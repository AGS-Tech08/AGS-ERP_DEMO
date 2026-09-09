<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCustomerRequest;
use App\Models\Customer;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    /**
     * Customer List
     */
    public function index(Request $request)
    {
        $query = Customer::query();

        if ($request->filled('search')) {

            $search = $request->search;

            $query->where(function ($q) use ($search) {

                $q->where('customer_code', 'like', "%{$search}%")
                    ->orWhere('company_name', 'like', "%{$search}%")
                    ->orWhere('contact_person', 'like', "%{$search}%")
                    ->orWhere('mobile', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");

            });
        }

        return response()->json([
            'success' => true,
            'data' => $query->latest()->paginate(10)
        ]);
    }

    /**
     * Create Customer
     */
    public function store(StoreCustomerRequest $request)
    {
        $lastCustomer = Customer::latest('id')->first();

        if ($lastCustomer) {
            $number = (int) substr($lastCustomer->customer_code, 3);
            $number++;
        } else {
            $number = 1;
        }

        $customerCode = 'AGS' . str_pad($number, 6, '0', STR_PAD_LEFT);

        $customer = Customer::create(array_merge(
            $request->validated(),
            [
                'customer_code' => $customerCode,
                'customer_status' => 'Active'
            ]
        ));

        return response()->json([
            'success' => true,
            'message' => 'Customer created successfully.',
            'data' => $customer
        ], 201);
    }

    /**
     * View Customer
     */
    public function show(Customer $customer)
    {
        return response()->json([
            'success' => true,
            'data' => $customer
        ]);
    }

    /**
     * Update Customer
     */
    public function update(Request $request, Customer $customer)
    {
        $validated = $request->validate([
            'company_name' => 'required|max:255',
            'contact_person' => 'required|max:255',
            'mobile' => 'required|max:20',
            'city' => 'required|max:100',
            'state' => 'required|max:100',
            'address' => 'required',
        ]);

        $customer->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Customer updated successfully.',
            'data' => $customer
        ]);
    }

    /**
     * Delete Customer
     */
    public function destroy(Customer $customer)
    {
        $customer->delete();

        return response()->json([
            'success' => true,
            'message' => 'Customer deleted successfully.'
        ]);
    }
}