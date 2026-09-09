<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDailyWorkRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'employee_id' => ['sometimes', 'integer', 'exists:employees,id'],
            'work_date' => ['sometimes', 'date'],
            'work_description' => ['sometimes', 'required', 'string'],
            'work_type' => ['sometimes', Rule::in(['Development', 'Support', 'Documentation', 'Training', 'Meeting'])],
            'hours_spent' => ['sometimes', 'numeric', 'between:0.5,12'],
            'status' => ['sometimes', Rule::in(['Pending', 'In Progress', 'Completed', 'On Hold'])],
            'remarks' => ['nullable', 'string'],
        ];
    }
}