<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('amc_assets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('amc_id')->constrained()->cascadeOnDelete();
            $table->foreignId('asset_id')->constrained()->cascadeOnDelete();
            $table->enum('status', ['Active', 'Inactive'])->default('Active');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['amc_id', 'asset_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('amc_assets');
    }
};
