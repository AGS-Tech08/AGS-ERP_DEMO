<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            $table->foreignId('service_spare_id')
                ->nullable()
                ->after('service_id')
                ->constrained('service_spares')
                ->nullOnDelete();

            $table->index('service_spare_id');
        });
    }

    public function down(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            $table->dropForeign(['service_spare_id']);
            $table->dropIndex(['service_spare_id']);
            $table->dropColumn('service_spare_id');
        });
    }
};