<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VendorPayment extends Model
{
    protected $fillable = [
        'purchase_id',
        'vendor_id',
        'payment_date',
        'amount',
        'payment_mode',
        'reference_no',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'payment_date' => 'date',
        'amount' => 'decimal:2',
    ];

    /**
     * Payment belongs to Purchase
     */
    public function purchase(): BelongsTo
    {
        return $this->belongsTo(
            Purchase::class
        );
    }

    /**
     * Payment belongs to Vendor
     */
    public function vendor(): BelongsTo
    {
        return $this->belongsTo(
            Vendor::class
        );
    }

    /**
     * Payment created by User
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'created_by'
        );
    }
}