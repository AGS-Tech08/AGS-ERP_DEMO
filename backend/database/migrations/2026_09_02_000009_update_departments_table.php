<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('departments')) {
            return;
        }

        if (!Schema::hasColumn('departments', 'name')) {
            Schema::table('departments', function (Blueprint $table) {
                $table->string('name')->nullable()->index();
            });
        }

        if (!Schema::hasColumn('departments', 'description')) {
            Schema::table('departments', function (Blueprint $table) {
                $table->text('description')->nullable();
            });
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('departments')) {
            return;
        }

        if (Schema::hasColumn('departments', 'description')) {
            Schema::table('departments', function (Blueprint $table) {
                $table->dropColumn('description');
            });
        }

        if (Schema::hasColumn('departments', 'name')) {
            Schema::table('departments', function (Blueprint $table) {
                $table->dropColumn('name');
            });
        }
    }
};