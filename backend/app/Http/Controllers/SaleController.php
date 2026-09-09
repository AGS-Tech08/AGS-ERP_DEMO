<?php

namespace App\Http\Controllers;

use App\Models\BankAccount;
use App\Models\InvoiceNumberSetting;
use App\Models\InvoiceTemplate;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Service;
use App\Models\ServiceSpare;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class SaleController extends Controller
{
    public function index(Request $request)
    {
        $query = Sale::with([
            'customer:id,customer_code,company_name',
            'service:id,service_number,customer_id,status',
            'items.product:id,product_code,product_name',
            'items.service:id,service_number',
            'items.serviceSpare:id,service_id,product_id,quantity,rate',
            'payments:id,sale_id,payment_date,amount,payment_mode,reference_no',
        ])->latest('sale_date')->latest('id');

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }

        if ($request->filled('invoice_type')) {
            $query->where('invoice_type', $request->invoice_type);
        }

        if ($request->filled('search')) {
            $search = trim($request->search);

            $query->where(function ($q) use ($search) {
                $q->where('invoice_no', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($customerQuery) use ($search) {
                        $customerQuery
                            ->where('company_name', 'like', "%{$search}%")
                            ->orWhere('customer_code', 'like', "%{$search}%");
                    })
                    ->orWhereHas('service', function ($serviceQuery) use ($search) {
                        $serviceQuery->where(
                            'service_number',
                            'like',
                            "%{$search}%"
                        );
                    });
            });
        }

        return response()->json(
            $query->paginate($request->integer('per_page', 20))
        );
    }

    public function store(Request $request)
    {
        $validated = $this->validateSaleRequest($request);

        try {
            $sale = DB::transaction(function () use ($validated) {
                return $this->createSale($validated);
            });

            if (
                $sale->invoice_type !== Sale::INVOICE_TYPE_SERVICE_CHALLAN &&
                $sale->customer_id &&
                $sale->grand_total > 0
            ) {
                app(RewardController::class)->awardPointsForSale($sale);
            }

            return response()->json([
                'message' => 'Sale created successfully.',
                'sale' => $this->loadSale($sale),
            ], 201);
        } catch (\Illuminate\Http\Exceptions\HttpResponseException $e) {
            throw $e;
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Unable to create sale.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function show(Sale $sale)
    {
        return response()->json($this->loadSale($sale));
    }

    public function update(Request $request, Sale $sale)
    {
        $validated = $this->validateSaleRequest($request, true);

        try {
            $updatedSale = DB::transaction(function () use ($validated, $sale) {
                return $this->updateSale($sale, $validated);
            });

            return response()->json([
                'message' => 'Sale updated successfully.',
                'sale' => $this->loadSale($updatedSale),
            ]);
        } catch (\Illuminate\Http\Exceptions\HttpResponseException $e) {
            throw $e;
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Unable to update sale.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(Sale $sale)
    {
        try {
            DB::transaction(function () use ($sale) {
                $sale->load('items');

                foreach ($sale->items as $item) {
                    /*
                     * Service spares are already deducted by Service system.
                     * Never reverse them from Sales.
                     */
                    if (
                        $item->item_type === 'spare' ||
                        !empty($item->service_spare_id)
                    ) {
                        continue;
                    }

                    if ($item->product_id) {
                        Product::where('id', $item->product_id)
                            ->increment('current_stock', $item->quantity);
                    }
                }

                $sale->items()->delete();
                $sale->payments()->delete();
                $sale->delete();
            });

            return response()->json([
                'message' => 'Sale deleted successfully.',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Unable to delete sale.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    private function validateSaleRequest(
        Request $request,
        bool $isUpdate = false
    ): array {
        $validated = $request->validate([
            'invoice_type' => [
                'required',
                Rule::in([
                    Sale::INVOICE_TYPE_NORMAL,
                    Sale::INVOICE_TYPE_TAX,
                ]),
            ],

            'sale_date' => [
                'required',
                'date',
            ],

            'customer_id' => [
                'nullable',
                'integer',
                'exists:customers,id',
            ],

            'service_id' => [
                'nullable',
                'integer',
                'exists:services,id',
            ],

            'bank_account_id' => [
                'nullable',
                'integer',
                'exists:bank_accounts,id',
            ],

            'items' => [
                'nullable',
                'array',
            ],

            'items.*.product_id' => [
                'nullable',
                'integer',
                'exists:products,id',
            ],

            'items.*.service_id' => [
                'nullable',
                'integer',
                'exists:services,id',
            ],

            'items.*.service_spare_id' => [
                'nullable',
                'integer',
                'exists:service_spares,id',
            ],

            'items.*.item_type' => [
                'nullable',
                'string',
                Rule::in(['product', 'service', 'spare']),
            ],

            'items.*.description' => [
                'nullable',
                'string',
                'max:255',
            ],

            'items.*.quantity' => [
                'nullable',
                'numeric',
                'gt:0',
            ],

            'items.*.rate' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'items.*.discount_amount' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'items.*.gst_percent' => [
                'nullable',
                'numeric',
                'min:0',
                'max:100',
            ],

            'discount_amount' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'other_charges' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'paid_amount' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'payment_mode' => [
                'nullable',
                'string',
                'max:50',
            ],

            'reference_no' => [
                'nullable',
                'string',
                'max:100',
            ],

            'notes' => [
                'nullable',
                'string',
            ],
        ]);

        $type = $validated['invoice_type'];

        if ($type === Sale::INVOICE_TYPE_SERVICE_CHALLAN) {
            if (empty($validated['service_id'])) {
                abort(422, 'Service is required for Service Challan.');
            }

            if (!empty($validated['items'])) {
                abort(422, 'Service Challan cannot contain product or spare items.');
            }
        }

        if ($type === Sale::INVOICE_TYPE_NORMAL) {
            if (empty($validated['items'])) {
                abort(422, 'At least one product is required.');
            }

            foreach ($validated['items'] as $item) {
                if (
                    empty($item['product_id']) ||
                    ($item['item_type'] ?? 'product') !== 'product'
                ) {
                    abort(422, 'Normal Invoice supports product items only.');
                }
            }

            if (
                !empty($validated['service_id']) ||
                (float) ($validated['other_charges'] ?? 0) > 0
            ) {
                abort(
                    422,
                    'Normal Invoice cannot contain service or service charges.'
                );
            }
        }

        if ($type === Sale::INVOICE_TYPE_TAX) {
            if (empty($validated['items'])) {
                abort(422, 'At least one item is required for Tax Invoice.');
            }

            foreach ($validated['items'] as $item) {
                $itemType = $item['item_type'] ?? 'product';

                if (
                    $itemType === 'product' &&
                    empty($item['product_id'])
                ) {
                    abort(422, 'Product is required for product item.');
                }

                if (
                    $itemType === 'service' &&
                    empty($item['service_id'])
                ) {
                    abort(422, 'Service is required for service item.');
                }

                if (
                    $itemType === 'spare' &&
                    empty($item['service_spare_id']) &&
                    empty($item['product_id'])
                ) {
                    abort(422, 'Service spare or product is required.');
                }
            }
        }

        return $validated;
    }

    private function createSale(array $validated): Sale
    {
        $type = $validated['invoice_type'];

        $service = null;

        if (!empty($validated['service_id'])) {
            $service = Service::with(['customer', 'spares.product'])
                ->findOrFail($validated['service_id']);
        }

        if ($type === Sale::INVOICE_TYPE_SERVICE_CHALLAN) {
            return $this->createServiceChallan($validated, $service);
        }

        return $this->createInvoiceSale($validated, $service);
    }

    private function createServiceChallan(
        array $validated,
        ?Service $service
    ): Sale {
        if (!$service) {
            abort(422, 'Service not found.');
        }

        $labourCharge = (float) ($service->labour_charge ?? 0);
        $serviceCharge = (float) ($service->other_charge ?? 0);

        $discount = (float) ($service->discount_amount ?? 0);

        $subtotal = $labourCharge + $serviceCharge;
        $taxableAmount = max(0, $subtotal - $discount);

        /*
         * Service Challan is always GST OFF.
         */
        $gstAmount = 0;
        $grandTotal = $taxableAmount;

        $paidAmount = (float) ($validated['paid_amount'] ?? 0);

        if ($paidAmount > $grandTotal) {
            abort(422, 'Paid amount cannot be greater than challan total.');
        }

        $balanceAmount = max(0, $grandTotal - $paidAmount);

        $paymentStatus = $this->paymentStatus(
            $paidAmount,
            $balanceAmount
        );

        $invoiceNo = InvoiceNumberSetting::generateFor(
            Carbon::parse($validated['sale_date'])
        );

        $customerId = $validated['customer_id']
            ?? $service->customer_id;

        $sale = Sale::create([
            'invoice_no' => $invoiceNo,
            'invoice_type' => Sale::INVOICE_TYPE_SERVICE_CHALLAN,
            'customer_id' => $customerId,
            'service_id' => $service->id,
            'bank_account_id' => $validated['bank_account_id'] ?? null,
            'sale_date' => $validated['sale_date'],
            'subtotal' => $subtotal,
            'discount_amount' => $discount,
            'taxable_amount' => $taxableAmount,
            'gst_amount' => $gstAmount,
            'other_charges' => 0,
            'grand_total' => $grandTotal,
            'paid_amount' => $paidAmount,
            'balance_amount' => $balanceAmount,
            'payment_status' => $paymentStatus,
            'sale_status' => 'COMPLETED',
            'notes' => $validated['notes'] ?? null,
            'created_by' => auth()->id(),
        ]);

        if ($labourCharge > 0) {
            $sale->items()->create([
                'product_id' => null,
                'service_id' => $service->id,
                'service_spare_id' => null,
                'item_type' => 'service',
                'description' => 'Labour Charge',
                'quantity' => 1,
                'rate' => $labourCharge,
                'discount_amount' => 0,
                'taxable_amount' => $labourCharge,
                'gst_percent' => 0,
                'gst_amount' => 0,
                'total_amount' => $labourCharge,
            ]);
        }

        if ($serviceCharge > 0) {
            $sale->items()->create([
                'product_id' => null,
                'service_id' => $service->id,
                'service_spare_id' => null,
                'item_type' => 'service',
                'description' => 'Service Charge',
                'quantity' => 1,
                'rate' => $serviceCharge,
                'discount_amount' => 0,
                'taxable_amount' => $serviceCharge,
                'gst_percent' => 0,
                'gst_amount' => 0,
                'total_amount' => $serviceCharge,
            ]);
        }

        $this->createInitialPayment(
            $sale,
            $validated,
            $paidAmount
        );

        return $sale;
    }

    private function createInvoiceSale(
        array $validated,
        ?Service $service
    ): Sale {
        $type = $validated['invoice_type'];

        $subtotal = 0;
        $itemDiscountTotal = 0;
        $gstTotal = 0;
        $itemsData = [];

        foreach ($validated['items'] as $item) {
            $itemType = $item['item_type'] ?? 'product';

            if ($itemType === 'product') {
                $product = Product::lockForUpdate()
                    ->findOrFail($item['product_id']);

                $quantity = (float) ($item['quantity'] ?? 0);
                $rate = (float) ($item['rate'] ?? 0);
                $discount = (float) ($item['discount_amount'] ?? 0);

                $this->validateProductStock(
                    $product,
                    $quantity
                );

                $gross = $quantity * $rate;

                if ($discount > $gross) {
                    abort(
                        422,
                        "Discount cannot be greater than item amount for {$product->product_name}."
                    );
                }

                $taxable = max(0, $gross - $discount);

                /*
                 * Normal Invoice = GST OFF.
                 * Tax Invoice = product GST.
                 */
                $gstPercent = $type === Sale::INVOICE_TYPE_TAX
                    ? (float) (
                        $item['gst_percent']
                        ?? $product->gst_percentage
                        ?? 0
                    )
                    : 0;

                $gst = $taxable * ($gstPercent / 100);
                $total = $taxable + $gst;

                $subtotal += $gross;
                $itemDiscountTotal += $discount;
                $gstTotal += $gst;

                $itemsData[] = [
                    'product_id' => $product->id,
                    'service_id' => null,
                    'service_spare_id' => null,
                    'item_type' => 'product',
                    'description' => $item['description']
                        ?? $product->product_name,
                    'quantity' => $quantity,
                    'rate' => $rate,
                    'discount_amount' => $discount,
                    'taxable_amount' => $taxable,
                    'gst_percent' => $gstPercent,
                    'gst_amount' => $gst,
                    'total_amount' => $total,
                ];

                /*
                 * Normal/Tax product sales deduct stock.
                 */
                Product::where('id', $product->id)
                    ->decrement('current_stock', $quantity);

                continue;
            }

            if ($itemType === 'spare') {
                $serviceSpare = null;

                if (!empty($item['service_spare_id'])) {
                    $serviceSpare = ServiceSpare::with('product')
                        ->findOrFail($item['service_spare_id']);

                    if (
                        $service &&
                        $serviceSpare->service_id !== $service->id
                    ) {
                        abort(
                            422,
                            'Selected spare does not belong to the selected service.'
                        );
                    }
                }

                $productId = $serviceSpare?->product_id
                    ?? $item['product_id']
                    ?? null;

                if (!$productId) {
                    abort(422, 'Product is required for spare item.');
                }

                $product = Product::lockForUpdate()
                    ->findOrFail($productId);

                $quantity = (float) (
                    $item['quantity']
                    ?? $serviceSpare?->quantity
                    ?? 0
                );

                $rate = (float) (
                    $item['rate']
                    ?? $serviceSpare?->rate
                    ?? 0
                );

                $discount = (float) (
                    $item['discount_amount']
                    ?? $serviceSpare?->discount_amount
                    ?? 0
                );

                $gross = $quantity * $rate;

                if ($discount > $gross) {
                    abort(422, 'Spare discount cannot exceed amount.');
                }

                $taxable = max(0, $gross - $discount);

                $gstPercent = (float) (
                    $item['gst_percent']
                    ?? $serviceSpare?->gst_percent
                    ?? $product->gst_percentage
                    ?? 0
                );

                $gst = $taxable * ($gstPercent / 100);
                $total = $taxable + $gst;

                $subtotal += $gross;
                $itemDiscountTotal += $discount;
                $gstTotal += $gst;

                $itemsData[] = [
                    'product_id' => $product->id,
                    'service_id' => $service?->id,
                    'service_spare_id' => $serviceSpare?->id,
                    'item_type' => 'spare',
                    'description' => $item['description']
                        ?? $product->product_name . ' - Spare',
                    'quantity' => $quantity,
                    'rate' => $rate,
                    'discount_amount' => $discount,
                    'taxable_amount' => $taxable,
                    'gst_percent' => $gstPercent,
                    'gst_amount' => $gst,
                    'total_amount' => $total,
                ];

                /*
                 * Existing ServiceSpare stock has already been
                 * deducted by Service system.
                 */
                if (!$serviceSpare) {
                    $this->validateProductStock(
                        $product,
                        $quantity
                    );

                    Product::where('id', $product->id)
                        ->decrement('current_stock', $quantity);
                }

                continue;
            }

            if ($itemType === 'service') {
                $itemService = Service::findOrFail(
                    $item['service_id']
                );

                $quantity = (float) ($item['quantity'] ?? 1);
                $rate = (float) ($item['rate'] ?? 0);
                $discount = (float) ($item['discount_amount'] ?? 0);

                $gross = $quantity * $rate;

                if ($discount > $gross) {
                    abort(422, 'Service discount cannot exceed amount.');
                }

                $taxable = max(0, $gross - $discount);

                $gstPercent = (float) (
                    $item['gst_percent']
                    ?? $itemService->gst_percent
                    ?? 0
                );

                $gst = $taxable * ($gstPercent / 100);
                $total = $taxable + $gst;

                $subtotal += $gross;
                $itemDiscountTotal += $discount;
                $gstTotal += $gst;

                $itemsData[] = [
                    'product_id' => null,
                    'service_id' => $itemService->id,
                    'service_spare_id' => null,
                    'item_type' => 'service',
                    'description' => $item['description']
                        ?? 'Service Charge',
                    'quantity' => $quantity,
                    'rate' => $rate,
                    'discount_amount' => $discount,
                    'taxable_amount' => $taxable,
                    'gst_percent' => $gstPercent,
                    'gst_amount' => $gst,
                    'total_amount' => $total,
                ];
            }
        }

        /*
         * Service Labour + Service Charge can be added to Tax Invoice.
         * They are NOT automatically added to Normal Invoice.
         */
        if (
            $type === Sale::INVOICE_TYPE_TAX &&
            $service &&
            !empty($validated['include_service_charges'])
        ) {
            $labourCharge = (float) ($service->labour_charge ?? 0);
            $serviceCharge = (float) ($service->other_charge ?? 0);

            if ($labourCharge > 0) {
                $this->appendServiceChargeItem(
                    $itemsData,
                    $service,
                    'Labour Charge',
                    $labourCharge,
                    (float) ($service->gst_percent ?? 0)
                );
            }

            if ($serviceCharge > 0) {
                $this->appendServiceChargeItem(
                    $itemsData,
                    $service,
                    'Service Charge',
                    $serviceCharge,
                    (float) ($service->gst_percent ?? 0)
                );
            }

            $subtotal += $labourCharge + $serviceCharge;

            $gstTotal +=
                ($labourCharge + $serviceCharge)
                * ((float) ($service->gst_percent ?? 0) / 100);
        }

        $invoiceDiscount = (float) (
            $validated['discount_amount'] ?? 0
        );

        $totalDiscount =
            $itemDiscountTotal + $invoiceDiscount;

        $taxableAmount = max(
            0,
            $subtotal - $totalDiscount
        );

        $otherCharges = $type === Sale::INVOICE_TYPE_TAX
            ? (float) ($validated['other_charges'] ?? 0)
            : 0;

        $grandTotal =
            $taxableAmount +
            $gstTotal +
            $otherCharges;

        $paidAmount = (float) (
            $validated['paid_amount'] ?? 0
        );

        if ($paidAmount > $grandTotal) {
            abort(
                422,
                'Paid amount cannot be greater than invoice total.'
            );
        }

        $balanceAmount = max(
            0,
            $grandTotal - $paidAmount
        );

        $paymentStatus = $this->paymentStatus(
            $paidAmount,
            $balanceAmount
        );

        $this->validateBankAccount(
            $validated['bank_account_id'] ?? null
        );

        $invoiceNo = InvoiceNumberSetting::generateFor(
            Carbon::parse($validated['sale_date']),
            $type
        );

        $customerId = $validated['customer_id']
            ?? $service?->customer_id;

        $sale = Sale::create([
            'invoice_no' => $invoiceNo,
            'invoice_type' => $type,
            'customer_id' => $customerId,
            'service_id' => $service?->id,
            'bank_account_id' => $validated['bank_account_id'] ?? null,
            'sale_date' => $validated['sale_date'],
            'subtotal' => $subtotal,
            'discount_amount' => $totalDiscount,
            'taxable_amount' => $taxableAmount,
            'gst_amount' => $gstTotal,
            'other_charges' => $otherCharges,
            'grand_total' => $grandTotal,
            'paid_amount' => $paidAmount,
            'balance_amount' => $balanceAmount,
            'payment_status' => $paymentStatus,
            'sale_status' => 'COMPLETED',
            'notes' => $validated['notes'] ?? null,
            'created_by' => auth()->id(),
        ]);

        foreach ($itemsData as $itemData) {
            $sale->items()->create($itemData);
        }

        $this->createInitialPayment(
            $sale,
            $validated,
            $paidAmount
        );

        return $sale;
    }

    private function updateSale(
        Sale $sale,
        array $validated
    ): Sale {
        $sale->load('items');

        /*
         * Restore stock belonging to the old Sales transaction.
         */
        foreach ($sale->items as $oldItem) {
            if (
                $oldItem->item_type === 'spare' ||
                !empty($oldItem->service_spare_id)
            ) {
                continue;
            }

            if ($oldItem->product_id) {
                Product::where('id', $oldItem->product_id)
                    ->increment(
                        'current_stock',
                        $oldItem->quantity
                    );
            }
        }

        /*
         * Existing invoice number MUST be preserved.
         */
        $existingInvoiceNo = $sale->invoice_no;

        $sale->items()->delete();

        /*
         * Existing payments are retained as payment history.
         * New paid amount is calculated from supplied value.
         */
        $existingPayments = $sale->payments()->get();

        $newSale = $this->buildUpdateSale(
            $sale,
            $validated,
            $existingInvoiceNo,
            $existingPayments
        );

        return $newSale;
    }

    private function buildUpdateSale(
        Sale $sale,
        array $validated,
        string $invoiceNo,
        $existingPayments
    ): Sale {
        $type = $validated['invoice_type'];

        /*
         * For update, create calculation using a temporary
         * payload but keep the same Sale record.
         */
        if ($type === Sale::INVOICE_TYPE_SERVICE_CHALLAN) {
            $service = Service::with(['customer'])
                ->findOrFail($validated['service_id']);

            $labour = (float) ($service->labour_charge ?? 0);
            $serviceCharge = (float) ($service->other_charge ?? 0);
            $discount = (float) ($service->discount_amount ?? 0);

            $subtotal = $labour + $serviceCharge;
            $taxable = max(0, $subtotal - $discount);
            $gst = 0;
            $other = 0;

            $items = [];

            if ($labour > 0) {
                $items[] = [
                    'product_id' => null,
                    'service_id' => $service->id,
                    'service_spare_id' => null,
                    'item_type' => 'service',
                    'description' => 'Labour Charge',
                    'quantity' => 1,
                    'rate' => $labour,
                    'discount_amount' => 0,
                    'taxable_amount' => $labour,
                    'gst_percent' => 0,
                    'gst_amount' => 0,
                    'total_amount' => $labour,
                ];
            }

            if ($serviceCharge > 0) {
                $items[] = [
                    'product_id' => null,
                    'service_id' => $service->id,
                    'service_spare_id' => null,
                    'item_type' => 'service',
                    'description' => 'Service Charge',
                    'quantity' => 1,
                    'rate' => $serviceCharge,
                    'discount_amount' => 0,
                    'taxable_amount' => $serviceCharge,
                    'gst_percent' => 0,
                    'gst_amount' => 0,
                    'total_amount' => $serviceCharge,
                ];
            }

            $customerId =
                $validated['customer_id']
                ?? $service->customer_id;
        } else {
            /*
             * Reuse invoice creation logic calculations by
             * calculating inside this method.
             */
            [$items, $subtotal, $totalDiscount, $taxable, $gst, $other] =
                $this->calculateInvoiceItems(
                    $validated,
                    $type
                );

            $service = !empty($validated['service_id'])
                ? Service::findOrFail($validated['service_id'])
                : null;

            $customerId =
                $validated['customer_id']
                ?? $service?->customer_id;
        }

        $grandTotal =
            $taxable + $gst + $other;

        $paidAmount = (float) (
            $validated['paid_amount'] ?? 0
        );

        if ($paidAmount > $grandTotal) {
            abort(
                422,
                'Paid amount cannot be greater than invoice total.'
            );
        }

        $balance = max(
            0,
            $grandTotal - $paidAmount
        );

        $this->validateBankAccount(
            $validated['bank_account_id'] ?? null
        );

        $sale->update([
            'invoice_no' => $invoiceNo,
            'invoice_type' => $type,
            'customer_id' => $customerId,
            'service_id' => $service?->id,
            'bank_account_id' => $validated['bank_account_id'] ?? null,
            'sale_date' => $validated['sale_date'],
            'subtotal' => $subtotal,
            'discount_amount' => $totalDiscount ?? 0,
            'taxable_amount' => $taxable,
            'gst_amount' => $gst,
            'other_charges' => $other,
            'grand_total' => $grandTotal,
            'paid_amount' => $paidAmount,
            'balance_amount' => $balance,
            'payment_status' => $this->paymentStatus(
                $paidAmount,
                $balance
            ),
            'notes' => $validated['notes'] ?? null,
            'updated_by' => auth()->id(),
        ]);

        foreach ($items as $item) {
            $sale->items()->create($item);
        }

        /*
         * Do not delete old payment history.
         * If supplied paid amount is greater than existing payment total,
         * record only the difference as an adjustment payment.
         */
        $existingPaid = (float) $existingPayments->sum('amount');

        if ($paidAmount > $existingPaid) {
            $difference = $paidAmount - $existingPaid;

            $sale->payments()->create([
                'payment_date' => $validated['sale_date'],
                'amount' => $difference,
                'payment_mode' => $validated['payment_mode'] ?? 'Cash',
                'reference_no' => $validated['reference_no'] ?? null,
                'notes' => 'Payment adjustment during invoice update',
                'created_by' => auth()->id(),
            ]);
        }

        return $sale;
    }

    private function calculateInvoiceItems(
        array $validated,
        string $type
    ): array {
        $subtotal = 0;
        $itemDiscountTotal = 0;
        $gstTotal = 0;
        $itemsData = [];

        foreach ($validated['items'] as $item) {
            $itemType = $item['item_type'] ?? 'product';

            if ($itemType === 'product') {
                $product = Product::lockForUpdate()
                    ->findOrFail($item['product_id']);

                $quantity = (float) ($item['quantity'] ?? 0);
                $rate = (float) ($item['rate'] ?? 0);
                $discount = (float) ($item['discount_amount'] ?? 0);

                $this->validateProductStock($product, $quantity);

                $gross = $quantity * $rate;

                if ($discount > $gross) {
                    abort(422, 'Item discount cannot exceed amount.');
                }

                $taxable = max(0, $gross - $discount);

                $gstPercent = $type === Sale::INVOICE_TYPE_TAX
                    ? (float) (
                        $item['gst_percent']
                        ?? $product->gst_percentage
                        ?? 0
                    )
                    : 0;

                $gst = $taxable * ($gstPercent / 100);

                $subtotal += $gross;
                $itemDiscountTotal += $discount;
                $gstTotal += $gst;

                $itemsData[] = [
                    'product_id' => $product->id,
                    'service_id' => null,
                    'service_spare_id' => null,
                    'item_type' => 'product',
                    'description' => $item['description']
                        ?? $product->product_name,
                    'quantity' => $quantity,
                    'rate' => $rate,
                    'discount_amount' => $discount,
                    'taxable_amount' => $taxable,
                    'gst_percent' => $gstPercent,
                    'gst_amount' => $gst,
                    'total_amount' => $taxable + $gst,
                ];

                Product::where('id', $product->id)
                    ->decrement('current_stock', $quantity);
            }

            if ($itemType === 'service') {
                $service = Service::findOrFail(
                    $item['service_id']
                );

                $quantity = (float) ($item['quantity'] ?? 1);
                $rate = (float) ($item['rate'] ?? 0);
                $discount = (float) ($item['discount_amount'] ?? 0);

                $gross = $quantity * $rate;

                if ($discount > $gross) {
                    abort(422, 'Service discount cannot exceed amount.');
                }

                $taxable = max(0, $gross - $discount);

                $gstPercent = (float) (
                    $item['gst_percent']
                    ?? $service->gst_percent
                    ?? 0
                );

                $gst = $taxable * ($gstPercent / 100);

                $subtotal += $gross;
                $itemDiscountTotal += $discount;
                $gstTotal += $gst;

                $itemsData[] = [
                    'product_id' => null,
                    'service_id' => $service->id,
                    'service_spare_id' => null,
                    'item_type' => 'service',
                    'description' => $item['description']
                        ?? 'Service Charge',
                    'quantity' => $quantity,
                    'rate' => $rate,
                    'discount_amount' => $discount,
                    'taxable_amount' => $taxable,
                    'gst_percent' => $gstPercent,
                    'gst_amount' => $gst,
                    'total_amount' => $taxable + $gst,
                ];
            }

            if ($itemType === 'spare') {
                $spare = !empty($item['service_spare_id'])
                    ? ServiceSpare::with('product')
                        ->findOrFail($item['service_spare_id'])
                    : null;

                $productId =
                    $spare?->product_id
                    ?? $item['product_id']
                    ?? null;

                if (!$productId) {
                    abort(422, 'Product is required for spare item.');
                }

                $product = Product::lockForUpdate()
                    ->findOrFail($productId);

                $quantity = (float) (
                    $item['quantity']
                    ?? $spare?->quantity
                    ?? 0
                );

                $rate = (float) (
                    $item['rate']
                    ?? $spare?->rate
                    ?? 0
                );

                $discount = (float) (
                    $item['discount_amount']
                    ?? $spare?->discount_amount
                    ?? 0
                );

                $gross = $quantity * $rate;

                if ($discount > $gross) {
                    abort(422, 'Spare discount cannot exceed amount.');
                }

                $taxable = max(0, $gross - $discount);

                $gstPercent = (float) (
                    $item['gst_percent']
                    ?? $spare?->gst_percent
                    ?? $product->gst_percentage
                    ?? 0
                );

                $gst = $taxable * ($gstPercent / 100);

                $subtotal += $gross;
                $itemDiscountTotal += $discount;
                $gstTotal += $gst;

                $itemsData[] = [
                    'product_id' => $product->id,
                    'service_id' => $spare?->service_id,
                    'service_spare_id' => $spare?->id,
                    'item_type' => 'spare',
                    'description' => $item['description']
                        ?? $product->product_name . ' - Spare',
                    'quantity' => $quantity,
                    'rate' => $rate,
                    'discount_amount' => $discount,
                    'taxable_amount' => $taxable,
                    'gst_percent' => $gstPercent,
                    'gst_amount' => $gst,
                    'total_amount' => $taxable + $gst,
                ];

                if (!$spare) {
                    $this->validateProductStock(
                        $product,
                        $quantity
                    );

                    Product::where('id', $product->id)
                        ->decrement('current_stock', $quantity);
                }
            }
        }

        $invoiceDiscount = (float) (
            $validated['discount_amount'] ?? 0
        );

        $totalDiscount =
            $itemDiscountTotal + $invoiceDiscount;

        $taxable = max(
            0,
            $subtotal - $totalDiscount
        );

        $other = $type === Sale::INVOICE_TYPE_TAX
            ? (float) ($validated['other_charges'] ?? 0)
            : 0;

        return [
            $itemsData,
            $subtotal,
            $totalDiscount,
            $taxable,
            $gstTotal,
            $other,
        ];
    }

    private function appendServiceChargeItem(
        array &$items,
        Service $service,
        string $description,
        float $amount,
        float $gstPercent
    ): void {
        $gst = $amount * ($gstPercent / 100);

        $items[] = [
            'product_id' => null,
            'service_id' => $service->id,
            'service_spare_id' => null,
            'item_type' => 'service',
            'description' => $description,
            'quantity' => 1,
            'rate' => $amount,
            'discount_amount' => 0,
            'taxable_amount' => $amount,
            'gst_percent' => $gstPercent,
            'gst_amount' => $gst,
            'total_amount' => $amount + $gst,
        ];
    }

    private function validateProductStock(
        Product $product,
        float $quantity
    ): void {
        $currentStock = (float) ($product->current_stock ?? 0);

        if ($quantity > $currentStock) {
            abort(
                422,
                "Insufficient stock for product: {$product->product_name}. Available stock: {$currentStock}"
            );
        }
    }

    private function validateBankAccount(?int $bankAccountId): void
    {
        if (!$bankAccountId) {
            return;
        }

        $bankAccount = BankAccount::where('is_active', true)
            ->find($bankAccountId);

        if (!$bankAccount) {
            abort(
                422,
                'Please select an active bank account.'
            );
        }
    }

    private function paymentStatus(
        float $paidAmount,
        float $balanceAmount
    ): string {
        if ($paidAmount <= 0) {
            return 'UNPAID';
        }

        if ($balanceAmount <= 0) {
            return 'PAID';
        }

        return 'PARTIAL';
    }

    private function createInitialPayment(
        Sale $sale,
        array $validated,
        float $paidAmount
    ): void {
        if ($paidAmount <= 0) {
            return;
        }

        $sale->payments()->create([
            'payment_date' => $validated['sale_date'],
            'amount' => $paidAmount,
            'payment_mode' => $validated['payment_mode'] ?? 'Cash',
            'reference_no' => $validated['reference_no'] ?? null,
            'notes' => 'Initial invoice payment',
            'created_by' => auth()->id(),
        ]);
    }

    private function loadSale(Sale $sale): Sale
    {
        $sale->load([
            'customer',
            'service',
            'bankAccount',
            'items.product',
            'items.service',
            'items.serviceSpare',
            'payments',
            'creator',
            'updater',
        ]);

        $preferredTemplate = null;

        /*
         * Customer-specific template can be added later if the
         * existing Customer model contains that setting.
         */
        if (!$preferredTemplate) {
            $preferredTemplate = InvoiceTemplate::where('is_active', true)
                ->where('is_default', true)
                ->first();
        }

        $sale->setAttribute(
            'invoice_template',
            $preferredTemplate
        );

        return $sale;
    }
}