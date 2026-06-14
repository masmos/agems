<?php

namespace App\Http\Controllers;

use App\Models\Alert;
use App\Models\FlareEmission;
use App\Models\FlareSite;
use App\Models\Inspection;
use App\Models\MonitoringStation;
use App\Models\TelemetryReading;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        // Get real-time statistics
        $stats = $this->getStatistics();
        
        // Get recent unacknowledged alerts (limit to 10 for dashboard)
        $recentAlerts = Alert::with(['source'])
            ->where('acknowledged', false)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($alert) {
                return [
                    'id' => $alert->id,
                    'message' => $alert->message,
                    'timestamp' => $alert->created_at,
                    'severity' => $alert->severity,
                    'acknowledged' => $alert->acknowledged,
                    'source' => $alert->source ? [
                        'station_name' => $alert->source->station_name ?? null,
                        'site_name' => $alert->source->site_name ?? null,
                    ] : null,
                ];
            });
        
        // Get alerts by severity for the last 7 days
        $alertsBySeverity = Alert::select(
                DB::raw('DATE(created_at) as date'),
                'severity',
                DB::raw('count(*) as count')
            )
            ->where('created_at', '>=', now()->subDays(7))
            ->groupBy('date', 'severity')
            ->orderBy('date')
            ->get()
            ->groupBy('date')
            ->map(function ($items, $date) {
                $result = ['date' => $date, 'critical' => 0, 'warning' => 0, 'info' => 0];
                foreach ($items as $item) {
                    $result[$item->severity] = $item->count;
                }
                return $result;
            })
            ->values();
        
        // Get air quality trends for last 24 hours
        $airQualityTrends = TelemetryReading::select(
                DB::raw('HOUR(reading_datetime) as hour'),
                DB::raw('AVG(aqi) as avg_aqi'),
                DB::raw('AVG(pm2_5) as avg_pm25'),
                DB::raw('AVG(pm10) as avg_pm10')
            )
            ->where('reading_datetime', '>=', now()->subHours(24))
            ->groupBy('hour')
            ->orderBy('hour')
            ->get()
            ->map(function ($item) {
                return [
                    'hour' => (int)$item->hour,
                    'avg_aqi' => round($item->avg_aqi ?? 0, 1),
                    'avg_pm25' => round($item->avg_pm25 ?? 0, 1),
                    'avg_pm10' => round($item->avg_pm10 ?? 0, 1),
                ];
            });
        
        // Fill in missing hours with zeros
        $completeTrends = [];
        for ($i = 0; $i < 24; $i++) {
            $existing = $airQualityTrends->firstWhere('hour', $i);
            $completeTrends[] = $existing ?: [
                'hour' => $i,
                'avg_aqi' => 0,
                'avg_pm25' => 0,
                'avg_pm10' => 0,
            ];
        }
        
        // Get emission trends for last 24 hours
        $emissionTrends = FlareEmission::select(
                DB::raw('HOUR(reading_datetime) as hour'),
                DB::raw('AVG(methane_level) as avg_methane'),
                DB::raw('AVG(so2_level) as avg_so2'),
                DB::raw('AVG(nox_level) as avg_nox')
            )
            ->where('reading_datetime', '>=', now()->subHours(24))
            ->groupBy('hour')
            ->orderBy('hour')
            ->get()
            ->map(function ($item) {
                return [
                    'hour' => (int)$item->hour,
                    'avg_methane' => round($item->avg_methane ?? 0, 1),
                    'avg_so2' => round($item->avg_so2 ?? 0, 1),
                    'avg_nox' => round($item->avg_nox ?? 0, 1),
                ];
            });
        
        // Fill in missing hours for emissions
        $completeEmissionTrends = [];
        for ($i = 0; $i < 24; $i++) {
            $existing = $emissionTrends->firstWhere('hour', $i);
            $completeEmissionTrends[] = $existing ?: [
                'hour' => $i,
                'avg_methane' => 0,
                'avg_so2' => 0,
                'avg_nox' => 0,
            ];
        }
        
        // Get stations with their latest readings for the map
        $stations = $this->getStationsForMap();
        
        return inertia('dashboard', [
            'stats' => $stats,
            'recentAlerts' => $recentAlerts,
            'alertsBySeverity' => $alertsBySeverity,
            'airQualityTrends' => $completeTrends,
            'emissionTrends' => $completeEmissionTrends,
            'stations' => $stations,
        ]);
    }
    
    public function getRealtimeData()
    {
        return response()->json([
            'stats' => $this->getStatistics(),
            'latest_alerts' => Alert::with(['source'])
                ->where('acknowledged', false)
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function ($alert) {
                    return [
                        'id' => $alert->id,
                        'message' => $alert->message,
                        'timestamp' => $alert->created_at,
                        'severity' => $alert->severity,
                        'acknowledged' => $alert->acknowledged,
                        'source' => $alert->source ? [
                            'station_name' => $alert->source->station_name ?? null,
                            'site_name' => $alert->source->site_name ?? null,
                        ] : null,
                    ];
                }),
            'stations' => $this->getStationsForMap(),
        ]);
    }
    
    protected function getStatistics(): array
    {
        $totalStations = MonitoringStation::count();
        $activeStations = MonitoringStation::where('status', 'active')->count();
        
        $totalFlares = FlareSite::count();
        $activeFlares = FlareSite::where('status', 'active')->count();
        
        $activeAlerts = Alert::where('acknowledged', false)->count();
        $criticalAlerts = Alert::where('severity', 'critical')->where('acknowledged', false)->count();
        
        $totalInspections = Inspection::count();
        $pendingInspections = Inspection::where('status', 'pending')->count();
        
        $averageAQI = TelemetryReading::where('reading_datetime', '>=', now()->subHours(24))
            ->avg('aqi') ?? 0;
        
        $averagePM25 = TelemetryReading::where('reading_datetime', '>=', now()->subHours(24))
            ->avg('pm2_5') ?? 0;
        
        // Calculate compliance rate
        $complianceRate = $this->calculateComplianceRate();
        
        return [
            'total_stations' => $totalStations,
            'active_stations' => $activeStations,
            'total_flares' => $totalFlares,
            'active_flares' => $activeFlares,
            'active_alerts' => $activeAlerts,
            'critical_alerts' => $criticalAlerts,
            'total_inspections' => $totalInspections,
            'pending_inspections' => $pendingInspections,
            'average_aqi' => round($averageAQI, 1),
            'average_pm25' => round($averagePM25, 1),
            'compliance_rate' => $complianceRate,
        ];
    }
    
    protected function calculateComplianceRate(): float
    {
        $totalInspections = Inspection::count();
        
        if ($totalInspections === 0) {
            return 100.0;
        }
        
        $compliantInspections = Inspection::where('status', 'compliant')->count();
        
        return round(($compliantInspections / $totalInspections) * 100, 1);
    }
    
    protected function getStationsForMap(): array
    {
        $stations = MonitoringStation::where('status', 'active')
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->with('latestReading')
            ->get();
        
        if ($stations->isEmpty()) {
            // Return fallback demo stations for Albertine Graben region
            return $this->getDemoStations();
        }
        
        return $stations->map(function ($station) {
            $latestReading = $station->latestReading;
            $aqi = $latestReading ? $latestReading->aqi : 0;
            
            // Determine status based on AQI
            $status = $this->getStatusFromAQI($aqi);
            
            return [
                'id' => $station->id,
                'name' => $station->station_name,
                'lat' => (float)$station->latitude,
                'lng' => (float)$station->longitude,
                'status' => $status,
                'aqi' => round($aqi, 1),
                'lastReading' => $latestReading ? $latestReading->reading_datetime->diffForHumans() : 'No data',
            ];
        })->toArray();
    }
    
    protected function getStatusFromAQI(?float $aqi): string
    {
        if ($aqi === null || $aqi <= 50) {
            return 'healthy';
        } elseif ($aqi <= 100) {
            return 'warning';
        } else {
            return 'critical';
        }
    }
    
    protected function getDemoStations(): array
    {
        // Fallback demo stations in Albertine Graben region
        return [
            [
                'id' => 1,
                'name' => 'Buliisa Station',
                'lat' => 2.1289,
                'lng' => 31.4167,
                'status' => 'warning',
                'aqi' => 142,
                'lastReading' => '2 minutes ago',
            ],
            [
                'id' => 2,
                'name' => 'Hoima Station',
                'lat' => 1.4333,
                'lng' => 31.3500,
                'status' => 'healthy',
                'aqi' => 68,
                'lastReading' => '5 minutes ago',
            ],
            [
                'id' => 3,
                'name' => 'Kikuube Station',
                'lat' => 1.4500,
                'lng' => 31.2500,
                'status' => 'critical',
                'aqi' => 215,
                'lastReading' => '1 minute ago',
            ],
            [
                'id' => 4,
                'name' => 'Nwoya Station',
                'lat' => 2.6333,
                'lng' => 32.0000,
                'status' => 'healthy',
                'aqi' => 55,
                'lastReading' => '3 minutes ago',
            ],
            [
                'id' => 5,
                'name' => 'Kibale Station',
                'lat' => 2.1500,
                'lng' => 31.2000,
                'status' => 'healthy',
                'aqi' => 72,
                'lastReading' => '7 minutes ago',
            ],
        ];
    }
}