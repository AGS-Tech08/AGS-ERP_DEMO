<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCustomerRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [

            'customer_code' => 'required|unique:customers',

            'company_name' => 'required|max:255',

            'contact_person' => 'required|max:255',

            'mobile' => 'required|max:15',

            'email' => 'nullable|email',

            'address' => 'required',

            'city' => 'required',

            'state' => 'required',

        ];
    }
}