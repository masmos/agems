<?php

namespace App\Http\Controllers;

use App\Models\MonitoringStation;
use App\Models\TelemetryReading;
use Illuminate\Http\Request;

class MonitoringStationController extends Controller
{
    public function index()
    {
        $stations = MonitoringStation::withCount('alerts')
            ->orderBy('created_at', 'desc')
            ->paginate(12);
        
        return inertia('stations/index', [
            'stations' => $stations,
        ]);
    }
    
    public function show(MonitoringStation $station)
    {
        $station->load(['alerts' => function ($query) {
            $query->latest()->limit(10);
        }]);
        
        $readings = TelemetryReading::where('monitoring_station_id', $station->id)
            ->orderBy('reading_datetime', 'desc')
            ->limit(100)
            ->get();
        
        $alertsCount = $station->alerts()
            ->where('created_at', '>=', now()->subDays(30))
            ->count();
        
        return inertia('stations/show', [
            'station' => $station,
            'readings' => $readings,
            'alertsCount' => $alertsCount,
        ]);
    }
    
    public function store(Request $request)
    {
        $validated = $request->validate([
            'station_name' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'status' => 'required|in:active,maintenance,offline',
        ]);
        
        $station = MonitoringStation::create($validated);
        
        return redirect()->route('stations.show', $station)
            ->with('success', 'Monitoring station created successfully.');
    }
    
    public function update(Request $request, MonitoringStation $station)
    {
        $validated = $request->validate([
            'station_name' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'status' => 'required|in:active,maintenance,offline',
        ]);
        
        $station->update($validated);
        
        return back()->with('success', 'Monitoring station updated successfully.');
    }
}