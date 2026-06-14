<?php

use App\Http\Controllers\AlertController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

require __DIR__.'/settings.php';

// Alert routes
/* Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('/alerts', AlertController::class);
});
 */
Route::middleware(['auth', 'verified'])->prefix('alerts')->group(function () {
    Route::get('/', [AlertController::class, 'index'])->name('alerts.index');
    Route::get('/{alert}', [AlertController::class, 'show'])->name('alerts.show');
    Route::post('/{alert}/acknowledge', [AlertController::class, 'acknowledge'])->name('alerts.acknowledge');
    Route::post('/bulk-acknowledge', [AlertController::class, 'bulkAcknowledge'])->name('alerts.bulk-acknowledge');
});