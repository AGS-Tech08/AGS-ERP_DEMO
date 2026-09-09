<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoice_number_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_profile_id')
                ->unique()
                ->constrained('company_profiles')
                ->cascadeOnDelete();
            $table->string('prefix', 30)->default('INV');
            $table->unsignedBigInteger('start_number')->default(1);
            $table->unsignedBigInteger('next_number')->default(1);
            $table->unsignedTinyInteger('number_padding')->default(5);
            $table->boolean('include_date')->default(true);
            $table->boolean('include_financial_year')->default(false);
            $table->unsignedTinyInteger('financial_year_start_month')->default(4);
            $table->string('last_financial_year', 10)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_number_settings');
    }
};
