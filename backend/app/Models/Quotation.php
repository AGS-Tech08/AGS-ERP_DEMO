<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Quotation extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'quotation_no',
        'customer_id',
        'quotation_date',
        'valid_until',
        'subtotal',
        'discount_amount',
        'taxable_amount',
        'gst_amount',
        'grand_total',
        'status',
        'notes',
        'terms_conditions',
        'converted_invoice_no',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'quotation_date' => 'date',
        'valid_until' => 'date',
        'subtotal' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'taxable_amount' => 'decimal:2',
        'gst_amount' => 'decimal:2',
        'grand_total' => 'decimal:2',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function items()
    {
        return $this->hasMany(QuotationItem::class);
    }

    public function createdByUser()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedByUser()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public static function generateNumber(CarbonInterface $date): string
    {
        $sequence = static::withTrashed()->max('id') ?? 0;
        $sequence += 1;

        return 'QTN-' . str_pad((string) $sequence, 6, '0', STR_PAD_LEFT);
    }
}
