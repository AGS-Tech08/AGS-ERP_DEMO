<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->string('invoice_type')
                ->default('tax')
                ->after('invoice_no');

            $table->foreignId('service_id')
                ->nullable()
                ->after('customer_id')
                ->constrained('services')
                ->nullOnDelete();

            $table->index('invoice_type');
            $table->index('service_id');
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropForeign(['service_id']);
            $table->dropIndex(['invoice_type']);
            $table->dropIndex(['service_id']);
            $table->dropColumn(['invoice_type', 'service_id']);
        });
    }
};