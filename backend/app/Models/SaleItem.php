<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SaleItem extends Model
{
    protected $fillable = [
        'sale_id',
        'product_id',
        'service_id',
        'service_spare_id',
        'item_type',
        'description',
        'quantity',
        'rate',
        'discount_amount',
        'taxable_amount',
        'gst_percent',
        'gst_amount',
        'total_amount',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'rate' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'taxable_amount' => 'decimal:2',
        'gst_percent' => 'decimal:2',
        'gst_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
    ];

    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function serviceSpare()
    {
        return $this->belongsTo(ServiceSpare::class);
    }

    public function isProduct(): bool
    {
        return $this->item_type === 'product';
    }

    public function isService(): bool
    {
        return $this->item_type === 'service';
    }

    public function isSpare(): bool
    {
        return $this->item_type === 'spare';
    }
}