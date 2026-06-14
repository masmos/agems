<?php

namespace App\Http\Controllers;

use App\Models\Threshold;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ThresholdController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'parameter' => ['required', 'string', 'max:50'],
            'source_type' => ['required', 'in:monitoring_station,flare_site'],
            'severity' => ['required', 'in:warning,critical'],
            'min_value' => ['nullable', 'numeric'],
            'max_value' => ['nullable', 'numeric'],
            'is_active' => ['required', 'boolean'],
        ]);

        if ($request->filled('min_value') === false && $request->filled('max_value') === false) {
            return back()->withErrors([
                'limits' => 'Please provide at least one of Min value or Max value.',
            ])->withInput();
        }

        Threshold::updateOrCreate(
            [
                'parameter' => $validated['parameter'],
                'source_type' => $validated['source_type'],
                'severity' => $validated['severity'],
            ],
            [
                'min_value' => $validated['min_value'] ?? null,
                'max_value' => $validated['max_value'] ?? null,
                'is_active' => $validated['is_active'],
            ]
        );

        return back()->with('success', 'Threshold saved successfully.');
    }

    public function index(Request $request)
    {

        $query = Threshold::query();


        if ($request->has('severity')) {
            $query->where('severity', $request->severity);
        }

        if ($request->has('source_type')) {
            $query->where('source_type', $request->source_type);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $thresholds = $query
            ->orderBy('updated_at', 'desc')
            ->paginate($request->get('per_page', 20));

        $stats = [
            'total' => Threshold::count(),
            'active' => Threshold::where('is_active', true)->count(),
            'warning' => Threshold::where('severity', 'warning')->where('is_active', true)->count(),
            'critical' => Threshold::where('severity', 'critical')->where('is_active', true)->count(),
        ];

        return inertia('thresholds/index', [
            'thresholds' => $thresholds,
            'stats' => $stats,
            'filters' => $request->only(['severity', 'source_type', 'is_active']),
        ]);
    }
}

