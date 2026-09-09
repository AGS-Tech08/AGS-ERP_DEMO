<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('daily_works')) {
            return;
        }

        Schema::create('daily_works', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->date('work_date');
            $table->text('work_description');
            $table->enum('work_type', ['Development', 'Support', 'Documentation', 'Training', 'Meeting']);
            $table->decimal('hours_spent', 5, 2);
            $table->enum('status', ['Pending', 'In Progress', 'Completed', 'On Hold'])->default('Pending');
            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->index(['employee_id', 'work_date']);
            $table->index(['work_type', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_works');
    }
};