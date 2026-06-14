<?php

use App\Http\Controllers\AlertController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\MonitoringStationController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('dashboard/realtime', [DashboardController::class, 'getRealtimeData'])->name('dashboard.realtime');
});

require __DIR__.'/settings.php';

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('alerts/', [AlertController::class, 'index'])->name('alerts.index');
    Route::get('alerts/{alert}', [AlertController::class, 'show'])->name('alerts.show');
    Route::post('alerts/{alert}/acknowledge', [AlertController::class, 'acknowledge'])->name('alerts.acknowledge');
    Route::post('alerts/bulk-acknowledge', [AlertController::class, 'bulkAcknowledge'])->name('alerts.bulk-acknowledge');
 Route::get('/stations', [MonitoringStationController::class, 'index'])->name('stations.index');
    Route::get('/stations/{station}', [MonitoringStationController::class, 'show'])->name('stations.show');
});
