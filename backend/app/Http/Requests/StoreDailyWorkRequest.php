<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDailyWorkRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'employee_id' => ['required', 'integer', 'exists:employees,id'],
            'work_date' => ['required', 'date'],
            'work_description' => ['required', 'string'],
            'work_type' => ['required', Rule::in(['Development', 'Support', 'Documentation', 'Training', 'Meeting'])],
            'hours_spent' => ['required', 'numeric', 'between:0.5,12'],
            'status' => ['required', Rule::in(['Pending', 'In Progress', 'Completed', 'On Hold'])],
            'remarks' => ['nullable', 'string'],
        ];
    }
}