<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_payments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('service_id')->constrained()->cascadeOnDelete();

            $table->date('payment_date');
            $table->decimal('amount', 12, 2);
            $table->enum('payment_mode', [
                'Cash',
                'Cheque',
                'Bank Transfer',
                'Card',
                'UPI',
                'Other'
            ])->default('Cash');

            $table->string('reference_no')->nullable();
            $table->text('remarks')->nullable();

            $table->foreignId('received_by')->nullable()->constrained('users')->nullOnDelete();

            $table->softDeletes();
            $table->timestamps();

            $table->index('service_id');
            $table->index('payment_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_payments');
    }
};
