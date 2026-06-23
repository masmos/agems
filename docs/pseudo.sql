1. Domain Models
   MonitoringStation
      Model MonitoringStation {
         fields: station_name, location, latitude, longitude, status
         relations:
            - hasMany TelemetryReading (telemetryReadings)
            - morphMany Alert (as source)
            - morphMany Inspection (as inspectable)
            - hasOne latestReading (latest TelemetryReading)
      }

   TelemetryReading
      Model TelemetryReading {
      fields: monitoring_station_id, reading_datetime, aqi, pm2_5, pm10, methane, co2, temperature
         relations:
            - belongsTo MonitoringStation
            - morphMany Alert (as source)
      }

   FlareSite
      Model FlareSite {
         fields: site_name, location, latitude, longitude, status
         relations:
            - hasMany FlareEmission
            - morphMany Alert (as source)
            - hasOne latestEmission
      }

   Threshold
      Model Threshold {
         fields: parameter, source_type, min_value, max_value, severity, is_active
         methods:
            - isBreached(value): check if value is outside min/max
            - getBreachMessage(value, sourceName): generate alert message
      }

   Alert
      Model Alert {
         fields: alert_type, source_type, source_id, threshold_id, severity, message, acknowledged, acknowledged_by, acknowledged_at
         relations:
            - morphTo source
            - belongsTo threshold
            - belongsTo acknowledgedBy (User)
         methods:
            - acknowledge(user): mark as acknowledged with user and timestamp
      }

2. Alert Evaluation Engine
AlertEngineService
   Service AlertEngineService {
      function checkAllThresholds():
         // Load all active thresholds
         activeThresholds = Threshold.where(is_active == true)
         
         // Group thresholds by source_type
         thresholdsBySource = groupBy(activeThresholds, source_type)
         
         // For each source type
         FOR EACH source_type in thresholdsBySource:
            IF source_type == 'monitoring_station':
            sources = MonitoringStation.where(status == 'active')
            FOR EACH station in sources:
               latestReading = station.latestReading
               IF latestReading exists:
                  evaluateReadings(station, latestReading, thresholdsBySource[source_type])
            
            ELSE IF source_type == 'flare_site':
            sources = FlareSite.where(status == 'active')
            FOR EACH site in sources:
               latestEmission = site.latestEmission
               IF latestEmission exists:
                  evaluateEmissions(site, latestEmission, thresholdsBySource[source_type])
      
      function evaluateReadings(source, reading, thresholds):
         FOR EACH threshold in thresholds:
            value = getValueByParameter(reading, threshold.parameter)
            IF value is not null:
            IF threshold.isBreached(value):
               processAlert(source, threshold, value)
      
      function processAlert(source, threshold, value):
         // Check for existing unacknowledged alert (last 24h)
         existingAlert = Alert.where(
            source_type == source.type,
            source_id == source.id,
            threshold_id == threshold.id,
            acknowledged == false,
            created_at >= now() - 24h
         ).first()
         
         IF existingAlert exists:
            // Update existing alert instead of creating new one
            existingAlert.message = threshold.getBreachMessage(value, source.name)
            existingAlert.updated_at = now()
            existingAlert.save()
         ELSE:
            // Create new alert
            newAlert = create Alert with:
            source_type = source.type
            source_id = source.id
            threshold_id = threshold.id
            severity = threshold.severity
            message = threshold.getBreachMessage(value, source.name)
            acknowledged = false
            
            // Send notification
            sendNotification(newAlert)
      
      function sendNotification(alert):
         // Get users to notify based on severity
         targetRoles = getTargetRoles(alert.severity)
         users = getUsersWithRoles(targetRoles)
         
         // Send notification to each user
         FOR EACH user in users:
            send ThresholdBreachedNotification to user with alert details
      
      function getTargetRoles(severity):
         IF severity == 'critical':
            return ['Administrator', 'Compliance Officer']
         ELSE:
            return ['Administrator', 'Environmental Officer']
   }


