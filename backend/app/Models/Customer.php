<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'customer_code',
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
        'latitude',
        'longitude',
        'credit_limit',
        'customer_status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'credit_limit' => 'decimal:2',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
    ];

    /*
    |--------------------------------------------------------------------------
    | Sales
    |--------------------------------------------------------------------------
    */

    public function sales()
    {
        return $this->hasMany(Sale::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Sale Payments
    |--------------------------------------------------------------------------
    */

    public function salePayments()
    {
        return $this->hasMany(SalePayment::class);
    }

    public function amcs()
    {
        return $this->hasMany(Amc::class);
    }

    public function assets()
    {
        return $this->hasMany(Asset::class);
    }

    public function rewardAccount()
    {
        return $this->hasOne(RewardAccount::class);
    }

    public function rewardTransactions()
    {
        return $this->hasMany(RewardTransaction::class);
    }

    public function services()
    {
        return $this->hasMany(Service::class);
    }
}