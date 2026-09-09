<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AssignTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'employee_id' => [
                'required', 'integer', 'exists:employees,id',
                Rule::unique('task_assignments', 'employee_id')
                    ->where(fn ($query) => $query->where('task_id', $this->route('task')?->id)),
            ],
            'assigned_date' => ['nullable', 'date'],
            'assignment_status' => ['nullable', Rule::in(['Assigned', 'In Progress', 'Completed', 'Cancelled'])],
            'completion_percentage' => ['nullable', 'integer', 'between:0,100'],
            'completion_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
        ];
    }
}