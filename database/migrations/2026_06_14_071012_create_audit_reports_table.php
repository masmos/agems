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
        Schema::create('audit_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('generated_by')->constrained('users')->onDelete('cascade');
            $table->enum('report_type', ['daily', 'weekly', 'monthly', 'custom'])->default('daily');
            $table->date('report_date');
            $table->longText('content'); // JSON encoded report data
            $table->string('file_path');
            $table->timestamps();
            
            $table->index('report_type');
            $table->index('report_date');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_reports');
    }
};
