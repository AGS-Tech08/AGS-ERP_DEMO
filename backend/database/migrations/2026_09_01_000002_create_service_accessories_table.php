<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_accessories', function (Blueprint $table) {
            $table->id();

            $table->foreignId('service_id')->constrained()->cascadeOnDelete();

            $table->enum('accessory', [
                'Power Adapter',
                'Power Cable',
                'Remote',
                'Mouse',
                'Keyboard',
                'HDD',
                'Bag',
                'Other'
            ]);

            $table->text('description')->nullable();

            $table->timestamps();

            $table->index('service_id');
            $table->unique(['service_id', 'accessory']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_accessories');
    }
};
