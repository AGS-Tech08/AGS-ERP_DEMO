<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_status_histories', function (Blueprint $table) {
            $table->id();

            $table->foreignId('service_id')->constrained()->cascadeOnDelete();

            $table->enum('old_status', [
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
            ])->nullable();

            $table->enum('new_status', [
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
            ]);

            $table->text('remarks')->nullable();

            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamp('changed_at')->useCurrent();

            $table->index('service_id');
            $table->index('changed_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_status_histories');
    }
};
