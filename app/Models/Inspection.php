<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Inspection extends Model
{
    use LogsActivity;

    protected $fillable = [
        'inspector_id',
        'inspection_date',
        'location',
        'findings',
        'status',
        'inspectable_type',
        'inspectable_id',
        'corrective_action',
        'follow_up_date',
    ];

    protected $casts = [
        'inspection_date' => 'date',
        'follow_up_date' => 'date',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty();
    }

    // Relationships
    public function inspector()
    {
        return $this->belongsTo(User::class, 'inspector_id');
    }

    public function inspectable()
    {
        return $this->morphTo();
    }

    // Helper methods
    public function markAsCompliant(): void
    {
        $this->update(['status' => 'compliant']);
    }

    public function markAsNonCompliant(string $action = null): void
    {
        $this->update([
            'status' => 'non_compliant',
            'corrective_action' => $action ?? $this->corrective_action,
        ]);
    }

    public function requiresFollowUp(): bool
    {
        return $this->status === 'non_compliant' && $this->follow_up_date !== null;
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeNonCompliant($query)
    {
        return $query->where('status', 'non_compliant');
    }

    public function scopeDueForFollowUp($query)
    {
        return $query->where('status', 'non_compliant')
                     ->where('follow_up_date', '<=', now());
    }
}
