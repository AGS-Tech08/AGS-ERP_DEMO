<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class RewardItem extends Model
{
    use SoftDeletes;

    protected $table = 'reward_items';

    protected $fillable = [
        'name',
        'points_required',
        'description',
        'status',
    ];

    protected $casts = [
        'points_required' => 'integer',
    ];
}
