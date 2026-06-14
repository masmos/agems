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
        Schema::create('inspections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inspector_id')->constrained('users')->onDelete('cascade');
            $table->date('inspection_date');
            $table->string('location');
            $table->text('findings');
            $table->enum('status', ['pending', 'compliant', 'non_compliant'])->default('pending');
            $table->nullableMorphs('inspectable');
            $table->text('corrective_action')->nullable();
            $table->date('follow_up_date')->nullable();
            $table->timestamps();
            
            $table->index('inspection_date');
            $table->index('status');
            $table->index('follow_up_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inspections');
    }
};