3. Dashboard Controller
   DashboardController@index
   function index():
      // Get statistics
      stats = {
         total_stations: MonitoringStation.count()
         active_stations: MonitoringStation.where(status == 'active').count()
         total_flares: FlareSite.count()
         active_flares: FlareSite.where(status == 'active').count()
         active_alerts: Alert.where(acknowledged == false).count()
         critical_alerts: Alert.where(severity == 'critical', acknowledged == false).count()
         total_inspections: Inspection.count()
         pending_inspections: Inspection.where(status == 'pending').count()
         average_aqi: TelemetryReading.where(reading_datetime >= now() - 24h).avg('aqi')
         average_pm25: TelemetryReading.where(reading_datetime >= now() - 24h).avg('pm2_5')
         compliance_rate: calculateComplianceRate()
      }
   
   // Get recent alerts
      recentAlerts = Alert.where(acknowledged == false)
         .with('source')
         .orderBy(created_at, desc)
         .limit(10)
         .get()
         .map(alert -> formatted alert data)
      
      // Get alerts by severity (last 7 days)
      alertsBySeverity = Alert.select(
            DATE(created_at) as date,
            severity,
            count(*) as count
         )
         .where(created_at >= now() - 7d)
         .groupBy(date, severity)
         .orderBy(date)
         .get()
         .groupBy(date)
      
      // Get air quality trends (last 24h)
      airQualityTrends = TelemetryReading.select(
            HOUR(reading_datetime) as hour,
            AVG(aqi) as avg_aqi,
            AVG(pm2_5) as avg_pm25,
            AVG(pm10) as avg_pm10
         )
         .where(reading_datetime >= now() - 24h)
         .groupBy(hour)
         .orderBy(hour)
         .get()
         // Fill missing hours with zeros
      
      // Get emission trends (last 24h)
      emissionTrends = FlareEmission.select(
            HOUR(reading_datetime) as hour,
            AVG(methane_level) as avg_methane,
            AVG(so2_level) as avg_so2,
            AVG(nox_level) as avg_nox
         )
         .where(reading_datetime >= now() - 24h)
         .groupBy(hour)
         .orderBy(hour)
         .get()
         // Fill missing hours with zeros
      
      // Get stations for map
      stations = MonitoringStation.where(status == 'active')
         .whereNotNull(latitude)
         .whereNotNull(longitude)
         .with('latestReading')
         .get()
         .map(station -> {
            id, name, lat, lng,
            status: getStatusFromAQI(station.latestReading.aqi),
            aqi: station.latestReading.aqi,
            lastReading: station.latestReading.reading_datetime
         })
      
      // If no stations exist, use demo stations
      IF stations.isEmpty():
         stations = getDemoStations()
      
      return inertia('dashboard', {
         stats, recentAlerts, alertsBySeverity,
         airQualityTrends, emissionTrends, stations
      })

   DashboardController@getRealtimeData
   function getRealtimeData():
   return JSON:
      stats: getStatistics()
      latest_alerts: Alert.where(acknowledged == false)
         .with('source')
         .orderBy(created_at, desc)
         .limit(10)
         .get()
      stations: getStationsForMap()

4. Alert Controller
   AlertController@index
      function index(request):
         query = Alert.with(['source', 'threshold', 'acknowledgedBy'])
         
         // Apply filters
         IF request.has('severity'):
            query.where('severity', request.severity)
         
         IF request.has('acknowledged'):
            query.where('acknowledged', request.boolean('acknowledged'))
         
         IF request.has('source_type'):
            query.where('source_type', request.source_type)
         
         alerts = query.orderBy('created_at', 'desc').paginate(10000000)
         
         stats = {
            total: Alert.count()
            unacknowledged: Alert.where(acknowledged == false).count()
            critical: Alert.where(severity == 'critical', acknowledged == false).count()
            warning: Alert.where(severity == 'warning', acknowledged == false).count()
      }
      
      return inertia('alerts/index', { alerts, stats, filters })
         AlertController@acknowledge
         
         function acknowledge(alert):
            alert.acknowledge(Auth.user())
            return back() with success message
            AlertController@bulkAcknowledge
            
         function bulkAcknowledge(request):
            validate request.alert_ids
            count = Alert.whereIn('id', request.alert_ids)
               .where('acknowledged', false)
               .update({
                  acknowledged: true,
                  acknowledged_by: Auth.user().id,
                  acknowledged_at: now()
               })
      return back() with success message

