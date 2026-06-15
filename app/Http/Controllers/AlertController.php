<?php

namespace App\Http\Controllers;

use App\Models\Alert;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AlertController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Alert::with(['source', 'threshold', 'acknowledgedBy']);
        
        // Filters
        if ($request->has('severity')) {
            $query->where('severity', $request->severity);
        }
        
        if ($request->has('acknowledged')) {
            $query->where('acknowledged', $request->boolean('acknowledged'));
        }
        
        if ($request->has('source_type')) {
            $query->where('source_type', $request->source_type);
        }
        
        $alerts = $query->orderBy('created_at', 'desc')
                        ->paginate($request->get('per_page', 10000000));
        
        $stats = [
            'total' => Alert::count(),
            'unacknowledged' => Alert::where('acknowledged', false)->count(),
            'critical' => Alert::where('severity', 'critical')->where('acknowledged', false)->count(),
            'warning' => Alert::where('severity', 'warning')->where('acknowledged', false)->count(),
        ];
        
        return inertia('alerts/index', [
            'alerts' => $alerts,
            'stats' => $stats,
            'filters' => $request->only(['severity', 'acknowledged', 'source_type']),
        ]);
    }
    
    public function show(Alert $alert)
    {
        $alert->load(['source', 'threshold', 'acknowledgedBy']);
        
        // Get historical data for the same source
        $historicalAlerts = Alert::where('source_type', $alert->source_type)
            ->where('source_id', $alert->source_id)
            ->where('id', '!=', $alert->id)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();
        
        return inertia('alerts/show', [
            'alert' => $alert,
            'historicalAlerts' => $historicalAlerts,
        ]);
    }
    
    public function acknowledge(Alert $alert)
    {
        $alert->acknowledge(Auth::user());
        
        return back()->with('success', 'Alert acknowledged successfully.');
    }
    
    public function bulkAcknowledge(Request $request)
    {
        $request->validate([
            'alert_ids' => 'required|array',
            'alert_ids.*' => 'exists:alerts,id',
        ]);
        
        $count = Alert::whereIn('id', $request->alert_ids)
            ->where('acknowledged', false)
            ->update([
                'acknowledged' => true,
                'acknowledged_by' => Auth::user()->id,
                'acknowledged_at' => now(),
            ]);
        
        return back()->with('success', "{$count} alert(s) acknowledged successfully.");
    }
    
    public function dashboard()
    {
        // Get recent alerts for dashboard
        $recentAlerts = Alert::with(['source'])
            ->where('acknowledged', false)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();
        
        // Get alert statistics by source type
        $alertsBySource = Alert::select('source_type', DB::raw('count(*) as count'))
            ->where('acknowledged', false)
            ->groupBy('source_type')
            ->get();
        
        // Get alerts by severity over time (last 7 days)
        $alertsOverTime = Alert::select(
                DB::raw('DATE(created_at) as date'),
                'severity',
                DB::raw('count(*) as count')
            )
            ->where('created_at', '>=', now()->subDays(7))
            ->groupBy('date', 'severity')
            ->orderBy('date')
            ->get();
        
        return inertia('dashboard', [
            'recentAlerts' => $recentAlerts,
            'alertsBySource' => $alertsBySource,
            'alertsOverTime' => $alertsOverTime,
        ]);
    }
}