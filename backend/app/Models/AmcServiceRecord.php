<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AmcServiceRecord extends Model
{
    protected $table = 'amc_service_records';

    protected $fillable = [
        'amc_id',
        'asset_id',
        'service_date',
        'complaint',
        'work_done',
        'engineer',
        'status',
        'remarks',
    ];

    protected $casts = [
        'service_date' => 'date',
    ];

    public function amc()
    {
        return $this->belongsTo(Amc::class);
    }

    public function asset()
    {
        return $this->belongsTo(Asset::class);
    }
}
