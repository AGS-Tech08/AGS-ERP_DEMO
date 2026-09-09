<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServiceAccessory extends Model
{
    protected $table = 'service_accessories';

    protected $fillable = [
        'service_id',
        'accessory',
        'description',
    ];

    public function service()
    {
        return $this->belongsTo(Service::class);
    }
}
