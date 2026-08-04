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
        Schema::create('customers', function (Blueprint $table) {
            $table->id();

            $table->string('customer_code')->unique();

            $table->string('company_name');
            $table->string('company_type')->nullable();

            $table->string('gst_number')->nullable();
            $table->string('pan_number')->nullable();

            $table->string('contact_person');
            $table->string('designation')->nullable();

            $table->string('mobile');
            $table->string('alternate_mobile')->nullable();

            $table->string('email')->nullable();
            $table->string('website')->nullable();

            $table->text('address');

            $table->string('area')->nullable();
            $table->string('city');
            $table->string('district')->nullable();
            $table->string('state');
            $table->string('country')->default('India');
            $table->string('pincode')->nullable();

            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();

            $table->decimal('credit_limit', 12, 2)->default(0);

            $table->enum('customer_status', [
                'Lead',
                'Active',
                'Inactive',
                'Blocked'
            ])->default('Lead');

            $table->foreignId('created_by')->nullable();
            $table->foreignId('updated_by')->nullable();

            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};