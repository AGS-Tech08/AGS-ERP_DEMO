<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaskAssignment extends Model
{
    protected $fillable = [
        'task_id', 'employee_id', 'assigned_date', 'assignment_status',
        'completion_percentage', 'completion_date', 'notes',
    ];

    protected $casts = [
        'assigned_date' => 'date',
        'completion_date' => 'date',
        'completion_percentage' => 'integer',
    ];

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}