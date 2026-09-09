<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('amcs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->string('amc_number')->unique();
            $table->date('start_date');
            $table->date('end_date');
            $table->decimal('agreement_value', 12, 2)->nullable();
            $table->decimal('gst', 12, 2)->nullable();
            $table->decimal('total_cost', 12, 2)->nullable();
            $table->string('payment_terms')->nullable();
            $table->enum('status', ['Draft', 'Active', 'Expired', 'Cancelled'])->default('Draft');
            $table->string('agreement_document')->nullable();
            $table->text('notes')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('amcs');
    }
};
