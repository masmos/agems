<?php

namespace App\Models;

use App\Models\Alert;
use App\Models\FlareEmission;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class FlareSite extends Model
{
    use LogsActivity;

    protected $fillable = [
        'site_name',
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
    public function flareEmissions()
    {
        return $this->hasMany(FlareEmission::class);
    }

    public function alerts()
    {
        return $this->morphMany(Alert::class, 'source');
    }

    public function inspections()
    {
        return $this->morphMany(Inspection::class, 'inspectable');
    }

    public function latestEmission()
    {
        return $this->hasOne(FlareEmission::class)->latest('reading_datetime');
    }
}
