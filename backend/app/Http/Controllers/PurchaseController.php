<?php

namespace App\Http\Controllers;

use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PurchaseController extends Controller
{
    /**
     * Purchase List
     */
    public function index(Request $request)
    {
        $query = Purchase::with('vendor')
            ->withCount('items');

        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where('purchase_code', 'like', "%{$search}%")
                    ->orWhere('supplier_invoice_no', 'like', "%{$search}%")
                    ->orWhereHas('vendor', function ($vendorQuery) use ($search) {
                        $vendorQuery
                            ->where('vendor_name', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('payment_status')) {
            $query->where(
                'payment_status',
                $request->payment_status
            );
        }

        if ($request->filled('purchase_status')) {
            $query->where(
                'purchase_status',
                $request->purchase_status
            );
        }

        return response()->json([
            'success' => true,
            'data' => $query
                ->latest('id')
                ->paginate(10)
        ]);
    }

    /**
     * Create Purchase
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'vendor_id' => 'required|exists:vendors,id',

            'purchase_date' => 'required|date',

            'supplier_invoice_no' =>
                'nullable|string|max:255',

            'supplier_invoice_date' =>
                'nullable|date',

            'discount_amount' =>
                'nullable|numeric|min:0',

            'other_charges' =>
                'nullable|numeric|min:0',

            'paid_amount' =>
                'nullable|numeric|min:0',

            'purchase_status' =>
                'nullable|string|max:50',

            'notes' =>
                'nullable|string',

            'items' =>
                'required|array|min:1',

            'items.*.product_id' =>
                'required|exists:products,id',

            'items.*.quantity' =>
                'required|numeric|min:0.001',

            'items.*.purchase_price' =>
                'required|numeric|min:0',

            'items.*.discount_percentage' =>
                'nullable|numeric|min:0|max:100',

            'items.*.gst_percentage' =>
                'nullable|numeric|min:0|max:100',
        ]);

        $purchase = DB::transaction(function () use ($validated) {

            $subtotal = 0;
            $discountAmount = 0;
            $gstAmount = 0;

            $itemsData = [];

            foreach ($validated['items'] as $item) {

                $quantity =
                    (float) $item['quantity'];

                $purchasePrice =
                    (float) $item['purchase_price'];

                $discountPercentage =
                    (float) (
                        $item['discount_percentage'] ?? 0
                    );

                $gstPercentage =
                    (float) (
                        $item['gst_percentage'] ?? 0
                    );

                $grossAmount =
                    $quantity * $purchasePrice;

                $itemDiscount =
                    $grossAmount *
                    ($discountPercentage / 100);

                $taxableAmount =
                    $grossAmount - $itemDiscount;

                $itemGst =
                    $taxableAmount *
                    ($gstPercentage / 100);

                $totalAmount =
                    $taxableAmount + $itemGst;

                $subtotal += $grossAmount;
                $discountAmount += $itemDiscount;
                $gstAmount += $itemGst;

                $itemsData[] = [
                    'product_id' =>
                        $item['product_id'],

                    'quantity' =>
                        $quantity,

                    'purchase_price' =>
                        $purchasePrice,

                    'discount_percentage' =>
                        $discountPercentage,

                    'discount_amount' =>
                        $itemDiscount,

                    'taxable_amount' =>
                        $taxableAmount,

                    'gst_percentage' =>
                        $gstPercentage,

                    'gst_amount' =>
                        $itemGst,

                    'total_amount' =>
                        $totalAmount,
                ];
            }

            $additionalDiscount =
                (float) (
                    $validated['discount_amount'] ?? 0
                );

            $otherCharges =
                (float) (
                    $validated['other_charges'] ?? 0
                );

            $taxableAmount =
                $subtotal -
                $discountAmount -
                $additionalDiscount;

            if ($taxableAmount < 0) {
                $taxableAmount = 0;
            }

            $grandTotal =
                $taxableAmount +
                $gstAmount +
                $otherCharges;

            $paidAmount =
                (float) (
                    $validated['paid_amount'] ?? 0
                );

            if ($paidAmount > $grandTotal) {
                $paidAmount = $grandTotal;
            }

            $balanceAmount =
                $grandTotal - $paidAmount;

            if ($balanceAmount <= 0) {
                $paymentStatus = 'Paid';
            } elseif ($paidAmount > 0) {
                $paymentStatus = 'Partial';
            } else {
                $paymentStatus = 'Pending';
            }

            $lastPurchase =
                Purchase::latest('id')->first();

            if ($lastPurchase) {

                $number = (int) substr(
                    $lastPurchase->purchase_code,
                    3
                );

                $number++;

            } else {

                $number = 1;
            }

            $purchaseCode =
                'PUR' .
                str_pad(
                    $number,
                    6,
                    '0',
                    STR_PAD_LEFT
                );

            $purchase = Purchase::create([
                'purchase_code' =>
                    $purchaseCode,

                'vendor_id' =>
                    $validated['vendor_id'],

                'purchase_date' =>
                    $validated['purchase_date'],

                'supplier_invoice_no' =>
                    $validated['supplier_invoice_no'] ?? null,

                'supplier_invoice_date' =>
                    $validated['supplier_invoice_date'] ?? null,

                'subtotal' =>
                    $subtotal,

                'discount_amount' =>
                    $discountAmount +
                    $additionalDiscount,

                'taxable_amount' =>
                    $taxableAmount,

                'gst_amount' =>
                    $gstAmount,

                'other_charges' =>
                    $otherCharges,

                'grand_total' =>
                    $grandTotal,

                'paid_amount' =>
                    $paidAmount,

                'balance_amount' =>
                    $balanceAmount,

                'payment_status' =>
                    $paymentStatus,

                'purchase_status' =>
                    $validated['purchase_status']
                    ?? 'Received',

                'notes' =>
                    $validated['notes'] ?? null,

                'created_by' =>
                    auth()->id(),
            ]);

            foreach ($itemsData as $itemData) {

                $purchase->items()->create(
                    $itemData
                );

                /*
                 * Increase Product Stock
                 */
                $product =
                    Product::find(
                        $itemData['product_id']
                    );

                if ($product) {

                    $product->current_stock =
                        (float) (
                            $product->current_stock ?? 0
                        ) +
                        (float) $itemData['quantity'];

                    $product->save();
                }
            }

            return $purchase;
        });

        return response()->json([
            'success' => true,
            'message' =>
                'Purchase created successfully.',
            'data' =>
                $purchase->load([
                    'vendor',
                    'items.product'
                ])
        ], 201);
    }

    /**
     * View Purchase
     */
    public function show(Purchase $purchase)
    {
        return response()->json([
            'success' => true,
            'data' => $purchase->load([
                'vendor',
                'items.product'
            ])
        ]);
    }

    /**
     * Update Purchase
     */
    public function update(
        Request $request,
        Purchase $purchase
    ) {
        return response()->json([
            'success' => false,
            'message' =>
                'Purchase editing will be handled separately to protect stock history.'
        ], 422);
    }

    /**
     * Delete Purchase
     */
    public function destroy(Purchase $purchase)
    {
        return response()->json([
            'success' => false,
            'message' =>
                'Purchase deletion is disabled to protect stock and accounting history.'
        ], 422);
    }
}