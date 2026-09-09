<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTaskAssignmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'assignment_status' => ['sometimes', Rule::in(['Assigned', 'In Progress', 'Completed', 'Cancelled'])],
            'completion_percentage' => ['sometimes', 'integer', 'between:0,100'],
            'completion_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
        ];
    }
}