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
        Schema::create('products', function (Blueprint $table) {

            $table->id();

            // Product Identification
            $table->string('product_code')->unique();
            $table->string('product_name');

            // Product Details
            $table->string('category')->nullable();
            $table->string('brand')->nullable();
            $table->string('unit')->default('PCS');

            // Pricing
            $table->decimal('purchase_price', 15, 2)->default(0);
            $table->decimal('selling_price', 15, 2)->default(0);

            // Stock
            $table->decimal('opening_stock', 15, 3)->default(0);
            $table->decimal('current_stock', 15, 3)->default(0);
            $table->decimal('minimum_stock', 15, 3)->default(0);

            // Tax
            $table->decimal('gst_percentage', 5, 2)->default(0);

            // Product Status
            $table->string('product_status')->default('Active');

            // Description
            $table->text('description')->nullable();

            // Audit
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->timestamps();
            $table->softDeletes();

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};