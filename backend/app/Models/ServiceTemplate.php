<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServiceTemplate extends Model
{
    protected $fillable = ['name', 'slug', 'template_type', 'description', 'config', 'is_active', 'is_default'];

    protected $casts = ['config' => 'array', 'is_active' => 'boolean', 'is_default' => 'boolean'];

    public static function defaultConfig(): array
    {
        return [
            'show_logo' => true,
            'show_header' => true,
            'show_customer' => true,
            'show_device' => true,
            'show_accessories' => true,
            'show_complaint' => true,
            'show_diagnosis' => true,
            'show_work_done' => true,
            'show_spares' => true,
            'show_charges' => true,
            'show_signature' => true,
            'show_terms' => true,
            'footer_text' => 'This is a Computer Generated Service Document',
        ];
    }

    public function mergedConfig(): array
    {
        return array_replace(self::defaultConfig(), $this->config ?? []);
    }
}
