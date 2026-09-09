<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuotationTemplate extends Model
{
    protected $fillable = ['name', 'slug', 'description', 'config', 'is_active', 'is_default'];

    protected $casts = ['config' => 'array', 'is_active' => 'boolean', 'is_default' => 'boolean'];

    public static function defaultConfig(): array
    {
        return [
            'show_logo' => true,
            'show_header' => true,
            'show_customer' => true,
            'show_product_table' => true,
            'show_tax_columns' => true,
            'show_bank_details' => true,
            'show_terms' => true,
            'show_signature' => true,
            'show_amount_in_words' => true,
            'footer_text' => 'This is a Computer Generated Quotation',
        ];
    }

    public function mergedConfig(): array
    {
        return array_replace(self::defaultConfig(), $this->config ?? []);
    }
}
