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
        Schema::create('flare_emissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('flare_site_id')
                  ->constrained()
                  ->onDelete('cascade');
            $table->timestamp('reading_datetime')->useCurrent();
            $table->float('methane_level')->nullable();
            $table->float('co2_level')->nullable();
            $table->float('so2_level')->nullable();
            $table->float('nox_level')->nullable();
            $table->timestamps();
            
            $table->index('reading_datetime');
            $table->index(['flare_site_id', 'reading_datetime']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('flare_emissions');
    }
};