5. Threshold Controller
   ThresholdController@store
      function store(request):
         validated = validate(request):
            parameter: required, string, max:50
            source_type: required, in: [monitoring_station, flare_site]
            severity: required, in: [warning, critical]
            min_value: nullable, numeric
            max_value: nullable, numeric
            is_active: required, boolean
         
         // Ensure at least one limit is set
         IF min_value is null AND max_value is null:
            return back with error: "Provide at least one of Min or Max value"
         
         // Update or create using unique key
         Threshold.updateOrCreate(
            { parameter, source_type, severity },
            { min_value, max_value, is_active }
         )
         
         return back with success message

   ThresholdController@index
      function index(request):
         query = Threshold.query()
         
         IF request.has('severity'):
            query.where('severity', request.severity)
         
         IF request.has('source_type'):
            query.where('source_type', request.source_type)
         
         IF request.has('is_active'):
            query.where('is_active', request.boolean('is_active'))
         
         thresholds = query.orderBy('updated_at', 'desc').paginate(20)
         
         stats = {
            total: Threshold.count()
            active: Threshold.where('is_active', true).count()
            warning: Threshold.where('severity', 'warning', 'is_active', true).count()
            critical: Threshold.where('severity', 'critical', 'is_active', true).count()
      }
  
   return inertia('thresholds/index', { thresholds, stats, filters })

6. Monitoring Station Controller
   MonitoringStationController@index
      function index(request):
         query = MonitoringStation.withCount(['alerts', 'telemetryReadings'])
         
         IF request.has('search'):
            search = request.search
            query.where('station_name', 'LIKE', "%search%")
               ->orWhere('location', 'LIKE', "%search%")
         
         IF request.has('status') AND request.status != 'all':
            query.where('status', request.status)
         
         stations = query.orderBy('created_at', 'desc').paginate(12)
         
         stats = {
            total: MonitoringStation.count()
            active: MonitoringStation.where('status', 'active').count()
            maintenance: MonitoringStation.where('status', 'maintenance').count()
            offline: MonitoringStation.where('status', 'offline').count()
            with_alerts: MonitoringStation.whereHas('alerts').count()
            average_aqi: TelemetryReading.where(reading_datetime >= now() - 24h).avg('aqi')
         }
      
   return inertia('stations/index', { stations, stats, filters })
   
   MonitoringStationController@show
      function show(station):
      station.load(['alerts' => latest, limit 10])
      
      // Get chart data (last 7 days)
      chartData = TelemetryReading.where(monitoring_station_id == station.id)
         .where(reading_datetime >= now() - 7d)
         .select(
            DATE_FORMAT(reading_datetime, '%Y-%m-%d %H:00:00') as hour,
            AVG(aqi) as avg_aqi,
            AVG(pm2_5) as avg_pm25,
            AVG(pm10) as avg_pm10,
            AVG(methane) as avg_methane,
            AVG(co2) as avg_co2,
            count(*) as count
         )
         .groupBy(hour)
         .orderBy(hour)
         .get()
      
      station.loadCount(['alerts', 'telemetryReadings'])
      
      recentReadings = TelemetryReading.where(monitoring_station_id == station.id)
         .orderBy('reading_datetime', 'desc')
         .limit(20)
         .get()
      
      alertStats = station.alerts()
         .select('severity', count(*) as count)
         .groupBy('severity')
         .pluck('count', 'severity')
      
      return inertia('stations/show', {
         station: station,
         chartData: chartData,
         recentReadings: recentReadings,
         alertStats: alertStats
      })

