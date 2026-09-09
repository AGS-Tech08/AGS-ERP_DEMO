<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->enum('template_type', ['customer_reference_challan', 'service_challan'])->index();
            $table->text('description')->nullable();
            $table->json('config')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_default')->default(false)->index();
            $table->timestamps();
        });

        DB::table('service_templates')->insert([
            [
                'name' => 'Customer Reference Challan',
                'slug' => 'customer-reference-challan',
                'template_type' => 'customer_reference_challan',
                'description' => 'Acknowledgement document without final charges or payment details.',
                'config' => json_encode([]),
                'is_active' => true,
                'is_default' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Service Challan',
                'slug' => 'service-challan',
                'template_type' => 'service_challan',
                'description' => 'Completed work document with spare and service charges, without invoice/payment fields.',
                'config' => json_encode([]),
                'is_active' => true,
                'is_default' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('service_templates');
    }
};
