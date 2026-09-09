<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AssetServiceRecord extends Model
{
    protected $table = 'asset_service_records';

    protected $fillable = [
        'asset_id',
        'service_date',
        'complaint',
        'work_done',
        'engineer',
        'parts_replaced',
        'service_cost',
        'remarks',
        'status',
    ];

    protected $casts = [
        'service_date' => 'date',
        'service_cost' => 'decimal:2',
    ];

    public function asset()
    {
        return $this->belongsTo(Asset::class);
    }
}
