<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePerformanceRequest extends FormRequest
{
    public function authorize(): bool { return $this->user() !== null; }

    public function rules(): array
    {
        return [
            'employee_id' => ['sometimes', 'integer', 'exists:employees,id'],
            'review_period' => ['sometimes', 'string', 'max:100'], 'review_date' => ['sometimes', 'date'],
            'overall_rating' => ['sometimes', 'numeric', 'between:1,5'],
            'productivity_rating' => ['sometimes', 'numeric', 'between:1,5'],
            'quality_rating' => ['sometimes', 'numeric', 'between:1,5'],
            'attendance_rating' => ['sometimes', 'numeric', 'between:1,5'],
            'skill_rating' => ['sometimes', 'numeric', 'between:1,5'],
            'goals' => ['nullable', 'string'], 'achievements' => ['nullable', 'string'],
            'strengths' => ['nullable', 'string'], 'improvement_areas' => ['nullable', 'string'],
            'manager_comments' => ['nullable', 'string'], 'employee_comments' => ['nullable', 'string'],
            'status' => ['sometimes', Rule::in(['Draft', 'Submitted', 'Acknowledged', 'Final'])],
        ];
    }
}