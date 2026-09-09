<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('task_assignments')) {
            return;
        }

        Schema::create('task_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained('tasks')->cascadeOnDelete();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->date('assigned_date');
            $table->enum('assignment_status', ['Assigned', 'In Progress', 'Completed', 'Cancelled'])->default('Assigned');
            $table->unsignedTinyInteger('completion_percentage')->default(0);
            $table->date('completion_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->unique(['task_id', 'employee_id']);
            $table->index(['employee_id', 'assignment_status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_assignments');
    }
};