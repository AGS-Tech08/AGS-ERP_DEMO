<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('skills')) return;
        Schema::create('skills', function (Blueprint $table) {
            $table->id();
            $table->string('skill_name')->unique();
            $table->string('category')->nullable();
            $table->text('description')->nullable();
            $table->enum('status', ['Active', 'Inactive'])->default('Active');
            $table->timestamps();
            $table->index(['category', 'status']);
        });
    }

    public function down(): void { Schema::dropIfExists('skills'); }
};