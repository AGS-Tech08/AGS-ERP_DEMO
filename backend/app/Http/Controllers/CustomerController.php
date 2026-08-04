<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCustomerRequest;
use App\Models\Customer;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    /**
     * Display all customers.
     */
    public function index()
    {
        return response()->json(
            Customer::latest()->paginate(10)
        );
    }

    /**
     * Store a new customer.
     */
    public function store(StoreCustomerRequest $request)
    {
        $customer = Customer::create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Customer created successfully.',
            'data' => $customer
        ], 201);
    }

    /**
     * Display one customer.
     */
    public function show(Customer $customer)
    {
        return response()->json($customer);
    }

    /**
     * Update customer.
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
     * Delete customer.
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