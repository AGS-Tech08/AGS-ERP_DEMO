<?php

namespace App\Http\Controllers;

use App\Models\Vendor;
use Illuminate\Http\Request;

class VendorController extends Controller
{
    /**
     * Vendor List
     */
    public function index(Request $request)
    {
        $query = Vendor::query();

        if ($request->filled('search')) {

            $search = $request->search;

            $query->where(function ($q) use ($search) {

                $q->where('vendor_code', 'like', "%{$search}%")
                    ->orWhere('company_name', 'like', "%{$search}%")
                    ->orWhere('contact_person', 'like', "%{$search}%")
                    ->orWhere('mobile', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('gst_number', 'like', "%{$search}%");

            });
        }

        if ($request->filled('vendor_status')) {
            $query->where(
                'vendor_status',
                $request->vendor_status
            );
        }

        if ($request->filled('city')) {
            $query->where(
                'city',
                $request->city
            );
        }

        return response()->json([
            'success' => true,
            'data' => $query
                ->latest()
                ->paginate(10)
        ]);
    }


    /**
     * Create Vendor
     */
    public function store(Request $request)
    {
        $validated = $request->validate([

            'company_name' => 'required|string|max:255',

            'company_type' => 'nullable|string|max:255',

            'gst_number' => 'nullable|string|max:50',
            'pan_number' => 'nullable|string|max:50',

            'contact_person' => 'required|string|max:255',
            'designation' => 'nullable|string|max:255',

            'mobile' => 'required|string|max:20',
            'alternate_mobile' => 'nullable|string|max:20',

            'email' => 'nullable|email|max:255',
            'website' => 'nullable|string|max:255',

            'address' => 'required|string',

            'area' => 'nullable|string|max:255',
            'city' => 'required|string|max:100',
            'district' => 'nullable|string|max:100',
            'state' => 'required|string|max:100',

            'country' => 'nullable|string|max:100',
            'pincode' => 'nullable|string|max:10',

            'credit_limit' => 'nullable|numeric|min:0',

            'vendor_status' => 'nullable|string|max:50',
        ]);


        // Generate Vendor Code

        $lastVendor = Vendor::withTrashed()
            ->latest('id')
            ->first();

        if ($lastVendor) {

            $number = (int) substr(
                $lastVendor->vendor_code,
                3
            );

            $number++;

        } else {

            $number = 1;
        }


        $vendorCode = 'VEN' .
            str_pad(
                $number,
                6,
                '0',
                STR_PAD_LEFT
            );


        $validated['vendor_code'] =
            $vendorCode;

        $validated['country'] =
            $validated['country'] ?? 'India';

        $validated['credit_limit'] =
            $validated['credit_limit'] ?? 0;

        $validated['vendor_status'] =
            $validated['vendor_status'] ?? 'Active';

        $validated['created_by'] =
            auth()->id();


        $vendor = Vendor::create(
            $validated
        );


        return response()->json([
            'success' => true,
            'message' =>
                'Vendor created successfully.',
            'data' => $vendor
        ], 201);
    }


    /**
     * View Vendor
     */
    public function show(Vendor $vendor)
    {
        return response()->json([
            'success' => true,
            'data' => $vendor
        ]);
    }


    /**
     * Update Vendor
     */
    public function update(
        Request $request,
        Vendor $vendor
    ) {

        $validated = $request->validate([

            'company_name' =>
                'required|string|max:255',

            'company_type' =>
                'nullable|string|max:255',

            'gst_number' =>
                'nullable|string|max:50',

            'pan_number' =>
                'nullable|string|max:50',

            'contact_person' =>
                'required|string|max:255',

            'designation' =>
                'nullable|string|max:255',

            'mobile' =>
                'required|string|max:20',

            'alternate_mobile' =>
                'nullable|string|max:20',

            'email' =>
                'nullable|email|max:255',

            'website' =>
                'nullable|string|max:255',

            'address' =>
                'required|string',

            'area' =>
                'nullable|string|max:255',

            'city' =>
                'required|string|max:100',

            'district' =>
                'nullable|string|max:100',

            'state' =>
                'required|string|max:100',

            'country' =>
                'nullable|string|max:100',

            'pincode' =>
                'nullable|string|max:10',

            'credit_limit' =>
                'nullable|numeric|min:0',

            'vendor_status' =>
                'nullable|string|max:50',
        ]);


        $validated['updated_by'] =
            auth()->id();


        $vendor->update(
            $validated
        );


        return response()->json([
            'success' => true,
            'message' =>
                'Vendor updated successfully.',
            'data' => $vendor
        ]);
    }


    /**
     * Delete Vendor
     */
    public function destroy(
        Vendor $vendor
    ) {

        $vendor->delete();

        return response()->json([
            'success' => true,
            'message' =>
                'Vendor deleted successfully.'
        ]);
    }
}