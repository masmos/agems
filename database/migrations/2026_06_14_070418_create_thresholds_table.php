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
        Schema::create('thresholds', function (Blueprint $table) {
            $table->id();
            $table->string('parameter', 50);
            $table->enum('source_type', ['monitoring_station', 'flare_site']);
            $table->enum('severity', ['warning', 'critical'])->default('warning');
            $table->float('min_value')->nullable();
            $table->float('max_value')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            // Unique constraint includes severity - allows warning AND critical for same parameter
            $table->unique(['parameter', 'source_type', 'severity'], 'thresholds_unique_key');
            $table->index(['source_type', 'is_active']);
            $table->index('severity');
            
            // Ensure at least one threshold value is provided
            // $table->check('min_value IS NOT NULL OR max_value IS NOT NULL');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('thresholds');
    }
};
