<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asset_service_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asset_id')->constrained()->cascadeOnDelete();
            $table->date('service_date');
            $table->text('complaint');
            $table->text('work_done')->nullable();
            $table->string('engineer')->nullable();
            $table->text('parts_replaced')->nullable();
            $table->decimal('service_cost', 12, 2)->nullable();
            $table->text('remarks')->nullable();
            $table->enum('status', ['Open', 'In Progress', 'Closed'])->default('Open');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asset_service_records');
    }
};
