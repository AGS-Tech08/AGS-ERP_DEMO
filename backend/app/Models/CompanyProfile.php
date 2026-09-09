<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class CompanyProfile extends Model
{
    protected $fillable = [
        'company_name',
        'address',
        'city',
        'state',
        'pincode',
        'gstin',
        'pan',
        'phone',
        'email',
        'website',
        'logo_path',
    ];

    public function bankAccounts(): HasMany
    {
        return $this->hasMany(BankAccount::class);
    }

    public function invoiceNumberSetting(): HasOne
    {
        return $this->hasOne(InvoiceNumberSetting::class);
    }
}
