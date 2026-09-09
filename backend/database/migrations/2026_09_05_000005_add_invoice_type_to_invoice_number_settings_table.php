<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE `invoice_number_settings` DROP FOREIGN KEY `invoice_number_settings_company_profile_id_foreign`');
        DB::statement('ALTER TABLE `invoice_number_settings` DROP INDEX `invoice_number_settings_company_profile_id_unique`');

        Schema::table('invoice_number_settings', function (Blueprint $table) {
            $table->enum('invoice_type', ['tax', 'normal'])
                ->default('tax')
                ->after('company_profile_id');
        });

        DB::table('invoice_number_settings')->update(['invoice_type' => 'tax']);

        Schema::table('invoice_number_settings', function (Blueprint $table) {
            $table->unique(
                ['company_profile_id', 'invoice_type'],
                'invoice_number_settings_company_profile_id_invoice_type_unique'
            );
        });

        DB::statement(
            'ALTER TABLE `invoice_number_settings` '
            . 'ADD CONSTRAINT `invoice_number_settings_company_profile_id_foreign` '
            . 'FOREIGN KEY (`company_profile_id`) REFERENCES `company_profiles` (`id`) '
            . 'ON DELETE CASCADE'
        );

        $profileIds = DB::table('invoice_number_settings')
            ->distinct()
            ->pluck('company_profile_id');
        foreach ($profileIds as $profileId) {
            if (DB::table('invoice_number_settings')
                ->where('company_profile_id', $profileId)
                ->where('invoice_type', 'normal')
                ->exists()) {
                continue;
            }

            DB::table('invoice_number_settings')->insert([
                'company_profile_id' => $profileId,
                'invoice_type' => 'normal',
                'prefix' => 'AGSN',
                'start_number' => 1,
                'next_number' => 1,
                'number_padding' => 3,
                'include_date' => false,
                'include_financial_year' => true,
                'financial_year_start_month' => 4,
                'last_financial_year' => '2026-27',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE `invoice_number_settings` DROP FOREIGN KEY `invoice_number_settings_company_profile_id_foreign`');

        Schema::table('invoice_number_settings', function (Blueprint $table) {
            $table->dropUnique('invoice_number_settings_company_profile_id_invoice_type_unique');
        });

        DB::table('invoice_number_settings')->where('invoice_type', 'normal')->delete();

        Schema::table('invoice_number_settings', function (Blueprint $table) {
            $table->dropColumn('invoice_type');
            $table->unique('company_profile_id', 'invoice_number_settings_company_profile_id_unique');
        });

        DB::statement(
            'ALTER TABLE `invoice_number_settings` '
            . 'ADD CONSTRAINT `invoice_number_settings_company_profile_id_foreign` '
            . 'FOREIGN KEY (`company_profile_id`) REFERENCES `company_profiles` (`id`) '
            . 'ON DELETE CASCADE'
        );
    }
};
