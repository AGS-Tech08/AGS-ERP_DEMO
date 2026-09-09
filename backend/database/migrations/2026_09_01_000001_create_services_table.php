<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('services', function (Blueprint $table) {
            $table->id();

            // Service number and dates
            $table->string('service_number')->unique();
            $table->dateTime('entry_date');
            $table->date('expected_delivery_date')->nullable();
            $table->date('actual_delivery_date')->nullable();

            // Customer reference
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->string('contact_person')->nullable();
            $table->string('phone')->nullable();

            // Device reference - could be existing asset or temporary device
            $table->foreignId('asset_id')->nullable()->constrained()->nullOnDelete();
            $table->string('device_type')->nullable(); // DVR, Computer, Laptop, Camera, Mobile, Router, Switch, Other
            $table->string('brand')->nullable();
            $table->string('model')->nullable();
            $table->string('serial_number')->nullable();

            // AMC reference if applicable
            $table->foreignId('amc_id')->nullable()->constrained()->nullOnDelete();

            // Problem and diagnosis details
            $table->text('customer_complaint')->nullable();
            $table->text('technician_diagnosis')->nullable();
            $table->text('work_done')->nullable();
            $table->text('final_remarks')->nullable();

            // Technician assignment
            $table->foreignId('assigned_technician_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('service_engineer')->nullable();
            $table->text('technician_remarks')->nullable();

            // Charges and totals
            $table->decimal('labour_charge', 12, 2)->default(0);
            $table->decimal('spare_charge', 12, 2)->default(0);
            $table->decimal('other_charge', 12, 2)->default(0);
            $table->decimal('discount_amount', 12, 2)->default(0);
            $table->decimal('taxable_amount', 12, 2)->default(0);
            $table->decimal('gst_percent', 5, 2)->default(0);
            $table->decimal('gst_amount', 12, 2)->default(0);
            $table->decimal('grand_total', 12, 2)->default(0);

            // Payment tracking
            $table->decimal('paid_amount', 12, 2)->default(0);
            $table->decimal('balance_amount', 12, 2)->default(0);
            $table->enum('payment_status', ['Unpaid', 'Partially Paid', 'Paid'])->default('Unpaid');

            // Status and priority
            $table->enum('status', [
                'Received',
                'Inspection',
                'Waiting for Approval',
                'Approved',
                'In Service',
                'Waiting for Spare',
                'Testing',
                'Ready for Delivery',
                'Delivered',
                'Closed',
                'Cancelled'
            ])->default('Received');

            $table->enum('priority', ['Low', 'Medium', 'High', 'Urgent'])->default('Medium');

            // Delivery info
            $table->string('delivered_to')->nullable();
            $table->string('delivered_by')->nullable();
            $table->text('customer_acknowledgement')->nullable();

            // Service type (AMC or Chargeable)
            $table->enum('service_type', ['AMC Service', 'Chargeable Service'])->default('Chargeable Service');

            // General remarks
            $table->text('remarks')->nullable();

            // Audit
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();

            // Soft deletes and timestamps
            $table->softDeletes();
            $table->timestamps();

            // Indexes
            $table->index('service_number');
            $table->index('customer_id');
            $table->index('asset_id');
            $table->index('status');
            $table->index('entry_date');
            $table->index('expected_delivery_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('services');
    }
};
