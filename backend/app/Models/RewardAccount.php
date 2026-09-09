<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RewardAccount extends Model
{
    protected $table = 'reward_accounts';

    protected $fillable = [
        'customer_id',
        'available_points',
        'total_earned',
        'total_redeemed',
        'status',
    ];

    protected $casts = [
        'available_points' => 'integer',
        'total_earned' => 'integer',
        'total_redeemed' => 'integer',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function transactions()
    {
        return $this->hasMany(RewardTransaction::class);
    }
}
