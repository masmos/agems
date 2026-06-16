<?php

namespace App\Http\Controllers;

use App\Models\MonitoringStation;
use App\Models\TelemetryReading;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TelemetryReadingController extends Controller
{
    public function index(Request $request)
    {
        $stationId = $request->get('station_id');
        
        $query = TelemetryReading::with('monitoringStation');
        
        if ($stationId) {
            $query->where('monitoring_station_id', $stationId);
        }
        
        $readings = $query->orderBy('reading_datetime', 'desc')
            ->paginate(20);
        
        // Get statistics
        $stats = [
            'total_readings' => TelemetryReading::count(),
            'last_24h' => TelemetryReading::where('reading_datetime', '>=', now()->subHours(24))->count(),
            'average_aqi' => TelemetryReading::where('reading_datetime', '>=', now()->subHours(24))->avg('aqi') ?? 0,
            'stations_with_data' => TelemetryReading::distinct('monitoring_station_id')->count('monitoring_station_id'),
        ];
        
        // Get stations for filter dropdown
        $stations = MonitoringStation::orderBy('station_name')->get();
        
        return Inertia::render('telemetry/index', [
            'readings' => $readings,
            'stats' => $stats,
            'stations' => $stations,
            'currentStationId' => $stationId,
        ]);
    }
    
    public function show(TelemetryReading $telemetryReading)
    {
        $telemetryReading->load('monitoringStation');

        if (empty($telemetryReading->reading_datetime)) {
            return Inertia::render('telemetry/show', [
                'reading' => $telemetryReading,
                'previous' => null,
                'next' => null,
            ]);
        }

        // Get previous and next readings
        $previous = TelemetryReading::where('monitoring_station_id', $telemetryReading->monitoring_station_id)
            ->where('reading_datetime', '<', $telemetryReading->reading_datetime)
            ->orderBy('reading_datetime', 'desc')
            ->first();

        $next = TelemetryReading::where('monitoring_station_id', $telemetryReading->monitoring_station_id)
            ->where('reading_datetime', '>', $telemetryReading->reading_datetime)
            ->orderBy('reading_datetime', 'asc')
            ->first();

        return Inertia::render('telemetry/show', [
            'reading' => $telemetryReading,
            'previous' => $previous,
            'next' => $next,
        ]);
    }

    
    public function store(Request $request)
    {
        $validated = $request->validate([
            'monitoring_station_id' => 'required|exists:monitoring_stations,id',
            'reading_datetime' => 'required|date',
            'aqi' => 'nullable|numeric|min:0|max:500',
            'pm2_5' => 'nullable|numeric|min:0|max:500',
            'pm10' => 'nullable|numeric|min:0|max:500',
            'methane' => 'nullable|numeric|min:0|max:1000',
            'co2' => 'nullable|numeric|min:0|max:5000',
            'temperature' => 'nullable|numeric|min:-50|max:60',
        ]);
        
        $reading = TelemetryReading::create($validated);
        
        // Trigger alert check for this reading
        $alertEngine = app(\App\Services\AlertEngineService::class);
        $alertEngine->checkAllThresholds();
        
        return redirect()->route('telemetry.show', $reading)
            ->with('success', 'Telemetry reading recorded successfully.');
    }
    
    public function storeBulk(Request $request)
    {
        $validated = $request->validate([
            'station_id' => 'required|exists:monitoring_stations,id',
            'readings' => 'required|array',
            'readings.*.reading_datetime' => 'required|date',
            'readings.*.aqi' => 'nullable|numeric',
            'readings.*.pm2_5' => 'nullable|numeric',
            'readings.*.pm10' => 'nullable|numeric',
            'readings.*.methane' => 'nullable|numeric',
            'readings.*.co2' => 'nullable|numeric',
            'readings.*.temperature' => 'nullable|numeric',
        ]);
        
        $created = [];
        foreach ($validated['readings'] as $readingData) {
            $readingData['monitoring_station_id'] = $validated['station_id'];
            $created[] = TelemetryReading::create($readingData);
        }
        
        // Trigger alert check
        $alertEngine = app(\App\Services\AlertEngineService::class);
        $alertEngine->checkAllThresholds();
        
        return redirect()->route('telemetry.index', ['station_id' => $validated['station_id']])
            ->with('success', count($created) . ' readings recorded successfully.');
    }
    
    public function getStationReadings(MonitoringStation $station)
    {
        $readings = TelemetryReading::where('monitoring_station_id', $station->id)
            ->orderBy('reading_datetime', 'desc')
            ->limit(100)
            ->get();
        
        // Prepare data for charts
        $chartData = TelemetryReading::where('monitoring_station_id', $station->id)
            ->where('reading_datetime', '>=', now()->subDays(7))
            ->orderBy('reading_datetime', 'asc')
            ->get()
            ->groupBy(function($item) {
                return $item->reading_datetime->format('Y-m-d H:00:00');
            })
            ->map(function($items, $hour) {
                return [
                    'hour' => $hour,
                    'avg_aqi' => round($items->avg('aqi') ?? 0, 1),
                    'avg_pm25' => round($items->avg('pm2_5') ?? 0, 1),
                    'avg_pm10' => round($items->avg('pm10') ?? 0, 1),
                    'max_aqi' => round($items->max('aqi') ?? 0, 1),
                ];
            })
            ->values();
        
        return response()->json([
            'readings' => $readings,
            'chartData' => $chartData,
        ]);
    }
    
    public function destroy(TelemetryReading $telemetryReading)
    {
        $stationId = $telemetryReading->monitoring_station_id;
        $telemetryReading->delete();
        
        return redirect()->route('telemetry.index', ['station_id' => $stationId])
            ->with('success', 'Telemetry reading deleted successfully.');
    }
}