<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Alert extends Model
{
    use LogsActivity;

    protected $fillable = [
        'alert_type',
        'source_type',
        'source_id',
        'threshold_id',
        'severity',
        'message',
        'acknowledged',
        'acknowledged_by',
        'acknowledged_at',
    ];

    protected $casts = [
        'acknowledged' => 'boolean',
        'acknowledged_at' => 'datetime',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['severity', 'message', 'acknowledged'])
            ->logOnlyDirty();
    }

    // Relationships
    public function source()
    {
        return $this->morphTo();
    }

    public function threshold()
    {
        return $this->belongsTo(Threshold::class);
    }

    public function acknowledgedBy()
    {
        return $this->belongsTo(User::class, 'acknowledged_by');
    }

    // Helper methods
    public function acknowledge(User $user): void
    {
        $this->update([
            'acknowledged' => true,
            'acknowledged_by' => $user->id,
            'acknowledged_at' => now(),
        ]);
    }

    public function isUnacknowledged(): bool
    {
        return !$this->acknowledged;
    }

    // Scopes
    public function scopeUnacknowledged($query)
    {
        return $query->where('acknowledged', false);
    }

    public function scopeCritical($query)
    {
        return $query->where('severity', 'critical');
    }

    public function scopeRecent($query, $days = 7)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }
}
