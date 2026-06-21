<?php

namespace App\Http\Controllers;

use App\Models\Inspection;
use App\Models\PipelineProject;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class PipelineProjectController extends Controller
{
    public function index(Request $request)
    {
        $projects = PipelineProject::withCount(['alerts', 'inspections'])
            ->when($request->search, function ($query, $search) {
                $query->where('project_name', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%")
                    ->orWhere('contractor', 'like', "%{$search}%");
            })
            ->when($request->status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->when($request->compliance, function ($query, $compliance) {
                $query->where('compliance_status', $compliance);
            })
            ->orderBy('created_at', 'desc')
            ->paginate(12);

        // Get statistics
        $stats = [
            'total' => PipelineProject::count(),
            'active' => PipelineProject::whereIn('status', ['active', 'in_progress'])->count(),
            'completed' => PipelineProject::where('status', 'completed')->count(),
            'high_risk' => PipelineProject::where('environmental_impact_score', '>=', 70)->count(),
            'non_compliant' => PipelineProject::where('compliance_status', 'non_compliant')->count(),
            'average_progress' => PipelineProject::avg('progress_percentage') ?? 0,
        ];

        // Get status counts for filter
        $statusCounts = PipelineProject::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');

        return Inertia::render('pipeline/index', [
            'projects' => $projects,
            'stats' => $stats,
            'statusCounts' => $statusCounts,
            'filters' => $request->only(['search', 'status', 'compliance']),
        ]);
    }

    public function create()
    {
        return Inertia::render('pipeline/create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'project_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => ['required', Rule::in(['planning', 'active', 'in_progress', 'paused', 'completed', 'cancelled'])],
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'location' => 'nullable|string|max:255',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'contractor' => 'nullable|string|max:255',
            'budget' => 'nullable|numeric|min:0',
            'actual_cost' => 'nullable|numeric|min:0',
            'environmental_impact_score' => 'nullable|integer|min:0|max:100',
            'compliance_status' => ['nullable', Rule::in(['compliant', 'partially_compliant', 'non_compliant', 'not_assessed'])],
            'notes' => 'nullable|string',
        ]);

        $project = PipelineProject::create($validated);

        return redirect()->route('pipeline.show', $project)
            ->with('success', 'Pipeline project created successfully.');
    }

    public function show($id)
    {
        // Try to find the project manually
        $pipelineProject = PipelineProject::find($id);

        if (!$pipelineProject) {
            Log::error('PipelineProject show - Project not found', ['id' => $id]);
            abort(404, 'Project not found');
        }

        Log::info('PipelineProject show - Found project:', [
            'id' => $pipelineProject->id,
            'name' => $pipelineProject->project_name,
            'status' => $pipelineProject->status,
        ]);

        // Load relationships
        $pipelineProject->load([
            'alerts' => function ($query) {
                $query->latest()->limit(10);
            }
        ]);

        // Get inspections for this project
        $inspections = Inspection::where('inspectable_type', PipelineProject::class)
            ->where('inspectable_id', $pipelineProject->id)
            ->with('inspector')
            ->orderBy('inspection_date', 'desc')
            ->limit(10)
            ->get();

        // Get alerts count by severity
        $alertStats = $pipelineProject->alerts()
            ->select('severity', DB::raw('count(*) as count'))
            ->groupBy('severity')
            ->pluck('count', 'severity');

        // Get progress history
        $progressHistory = $this->getProgressHistory($pipelineProject);

        // Get counts
        $alertsCount = $pipelineProject->alerts()->count();
        $inspectionsCount = $pipelineProject->inspections()->count();

        // Prepare the project data
        $projectData = [
            'id' => $pipelineProject->id,
            'project_name' => $pipelineProject->project_name,
            'description' => $pipelineProject->description,
            'progress_percentage' => (float) $pipelineProject->progress_percentage,
            'status' => $pipelineProject->status,
            'start_date' => $pipelineProject->start_date,
            'end_date' => $pipelineProject->end_date,
            'location' => $pipelineProject->location,
            'latitude' => $pipelineProject->latitude,
            'longitude' => $pipelineProject->longitude,
            'contractor' => $pipelineProject->contractor,
            'budget' => (float) $pipelineProject->budget,
            'actual_cost' => (float) $pipelineProject->actual_cost,
            'environmental_impact_score' => $pipelineProject->environmental_impact_score,
            'compliance_status' => $pipelineProject->compliance_status,
            'notes' => $pipelineProject->notes,
            'created_at' => $pipelineProject->created_at,
            'updated_at' => $pipelineProject->updated_at,
            'alerts' => $pipelineProject->alerts,
            'alerts_count' => $alertsCount,
            'inspections_count' => $inspectionsCount,
        ];

        Log::info('PipelineProject show - Returning data:', [
            'project_name' => $projectData['project_name'],
            'status' => $projectData['status'],
        ]);

        return Inertia::render('pipeline/show', [
            'project' => $projectData,
            'inspections' => $inspections,
            'alertStats' => $alertStats,
            'progressHistory' => $progressHistory,
        ]);
    }

    public function edit($id)
    {
        // Find the project manually
        $pipelineProject = PipelineProject::find($id);

        if (!$pipelineProject) {
            Log::error('PipelineProject edit - Project not found', ['id' => $id]);
            abort(404, 'Project not found');
        }

        Log::info('PipelineProject edit - Found project:', [
            'id' => $pipelineProject->id,
            'name' => $pipelineProject->project_name,
        ]);

        return Inertia::render('pipeline/edit', [
            'project' => $pipelineProject,
        ]);
    }

    public function update(Request $request, $id)
    {
        // Find the project manually
        $pipelineProject = PipelineProject::find($id);

        if (!$pipelineProject) {
            Log::error('PipelineProject update - Project not found', ['id' => $id]);
            abort(404, 'Project not found');
        }

        $validated = $request->validate([
            'project_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'progress_percentage' => 'nullable|numeric|min:0|max:100',
            'status' => ['required', Rule::in(['planning', 'active', 'in_progress', 'paused', 'completed', 'cancelled'])],
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'location' => 'nullable|string|max:255',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'contractor' => 'nullable|string|max:255',
            'budget' => 'nullable|numeric|min:0',
            'actual_cost' => 'nullable|numeric|min:0',
            'environmental_impact_score' => 'nullable|integer|min:0|max:100',
            'compliance_status' => ['nullable', Rule::in(['compliant', 'partially_compliant', 'non_compliant', 'not_assessed'])],
            'notes' => 'nullable|string',
        ]);

        $pipelineProject->update($validated);

        Log::info('PipelineProject update - Project updated:', [
            'id' => $pipelineProject->id,
            'name' => $pipelineProject->project_name,
            'status' => $pipelineProject->status,
        ]);

        return redirect()->route('pipeline.show', $pipelineProject)
            ->with('success', 'Pipeline project updated successfully.');
    }

    public function destroy($id)
    {
        // Find the project manually
        $pipelineProject = PipelineProject::find($id);

        if (!$pipelineProject) {
            Log::error('PipelineProject destroy - Project not found', ['id' => $id]);
            abort(404, 'Project not found');
        }

        $projectName = $pipelineProject->project_name;
        $pipelineProject->delete();

        Log::info('PipelineProject destroy - Project deleted:', [
            'id' => $id,
            'name' => $projectName,
        ]);

        return redirect()->route('pipeline.index')
            ->with('success', 'Pipeline project deleted successfully.');
    }

    public function updateProgress(Request $request, $id)
    {
        // Find the project manually
        $pipelineProject = PipelineProject::find($id);

        if (!$pipelineProject) {
            Log::error('PipelineProject updateProgress - Project not found', ['id' => $id]);
            abort(404, 'Project not found');
        }

        $validated = $request->validate([
            'progress_percentage' => 'required|numeric|min:0|max:100',
        ]);

        $pipelineProject->update(['progress_percentage' => $validated['progress_percentage']]);

        Log::info('PipelineProject updateProgress - Progress updated:', [
            'id' => $pipelineProject->id,
            'progress' => $pipelineProject->progress_percentage,
        ]);

        return back()->with('success', 'Progress updated successfully.');
    }

    protected function getProgressHistory(PipelineProject $project): array
    {
        $history = [];

        // Add current progress
        $history[] = [
            'date' => now()->format('Y-m-d'),
            'progress' => (float) $project->progress_percentage,
            'status' => $project->status ?? 'planning',
        ];

        // Add historical data from inspections if available
        $inspections = Inspection::where('inspectable_type', PipelineProject::class)
            ->where('inspectable_id', $project->id)
            ->whereNotNull('inspection_date')
            ->orderBy('inspection_date', 'desc')
            ->limit(10)
            ->get();

        foreach ($inspections as $inspection) {
            // Try to extract progress from inspection findings
            $progressMatch = preg_match('/progress\s*[:=]\s*(\d+)/i', $inspection->findings ?? '', $matches);
            $progress = $progressMatch ? (int)$matches[1] : null;

            if ($progress !== null && $progress >= 0 && $progress <= 100) {
                $history[] = [
                    'date' => $inspection->inspection_date->format('Y-m-d'),
                    'progress' => (float) min($progress, 100),
                    'status' => $inspection->status ?? 'unknown',
                ];
            }
        }

        // Sort by date ascending
        usort($history, function ($a, $b) {
            return strtotime($a['date']) - strtotime($b['date']);
        });

        return $history;
    }
}
