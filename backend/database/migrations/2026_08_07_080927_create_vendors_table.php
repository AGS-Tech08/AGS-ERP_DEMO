<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendors', function (Blueprint $table) {

            $table->id();

            // Vendor Identity
            $table->string('vendor_code')->unique();
            $table->string('company_name');
            $table->string('company_type')->nullable();

            // Tax Details
            $table->string('gst_number')->nullable();
            $table->string('pan_number')->nullable();

            // Contact Details
            $table->string('contact_person');
            $table->string('designation')->nullable();

            $table->string('mobile', 20);
            $table->string('alternate_mobile', 20)->nullable();

            $table->string('email')->nullable();
            $table->string('website')->nullable();

            // Address
            $table->text('address');
            $table->string('area')->nullable();
            $table->string('city');
            $table->string('district')->nullable();
            $table->string('state');
            $table->string('country')->default('India');
            $table->string('pincode', 10)->nullable();

            // Financial
            $table->decimal('credit_limit', 15, 2)
                ->default(0);

            // Status
            $table->string('vendor_status')
                ->default('Active');

            // Audit
            $table->unsignedBigInteger('created_by')
                ->nullable();

            $table->unsignedBigInteger('updated_by')
                ->nullable();

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendors');
    }
};