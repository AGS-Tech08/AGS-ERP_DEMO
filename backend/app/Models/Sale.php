<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Sale extends Model
{
    use SoftDeletes;

    public const INVOICE_TYPE_NORMAL = 'normal';
    public const INVOICE_TYPE_TAX = 'tax';
    public const INVOICE_TYPE_SERVICE_CHALLAN = 'service_challan';

    protected $fillable = [
        'invoice_no',
        'invoice_type',
        'customer_id',
        'service_id',
        'bank_account_id',
        'sale_date',
        'subtotal',
        'discount_amount',
        'taxable_amount',
        'gst_amount',
        'other_charges',
        'grand_total',
        'paid_amount',
        'balance_amount',
        'payment_status',
        'sale_status',
        'notes',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'sale_date' => 'date',
        'subtotal' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'taxable_amount' => 'decimal:2',
        'gst_amount' => 'decimal:2',
        'other_charges' => 'decimal:2',
        'grand_total' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'balance_amount' => 'decimal:2',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function bankAccount()
    {
        return $this->belongsTo(BankAccount::class);
    }

    public function items()
    {
        return $this->hasMany(SaleItem::class);
    }

    public function payments()
    {
        return $this->hasMany(SalePayment::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function isNormalInvoice(): bool
    {
        return $this->invoice_type === self::INVOICE_TYPE_NORMAL;
    }

    public function isTaxInvoice(): bool
    {
        return $this->invoice_type === self::INVOICE_TYPE_TAX;
    }

    public function isServiceChallan(): bool
    {
        return $this->invoice_type === self::INVOICE_TYPE_SERVICE_CHALLAN;
    }
}