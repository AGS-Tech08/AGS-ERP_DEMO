<?php

namespace App\Http\Controllers;

use App\Models\ServiceTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ServiceTemplateController extends Controller
{
    public function index()
    {
        return response()->json(['success' => true, 'data' => ServiceTemplate::orderBy('template_type')->orderByDesc('is_default')->get()]);
    }

    public function store(Request $request)
    {
        $template = ServiceTemplate::create($this->validated($request));
        if ($template->is_default) $this->makeDefault($template);
        return response()->json(['success' => true, 'data' => $template->fresh()], 201);
    }

    public function updateConfig(Request $request, ServiceTemplate $serviceTemplate)
    {
        $config = $request->validate(['config' => ['required', 'array']])['config'];
        $serviceTemplate->update(['config' => array_replace($serviceTemplate->mergedConfig(), $config)]);
        return response()->json(['success' => true, 'data' => $serviceTemplate->fresh()]);
    }

    public function setDefault(ServiceTemplate $serviceTemplate)
    {
        if (!$serviceTemplate->is_active) return response()->json(['success' => false, 'message' => 'Inactive templates cannot be selected.'], 422);
        $this->makeDefault($serviceTemplate);
        return response()->json(['success' => true, 'data' => $serviceTemplate->fresh()]);
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', 'unique:service_templates,slug'],
            'template_type' => ['required', 'in:customer_reference_challan,service_challan'],
            'description' => ['nullable', 'string'],
            'config' => ['nullable', 'array'],
            'is_active' => ['required', 'boolean'],
            'is_default' => ['sometimes', 'boolean'],
        ]);
    }

    private function makeDefault(ServiceTemplate $template): void
    {
        DB::transaction(function () use ($template) {
            ServiceTemplate::where('template_type', $template->template_type)->where('id', '!=', $template->id)->update(['is_default' => false]);
            $template->update(['is_default' => true]);
        });
    }
}
