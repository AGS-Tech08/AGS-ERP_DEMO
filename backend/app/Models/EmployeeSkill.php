<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeSkill extends Model
{
    protected $fillable = [
        'employee_id', 'skill_id', 'current_level', 'target_level',
        'progress_percentage', 'improvement_goal', 'review_date', 'status', 'remarks',
    ];

    protected $casts = [
        'review_date' => 'date',
        'progress_percentage' => 'integer',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function skill(): BelongsTo
    {
        return $this->belongsTo(Skill::class);
    }
}