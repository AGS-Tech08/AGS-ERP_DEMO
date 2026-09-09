<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Task extends Model
{
    protected $fillable = [
        'task_title', 'task_description', 'created_by_employee_id',
        'priority', 'start_date', 'due_date', 'task_status', 'completion_percentage',
    ];

    protected $casts = [
        'start_date' => 'date',
        'due_date' => 'date',
        'completion_percentage' => 'integer',
    ];

    public function createdByEmployee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'created_by_employee_id');
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(TaskAssignment::class);
    }
}