import { Head, usePage, router } from '@inertiajs/react';
import { dashboard } from '@/routes';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, Circle as LeafletCircle, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  AlertTriangle,
  MapPin,
  Bell,
  Circle,
  Wind,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import toast from 'react-hot-toast';

// Fix Leaflet icon issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// ========== Types ==========
interface Alert {
  id: number;
  station?: string;
  message: string;
  timestamp: string;
  severity: 'warning' | 'critical' | 'info';
  acknowledged: boolean;
  source?: {
    station_name?: string;
    site_name?: string;
  };
}

interface AQIDataPoint {
  hour: number;
  avg_aqi: number;
  avg_pm25: number;
  avg_pm10: number;
}

interface EmissionDataPoint {
  hour: number;
  avg_methane: number;
  avg_so2: number;
  avg_nox: number;
}

interface Station {
  id: number;
  name: string;
  lat: number;
  lng: number;
  status: 'healthy' | 'warning' | 'critical';
  aqi: number;
  lastReading: string;
}

interface DashboardStats {
  total_stations: number;
  active_stations: number;
  total_flares: number;
  active_flares: number;
  active_alerts: number;
  critical_alerts: number;
  total_inspections: number;
  pending_inspections: number;
  average_aqi: number;
  average_pm25: number;
  compliance_rate: number;
}

interface DashboardProps {
  stats: DashboardStats;
  recentAlerts: Alert[];
  alertsBySeverity: Array<{ date: string; critical: number; warning: number; info: number }>;
  airQualityTrends: AQIDataPoint[];
  emissionTrends: EmissionDataPoint[];
  stations: Station[];
}

// ========== Metric Card Component ==========
const MetricCard = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
}) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900/50">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {title}
        </p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">{value}</p>
        {subtitle && (
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
        )}
        {trend && trendValue && (
          <div className="mt-1 flex items-center gap-1">
            {trend === 'up' && <AlertCircle className="h-3 w-3 text-red-500" />}
            {trend === 'down' && <CheckCircle className="h-3 w-3 text-green-500" />}
            <span className={`text-xs ${trend === 'up' ? 'text-red-600' : trend === 'down' ? 'text-green-600' : 'text-gray-500'}`}>
              {trendValue}
            </span>
          </div>
        )}
      </div>
      <div className="rounded-lg bg-gray-100 p-2 dark:bg-gray-800">
        {icon}
      </div>
    </div>
  </div>
);

// ========== Custom Tooltip for Chart ==========
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Hour {label}:00</p>
        {payload.map((p: any, index: number) => (
          <p key={index} className="text-sm font-bold" style={{ color: p.color }}>
            {p.name}: {p.value.toFixed(1)}
          </p>
        ))}
      </div>
    );
  }

  return null;
};

