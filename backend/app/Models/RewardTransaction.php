<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RewardTransaction extends Model
{
    protected $table = 'reward_transactions';

    protected $fillable = [
        'customer_id',
        'reward_account_id',
        'type',
        'points',
        'balance_after',
        'reference_type',
        'reference_id',
        'description',
    ];

    protected $casts = [
        'points' => 'integer',
        'balance_after' => 'integer',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function rewardAccount()
    {
        return $this->belongsTo(RewardAccount::class);
    }
}
