<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CheckOutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'check_out_time' => ['nullable', 'date'],
            'remarks' => ['nullable', 'string'],
        ];
    }
}