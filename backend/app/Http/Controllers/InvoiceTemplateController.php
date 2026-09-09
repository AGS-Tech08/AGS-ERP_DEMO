<?php

namespace App\Http\Controllers;

use App\Models\CompanyProfile;
use App\Models\InvoiceTemplate;
use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class InvoiceTemplateController extends Controller
{
    public function index()
    {
        return response()->json(['success' => true, 'data' => InvoiceTemplate::orderByDesc('is_default')->orderBy('name')->get()]);
    }

    public function show(InvoiceTemplate $invoiceTemplate)
    {
        return response()->json(['success' => true, 'data' => $invoiceTemplate]);
    }

    public function store(Request $request)
    {
        $validated = $this->validated($request);
        $template = InvoiceTemplate::create($validated);
        if ($template->is_default) $this->makeDefault($template);
        return response()->json(['success' => true, 'message' => 'Invoice template created successfully.', 'data' => $template->fresh()], 201);
    }

    public function update(Request $request, InvoiceTemplate $invoiceTemplate)
    {
        $validated = $this->validated($request, $invoiceTemplate);
        $invoiceTemplate->update($validated);
        if ($invoiceTemplate->is_default) $this->makeDefault($invoiceTemplate);
        return response()->json(['success' => true, 'message' => 'Invoice template updated successfully.', 'data' => $invoiceTemplate->fresh()]);
    }

    public function destroy(InvoiceTemplate $invoiceTemplate)
    {
        if ($invoiceTemplate->is_default) return response()->json(['success' => false, 'message' => 'Select another default template before deleting this template.'], 422);
        $invoiceTemplate->delete();
        return response()->json(['success' => true, 'message' => 'Invoice template deleted successfully.']);
    }

    public function updateConfig(Request $request, InvoiceTemplate $invoiceTemplate)
    {
        $config = $request->validate([
            'config' => ['required', 'array'],
            'config.show_logo' => ['sometimes', 'boolean'], 'config.show_header' => ['sometimes', 'boolean'],
            'config.show_footer' => ['sometimes', 'boolean'], 'config.show_bank_details' => ['sometimes', 'boolean'],
            'config.show_terms' => ['sometimes', 'boolean'], 'config.show_signature' => ['sometimes', 'boolean'],
            'config.show_tax_columns' => ['sometimes', 'boolean'], 'config.show_amount_in_words' => ['sometimes', 'boolean'],
            'config.footer_text' => ['sometimes', 'string', 'max:500'],
        ])['config'];
        $invoiceTemplate->update(['config' => array_replace($invoiceTemplate->mergedConfig(), $config)]);
        return response()->json(['success' => true, 'message' => 'Invoice template configuration saved successfully.', 'data' => $invoiceTemplate->fresh()]);
    }

    public function setDefault(InvoiceTemplate $invoiceTemplate)
    {
        if (!$invoiceTemplate->is_active) return response()->json(['success' => false, 'message' => 'Inactive templates cannot be selected as default.'], 422);
        $this->makeDefault($invoiceTemplate);
        return response()->json(['success' => true, 'message' => 'Default invoice template updated successfully.', 'data' => $invoiceTemplate->fresh()]);
    }

    public function default()
    {
        $template = InvoiceTemplate::where('is_active', true)->where('is_default', true)->first()
            ?? InvoiceTemplate::where('is_active', true)->where('slug', 'classic-tax-invoice')->first()
            ?? InvoiceTemplate::where('is_active', true)->orderBy('id')->first();
        return response()->json(['success' => true, 'data' => $template]);
    }

    public function preview(Request $request, InvoiceTemplate $invoiceTemplate)
    {
        $sale = $request->filled('sale_id')
            ? Sale::with(['customer', 'bankAccount', 'items.product', 'payments'])->findOrFail($request->integer('sale_id'))
            : null;
        return response()->json(['success' => true, 'data' => ['template' => $invoiceTemplate, 'company' => CompanyProfile::with('bankAccounts')->first(), 'sale' => $sale]]);
    }

    private function validated(Request $request, ?InvoiceTemplate $template = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', Rule::unique('invoice_templates', 'slug')->ignore($template?->id)],
            'description' => ['nullable', 'string'],
            'config' => ['nullable', 'array'],
            'is_active' => ['required', 'boolean'],
            'is_default' => ['sometimes', 'boolean'],
        ]);
    }

    private function makeDefault(InvoiceTemplate $template): void
    {
        DB::transaction(function () use ($template) {
            InvoiceTemplate::where('id', '!=', $template->id)->update(['is_default' => false]);
            $template->update(['is_default' => true]);
        });
    }
}