<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('telemetry_readings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('monitoring_station_id')
                  ->constrained()
                  ->onDelete('cascade');
            $table->timestamp('reading_datetime')->useCurrent();
            $table->float('aqi')->nullable();
            $table->float('pm2_5')->nullable();
            $table->float('pm10')->nullable();
            $table->float('methane')->nullable();
            $table->float('co2')->nullable();
            $table->float('temperature')->nullable();
            $table->timestamps();
            
            $table->index('reading_datetime');
            $table->index(['monitoring_station_id', 'reading_datetime']);
            $table->index('aqi');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('telemetry_readings');
    }
};
