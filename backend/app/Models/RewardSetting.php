<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RewardSetting extends Model
{
    protected $table = 'reward_settings';

    protected $fillable = [
        'purchase_amount',
        'reward_points',
        'minimum_redeem_points',
        'points_expiry_days',
        'enable_points_expiry',
        'status',
    ];

    protected $casts = [
        'purchase_amount' => 'decimal:2',
        'reward_points' => 'integer',
        'minimum_redeem_points' => 'integer',
        'points_expiry_days' => 'integer',
        'enable_points_expiry' => 'boolean',
    ];
}
