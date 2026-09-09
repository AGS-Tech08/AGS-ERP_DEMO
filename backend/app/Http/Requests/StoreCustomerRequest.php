<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCustomerRequest extends FormRequest
{
    /**
     * Determine if the user is authorized.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Validation Rules
     */
    public function rules(): array
    {
        return [

            'company_name' => 'required|string|max:255',
            'company_type' => 'nullable|string|max:100',

            'gst_number' => 'nullable|string|max:20',
            'pan_number' => 'nullable|string|max:20',

            'contact_person' => 'required|string|max:255',
            'designation' => 'nullable|string|max:100',

            'mobile' => 'required|string|max:20|unique:customers,mobile',
            'alternate_mobile' => 'nullable|string|max:20',

            'email' => 'nullable|email|max:255|unique:customers,email',

            'website' => 'nullable|string|max:255',

            'address' => 'required|string',

            'area' => 'nullable|string|max:100',
            'city' => 'required|string|max:100',
            'district' => 'nullable|string|max:100',
            'state' => 'required|string|max:100',
            'country' => 'nullable|string|max:100',
            'pincode' => 'nullable|string|max:10',

            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',

            'credit_limit' => 'nullable|numeric',

        ];
    }

    /**
     * Custom Messages
     */
    public function messages(): array
    {
        return [

            'company_name.required' => 'Company Name is required.',

            'contact_person.required' => 'Contact Person is required.',

            'mobile.required' => 'Mobile Number is required.',
            'mobile.unique' => 'Mobile Number already exists.',

            'email.unique' => 'Email already exists.',

            'address.required' => 'Address is required.',

            'city.required' => 'City is required.',

            'state.required' => 'State is required.',
        ];
    }
}