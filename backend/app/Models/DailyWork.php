<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DailyWork extends Model
{
    protected $fillable = [
        'employee_id',
        'work_date',
        'work_description',
        'work_type',
        'hours_spent',
        'status',
        'remarks',
    ];

    protected $casts = [
        'work_date' => 'date',
        'hours_spent' => 'decimal:2',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}