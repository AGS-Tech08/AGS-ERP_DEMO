<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServiceStatusHistory extends Model
{
    protected $table = 'service_status_histories';

    public $timestamps = false;

    protected $fillable = [
        'service_id',
        'old_status',
        'new_status',
        'remarks',
        'changed_by',
        'changed_at',
    ];

    protected $casts = [
        'changed_at' => 'datetime',
    ];

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function changedBy()
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
