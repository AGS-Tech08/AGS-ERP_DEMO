<?php

namespace App\Http\Controllers;

use App\Models\CompanyProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CompanyProfileController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Show Company Profile
    |--------------------------------------------------------------------------
    */

    public function show()
    {
        $profile = CompanyProfile::oldest('id')->first();

        return response()->json([
            'success' => true,
            'data' => $profile,
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | Update Company Profile
    |--------------------------------------------------------------------------
    */

    public function update(Request $request)
    {
        $validated = $request->validate([
            'company_name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'pincode' => 'nullable|string|max:10',
            'gstin' => 'nullable|string|max:20',
            'pan' => 'nullable|string|max:20',
            'phone' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|string|max:255',
        ]);

        $profile = CompanyProfile::oldest('id')->first();

        if (!$profile) {
            $profile = CompanyProfile::create($validated);
        } else {
            $profile->update($validated);
        }

        return response()->json([
            'success' => true,
            'message' => 'Company profile saved successfully.',
            'data' => $profile,
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | Upload Company Logo
    |--------------------------------------------------------------------------
    */

    public function uploadLogo(Request $request)
    {
        $request->validate([
            'logo' => 'required|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        $profile = CompanyProfile::oldest('id')->first();

        if (!$profile) {
            return response()->json([
                'success' => false,
                'message' => 'Please save company profile first.',
            ], 422);
        }

        /*
        | Delete old logo
        */

        if ($profile->logo_path) {

            $oldPath = str_replace(
                '/storage/',
                '',
                $profile->logo_path
            );

            if (Storage::disk('public')->exists($oldPath)) {
                Storage::disk('public')->delete($oldPath);
            }
        }


        /*
        | Store new logo
        */

        $path = $request
            ->file('logo')
            ->store('company', 'public');


        /*
        | Public URL
        */

        $logoUrl = '/storage/' . $path;


        /*
        | Save path
        */

        $profile->update([
            'logo_path' => $logoUrl,
        ]);


        return response()->json([
            'success' => true,
            'message' => 'Company logo uploaded successfully.',
            'data' => $profile,
        ]);
    }
}
