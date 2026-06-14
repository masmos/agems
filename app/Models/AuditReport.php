<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class AuditReport extends Model
{
    use LogsActivity;

    protected $fillable = [
        'generated_by',
        'report_type',
        'report_date',
        'content',
        'file_path',
    ];

    protected $casts = [
        'report_date' => 'date',
        'content' => 'array', // Automatically cast JSON to array
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['report_type', 'report_date', 'file_path'])
            ->logOnlyDirty();
    }

    // Relationships
    public function generator()
    {
        return $this->belongsTo(User::class, 'generated_by');
    }

    // Helper methods
    public function getFormattedContent(): array
    {
        return is_array($this->content) ? $this->content : json_decode($this->content, true);
    }

    public function getFileUrl(): string
    {
        return asset('storage/' . $this->file_path);
    }

    // Scopes
    public function scopeOfType($query, $type)
    {
        return $query->where('report_type', $type);
    }

    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('report_date', [$startDate, $endDate]);
    }
}
