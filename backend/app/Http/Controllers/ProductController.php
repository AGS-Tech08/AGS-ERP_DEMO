<?php

namespace App\Http\Controllers;

use App\Imports\ProductsImport;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Maatwebsite\Excel\Facades\Excel;

class ProductController extends Controller
{
    /**
     * Product List
     */
    public function index(Request $request)
    {
        $query = Product::query();

        if ($request->filled('search')) {

            $search = $request->search;

            $query->where(function ($q) use ($search) {

                $q->where(
                    'product_code',
                    'like',
                    "%{$search}%"
                )
                    ->orWhere(
                        'product_name',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'category',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'brand',
                        'like',
                        "%{$search}%"
                    );

            });
        }

        return response()->json([
            'success' => true,

            'data' =>
                $query
                    ->latest()
                    ->paginate(10),
        ]);
    }

    /**
     * Create Product
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_name' =>
                'required|string|max:255',

            'category' =>
                'nullable|string|max:255',

            'brand' =>
                'nullable|string|max:255',

            'hsn_code' =>
                'nullable|string|max:255',

            'unit' =>
                'nullable|string|max:50',

            'purchase_price' =>
                'nullable|numeric|min:0',

            'selling_price' =>
                'nullable|numeric|min:0',

            'opening_stock' =>
                'nullable|numeric|min:0',

            'current_stock' =>
                'nullable|numeric|min:0',

            'minimum_stock' =>
                'nullable|numeric|min:0',

            'gst_percentage' =>
                'nullable|numeric|min:0|max:100',

            'product_status' =>
                'nullable|string|max:50',

            'description' =>
                'nullable|string',
        ]);

        /*
         * Generate Product Code
         */
        $lastProduct = Product::withTrashed()
            ->latest('id')
            ->first();

        if ($lastProduct) {

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

        } else {

            $number = 1;
        }

        /*
         * Ensure unique code
         */
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

        $validated['product_code'] =
            $productCode;

        /*
         * Defaults
         */
        $validated['unit'] =
            $validated['unit'] ??
            'PCS';

        $validated['purchase_price'] =
            $validated['purchase_price'] ??
            0;

        $validated['selling_price'] =
            $validated['selling_price'] ??
            0;

        $validated['opening_stock'] =
            $validated['opening_stock'] ??
            0;

        $validated['current_stock'] =
            $validated['current_stock']
            ?? $validated['opening_stock'];

        $validated['minimum_stock'] =
            $validated['minimum_stock'] ??
            0;

        $validated['gst_percentage'] =
            $validated['gst_percentage'] ??
            0;

        $validated['product_status'] =
            $validated['product_status'] ??
            'Active';

        $validated['created_by'] =
            auth()->id();

        $product =
            Product::create(
                $validated
            );

        return response()->json([
            'success' => true,

            'message' =>
                'Product created successfully.',

            'data' => $product,
        ], 201);
    }

    /**
     * Import Products from Excel
     */
    public function import(Request $request)
    {
        try {

            /*
             * File received?
             */
            if (!$request->hasFile('file')) {

                return response()->json([
                    'success' => false,

                    'message' =>
                        'Excel file was not received by the server.',

                    'errors' => [
                        'file' => [
                            'No uploaded file was found.'
                        ],
                    ],
                ], 422);
            }

            $file =
                $request->file('file');

            /*
             * Uploaded file valid?
             */
            if (!$file->isValid()) {

                return response()->json([
                    'success' => false,

                    'message' =>
                        'Uploaded file is invalid.',

                    'errors' => [
                        'file' => [
                            $file->getErrorMessage()
                        ],
                    ],
                ], 422);
            }

            /*
             * Validate extension + size.
             *
             * We intentionally avoid strict MIME validation
             * here because valid Excel files can arrive with
             * different MIME types depending on the browser/OS.
             */
            $extension =
                strtolower(
                    $file->getClientOriginalExtension()
                );

            $allowedExtensions = [
                'xlsx',
                'xls',
                'csv',
            ];

            if (
                !in_array(
                    $extension,
                    $allowedExtensions,
                    true
                )
            ) {

                return response()->json([
                    'success' => false,

                    'message' =>
                        'Only .xlsx, .xls or .csv files are allowed.',

                    'errors' => [
                        'file' => [
                            'Unsupported file extension.'
                        ],
                    ],
                ], 422);
            }

            /*
             * Maximum 10 MB
             */
            if (
                $file->getSize() >
                10 * 1024 * 1024
            ) {

                return response()->json([
                    'success' => false,

                    'message' =>
                        'Excel file must be 10 MB or smaller.',

                    'errors' => [
                        'file' => [
                            'Maximum file size is 10 MB.'
                        ],
                    ],
                ], 422);
            }

            /*
             * Import
             */
            $import =
                new ProductsImport();

            Excel::import(
                $import,
                $file
            );

            return response()->json([
                'success' => true,

                'message' =>
                    'Product import completed.',

                'data' => [
                    'imported' =>
                        $import->successCount,

                    'skipped' =>
                        $import->skipCount,

                    'errors' =>
                        $import->errors,
                ],
            ]);

        } catch (ValidationException $e) {

            return response()->json([
                'success' => false,

                'message' =>
                    'Excel validation failed.',

                'errors' =>
                    $e->errors(),
            ], 422);

        } catch (\Throwable $e) {

            return response()->json([
                'success' => false,

                'message' =>
                    'Excel import failed.',

                'error' =>
                    $e->getMessage(),

                'exception' =>
                    get_class($e),
            ], 500);
        }
    }

    /**
     * View Product
     */
    public function show(Product $product)
    {
        return response()->json([
            'success' => true,
            'data' => $product,
        ]);
    }

    /**
     * Update Product
     */
    public function update(
        Request $request,
        Product $product
    ) {
        $validated = $request->validate([
            'product_name' =>
                'required|string|max:255',

            'category' =>
                'nullable|string|max:255',

            'brand' =>
                'nullable|string|max:255',

            'hsn_code' =>
                'nullable|string|max:255',

            'unit' =>
                'nullable|string|max:50',

            'purchase_price' =>
                'nullable|numeric|min:0',

            'selling_price' =>
                'nullable|numeric|min:0',

            'opening_stock' =>
                'nullable|numeric|min:0',

            'current_stock' =>
                'nullable|numeric|min:0',

            'minimum_stock' =>
                'nullable|numeric|min:0',

            'gst_percentage' =>
                'nullable|numeric|min:0|max:100',

            'product_status' =>
                'nullable|string|max:50',

            'description' =>
                'nullable|string',
        ]);

        $validated['updated_by'] =
            auth()->id();

        $product->update(
            $validated
        );

        return response()->json([
            'success' => true,

            'message' =>
                'Product updated successfully.',

            'data' => $product->fresh(),
        ]);
    }

    /**
     * Delete Product
     */
    public function destroy(Product $product)
    {
        $product->delete();

        return response()->json([
            'success' => true,

            'message' =>
                'Product deleted successfully.',
        ]);
    }
}