<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Check thresholds every 5 minutes
Schedule::command('environmental:check-thresholds')
    ->everyFiveMinutes()
    ->appendOutputTo(storage_path('logs/threshold-checks.log'));

// Optional: Check more frequently if there are critical alerts
Schedule::command('environmental:check-thresholds --once')
    ->everyMinute()
    ->when(function () {
        return \App\Models\Alert::where('severity', 'critical')
            ->where('acknowledged', false)
            ->where('created_at', '>=', now()->subHour())
            ->exists();
    });
