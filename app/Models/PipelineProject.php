<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class PipelineProject extends Model
{
    use LogsActivity;

   protected $fillable = [
        'project_name',
        'description',
        'progress_percentage',
        'start_date',
        'end_date',
        'location',
        'status',
        'contractor',
        'budget',
        'actual_cost',
        'environmental_impact_score',
        'compliance_status',
        'notes',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'progress_percentage' => 'decimal:2',
        'budget' => 'decimal:2',
        'actual_cost' => 'decimal:2',
        'environmental_impact_score' => 'integer',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    // Relationships
    public function inspections()
    {
        return $this->morphMany(Inspection::class, 'inspectable');
    }

    public function alerts()
    {
        return $this->morphMany(Alert::class, 'source');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active')
            ->orWhere('status', 'in_progress');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeHighRisk($query)
    {
        return $query->where('environmental_impact_score', '>=', 70);
    }

    // Helper Methods
    public function getProgressColor(): string
    {
        if ($this->progress_percentage < 30) {
            return 'bg-red-500';
        } elseif ($this->progress_percentage < 70) {
            return 'bg-yellow-500';
        } else {
            return 'bg-green-500';
        }
    }

    public function getStatusColor(): string
    {
        return match($this->status) {
            'planning' => 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
            'active', 'in_progress' => 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
            'paused' => 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
            'completed' => 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
            'cancelled' => 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
            default => 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
        };
    }

    public function getComplianceColor(): string
    {
        return match($this->compliance_status) {
            'compliant' => 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
            'partially_compliant' => 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
            'non_compliant' => 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
            default => 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
        };
    }

    public function getEnvironmentalRiskLevel(): string
    {
        if (!$this->environmental_impact_score) {
            return 'unknown';
        }
        
        if ($this->environmental_impact_score < 30) {
            return 'Low';
        } elseif ($this->environmental_impact_score < 60) {
            return 'Medium';
        } elseif ($this->environmental_impact_score < 80) {
            return 'High';
        } else {
            return 'Critical';
        }
    }

    public function getEnvironmentalRiskColor(): string
    {
        if (!$this->environmental_impact_score) {
            return 'bg-gray-100 text-gray-800';
        }
        
        if ($this->environmental_impact_score < 30) {
            return 'bg-green-100 text-green-800';
        } elseif ($this->environmental_impact_score < 60) {
            return 'bg-yellow-100 text-yellow-800';
        } elseif ($this->environmental_impact_score < 80) {
            return 'bg-orange-100 text-orange-800';
        } else {
            return 'bg-red-100 text-red-800';
        }
    }

    public function isOverBudget(): bool
    {
        return $this->actual_cost && $this->budget && $this->actual_cost > $this->budget;
    }

    public function getBudgetVariance(): ?float
    {
        if (!$this->budget || !$this->actual_cost) {
            return null;
        }
        return $this->actual_cost - $this->budget;
    }

    public function getBudgetVariancePercentage(): ?float
    {
        if (!$this->budget || $this->budget == 0) {
            return null;
        }
        return (($this->actual_cost - $this->budget) / $this->budget) * 100;
    }

    public function getDaysRemaining(): ?int
    {
        if (!$this->end_date) {
            return null;
        }
        
        if ($this->status === 'completed') {
            return 0;
        }
        
        $days = now()->diffInDays($this->end_date, false);
        return $days > 0 ? $days : 0;
    }

    public function getTotalDays(): ?int
    {
        if (!$this->start_date || !$this->end_date) {
            return null;
        }
        return $this->start_date->diffInDays($this->end_date);
    }

    public function getDaysElapsed(): ?int
    {
        if (!$this->start_date) {
            return null;
        }
        
        if ($this->status === 'completed' && $this->end_date) {
            return $this->start_date->diffInDays($this->end_date);
        }
        
        return $this->start_date->diffInDays(now());
    }
}
