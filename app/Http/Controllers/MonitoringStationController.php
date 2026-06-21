<?php

namespace App\Http\Controllers;

use App\Models\MonitoringStation;
use App\Models\TelemetryReading;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MonitoringStationController extends Controller
{
    public function index(Request $request)
    {
        $stations = MonitoringStation::withCount(['alerts', 'telemetryReadings'])
            ->when($request->search, function ($query, $search) {
                $query->where('station_name', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%");
            })
            ->when($request->status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->orderBy('created_at', 'desc')
            ->paginate(12);

        // Get statistics
        $stats = [
            'total' => MonitoringStation::count(),
            'active' => MonitoringStation::where('status', 'active')->count(),
            'maintenance' => MonitoringStation::where('status', 'maintenance')->count(),
            'offline' => MonitoringStation::where('status', 'offline')->count(),
            'with_alerts' => MonitoringStation::has('alerts')->count(),
            'average_aqi' => TelemetryReading::where('reading_datetime', '>=', now()->subHours(24))->avg('aqi') ?? 0,
        ];

        return Inertia::render('stations/index', [
            'stations' => $stations,
            'stats' => $stats,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function show($id)
    {
        $station = MonitoringStation::with(['alerts' => function ($query) {
            $query->latest()->limit(10);
        }])->find($id);

        if (!$station) {
            Log::error('MonitoringStation show - Station not found', ['id' => $id]);
            abort(404, 'Station not found');
        }

        // Get telemetry readings for the last 7 days
        $readings = TelemetryReading::where('monitoring_station_id', $station->id)
            ->where('reading_datetime', '>=', now()->subDays(7))
            ->orderBy('reading_datetime', 'asc')
            ->get();

        // Prepare chart data
        $chartData = $readings->groupBy(function ($item) {
            return $item->reading_datetime->format('Y-m-d H:00:00');
        })->map(function ($items, $hour) {
            return [
                'hour' => $hour,
                'avg_aqi' => round($items->avg('aqi') ?? 0, 1),
                'avg_pm25' => round($items->avg('pm2_5') ?? 0, 1),
                'avg_pm10' => round($items->avg('pm10') ?? 0, 1),
                'avg_methane' => round($items->avg('methane') ?? 0, 1),
                'avg_co2' => round($items->avg('co2') ?? 0, 1),
                'count' => $items->count(),
            ];
        })->values();

        // Get latest reading
        $latestReading = TelemetryReading::where('monitoring_station_id', $station->id)
            ->latest('reading_datetime')
            ->first();

        // Get alert statistics
        $alertStats = $station->alerts()
            ->select('severity', DB::raw('count(*) as count'))
            ->groupBy('severity')
            ->pluck('count', 'severity');

        // Get recent readings for table
        $recentReadings = TelemetryReading::where('monitoring_station_id', $station->id)
            ->orderBy('reading_datetime', 'desc')
            ->limit(20)
            ->get();

        // Get counts
        $totalReadings = TelemetryReading::where('monitoring_station_id', $station->id)->count();
        $totalAlerts = $station->alerts()->count();
        $unacknowledgedAlerts = $station->alerts()->where('acknowledged', false)->count();

        // Get status color
        $statusColor = $this->getStatusColor($station->status);

        // Calculate AQI category
        $aqiCategory = $this->getAQICategory($latestReading?->aqi);

        return Inertia::render('stations/show', [
            'station' => [
                'id' => $station->id,
                'station_name' => $station->station_name,
                'location' => $station->location,
                'latitude' => $station->latitude,
                'longitude' => $station->longitude,
                'status' => $station->status,
                'status_color' => $statusColor,
                'created_at' => $station->created_at,
                'updated_at' => $station->updated_at,
                'alerts' => $station->alerts,
                'total_readings' => $totalReadings,
                'total_alerts' => $totalAlerts,
                'unacknowledged_alerts' => $unacknowledgedAlerts,
                'latest_reading' => $latestReading,
                'aqi_category' => $aqiCategory,
            ],
            'chartData' => $chartData,
            'recentReadings' => $recentReadings,
            'alertStats' => $alertStats,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'station_name' => 'required|string|max:255|unique:monitoring_stations',
            'location' => 'required|string|max:255',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'status' => ['required', Rule::in(['active', 'maintenance', 'offline'])],
        ]);

        $station = MonitoringStation::create($validated);

        Log::info('MonitoringStation created:', [
            'id' => $station->id,
            'name' => $station->station_name,
        ]);

        return redirect()->route('stations.show', $station)
            ->with('success', 'Monitoring station created successfully.');
    }

    public function edit($id)
    {
        $station = MonitoringStation::withCount(['alerts', 'telemetryReadings'])
            ->find($id);

        if (!$station) {
            Log::error('MonitoringStation edit - Station not found', ['id' => $id]);
            abort(404, 'Station not found');
        }

        Log::info('MonitoringStation edit - Found station:', [
            'id' => $station->id,
            'name' => $station->station_name,
        ]);

        return Inertia::render('stations/edit', [
            'station' => $station,
        ]);
    }

    public function update(Request $request, $id)
    {
        $station = MonitoringStation::find($id);

        if (!$station) {
            Log::error('MonitoringStation update - Station not found', ['id' => $id]);
            abort(404, 'Station not found');
        }

        $validated = $request->validate([
            'station_name' => ['required', 'string', 'max:255', Rule::unique('monitoring_stations')->ignore($station->id)],
            'location' => 'required|string|max:255',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'status' => ['required', Rule::in(['active', 'maintenance', 'offline'])],
        ]);

        $station->update($validated);

        Log::info('MonitoringStation updated:', [
            'id' => $station->id,
            'name' => $station->station_name,
            'status' => $station->status,
        ]);

        return redirect()->route('stations.show', $station)
            ->with('success', 'Monitoring station updated successfully.');
    }

    public function destroy($id)
    {
        $station = MonitoringStation::find($id);

        if (!$station) {
            Log::error('MonitoringStation destroy - Station not found', ['id' => $id]);
            abort(404, 'Station not found');
        }

        $stationName = $station->station_name;
        $station->delete();

        Log::info('MonitoringStation deleted:', [
            'id' => $id,
            'name' => $stationName,
        ]);

        return redirect()->route('stations.index')
            ->with('success', 'Monitoring station deleted successfully.');
    }

    public function getRealtimeData($id)
    {
        $station = MonitoringStation::with(['latestReading'])->find($id);

        if (!$station) {
            return response()->json(['error' => 'Station not found'], 404);
        }

        $latestReading = $station->latestReading;
        $alertCount = $station->alerts()->where('acknowledged', false)->count();
        $aqiCategory = $this->getAQICategory($latestReading?->aqi);

        return response()->json([
            'status' => $station->status,
            'latest_reading' => $latestReading,
            'alert_count' => $alertCount,
            'aqi_category' => $aqiCategory,
            'last_updated' => $latestReading?->reading_datetime,
        ]);
    }

    protected function getStatusColor(string $status): string
    {
        return match ($status) {
            'active' => 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
            'maintenance' => 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
            'offline' => 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
            default => 'bg-gray-100 text-gray-800',
        };
    }

    protected function getAQICategory(?float $aqi): array
    {
        if ($aqi === null) {
            return ['label' => 'No Data', 'color' => 'bg-gray-100 text-gray-800'];
        }

        if ($aqi <= 50) {
            return ['label' => 'Good', 'color' => 'bg-green-100 text-green-800'];
        } elseif ($aqi <= 100) {
            return ['label' => 'Moderate', 'color' => 'bg-yellow-100 text-yellow-800'];
        } elseif ($aqi <= 150) {
            return ['label' => 'Unhealthy for Sensitive Groups', 'color' => 'bg-orange-100 text-orange-800'];
        } elseif ($aqi <= 200) {
            return ['label' => 'Unhealthy', 'color' => 'bg-red-100 text-red-800'];
        } else {
            return ['label' => 'Very Unhealthy', 'color' => 'bg-purple-100 text-purple-800'];
        }
    }
}
