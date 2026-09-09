<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePerformanceRequest extends FormRequest
{
    public function authorize(): bool { return $this->user() !== null; }

    public function rules(): array
    {
        return [
            'employee_id' => ['required', 'integer', 'exists:employees,id'],
            'review_period' => ['required', 'string', 'max:100'],
            'review_date' => ['required', 'date'],
            'overall_rating' => ['required', 'numeric', 'between:1,5'],
            'productivity_rating' => ['required', 'numeric', 'between:1,5'],
            'quality_rating' => ['required', 'numeric', 'between:1,5'],
            'attendance_rating' => ['required', 'numeric', 'between:1,5'],
            'skill_rating' => ['required', 'numeric', 'between:1,5'],
            'goals' => ['nullable', 'string'], 'achievements' => ['nullable', 'string'],
            'strengths' => ['nullable', 'string'], 'improvement_areas' => ['nullable', 'string'],
            'manager_comments' => ['nullable', 'string'], 'employee_comments' => ['nullable', 'string'],
            'status' => ['required', Rule::in(['Draft', 'Submitted', 'Acknowledged', 'Final'])],
        ];
    }
}