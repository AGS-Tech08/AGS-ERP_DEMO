<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Performance extends Model
{
    protected $fillable = [
        'employee_id', 'review_period', 'review_date', 'overall_rating',
        'productivity_rating', 'quality_rating', 'attendance_rating', 'skill_rating',
        'goals', 'achievements', 'strengths', 'improvement_areas',
        'manager_comments', 'employee_comments', 'status',
    ];

    protected $casts = [
        'review_date' => 'date',
        'overall_rating' => 'decimal:2',
        'productivity_rating' => 'decimal:2',
        'quality_rating' => 'decimal:2',
        'attendance_rating' => 'decimal:2',
        'skill_rating' => 'decimal:2',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}