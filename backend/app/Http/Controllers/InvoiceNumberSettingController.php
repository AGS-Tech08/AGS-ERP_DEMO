<?php

namespace App\Http\Controllers;

use App\Models\CompanyProfile;
use App\Models\InvoiceNumberSetting;
use App\Models\Sale;
use Carbon\Carbon;
use Illuminate\Http\Request;

class InvoiceNumberSettingController extends Controller
{
    public function show(Request $request)
    {
        $invoiceType = $request->input('invoice_type', 'tax');
        $setting = $this->settingForCurrentCompany($invoiceType);

        if (!$setting) {
            return response()->json([
                'success' => false,
                'message' => 'Please save the company profile before configuring invoice numbers.',
            ], 422);
        }

        return response()->json([
            'success' => true,
            'data' => $setting,
        ]);
    }

    public function update(Request $request)
    {
        $profile = CompanyProfile::first();

        if (!$profile) {
            return response()->json([
                'success' => false,
                'message' => 'Please save the company profile before configuring invoice numbers.',
            ], 422);
        }

        $validated = $request->validate([
            'invoice_type' => ['sometimes', 'string', 'in:tax,normal'],
            'prefix' => ['required', 'string', 'max:30'],
            'start_number' => ['required', 'integer', 'min:1'],
            'next_number' => ['required', 'integer', 'min:1'],
            'number_padding' => ['required', 'integer', 'min:1', 'max:12'],
            'include_date' => ['required', 'boolean'],
            'include_financial_year' => ['required', 'boolean'],
            'financial_year_start_month' => ['required', 'integer', 'between:1,12'],
        ]);

        $invoiceType = $validated['invoice_type'] ?? 'tax';
        $setting = InvoiceNumberSetting::updateOrCreate(
            ['company_profile_id' => $profile->id, 'invoice_type' => $invoiceType],
            $validated
        );

        return response()->json([
            'success' => true,
            'message' => 'Invoice number settings saved successfully.',
            'data' => $setting,
        ]);
    }

    public function preview(Request $request)
    {
        $invoiceType = $request->input('invoice_type', 'tax');
        $setting = $this->settingForCurrentCompany($invoiceType);

        if (!$setting) {
            return response()->json([
                'success' => false,
                'message' => 'Please save the company profile before configuring invoice numbers.',
            ], 422);
        }

        $date = Carbon::parse($request->input('invoice_date', now()->toDateString()));
        $sequence = $this->previewSequence($setting, $date);

        while (Sale::withTrashed()
            ->where('invoice_no', $setting->numberFor($date, $sequence))
            ->exists()) {
            $sequence++;
        }

        return response()->json([
            'success' => true,
            'data' => [
                'invoice_no' => $setting->numberFor($date, $sequence),
                'next_number' => $sequence,
            ],
        ]);
    }

    private function settingForCurrentCompany(string $invoiceType = 'tax'): ?InvoiceNumberSetting
    {
        $profile = CompanyProfile::first();

        if (!$profile) {
            return null;
        }

        return InvoiceNumberSetting::firstOrCreate(
            ['company_profile_id' => $profile->id, 'invoice_type' => $invoiceType],
            $this->defaultSettings($invoiceType)
        );
    }

    private function defaultSettings(string $invoiceType = 'tax'): array
    {
        return [
            'invoice_type' => $invoiceType,
            'prefix' => $invoiceType === 'normal' ? 'AGSN' : 'AGS',
            'start_number' => 1,
            'next_number' => 1,
            'number_padding' => 3,
            'include_date' => false,
            'include_financial_year' => true,
            'financial_year_start_month' => 4,
        ];
    }

    private function previewSequence(InvoiceNumberSetting $setting, Carbon $date): int
    {
        if (!$setting->include_financial_year) {
            return $setting->next_number;
        }

        return $setting->last_financial_year === $setting->financialYear($date)
            ? $setting->next_number
            : $setting->start_number;
    }
}
