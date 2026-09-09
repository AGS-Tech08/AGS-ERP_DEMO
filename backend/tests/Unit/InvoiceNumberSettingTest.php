<?php

namespace Tests\Unit;

use App\Models\BankAccount;
use App\Models\InvoiceNumberSetting;
use Carbon\Carbon;
use PHPUnit\Framework\TestCase;

class InvoiceNumberSettingTest extends TestCase
{
    public function test_default_style_invoice_number_matches_existing_format(): void
    {
        $setting = new InvoiceNumberSetting([
            'prefix' => 'INV',
            'number_padding' => 5,
            'include_date' => true,
            'include_financial_year' => false,
            'financial_year_start_month' => 4,
        ]);

        $this->assertSame(
            'INV20260829-00042',
            $setting->numberFor(Carbon::parse('2026-08-29'), 42)
        );
    }

    public function test_financial_year_invoice_number_uses_the_configured_start_month(): void
    {
        $setting = new InvoiceNumberSetting([
            'prefix' => 'INV',
            'number_padding' => 4,
            'include_date' => false,
            'include_financial_year' => true,
            'financial_year_start_month' => 4,
        ]);

        $this->assertSame(
            'INV2025-26-0007',
            $setting->numberFor(Carbon::parse('2026-03-31'), 7)
        );
    }

    public function test_bank_account_number_is_masked_when_serialized(): void
    {
        $account = new BankAccount(['account_number' => '123456789012']);

        $this->assertSame('********9012', $account->account_number_masked);
        $this->assertArrayNotHasKey('account_number', $account->toArray());
    }
}