7. Flare Site Controller
   FlareSiteController@index
      function index():
         flareSites = FlareSite.withCount(['alerts', 'flareEmissions'])
            .orderBy('created_at', 'desc')
            .paginate(12)
         
         stats = {
            total: FlareSite.count()
            active: FlareSite.where('status', 'active').count()
            critical_alerts: FlareSite.whereHas('alerts', function(query):
               query.where('severity', 'critical')
               .where('acknowledged', false)
            ).count()
            average_emissions: {
               methane: FlareEmission.where(reading_datetime >= now() - 24h).avg('methane_level')
               so2: FlareEmission.where(reading_datetime >= now() - 24h).avg('so2_level')
               nox: FlareEmission.where(reading_datetime >= now() - 24h).avg('nox_level')
            }
         }
      
      return inertia('flare-sites/index', { flareSites, stats })
   FlareSiteController@show
      function show(flareSite):
         flareSite.load(['alerts' => latest, limit 10])
      
         // Get emissions for last 7 days
         emissions = FlareEmission.where(flare_site_id == flareSite.id)
            .where(reading_datetime >= now() - 7d)
            .orderBy('reading_datetime', 'asc')
            .get()
            .groupBy('reading_datetime')
            .map(function(items, hour):
               return {
               hour: hour,
               avg_methane: items.avg('methane_level'),
               avg_so2: items.avg('so2_level'),
               avg_nox: items.avg('nox_level'),
               max_methane: items.max('methane_level')
               }
            )
            .values()
         
         flareSite.loadCount(['alerts', 'flareEmissions'])
         
         recentEmissions = FlareEmission.where(flare_site_id == flareSite.id)
            .orderBy('reading_datetime', 'desc')
            .limit(20)
            .get()
         
      return inertia('flare-sites/show', {
         flareSite, emissions, recentEmissions
      })

8. Pipeline Project Controller
   PipelineProjectController@index
      function index(request):
         projects = PipelineProject.withCount(['alerts', 'inspections'])
            .when(request.search, function(query, search):
               query.where('project_name', 'LIKE', "%search%")
               ->orWhere('location', 'LIKE', "%search%")
               ->orWhere('contractor', 'LIKE', "%search%")
            )
            .when(request.status, function(query, status):
               query.where('status', status)
            )
            .when(request.compliance, function(query, compliance):
               query.where('compliance_status', compliance)
            )
            .orderBy('created_at', 'desc')
            .paginate(12)
         
         stats = {
            total: PipelineProject.count()
            active: PipelineProject.whereIn('status', ['active', 'in_progress']).count()
            completed: PipelineProject.where('status', 'completed').count()
            high_risk: PipelineProject.where('environmental_impact_score', >= 70).count()
            non_compliant: PipelineProject.where('compliance_status', 'non_compliant').count()
            average_progress: PipelineProject.avg('progress_percentage')
         }
         
      statusCounts = PipelineProject.select('status', count(*) as count)
         .groupBy('status')
         .pluck('count', 'status')
      
      return inertia('pipeline/index', {
         projects, stats, statusCounts, filters
      })

   PipelineProjectController@show
      function show(id):
         project = PipelineProject.find(id)
         
         IF not project:
            abort(404)
         
         project.load(['alerts' => latest, limit 10])
         
         inspections = Inspection.where(
               inspectable_type == PipelineProject.class,
               inspectable_id == project.id
            )
            .with('inspector')
            .orderBy('inspection_date', 'desc')
            .limit(10)
            .get()
         
         alertStats = project.alerts()
            .select('severity', count(*) as count)
            .groupBy('severity')
            .pluck('count', 'severity')
         
         progressHistory = getProgressHistory(project)
         
         return inertia('pipeline/show', {
            project, inspections, alertStats, progressHistory
         })

