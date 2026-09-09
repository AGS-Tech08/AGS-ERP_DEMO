<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEmployeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['nullable', 'integer', 'exists:users,id', Rule::unique('employees', 'user_id')],
            'employee_id' => ['required', 'string', 'max:50', Rule::unique('employees', 'employee_id')],
            'department_id' => ['nullable', 'integer', 'exists:departments,id'],
            'reporting_manager_id' => ['nullable', 'integer', 'exists:employees,id'],
            'designation' => ['nullable', 'string', 'max:255'],
            'date_of_joining' => ['nullable', 'date'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string'],
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'pincode' => ['nullable', 'string', 'max:20'],
            'employee_status' => ['required', Rule::in(['Active', 'Inactive', 'On Leave', 'Terminated'])],
        ];
    }
}