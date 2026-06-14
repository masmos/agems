<?php

namespace App\Models;

use App\Models\Alert;
use App\Models\Inspection;
use App\Models\TelemetryReading;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class MonitoringStation extends Model
{
    use LogsActivity;

    protected $fillable = [
        'station_name',
        'location',
        'latitude',
        'longitude',
        'status',
    ];

    protected $casts = [
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty();
    }

    // Relationships
    public function telemetryReadings()
    {
        return $this->hasMany(TelemetryReading::class);
    }

    public function alerts()
    {
        return $this->morphMany(Alert::class, 'source');
    }

    public function inspections()
    {
        return $this->morphMany(Inspection::class, 'inspectable');
    }

    public function latestReading()
    {
        return $this->hasOne(TelemetryReading::class)->latest('reading_datetime');
    }
}
