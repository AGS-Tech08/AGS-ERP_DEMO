<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reward_settings', function (Blueprint $table) {
            $table->id();
            $table->decimal('purchase_amount', 12, 2)->default(100);
            $table->integer('reward_points')->default(10);
            $table->integer('minimum_redeem_points')->default(100);
            $table->integer('points_expiry_days')->default(365);
            $table->boolean('enable_points_expiry')->default(true);
            $table->string('status')->default('Active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reward_settings');
    }
};
