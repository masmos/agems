<?php

namespace App\Models;

use App\Models\Alert;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Threshold extends Model
{
    use LogsActivity;

    protected $fillable = [
        'parameter',
        'source_type',
        'min_value',
        'max_value',
        'severity',
        'is_active',
    ];

    protected $casts = [
        'min_value' => 'float',
        'max_value' => 'float',
        'is_active' => 'boolean',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty();
    }

    // Relationships
    public function alerts()
    {
        return $this->hasMany(Alert::class);
    }

    // Helper methods
    public function isBreached($value): bool
    {
        if ($this->min_value !== null && $value < $this->min_value) {
            return true;
        }
        
        if ($this->max_value !== null && $value > $this->max_value) {
            return true;
        }
        
        return false;
    }

    public function getBreachMessage($value, $sourceName): string
    {
        $operator = $this->min_value !== null ? 'below' : 'above';
        $limit = $this->min_value ?? $this->max_value;
        
        return sprintf(
            '%s at %s is %s %.2f (limit: %.2f)',
            strtoupper($this->parameter),
            $sourceName,
            $operator,
            $value,
            $limit
        );
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForSourceType($query, $sourceType)
    {
        return $query->where('source_type', $sourceType);
    }
}
