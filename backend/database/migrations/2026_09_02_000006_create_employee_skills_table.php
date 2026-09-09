<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('employee_skills')) return;
        Schema::create('employee_skills', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->foreignId('skill_id')->constrained('skills')->cascadeOnDelete();
            $table->enum('current_level', ['Beginner', 'Intermediate', 'Advanced', 'Expert']);
            $table->enum('target_level', ['Beginner', 'Intermediate', 'Advanced', 'Expert']);
            $table->unsignedTinyInteger('progress_percentage')->default(0);
            $table->text('improvement_goal')->nullable();
            $table->date('review_date')->nullable();
            $table->enum('status', ['Active', 'In Progress', 'Completed', 'On Hold'])->default('Active');
            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->unique(['employee_id', 'skill_id']);
            $table->index(['status', 'review_date']);
        });
    }

    public function down(): void { Schema::dropIfExists('employee_skills'); }
};