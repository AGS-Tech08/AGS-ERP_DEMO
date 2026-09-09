<?php

namespace App\Http\Controllers;

use App\Models\Purchase;
use App\Models\VendorPayment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VendorPaymentController extends Controller
{
    /**
     * List vendor payments
     */
    public function index(Request $request)
    {
        $query = VendorPayment::with([
            'purchase:id,purchase_code,grand_total',
            'vendor:id,vendor_code,company_name',
        ])->latest('payment_date');

        if ($request->filled('vendor_id')) {
            $query->where('vendor_id', $request->vendor_id);
        }

        if ($request->filled('purchase_id')) {
            $query->where('purchase_id', $request->purchase_id);
        }

        return response()->json(
            $query->get()
        );
    }

    /**
     * Store vendor payment
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'purchase_id' => [
                'required',
                'integer',
                'exists:purchases,id',
            ],

            'payment_date' => [
                'required',
                'date',
            ],

            'amount' => [
                'required',
                'numeric',
                'min:0.01',
            ],

            'payment_mode' => [
                'required',
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

        try {
            $payment = DB::transaction(function () use ($validated) {

                $purchase = Purchase::lockForUpdate()
                    ->findOrFail(
                        $validated['purchase_id']
                    );

                $alreadyPaid = (float) $purchase->paid_amount;

                $grandTotal = (float) $purchase->grand_total;

                $balance = $grandTotal - $alreadyPaid;

                if ($balance <= 0) {
                    abort(
                        422,
                        'This purchase is already fully paid.'
                    );
                }

                $paymentAmount = (float) $validated['amount'];

                if ($paymentAmount > $balance) {
                    abort(
                        422,
                        'Payment amount cannot be greater than the outstanding balance.'
                    );
                }

                $newPaidAmount =
                    $alreadyPaid + $paymentAmount;

                $newBalance =
                    $grandTotal - $newPaidAmount;

                if ($newBalance <= 0) {
                    $paymentStatus = 'PAID';
                    $newBalance = 0;
                } elseif ($newPaidAmount > 0) {
                    $paymentStatus = 'PARTIAL';
                } else {
                    $paymentStatus = 'UNPAID';
                }

                $payment = VendorPayment::create([
                    'purchase_id' => $purchase->id,
                    'vendor_id' => $purchase->vendor_id,
                    'payment_date' => $validated['payment_date'],
                    'amount' => $paymentAmount,
                    'payment_mode' => $validated['payment_mode'],
                    'reference_no' => $validated['reference_no'] ?? null,
                    'notes' => $validated['notes'] ?? null,
                    'created_by' => auth()->id(),
                ]);

                $purchase->update([
                    'paid_amount' => $newPaidAmount,
                    'balance_amount' => $newBalance,
                    'payment_status' => $paymentStatus,
                ]);

                return $payment;
            });

            return response()->json([
                'message' => 'Vendor payment saved successfully.',
                'payment' => $payment->load([
                    'purchase',
                    'vendor',
                ]),
            ], 201);

        } catch (\Illuminate\Http\Exceptions\HttpResponseException $e) {
            throw $e;

        } catch (\Throwable $e) {

            return response()->json([
                'message' => 'Unable to save vendor payment.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Show single payment
     */
    public function show(VendorPayment $vendorPayment)
    {
        return response()->json(
            $vendorPayment->load([
                'purchase',
                'vendor',
                'creator',
            ])
        );
    }

    /**
     * Delete payment
     *
     * When a payment is deleted,
     * purchase paid/balance/status are recalculated.
     */
    public function destroy(VendorPayment $vendorPayment)
    {
        try {
            DB::transaction(function () use ($vendorPayment) {

                $purchase = Purchase::lockForUpdate()
                    ->findOrFail(
                        $vendorPayment->purchase_id
                    );

                $paymentAmount =
                    (float) $vendorPayment->amount;

                $currentPaid =
                    (float) $purchase->paid_amount;

                $newPaidAmount =
                    max(
                        0,
                        $currentPaid - $paymentAmount
                    );

                $grandTotal =
                    (float) $purchase->grand_total;

                $newBalance =
                    max(
                        0,
                        $grandTotal - $newPaidAmount
                    );

                if ($newPaidAmount <= 0) {
                    $paymentStatus = 'UNPAID';
                } elseif ($newBalance <= 0) {
                    $paymentStatus = 'PAID';
                    $newBalance = 0;
                } else {
                    $paymentStatus = 'PARTIAL';
                }

                $vendorPayment->delete();

                $purchase->update([
                    'paid_amount' => $newPaidAmount,
                    'balance_amount' => $newBalance,
                    'payment_status' => $paymentStatus,
                ]);
            });

            return response()->json([
                'message' => 'Vendor payment deleted successfully.',
            ]);

        } catch (\Throwable $e) {

            return response()->json([
                'message' => 'Unable to delete vendor payment.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}