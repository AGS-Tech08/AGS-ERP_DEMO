<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Vendor extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'vendor_code',
        'company_name',
        'company_type',

        'gst_number',
        'pan_number',

        'contact_person',
        'designation',

        'mobile',
        'alternate_mobile',

        'email',
        'website',

        'address',
        'area',
        'city',
        'district',
        'state',
        'country',
        'pincode',

        'credit_limit',

        'vendor_status',

        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'credit_limit' => 'decimal:2',
    ];

    /**
     * Vendor has many Purchases
     */
    public function purchases(): HasMany
    {
        return $this->hasMany(Purchase::class);
    }

    /**
     * Vendor has many Payments
     */
    public function vendorPayments(): HasMany
    {
        return $this->hasMany(VendorPayment::class);
    }
}