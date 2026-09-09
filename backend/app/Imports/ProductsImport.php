<?php

namespace App\Imports;

use App\Models\Product;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class ProductsImport implements ToCollection, WithHeadingRow
{
    public array $errors = [];

    public int $successCount = 0;

    public int $skipCount = 0;

    public function collection(Collection $rows): void
    {
        foreach ($rows as $index => $row) {

            $excelRow = $index + 2;

            try {

                /*
                 * Product Name
                 */
                $productName = trim(
                    (string) (
                        $row['product_name']
                        ?? $row['name']
                        ?? ''
                    )
                );

                if ($productName === '') {

                    $this->errors[] = [
                        'row' => $excelRow,
                        'message' =>
                            'Product Name is required.',
                    ];

                    $this->skipCount++;

                    continue;
                }

                /*
                 * Numeric fields
                 */
                $purchasePrice = $this->toNumber(
                    $row['purchase_price']
                    ?? 0
                );

                $sellingPrice = $this->toNumber(
                    $row['selling_price']
                    ?? 0
                );

                $openingStock = $this->toNumber(
                    $row['opening_stock']
                    ?? 0
                );

                $minimumStock = $this->toNumber(
                    $row['minimum_stock']
                    ?? 0
                );

                /*
                 * Laravel Excel converts:
                 *
                 * GST % -> gst
                 *
                 * So support both.
                 */
                $gstPercentage = $this->toNumber(
                    $row['gst']
                    ?? $row['gst_percentage']
                    ?? 0
                );

                /*
                 * Validation
                 */
                if ($purchasePrice < 0) {
                    throw new \Exception(
                        'Purchase Price cannot be negative.'
                    );
                }

                if ($sellingPrice < 0) {
                    throw new \Exception(
                        'Selling Price cannot be negative.'
                    );
                }

                if ($openingStock < 0) {
                    throw new \Exception(
                        'Opening Stock cannot be negative.'
                    );
                }

                if ($minimumStock < 0) {
                    throw new \Exception(
                        'Minimum Stock cannot be negative.'
                    );
                }

                if (
                    $gstPercentage < 0 ||
                    $gstPercentage > 100
                ) {
                    throw new \Exception(
                        'GST % must be between 0 and 100.'
                    );
                }

                /*
                 * Generate new Product Code.
                 *
                 * Excel Product Code is not used.
                 */
                $productCode =
                    $this->generateProductCode();

                /*
                 * Unit
                 */
                $unit = trim(
                    (string) (
                        $row['unit'] ?? ''
                    )
                );

                if ($unit === '') {
                    $unit = 'PCS';
                }

                /*
                 * Status
                 */
                $productStatus = trim(
                    (string) (
                        $row['product_status']
                        ?? 'Active'
                    )
                );

                if ($productStatus === '') {
                    $productStatus = 'Active';
                }

                /*
                 * HSN/SAC
                 *
                 * HSN/SAC normally becomes hsn_sac
                 * with HeadingRowFormatter.
                 */
                $hsnCode = $this->nullableString(
                    $row['hsn_sac']
                    ?? $row['hsn_code']
                    ?? $row['hsn']
                    ?? null
                );

                /*
                 * Create new Product only.
                 */
                Product::create([
                    'product_code' =>
                        $productCode,

                    'product_name' =>
                        $productName,

                    'category' =>
                        $this->nullableString(
                            $row['category']
                            ?? null
                        ),

                    'brand' =>
                        $this->nullableString(
                            $row['brand']
                            ?? null
                        ),

                    'hsn_code' =>
                        $hsnCode,

                    'unit' =>
                        $unit,

                    'purchase_price' =>
                        $purchasePrice,

                    'selling_price' =>
                        $sellingPrice,

                    'opening_stock' =>
                        $openingStock,

                    /*
                     * New Product stock starts
                     * from Opening Stock.
                     */
                    'current_stock' =>
                        $openingStock,

                    'minimum_stock' =>
                        $minimumStock,

                    'gst_percentage' =>
                        $gstPercentage,

                    'product_status' =>
                        $productStatus,

                    'description' =>
                        $this->nullableString(
                            $row['description']
                            ?? null
                        ),

                    'created_by' =>
                        auth()->id(),
                ]);

                $this->successCount++;

            } catch (\Throwable $e) {

                $this->errors[] = [
                    'row' => $excelRow,
                    'message' =>
                        $e->getMessage(),
                ];

                $this->skipCount++;
            }
        }
    }

    /**
     * Generate a unique Product Code.
     */
    private function generateProductCode(): string
    {
        $lastProduct = Product::withTrashed()
            ->latest('id')
            ->first();

        if (!$lastProduct) {

            $number = 1;

        } else {

            $code =
                (string) $lastProduct->product_code;

            if (
                preg_match(
                    '/(\d+)$/',
                    $code,
                    $matches
                )
            ) {

                $number =
                    ((int) $matches[1]) + 1;

            } else {

                $number =
                    $lastProduct->id + 1;
            }
        }

        do {

            $productCode =
                'PRD' .
                str_pad(
                    $number,
                    6,
                    '0',
                    STR_PAD_LEFT
                );

            $exists =
                Product::withTrashed()
                    ->where(
                        'product_code',
                        $productCode
                    )
                    ->exists();

            if ($exists) {
                $number++;
            }

        } while ($exists);

        return $productCode;
    }

    /**
     * Convert Excel value to number.
     */
    private function toNumber($value): float
    {
        if (
            $value === null ||
            $value === ''
        ) {
            return 0;
        }

        return (float) str_replace(
            ',',
            '',
            trim((string) $value)
        );
    }

    /**
     * Empty string -> null.
     */
    private function nullableString(
        $value
    ): ?string {

        if ($value === null) {
            return null;
        }

        $value = trim(
            (string) $value
        );

        return $value === ''
            ? null
            : $value;
    }
}