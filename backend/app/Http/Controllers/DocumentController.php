<?php

namespace App\Http\Controllers;

use App\Models\CompanyProfile;
use App\Models\Quotation;
use App\Models\QuotationTemplate;
use App\Models\Service;
use App\Models\ServiceTemplate;

class DocumentController extends Controller
{
    public function quotation(Quotation $quotation)
    {
        $template = QuotationTemplate::where('is_active', true)->where('is_default', true)->first()
            ?? QuotationTemplate::where('is_active', true)->first();
        $company = CompanyProfile::oldest('id')->first();

        return response()->json(['success' => true, 'data' => [
            'company' => $company,
            'bank_accounts' => $company?->bankAccounts()->where('is_active', true)->get() ?? [],
            'template' => $template,
            'template_config' => $template?->mergedConfig() ?? QuotationTemplate::defaultConfig(),
            'quotation' => $quotation->load(['customer', 'items.product']),
        ]]);
    }

    public function service(Service $service, string $type)
    {
        abort_unless(in_array($type, ['reference', 'final'], true), 404);
        $templateType = $type === 'reference' ? 'customer_reference_challan' : 'service_challan';
        $template = ServiceTemplate::where('template_type', $templateType)->where('is_active', true)->where('is_default', true)->first()
            ?? ServiceTemplate::where('template_type', $templateType)->where('is_active', true)->first();
        $company = CompanyProfile::oldest('id')->first();

        return response()->json(['success' => true, 'data' => [
            'company' => $company,
            'bank_accounts' => $company?->bankAccounts()->where('is_active', true)->get() ?? [],
            'template' => $template,
            'template_config' => $template?->mergedConfig() ?? ServiceTemplate::defaultConfig(),
            'service' => $service->load(['customer', 'asset', 'assignedTechnician', 'spares.product', 'accessories']),
        ]]);
    }
}
