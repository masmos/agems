<?php

use App\Http\Controllers\AlertController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FlareSiteController;
use App\Http\Controllers\MonitoringStationController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\TelemetryReadingController;
use App\Http\Controllers\ThresholdController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('dashboard/realtime', [DashboardController::class, 'getRealtimeData'])->name('dashboard.realtime');
});

require __DIR__.'/settings.php';

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('alerts', AlertController::class);
    Route::post('alerts/{alert}/acknowledge', [AlertController::class, 'acknowledge'])->name('alerts.acknowledge');
    Route::post('alerts/bulk-acknowledge', [AlertController::class, 'bulkAcknowledge'])->name('alerts.bulk-acknowledge');
    Route::resource('/thresholds', ThresholdController::class);
    Route::resource('/stations', MonitoringStationController::class);
    Route::resource('flare-sites', FlareSiteController::class);
    Route::get('/flare-sites/{flareSite}/realtime', [FlareSiteController::class, 'getRealtimeData'])->name('flare-sites.realtime');
    Route::resource('telemetry', TelemetryReadingController::class);
    Route::get('/stations/{station}/readings', [TelemetryReadingController::class, 'getStationReadings'])->name('stations.readings');

    // User Management
    Route::resource('users', UserController::class);
    Route::post('/users/bulk', [UserController::class, 'bulkAction'])->name('users.bulk');
    
    // Role Management
    Route::resource('roles', RoleController::class);
    
    // Permission Management (Optional)
    Route::resource('permissions', PermissionController::class);
});
