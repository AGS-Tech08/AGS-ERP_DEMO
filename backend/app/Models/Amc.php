<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Amc extends Model
{
    use SoftDeletes;

    protected $table = 'amcs';

    protected $fillable = [
        'customer_id',
        'amc_number',
        'start_date',
        'end_date',
        'agreement_value',
        'gst',
        'total_cost',
        'payment_terms',
        'status',
        'agreement_document',
        'notes',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'agreement_value' => 'decimal:2',
        'gst' => 'decimal:2',
        'total_cost' => 'decimal:2',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function assets()
    {
        return $this->belongsToMany(Asset::class, 'amc_assets')
            ->withPivot('id', 'status', 'notes', 'created_at')
            ->withTimestamps();
    }

    public function amcAssets()
    {
        return $this->hasMany(AmcAsset::class);
    }

    public function serviceRecords()
    {
        return $this->hasMany(AmcServiceRecord::class);
    }

    public function services()
    {
        return $this->hasMany(Service::class);
    }
}