// ========== Air Quality Trend Chart ==========
const AQITrendChart = ({ data }: { data: AQIDataPoint[] }) => {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e5e7eb"
            strokeOpacity={0.5}
            vertical={false}
          />
          <XAxis
            dataKey="hour"
            tick={{ fontSize: 10, fill: '#6b7280' }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb', strokeWidth: 1 }}
            domain={[0, 23]}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#6b7280' }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb', strokeWidth: 1 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={50}
            stroke="#eab308"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            label={{ value: 'Warning Threshold', position: 'right', fontSize: 10 }}
          />
          <ReferenceLine
            y={100}
            stroke="#ef4444"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            label={{ value: 'Critical Threshold', position: 'right', fontSize: 10 }}
          />
          <Line
            type="monotone"
            dataKey="avg_aqi"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#3b82f6' }}
            name="AQI"
          />
          <Line
            type="monotone"
            dataKey="avg_pm25"
            stroke="#8b5cf6"
            strokeWidth={1.5}
            dot={{ r: 2, fill: '#8b5cf6', strokeWidth: 0 }}
            name="PM2.5"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// ========== Emission Trends Chart ==========
const EmissionTrendChart = ({ data }: { data: EmissionDataPoint[] }) => {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e5e7eb"
            strokeOpacity={0.5}
            vertical={false}
          />
          <XAxis
            dataKey="hour"
            tick={{ fontSize: 10, fill: '#6b7280' }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb', strokeWidth: 1 }}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#6b7280' }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb', strokeWidth: 1 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="avg_methane"
            stroke="#ec4899"
            strokeWidth={2}
            name="Methane (ppm)"
          />
          <Line
            type="monotone"
            dataKey="avg_so2"
            stroke="#f59e0b"
            strokeWidth={2}
            name="SO2 (ppm)"
          />
          <Line
            type="monotone"
            dataKey="avg_nox"
            stroke="#10b981"
            strokeWidth={2}
            name="NOx (ppm)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// ========== Map Controller Component ==========
const MapController = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);

  return null;
};

// ========== Station Status Map ==========
const StationStatusMap = ({ stations }: { stations?: Station[] }) => {
  const [mapCenter] = useState<[number, number]>([1.9, 31.5]);
  const [mapZoom] = useState(8);

  if (!stations || stations.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900/50 p-6 text-center">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No station location data available.</p>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Add monitoring stations with latitude and longitude to display the map.</p>
      </div>
    );
  }

  const getStatusColor = (status: Station['status']) => {
    switch (status) {
      case 'healthy': return '#22c55e';
      case 'warning': return '#eab308';
      case 'critical': return '#ef4444';
    }
  };

  const getStatusIcon = (status: Station['status']) => {
    const color = status === 'healthy' ? 'green' : status === 'warning' ? 'yellow' : 'red';

    return L.icon({
      iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
      iconRetinaUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900/50">
      <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Station status map</h3>
        <div className="mt-1 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1.5">
            <Circle className="h-2.5 w-2.5 fill-green-500 text-green-500" />
            <span>Healthy (AQI 0-50)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Circle className="h-2.5 w-2.5 fill-yellow-500 text-yellow-500" />
            <span>Warning (AQI 51-100)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Circle className="h-2.5 w-2.5 fill-red-500 text-red-500" />
            <span>Critical (AQI 101+)</span>
          </div>
        </div>
      </div>

      <div className="relative w-full overflow-hidden rounded-b-lg" style={{ height: '400px' }}>
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
          scrollWheelZoom={true}
        >
          <MapController center={mapCenter} zoom={mapZoom} />

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {stations.map((station) => (
            <div key={station.id}>
              <Marker
                position={[station.lat, station.lng]}
                icon={getStatusIcon(station.status)}
              >
                <Popup>
                  <div className="min-w-[180px]">
                    <h4 className="font-bold text-sm">{station.name}</h4>
                    <div className="mt-2 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Status:</span>
                        <span className={`font-medium ${station.status === 'healthy' ? 'text-green-600' :
                            station.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                          {station.status === 'healthy' ? 'Healthy' :
                            station.status === 'warning' ? 'Warning' : 'Critical'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">AQI:</span>
                        <span className={`font-medium ${station.aqi <= 50 ? 'text-green-600' :
                            station.aqi <= 100 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                          {station.aqi}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Last reading:</span>
                        <span className="text-gray-600">{station.lastReading}</span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>

              <LeafletCircle
                center={[station.lat, station.lng]}
                radius={station.status === 'critical' ? 5000 : station.status === 'warning' ? 3000 : 2000}
                pathOptions={{
                  color: getStatusColor(station.status),
                  fillColor: getStatusColor(station.status),
                  fillOpacity: 0.15,
                  weight: 1.5
                }}
              />
            </div>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

// ========== Live Alert Feed ==========
const LiveAlertFeed = ({ alerts, onAcknowledge }: { alerts: Alert[]; onAcknowledge?: (id: number) => void }) => {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800';
      case 'warning': return 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800';
      default: return 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800';
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900/50">
      <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Live alert feed</h3>
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {alerts.filter(a => !a.acknowledged).length} unacknowledged
            </span>
          </div>
          {alerts.length > 3 && (
            <button
              onClick={() => router.visit('/alerts')}
              className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            >
              View all
            </button>
          )}
        </div>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-800 max-h-[400px] overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No active alerts. All systems normal.</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className={`px-4 py-3 border-l-4 ${getSeverityBg(alert.severity)}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {getSeverityIcon(alert.severity)}
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {alert.source?.station_name || alert.source?.site_name || alert.station || 'Unknown Station'}
                    </p>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{alert.message}</p>
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </div>
                {!alert.acknowledged && onAcknowledge && (
                  <button
                    onClick={() => onAcknowledge(alert.id)}
                    className="ml-4 rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-400"
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ========== Alert Distribution Pie Chart ==========
const AlertDistributionChart = ({ stats }: { stats: DashboardStats }) => {
  const data = [
    { name: 'Critical', value: stats.critical_alerts, color: '#ef4444' },
    { name: 'Warning', value: stats.active_alerts - stats.critical_alerts, color: '#f59e0b' },
  ];

  if (stats.active_alerts === 0) {
    return (
      <div className="flex h-[250px] items-center justify-center">
        <div className="text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
          <p className="mt-2 text-sm text-gray-500">No active alerts</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
};

// ========== Main Dashboard Component ==========
const defaultStats: DashboardStats = {
  total_stations: 0,
  active_stations: 0,
  total_flares: 0,
  active_flares: 0,
  active_alerts: 0,
  critical_alerts: 0,
  total_inspections: 0,
  pending_inspections: 0,
  average_aqi: 0,
  average_pm25: 0,
  compliance_rate: 0,
};

export default function Dashboard({
  stats: initialStats,
  recentAlerts: initialAlerts,
  alertsBySeverity,
  airQualityTrends,
  emissionTrends,
  stations: initialStations = []
}: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats>(initialStats ?? defaultStats);
  const [recentAlerts, setRecentAlerts] = useState(initialAlerts ?? []);
  const [stations, setStations] = useState<Station[]>(initialStations ?? []);

  // Poll for real-time updates every 30 seconds
  useEffect(() => {
    const fetchRealtimeData = async () => {
      try {
        const response = await fetch('/dashboard/realtime');
        const data = await response.json();
        setStats(data.stats ?? defaultStats);
        setRecentAlerts(data.latest_alerts ?? []);
        setStations(data.stations ?? []);
      } catch (error) {
        console.error('Failed to fetch realtime data:', error);
      }
    };

    fetchRealtimeData();
    const interval = setInterval(fetchRealtimeData, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleAcknowledgeAlert = async (alertId: number) => {
    try {
      const response = await fetch(`/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
      });

      if (response.ok) {
        setRecentAlerts(prevAlerts =>
          prevAlerts.map(alert =>
            alert.id === alertId ? { ...alert, acknowledged: true } : alert
          )
        );
        toast.success('Alert acknowledged successfully');

        // Update stats
        setStats(prev => ({
          ...prev,
          active_alerts: prev.active_alerts - 1,
          critical_alerts: recentAlerts.find(a => a.id === alertId)?.severity === 'critical'
            ? prev.critical_alerts - 1
            : prev.critical_alerts
        }));
      }
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
      toast.error('Failed to acknowledge alert');
    }
  };

  // Calculate AQI status for display
  const getAQIStatus = (aqi: number) => {
    if (aqi <= 50) {
      return { text: 'Good', color: 'text-green-600' };
    }

    if (aqi <= 100) {
      return { text: 'Moderate', color: 'text-yellow-600' };
    }

    if (aqi <= 150) {
      return { text: 'Unhealthy for Sensitive Groups', color: 'text-orange-600' };
    }

    if (aqi <= 200) {
      return { text: 'Unhealthy', color: 'text-red-600' };
    }

    return { text: 'Very Unhealthy', color: 'text-purple-600' };
  };

  const averageAQI = stats?.average_aqi ?? 0;
  const aqiStatus = getAQIStatus(Math.round(averageAQI));

  return (
    <>
      <Head title="Dashboard | AGEMS" />
      <div className="min-h-full bg-gray-50 dark:bg-gray-950">
        <div className="w-full space-y-5 p-5">
          {/* Header */}
          <div className="space-y-0.5">
            <h1 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
              Environmental Dashboard
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Live monitoring across the Albertine Graben region
            </p>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="OPEN ALERTS"
              value={stats.active_alerts}
              subtitle={`${stats.critical_alerts} critical`}
              icon={<AlertTriangle className="h-4 w-4 text-gray-600 dark:text-gray-400" />}
              trend={stats.active_alerts > 0 ? 'up' : 'down'}
              trendValue={stats.active_alerts > 0 ? 'Action required' : 'All clear'}
            />
            <MetricCard
              title="AVG AQI (24H)"
              value={Math.round(stats.average_aqi)}
              subtitle={aqiStatus.text}
              icon={<Wind className="h-4 w-4 text-gray-600 dark:text-gray-400" />}
            />
            <MetricCard
              title="ACTIVE STATIONS"
              value={`${stats.active_stations}/${stats.total_stations}`}
              icon={<MapPin className="h-4 w-4 text-gray-600 dark:text-gray-400" />}
            />
            <MetricCard
              title="COMPLIANCE RATE"
              value={`${stats.compliance_rate}%`}
              subtitle={`${stats.pending_inspections} pending inspections`}
              icon={<Activity className="h-4 w-4 text-gray-600 dark:text-gray-400" />}
            />
          </div>

          {/* Air Quality Trend */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900/50">
            <div className="mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Air quality trend (24h)</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Hourly AQI and PM2.5 averages across all monitoring stations
              </p>
            </div>
            <AQITrendChart data={airQualityTrends} />
          </div>

          {/* Emission Trends */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900/50">
            <div className="mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Flare emission trends (24h)</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Hourly averages of methane, SO2, and NOx emissions
              </p>
            </div>
            <EmissionTrendChart data={emissionTrends} />
          </div>

          {/* Three-column layout for Alert Feed, Map, and Distribution */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <LiveAlertFeed alerts={recentAlerts} onAcknowledge={handleAcknowledgeAlert} />
            </div>
            <div className="lg:col-span-2">
              <StationStatusMap stations={stations} />
            </div>
          </div>

          {/* Additional Stats Row */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900/50">
              <h3 className="mb-4 font-semibold text-gray-900 dark:text-gray-100">Alert Distribution</h3>
              <AlertDistributionChart stats={stats} />
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900/50">
              <h3 className="mb-4 font-semibold text-gray-900 dark:text-gray-100">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.visit('/stations')}
                  className="w-full rounded-lg border border-gray-200 p-3 text-left hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">View All Stations</p>
                      <p className="text-xs text-gray-500">Manage monitoring stations and view details</p>
                    </div>
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                </button>
                <button
                  onClick={() => router.visit('/alerts')}
                  className="w-full rounded-lg border border-gray-200 p-3 text-left hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">Review All Alerts</p>
                      <p className="text-xs text-gray-500">View and acknowledge pending alerts</p>
                    </div>
                    <Bell className="h-5 w-5 text-gray-400" />
                  </div>
                </button>
                <button
                  onClick={() => router.visit('/reports')}
                  className="w-full rounded-lg border border-gray-200 p-3 text-left hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">Generate Report</p>
                      <p className="text-xs text-gray-500">Export compliance and emissions report</p>
                    </div>
                    <Activity className="h-5 w-5 text-gray-400" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Preserve original layout configuration
(Dashboard as any).layout = {
  breadcrumbs: [
    {
      title: 'Dashboard',
      href: dashboard(),
    },
  ],
};