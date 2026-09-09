<?php

namespace App\Http\Controllers;

use App\Models\QuotationTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QuotationTemplateController extends Controller
{
    public function index()
    {
        return response()->json(['success' => true, 'data' => QuotationTemplate::orderByDesc('is_default')->orderBy('name')->get()]);
    }

    public function store(Request $request)
    {
        $template = QuotationTemplate::create($this->validated($request));
        if ($template->is_default) $this->makeDefault($template);
        return response()->json(['success' => true, 'data' => $template->fresh()], 201);
    }

    public function update(Request $request, QuotationTemplate $quotationTemplate)
    {
        $template = $quotationTemplate;
        $template->update($this->validated($request, $template));
        if ($template->is_default) $this->makeDefault($template);
        return response()->json(['success' => true, 'data' => $template->fresh()]);
    }

    public function updateConfig(Request $request, QuotationTemplate $quotationTemplate)
    {
        $config = $request->validate(['config' => ['required', 'array']])['config'];
        $quotationTemplate->update(['config' => array_replace($quotationTemplate->mergedConfig(), $config)]);
        return response()->json(['success' => true, 'data' => $quotationTemplate->fresh()]);
    }

    public function setDefault(QuotationTemplate $quotationTemplate)
    {
        if (!$quotationTemplate->is_active) return response()->json(['success' => false, 'message' => 'Inactive templates cannot be selected.'], 422);
        $this->makeDefault($quotationTemplate);
        return response()->json(['success' => true, 'data' => $quotationTemplate->fresh()]);
    }

    private function validated(Request $request, ?QuotationTemplate $template = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', 'unique:quotation_templates,slug,' . ($template?->id ?? 'NULL')],
            'description' => ['nullable', 'string'],
            'config' => ['nullable', 'array'],
            'is_active' => ['required', 'boolean'],
            'is_default' => ['sometimes', 'boolean'],
        ]);
    }

    private function makeDefault(QuotationTemplate $template): void
    {
        DB::transaction(function () use ($template) {
            QuotationTemplate::where('id', '!=', $template->id)->update(['is_default' => false]);
            $template->update(['is_default' => true]);
        });
    }
}
