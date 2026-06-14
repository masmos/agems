<?php

namespace App\Models;

use App\Models\Alert;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class FlareEmission extends Model
{
     use LogsActivity;

    protected $fillable = [
        'flare_site_id',
        'reading_datetime',
        'methane_level',
        'co2_level',
        'so2_level',
        'nox_level',
    ];

    protected $casts = [
        'reading_datetime' => 'datetime',
        'methane_level' => 'float',
        'co2_level' => 'float',
        'so2_level' => 'float',
        'nox_level' => 'float',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['flare_site_id', 'methane_level', 'so2_level', 'nox_level'])
            ->logOnlyDirty();
    }

    // Relationships
    public function flareSite()
    {
        return $this->belongsTo(FlareSite::class);
    }

    public function alerts()
    {
        return $this->morphMany(Alert::class, 'source');
    }

    // Scopes
    public function scopeRecent($query, $hours = 24)
    {
        return $query->where('reading_datetime', '>=', now()->subHours($hours));
    }
}
