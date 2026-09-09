<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BankAccount extends Model
{
    protected $fillable = [
        'company_profile_id',
        'bank_name',
        'account_holder_name',
        'account_number',
        'ifsc_code',
        'branch',
        'account_type',
        'upi_id',
        'is_active',
    ];

    protected $hidden = [
        'account_number',
    ];

    protected $appends = [
        'account_number_masked',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function companyProfile(): BelongsTo
    {
        return $this->belongsTo(CompanyProfile::class);
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    public function getAccountNumberMaskedAttribute(): string
    {
        $visibleDigits = 4;
        $length = strlen((string) $this->account_number);

        if ($length <= $visibleDigits) {
            return str_repeat('*', $length);
        }

        return str_repeat('*', $length - $visibleDigits)
            . substr((string) $this->account_number, -$visibleDigits);
    }
}
