<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvoiceNumberSetting extends Model
{
    protected $fillable = [
        'company_profile_id',
        'invoice_type',
        'prefix',
        'start_number',
        'next_number',
        'number_padding',
        'include_date',
        'include_financial_year',
        'financial_year_start_month',
        'last_financial_year',
    ];

    protected $casts = [
        'start_number' => 'integer',
        'next_number' => 'integer',
        'number_padding' => 'integer',
        'include_date' => 'boolean',
        'include_financial_year' => 'boolean',
        'financial_year_start_month' => 'integer',
    ];

    public function companyProfile(): BelongsTo
    {
        return $this->belongsTo(CompanyProfile::class);
    }

    public function financialYear(CarbonInterface $date): string
    {
        $startYear = $date->month >= $this->financial_year_start_month
            ? $date->year
            : $date->year - 1;

        return $startYear . '-' . str_pad(
            (string) (($startYear + 1) % 100),
            2,
            '0',
            STR_PAD_LEFT
        );
    }

    public function numberFor(CarbonInterface $date, int $sequence): string
    {
        $number = $this->prefix;

        if ($this->include_financial_year) {
            $number .= $this->financialYearCode($date);
        } elseif ($this->include_date) {
            $number .= $date->format('Ymd');
        }

        return $number . str_pad(
            (string) $sequence,
            $this->number_padding,
            '0',
            STR_PAD_LEFT
        );
    }

    public function financialYearCode(CarbonInterface $date): string
    {
        $startYear = $date->month >= $this->financial_year_start_month
            ? $date->year
            : $date->year - 1;

        return str_pad((string) ($startYear % 100), 2, '0', STR_PAD_LEFT)
            . str_pad((string) (($startYear + 1) % 100), 2, '0', STR_PAD_LEFT);
    }

    public static function generateFor(CarbonInterface $date, string $invoiceType = 'tax'): string
    {
        if (!in_array($invoiceType, ['tax', 'normal'], true)) {
            throw new \InvalidArgumentException('Unsupported invoice type.');
        }

        $profile = CompanyProfile::lockForUpdate()->first();

        if (!$profile) {
            $nextId = (Sale::withTrashed()->max('id') ?? 0) + 1;

            return 'INV' . $date->format('Ymd') . '-'
                . str_pad((string) $nextId, 5, '0', STR_PAD_LEFT);
        }

        $setting = static::where('company_profile_id', $profile->id)
            ->where('invoice_type', $invoiceType)
            ->lockForUpdate()
            ->first();

        if (!$setting) {
            $setting = static::create([
                'company_profile_id' => $profile->id,
                'invoice_type' => $invoiceType,
                'prefix' => $invoiceType === 'normal' ? 'AGSN' : 'AGS',
                'start_number' => 1,
                'next_number' => 1,
                'number_padding' => 3,
                'include_date' => false,
                'include_financial_year' => true,
                'financial_year_start_month' => 4,
            ]);
        }

        $financialYear = $setting->include_financial_year
            ? $setting->financialYear($date)
            : null;

        $sequence = $financialYear && $setting->last_financial_year !== $financialYear
            ? $setting->start_number
            : $setting->next_number;

        do {
            $invoiceNo = $setting->numberFor($date, $sequence);
            $sequence++;
        } while (Sale::withTrashed()->where('invoice_no', $invoiceNo)->exists());

        $setting->update([
            'next_number' => $sequence,
            'last_financial_year' => $financialYear,
        ]);

        return $invoiceNo;
    }
}
