<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('assets', function (Blueprint $table) {

            $table->id();

            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();

            $table->string('asset_code')->unique();

            $table->string('category');
            $table->string('brand')->nullable();
            $table->string('model')->nullable();

            $table->string('serial_number')->nullable();

            $table->string('ip_address')->nullable();
            $table->string('mac_address')->nullable();

            $table->string('location')->nullable();

            $table->date('purchase_date')->nullable();
            $table->date('installation_date')->nullable();

            $table->date('warranty_from')->nullable();
            $table->date('warranty_to')->nullable();

            $table->string('vendor')->nullable();

            $table->decimal('purchase_price',12,2)->nullable();

            $table->enum('status',[
                'Working',
                'Faulty',
                'Under Service',
                'Replaced',
                'Disposed'
            ])->default('Working');

            $table->text('remarks')->nullable();

            $table->softDeletes();

            $table->timestamps();

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assets');
    }
};