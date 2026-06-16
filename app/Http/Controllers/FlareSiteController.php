<?php

namespace App\Http\Controllers;

use App\Models\FlareSite;
use App\Models\FlareEmission;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FlareSiteController extends Controller
{
    public function index()
    {
        $flareSites = FlareSite::withCount(['alerts', 'flareEmissions'])
            ->orderBy('created_at', 'desc')
            ->paginate(12);
        
        // Get statistics for dashboard
        $stats = [
            'total' => FlareSite::count(),
            'active' => FlareSite::where('status', 'active')->count(),
            'critical_alerts' => FlareSite::whereHas('alerts', function($query) {
                $query->where('severity', 'critical')->where('acknowledged', false);
            })->count(),
            'average_emissions' => [
                'methane' => FlareEmission::where('reading_datetime', '>=', now()->subHours(24))->avg('methane_level') ?? 0,
                'so2' => FlareEmission::where('reading_datetime', '>=', now()->subHours(24))->avg('so2_level') ?? 0,
                'nox' => FlareEmission::where('reading_datetime', '>=', now()->subHours(24))->avg('nox_level') ?? 0,
            ]
        ];
        
        return Inertia::render('flare-sites/index', [
            'flareSites' => $flareSites,
            'stats' => $stats,
        ]);
    }
    
    public function show(FlareSite $flareSite)
    {
        $flareSite->load(['alerts' => function ($query) {
            $query->latest()->limit(10);
        }]);
        
        // Get emissions for the last 7 days
        $emissions = FlareEmission::where('flare_site_id', $flareSite->id)
            ->where('reading_datetime', '>=', now()->subDays(7))
            ->orderBy('reading_datetime', 'asc')
            ->get()
            ->groupBy(function($item) {
                return $item->reading_datetime->format('Y-m-d H:00:00');
            })
            ->map(function($items, $hour) {
                return [
                    'hour' => $hour,
                    'avg_methane' => round($items->avg('methane_level') ?? 0, 2),
                    'avg_so2' => round($items->avg('so2_level') ?? 0, 2),
                    'avg_nox' => round($items->avg('nox_level') ?? 0, 2),
                    'max_methane' => round($items->max('methane_level') ?? 0, 2),
                ];
            })
            ->values();
        
        $flareSite->loadCount('alerts', 'flareEmissions');
        
        // Get recent emissions for table view
        $recentEmissions = FlareEmission::where('flare_site_id', $flareSite->id)
            ->orderBy('reading_datetime', 'desc')
            ->limit(20)
            ->get();
        
        return Inertia::render('flare-sites/show', [
            'flareSite' => $flareSite,
            'emissions' => $emissions,
            'recentEmissions' => $recentEmissions,
        ]);
    }
    
    public function store(Request $request)
    {
        $validated = $request->validate([
            'site_name' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'status' => 'required|in:active,inactive',
        ]);
        
        $flareSite = FlareSite::create($validated);
        
        return redirect()->route('flare-sites.show', $flareSite)
            ->with('success', 'Flare site created successfully.');
    }
    
    public function update(Request $request, FlareSite $flareSite)
    {
        $validated = $request->validate([
            'site_name' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'status' => 'required|in:active,inactive',
        ]);
        
        $flareSite->update($validated);
        
        return back()->with('success', 'Flare site updated successfully.');
    }
    
    public function destroy(FlareSite $flareSite)
    {
        $flareSite->delete();
        
        return redirect()->route('flare-sites.index')
            ->with('success', 'Flare site deleted successfully.');
    }
    
    public function getRealtimeData(FlareSite $flareSite)
    {
        $latestEmission = $flareSite->latestEmission;
        
        return response()->json([
            'latestEmission' => $latestEmission,
            'alertCount' => $flareSite->alerts()->where('acknowledged', false)->count(),
            'status' => $flareSite->status,
        ]);
    }
}