<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CheckInRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'check_in_time' => ['nullable', 'date'],
            'remarks' => ['nullable', 'string'],
        ];
    }
}