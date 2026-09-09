<?php

namespace App\Http\Controllers;

use App\Models\CompanyProfile;
use App\Models\Customer;
use App\Models\InvoiceNumberSetting;
use App\Models\Product;
use App\Models\Quotation;
use App\Models\QuotationItem;
use App\Models\Sale;
use App\Models\SaleItem;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QuotationController extends Controller
{
    public function index(Request $request)
    {
        $query = Quotation::with([
            'customer:id,company_name,contact_person,mobile,email,state',
            'items.product:id,product_name,product_code,hsn_code,unit',
        ])->latest('quotation_date')->latest('id');

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = trim($request->search);

            $query->where(function ($q) use ($search) {
                $q->where('quotation_no', 'like', "%{$search}%")
                    ->orWhere('status', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($customerQuery) use ($search) {
                        $customerQuery->where('company_name', 'like', "%{$search}%")
                            ->orWhere('mobile', 'like', "%{$search}%");
                    });
            });
        }

        return response()->json(
            $query->paginate($request->integer('per_page', 20))
        );
    }

    public function store(Request $request)
    {
        $validated = $this->validateQuotation($request);

        try {
            $quotation = DB::transaction(function () use ($validated) {
                $customer = Customer::findOrFail($validated['customer_id']);

                $quotationNo = Quotation::generateNumber(
                    Carbon::parse($validated['quotation_date'])
                );

                $quotation = Quotation::create([
                    'quotation_no' => $quotationNo,
                    'customer_id' => $customer->id,
                    'quotation_date' => $validated['quotation_date'],
                    'valid_until' => $validated['valid_until'],
                    'subtotal' => $validated['subtotal'],
                    'discount_amount' => $validated['discount_amount'],
                    'taxable_amount' => $validated['taxable_amount'],
                    'gst_amount' => $validated['gst_amount'],
                    'grand_total' => $validated['grand_total'],
                    'status' => 'Draft',
                    'notes' => $validated['notes'] ?? null,
                    'terms_conditions' => $validated['terms_conditions'] ?? null,
                    'created_by' => auth()->id(),
                    'updated_by' => auth()->id(),
                ]);

                foreach ($validated['items'] as $item) {
                    $product = Product::findOrFail($item['product_id']);

                    $quotation->items()->create([
                        'product_id' => $product->id,
                        'description' => $item['description'] ?? $product->product_name,
                        'hsn_code' => $item['hsn_code'] ?? $product->hsn_code ?? null,
                        'quantity' => $item['quantity'],
                        'rate' => $item['rate'],
                        'discount_amount' => $item['discount_amount'],
                        'taxable_amount' => $item['taxable_amount'],
                        'gst_percent' => $item['gst_percent'] ?? $product->gst_percentage ?? 0,
                        'gst_amount' => $item['gst_amount'],
                        'total_amount' => $item['total_amount'],
                    ]);
                }

                return $quotation->fresh(['customer', 'items.product']);
            });

            return response()->json([
                'message' => 'Quotation created successfully.',
                'quotation' => $quotation,
            ], 201);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Unable to create quotation.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function show(Quotation $quotation)
    {
        return response()->json([
            'data' => $quotation->load(['customer', 'items.product', 'createdByUser', 'updatedByUser']),
        ]);
    }

    public function update(Request $request, Quotation $quotation)
    {
        $validated = $this->validateQuotation($request, true);

        try {
            $quotation = DB::transaction(function () use ($request, $quotation, $validated) {
                $quotation->update([
                    'customer_id' => $validated['customer_id'],
                    'quotation_date' => $validated['quotation_date'],
                    'valid_until' => $validated['valid_until'],
                    'subtotal' => $validated['subtotal'],
                    'discount_amount' => $validated['discount_amount'],
                    'taxable_amount' => $validated['taxable_amount'],
                    'gst_amount' => $validated['gst_amount'],
                    'grand_total' => $validated['grand_total'],
                    'notes' => $validated['notes'] ?? null,
                    'terms_conditions' => $validated['terms_conditions'] ?? null,
                    'updated_by' => auth()->id(),
                ]);

                $quotation->items()->delete();

                foreach ($validated['items'] as $item) {
                    $product = Product::findOrFail($item['product_id']);

                    $quotation->items()->create([
                        'product_id' => $product->id,
                        'description' => $item['description'] ?? $product->product_name,
                        'hsn_code' => $item['hsn_code'] ?? $product->hsn_code ?? null,
                        'quantity' => $item['quantity'],
                        'rate' => $item['rate'],
                        'discount_amount' => $item['discount_amount'],
                        'taxable_amount' => $item['taxable_amount'],
                        'gst_percent' => $item['gst_percent'] ?? $product->gst_percentage ?? 0,
                        'gst_amount' => $item['gst_amount'],
                        'total_amount' => $item['total_amount'],
                    ]);
                }

                return $quotation->fresh(['customer', 'items.product']);
            });

            return response()->json([
                'message' => 'Quotation updated successfully.',
                'quotation' => $quotation,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Unable to update quotation.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(Quotation $quotation)
    {
        try {
            DB::transaction(function () use ($quotation) {
                $quotation->items()->delete();
                $quotation->delete();
            });

            return response()->json([
                'message' => 'Quotation deleted successfully.',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Unable to delete quotation.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function duplicate(Quotation $quotation)
    {
        try {
            $duplicate = DB::transaction(function () use ($quotation) {
                $newQuotation = $quotation->replicate([
                    'quotation_no',
                    'status',
                    'converted_invoice_no',
                ]);

                $newQuotation->quotation_no = Quotation::generateNumber(Carbon::today());
                $newQuotation->status = 'Draft';
                $newQuotation->converted_invoice_no = null;
                $newQuotation->created_by = auth()->id();
                $newQuotation->updated_by = auth()->id();
                $newQuotation->save();

                foreach ($quotation->items as $item) {
                    $copy = $item->replicate();
                    $copy->quotation_id = $newQuotation->id;
                    $copy->save();
                }

                return $newQuotation->fresh(['customer', 'items.product']);
            });

            return response()->json([
                'message' => 'Quotation duplicated successfully.',
                'quotation' => $duplicate,
            ], 201);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Unable to duplicate quotation.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function updateStatus(Request $request, Quotation $quotation)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:Draft,Sent,Accepted,Rejected,Expired',
        ]);

        $quotation->status = $validated['status'];
        $quotation->updated_by = auth()->id();
        $quotation->save();

        return response()->json([
            'message' => 'Quotation status updated successfully.',
            'quotation' => $quotation->fresh(['customer', 'items.product']),
        ]);
    }

    public function preview(Quotation $quotation)
    {
        $company = CompanyProfile::oldest('id')->first();

        return response()->json([
            'success' => true,
            'data' => [
                'company' => $company,
                'bank_accounts' => $company ? $company->bankAccounts()->where('is_active', true)->get() : [],
                'quotation' => $quotation->load(['customer', 'items.product']),
            ],
        ]);
    }

    public function convertToInvoice(Quotation $quotation)
    {
        if (!in_array($quotation->status, ['Draft', 'Sent', 'Accepted'], true)) {
            return response()->json([
                'message' => 'Only Draft, Sent, or Accepted quotations can be converted to an invoice.',
            ], 422);
        }

        try {
            $sale = DB::transaction(function () use ($quotation) {
                $invoiceNo = InvoiceNumberSetting::generateFor(Carbon::today());
                $sale = Sale::create([
                    'invoice_no' => $invoiceNo,
                    'invoice_type' => 'tax',
                    'customer_id' => $quotation->customer_id,
                    'sale_date' => Carbon::today(),
                    'subtotal' => $quotation->subtotal,
                    'discount_amount' => $quotation->discount_amount,
                    'taxable_amount' => $quotation->taxable_amount,
                    'gst_amount' => $quotation->gst_amount,
                    'other_charges' => 0,
                    'grand_total' => $quotation->grand_total,
                    'paid_amount' => 0,
                    'balance_amount' => $quotation->grand_total,
                    'payment_status' => 'UNPAID',
                    'sale_status' => 'COMPLETED',
                    'notes' => 'Converted from quotation ' . $quotation->quotation_no,
                    'created_by' => auth()->id(),
                    'updated_by' => auth()->id(),
                ]);

                foreach ($quotation->items as $item) {
                    $sale->items()->create([
                        'product_id' => $item->product_id,
                        'service_id' => null,
                        'service_spare_id' => null,
                        'item_type' => 'product',
                        'description' => $item->description,
                        'quantity' => $item->quantity,
                        'rate' => $item->rate,
                        'discount_amount' => $item->discount_amount,
                        'taxable_amount' => $item->taxable_amount,
                        'gst_percent' => $item->gst_percent,
                        'gst_amount' => $item->gst_amount,
                        'total_amount' => $item->total_amount,
                    ]);

                    if ($item->product_id) {
                        Product::whereKey($item->product_id)->decrement('current_stock', $item->quantity);
                    }
                }

                $quotation->status = 'Accepted';
                $quotation->converted_invoice_no = $invoiceNo;
                $quotation->updated_by = auth()->id();
                $quotation->save();

                return $sale->fresh(['customer','items.product']);
            });

            return response()->json([
                'message' => 'Quotation converted to invoice successfully.',
                'invoice_no' => $sale->invoice_no,
                'sale' => $sale,
                'quotation' => $quotation->fresh(['customer', 'items.product']),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Unable to convert quotation to invoice.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    private function validateQuotation(Request $request, bool $isUpdate = false): array
    {
        $validated = $request->validate([
            'customer_id' => ['required', 'integer', 'exists:customers,id'],
            'quotation_date' => ['required', 'date'],
            'valid_until' => ['required', 'date', 'after_or_equal:quotation_date'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.description' => ['nullable', 'string', 'max:255'],
            'items.*.hsn_code' => ['nullable', 'string', 'max:50'],
            'items.*.quantity' => ['required', 'numeric', 'gt:0'],
            'items.*.rate' => ['required', 'numeric', 'min:0'],
            'items.*.discount_amount' => ['nullable', 'numeric', 'min:0'],
            'items.*.gst_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'notes' => ['nullable', 'string'],
            'terms_conditions' => ['nullable', 'string'],
        ]);

        $items = [];
        $subtotal = 0;
        $discountAmount = 0;
        $gstAmount = 0;

        foreach ($validated['items'] as $index => $item) {
            $product = Product::findOrFail($item['product_id']);
            $quantity = (float) ($item['quantity'] ?? 0);
            $rate = (float) ($item['rate'] ?? 0);
            $discount = (float) ($item['discount_amount'] ?? 0);
            $gross = $quantity * $rate;

            if ($discount > $gross) {
                abort(422, 'Discount for ' . ($product->product_name ?? 'product') . ' cannot exceed item value.');
            }

            $taxable = max(0, $gross - $discount);
            $gstPercent = (float) ($item['gst_percent'] ?? $product->gst_percentage ?? 0);
            $itemGst = $taxable * ($gstPercent / 100);
            $total = $taxable + $itemGst;

            $subtotal += $gross;
            $discountAmount += $discount;
            $gstAmount += $itemGst;

            $items[$index] = [
                'product_id' => $product->id,
                'description' => $item['description'] ?? $product->product_name,
                'hsn_code' => $item['hsn_code'] ?? $product->hsn_code ?? null,
                'quantity' => $quantity,
                'rate' => $rate,
                'discount_amount' => $discount,
                'taxable_amount' => $taxable,
                'gst_percent' => $gstPercent,
                'gst_amount' => $itemGst,
                'total_amount' => $total,
            ];
        }

        $taxableAmount = max(0, $subtotal - $discountAmount);

        $validated['items'] = $items;
        $validated['subtotal'] = $subtotal;
        $validated['discount_amount'] = $discountAmount;
        $validated['taxable_amount'] = $taxableAmount;
        $validated['gst_amount'] = $gstAmount;
        $validated['grand_total'] = $taxableAmount + $gstAmount;

        return $validated;
    }
}
