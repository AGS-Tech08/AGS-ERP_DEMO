<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ServiceSpare extends Model
{
    use SoftDeletes;

    protected $table = 'service_spares';

    protected $fillable = [
        'service_id',
        'product_id',
        'quantity',
        'rate',
        'discount_amount',
        'taxable_amount',
        'gst_percent',
        'gst_amount',
        'total_amount',
        'stock_deducted',
        'stock_deducted_at',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'rate' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'taxable_amount' => 'decimal:2',
        'gst_percent' => 'decimal:2',
        'gst_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'stock_deducted' => 'boolean',
        'stock_deducted_at' => 'datetime',
    ];

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Calculate totals based on quantity and rate
     */
    public function calculateTotal()
    {
        $this->taxable_amount = ($this->quantity * $this->rate) - ($this->discount_amount ?? 0);

        if ($this->taxable_amount < 0) {
            $this->taxable_amount = 0;
        }

        $this->gst_amount = ($this->taxable_amount * ($this->gst_percent ?? 0)) / 100;
        $this->total_amount = $this->taxable_amount + $this->gst_amount;
    }
}
