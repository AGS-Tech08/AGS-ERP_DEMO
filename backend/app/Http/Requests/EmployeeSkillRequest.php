<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EmployeeSkillRequest extends FormRequest
{
    public function authorize(): bool { return $this->user() !== null; }

    public function rules(): array
    {
        return [
            'skill_id' => ['required', 'integer', 'exists:skills,id'],
            'current_level' => ['required', Rule::in(['Beginner', 'Intermediate', 'Advanced', 'Expert'])],
            'target_level' => ['required', Rule::in(['Beginner', 'Intermediate', 'Advanced', 'Expert'])],
            'progress_percentage' => ['required', 'integer', 'between:0,100'],
            'improvement_goal' => ['nullable', 'string'],
            'review_date' => ['nullable', 'date'],
            'status' => ['required', Rule::in(['Active', 'In Progress', 'Completed', 'On Hold'])],
            'remarks' => ['nullable', 'string'],
        ];
    }
}