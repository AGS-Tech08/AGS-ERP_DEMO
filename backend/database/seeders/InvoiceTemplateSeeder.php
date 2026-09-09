<?php

namespace Database\Seeders;

use App\Models\InvoiceTemplate;
use Illuminate\Database\Seeder;

class InvoiceTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $hasExistingDefault = InvoiceTemplate::where('is_default', true)->exists();
        $templates = [
            ['name' => 'Classic Tax Invoice', 'slug' => 'classic-tax-invoice', 'description' => 'Professional Indian GST and Tally-style invoice.', 'is_default' => true],
            ['name' => 'Modern ERP Invoice', 'slug' => 'modern-erp-invoice', 'description' => 'Clean modern ERP invoice with structured summaries.', 'is_default' => false],
            ['name' => 'Compact Tax Invoice', 'slug' => 'compact-tax-invoice', 'description' => 'Space-efficient GST invoice for compact printing.', 'is_default' => false],
        ];
        foreach ($templates as $data) {
            $data['is_default'] = !$hasExistingDefault && $data['slug'] === 'classic-tax-invoice';
            InvoiceTemplate::updateOrCreate(['slug' => $data['slug']], array_merge($data, ['config' => InvoiceTemplate::defaultConfig(), 'is_active' => true]));
        }
        if (!$hasExistingDefault) InvoiceTemplate::where('slug', 'classic-tax-invoice')->update(['is_default' => true]);
    }
}