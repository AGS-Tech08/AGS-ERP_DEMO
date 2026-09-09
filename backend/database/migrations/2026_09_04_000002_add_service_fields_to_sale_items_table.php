<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            $table->foreignId('service_id')
                ->nullable()
                ->after('product_id')
                ->constrained('services')
                ->nullOnDelete();

            $table->string('item_type')
                ->default('product')
                ->after('service_id');

            $table->string('description')
                ->nullable()
                ->after('item_type');

            $table->index('item_type');
            $table->index('service_id');
        });

        // Existing product lines must remain valid.
        // New service lines can have product_id = null.
        Schema::table('sale_items', function (Blueprint $table) {
            $table->foreignId('product_id')
                ->nullable()
                ->change();
        });
    }

    public function down(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            $table->dropForeign(['service_id']);
            $table->dropIndex(['item_type']);
            $table->dropIndex(['service_id']);
            $table->dropColumn([
                'service_id',
                'item_type',
                'description',
            ]);
        });

        Schema::table('sale_items', function (Blueprint $table) {
            $table->foreignId('product_id')
                ->nullable(false)
                ->change();
        });
    }
};