<?php

namespace App\Http\Controllers;

use App\Models\BankAccount;
use App\Models\CompanyProfile;
use Illuminate\Http\Request;

class BankAccountController extends Controller
{
    public function index()
    {
        return response()->json([
            'success' => true,
            'data' => BankAccount::latest()->get(),
        ]);
    }

    public function active()
    {
        return response()->json([
            'success' => true,
            'data' => BankAccount::where('is_active', true)
                ->orderBy('bank_name')
                ->get(),
        ]);
    }

    public function store(Request $request)
    {
        $profile = CompanyProfile::first();

        if (!$profile) {
            return response()->json([
                'success' => false,
                'message' => 'Please save the company profile before adding a bank account.',
            ], 422);
        }

        $bankAccount = BankAccount::create(array_merge(
            $this->validatedData($request),
            ['company_profile_id' => $profile->id]
        ));

        return response()->json([
            'success' => true,
            'message' => 'Bank account created successfully.',
            'data' => $bankAccount,
        ], 201);
    }

    public function show(BankAccount $bankAccount)
    {
        return response()->json([
            'success' => true,
            'data' => $bankAccount,
        ]);
    }

    public function update(Request $request, BankAccount $bankAccount)
    {
        $bankAccount->update($this->validatedData($request, true));

        return response()->json([
            'success' => true,
            'message' => 'Bank account updated successfully.',
            'data' => $bankAccount->fresh(),
        ]);
    }

    public function destroy(BankAccount $bankAccount)
    {
        if ($bankAccount->sales()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'This bank account is used by invoices and cannot be deleted.',
            ], 422);
        }

        $bankAccount->delete();

        return response()->json([
            'success' => true,
            'message' => 'Bank account deleted successfully.',
        ]);
    }

    private function validatedData(Request $request, bool $isUpdate = false): array
    {
        $accountNumberRule = $isUpdate
            ? ['sometimes', 'string', 'max:50']
            : ['required', 'string', 'max:50'];

        return $request->validate([
            'bank_name' => ['required', 'string', 'max:255'],
            'account_holder_name' => ['required', 'string', 'max:255'],
            'account_number' => $accountNumberRule,
            'ifsc_code' => ['required', 'string', 'max:20'],
            'branch' => ['nullable', 'string', 'max:255'],
            'account_type' => ['required', 'string', 'max:50'],
            'upi_id' => ['nullable', 'string', 'max:255'],
            'is_active' => ['required', 'boolean'],
        ]);
    }
}
