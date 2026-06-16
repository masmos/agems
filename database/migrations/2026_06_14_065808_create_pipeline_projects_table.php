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
       Schema::create('pipeline_projects', function (Blueprint $table) {
            $table->id();
            $table->string('project_name');
            $table->text('description')->nullable();
            
            // Progress tracking
            $table->decimal('progress_percentage', 5, 2)->default(0);
            $table->enum('status', [
                'planning', 
                'active', 
                'in_progress', 
                'paused', 
                'completed', 
                'cancelled'
            ])->default('planning');
            
            // Dates
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            
            // Location
            $table->string('location')->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            
            // Financials
            $table->string('contractor')->nullable();
            $table->decimal('budget', 15, 2)->nullable();
            $table->decimal('actual_cost', 15, 2)->nullable();
            
            // Environmental & Compliance
            $table->integer('environmental_impact_score')->nullable();
            $table->enum('compliance_status', [
                'compliant',
                'partially_compliant',
                'non_compliant',
                'not_assessed'
            ])->default('not_assessed');
            
            // Additional
            $table->text('notes')->nullable();
            
            $table->timestamps();
            
            // Indexes
            $table->index('status');
            $table->index('start_date');
            $table->index('end_date');
            $table->index('compliance_status');
            $table->index('progress_percentage');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pipeline_projects');
    }
};
