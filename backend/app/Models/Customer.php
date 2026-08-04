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
}