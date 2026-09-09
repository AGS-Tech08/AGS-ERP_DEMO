<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'task_title' => ['required', 'string', 'max:255'],
            'task_description' => ['nullable', 'string'],
            'created_by_employee_id' => ['nullable', 'integer', 'exists:employees,id'],
            'priority' => ['required', Rule::in(['Low', 'Medium', 'High', 'Critical'])],
            'start_date' => ['nullable', 'date', 'before_or_equal:due_date'],
            'due_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'task_status' => ['required', Rule::in(['Not Started', 'In Progress', 'Completed', 'On Hold'])],
            'completion_percentage' => ['required', 'integer', 'between:0,100'],
        ];
    }
}