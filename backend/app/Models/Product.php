<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'product_code',
        'product_name',
        'category',
        'brand',
        'hsn_code',
        'unit',
        'purchase_price',
        'selling_price',
        'opening_stock',
        'current_stock',
        'minimum_stock',
        'gst_percentage',
        'product_status',
        'description',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'purchase_price' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'opening_stock' => 'decimal:3',
        'current_stock' => 'decimal:3',
        'minimum_stock' => 'decimal:3',
        'gst_percentage' => 'decimal:2',
    ];
}