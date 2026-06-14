<?php

namespace App\Models;

use App\Models\Alert;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class TelemetryReading extends Model
{
    use LogsActivity;

    protected $fillable = [
        'monitoring_station_id',
        'reading_datetime',
        'aqi',
        'pm2_5',
        'pm10',
        'methane',
        'co2',
        'temperature',
    ];

    protected $casts = [
        'reading_datetime' => 'datetime',
        'aqi' => 'float',
        'pm2_5' => 'float',
        'pm10' => 'float',
        'methane' => 'float',
        'co2' => 'float',
        'temperature' => 'float',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['monitoring_station_id', 'aqi', 'pm2_5', 'methane'])
            ->logOnlyDirty();
    }

    // Relationships
    public function monitoringStation()
    {
        return $this->belongsTo(MonitoringStation::class);
    }

    public function alerts()
    {
        return $this->morphMany(Alert::class, 'source');
    }

    // Scopes
    public function scopeExceedingThreshold($query, $parameter, $value)
    {
        return $query->where($parameter, '>=', $value);
    }

    public function scopeRecent($query, $hours = 24)
    {
        return $query->where('reading_datetime', '>=', now()->subHours($hours));
    }
}
