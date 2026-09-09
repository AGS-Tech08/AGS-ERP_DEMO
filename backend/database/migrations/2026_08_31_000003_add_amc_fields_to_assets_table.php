<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Safely add AMC-related fields to assets table.
     * Skip columns that already exist from the original create_assets_table migration.
     */
    public function up(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            // AMC linkage
            if (!Schema::hasColumn('assets', 'amc_id')) {
                $table->foreignId('amc_id')->nullable()->after('customer_id')->constrained('amcs')->nullOnDelete();
            }

            // Device identification (needed for frontend form)
            if (!Schema::hasColumn('assets', 'device_name')) {
                $table->string('device_name')->nullable()->after('asset_code');
            }

            if (!Schema::hasColumn('assets', 'device_type')) {
                $table->string('device_type')->nullable()->after('device_name');
            }

            // Note: 'category' already exists in original create_assets_table migration
            // so we skip it here to avoid "Duplicate column name" error
        });
    }

    public function down(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            $columns_to_drop = [];

            if (Schema::hasColumn('assets', 'amc_id')) {
                $columns_to_drop[] = 'amc_id';
            }

            if (Schema::hasColumn('assets', 'device_name')) {
                $columns_to_drop[] = 'device_name';
            }

            if (Schema::hasColumn('assets', 'device_type')) {
                $columns_to_drop[] = 'device_type';
            }

            if (!empty($columns_to_drop)) {
                $table->dropColumn($columns_to_drop);
            }
        });
    }
};
