<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AmcAsset extends Model
{
    protected $table = 'amc_assets';

    protected $fillable = [
        'amc_id',
        'asset_id',
        'status',
        'notes',
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
