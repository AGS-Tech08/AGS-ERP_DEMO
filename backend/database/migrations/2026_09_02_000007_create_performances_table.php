<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('performances')) return;
        Schema::create('performances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->string('review_period', 100);
            $table->date('review_date');
            $table->decimal('overall_rating', 3, 2);
            $table->decimal('productivity_rating', 3, 2);
            $table->decimal('quality_rating', 3, 2);
            $table->decimal('attendance_rating', 3, 2);
            $table->decimal('skill_rating', 3, 2);
            $table->text('goals')->nullable();
            $table->text('achievements')->nullable();
            $table->text('strengths')->nullable();
            $table->text('improvement_areas')->nullable();
            $table->text('manager_comments')->nullable();
            $table->text('employee_comments')->nullable();
            $table->enum('status', ['Draft', 'Submitted', 'Acknowledged', 'Final'])->default('Draft');
            $table->timestamps();
            $table->index(['employee_id', 'review_date']);
            $table->index(['review_period', 'status']);
        });
    }

    public function down(): void { Schema::dropIfExists('performances'); }
};