9. User Controller
   UserController@index 
      function index(request):
         users = User.with(['roles', 'permissions'])
            .when(request.search, function(query, search):
               query.where('name', 'LIKE', "%search%")
               ->orWhere('email', 'LIKE', "%search%")
            )
            .orderBy('created_at', 'desc')
            .paginate(15)
         
         stats = {
            total_users: User.count()
            active_users: User.whereNotNull('email_verified_at').count()
            new_users_this_month: User.whereMonth('created_at', now().month).count()
            roles_count: Role.count()
         }
         
         roles = Role.all()
         
      return inertia('users/index', { users, stats, roles, filters })
   UserController@store
      function store(request):
         validate request:
            name: required, string, max:255
            email: required, email, unique:users
            password: required, string, min:8, confirmed
            roles: array, each exists:roles,id
            permissions: array, each exists:permissions,id
         
         user = User.create({
            name, email,
            password: Hash.make(password),
            email_verified_at: now()
         })
         
         // Assign roles
         IF request.has('roles'):
            roleNames = Role.whereIn('id', request.roles).pluck('name')
            user.assignRole(roleNames)
         
         // Assign permissions
         IF request.has('permissions'):
            permissionNames = Permission.whereIn('id', request.permissions).pluck('name')
            user.givePermissionTo(permissionNames)
         
         return redirect to users.index

   UserController@bulkAction
      function bulkAction(request):
         validate:
            user_ids: required, array, each exists:users,id
            action: required, in: [activate, deactivate, delete]
         
         users = User.whereIn('id', request.user_ids)
         
         SWITCH request.action:
            CASE 'activate':
               users.update({ email_verified_at: now() })
               message = 'Users activated successfully'
            
            CASE 'deactivate':
               users.update({ email_verified_at: null })
               message = 'Users deactivated successfully'
            
            CASE 'delete':
               users.where('id', '!=', Auth.user().id).delete()
               message = 'Users deleted successfully'
         
      return back with success message

10. Scheduled Jobs
   Check Thresholds Command
   Command environmental:check-thresholds:
   /**
      * Every 5 minutes:
      *   - Check all active thresholds against latest readings
      *   - Create/update alerts as needed
      *   - Send notifications for new alerts
      */
   
   /**
      * Every minute when there are critical unacknowledged alerts:
      *   - Additional check for thresholds with --once flag
      */
   
   function handle():
      // Option --once for immediate check
      IF this.option('once'):
         alertEngine.checkAllThresholds()
         return
      
      // Check if there are critical alerts
      criticalCount = Alert.where(
         severity == 'critical',
         acknowledged == false,
         created_at >= now() - 1h
      ).count()
      
      IF criticalCount > 0:
         // Trigger extra check
         alertEngine.checkAllThresholds()
      
      // Also run the regular check
      alertEngine.checkAllThresholds()

11. Testing Commands
   Test Alert Engine
   Command test-alert-engine:
   /**
      * Used for development/testing
      * - Sets up test thresholds and sources
      * - Runs the alert engine
      * - Displays results in console
      */
   
   function handle():
      // Create or get test sources
      // Create test thresholds
      // Run alert engine check
      // Output results

12. Core Request Flow
   Creating a Telemetry Reading
      User submits telemetry reading form -> 
         TelemetryReadingController@store:
            1. Validate input
            2. Create TelemetryReading record
            3. Trigger AlertEngineService.checkAllThresholds()
            4. Redirect to show page with success message

   Viewing Dashboard
      User navigates to /dashboard ->
      DashboardController@index:
         1. Query statistics (counts, averages)
         2. Get recent alerts (last 10, unacknowledged)
         3. Calculate hourly trends (last 24h)
         4. Prepare station data for map
         5. Render Inertia page with data

      Dashboard auto-refresh:
      - Client polls /dashboard/realtime every 30 seconds
      - Returns updated stats and alerts as JSON

   Acknowledging an Alert
      User clicks "Acknowledge" on alert ->
      AlertController@acknowledge:
         1. Find alert by ID
         2. Call alert.acknowledge(Auth.user())
         3. Updates: acknowledged=true, acknowledged_by=user_id, acknowledged_at=now()
         4. Return with success message
         5. Dashboard auto-refreshes, alert disappears from list


