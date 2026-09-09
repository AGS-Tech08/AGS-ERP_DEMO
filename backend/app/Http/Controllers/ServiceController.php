<?php

namespace App\Http\Controllers;

use App\Models\Service;
use App\Models\ServiceSpare;
use App\Models\ServiceAccessory;
use App\Models\ServiceStatusHistory;
use App\Models\ServicePayment;
use App\Models\Customer;
use App\Models\Asset;
use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ServiceController extends Controller
{
    /**
     * List services with filters and search
     */
    public function index(Request $request)
    {
        $query = Service::with([
            'customer:id,customer_code,company_name,mobile',
            'asset:id,asset_code,device_type,brand,model',
            'assignedTechnician:id,name',
            'spares.product:id,product_code,product_name',
        ])->latest('entry_date');

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->filled('device_type')) {
            $query->where('device_type', $request->device_type);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('assigned_technician_id')) {
            $query->where('assigned_technician_id', $request->assigned_technician_id);
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('service_number', 'like', "%{$search}%")
                    ->orWhere('serial_number', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($customerQuery) use ($search) {
                        $customerQuery
                            ->where('company_name', 'like', "%{$search}%")
                            ->orWhere('customer_code', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('entry_date_from')) {
            $query->whereDate('entry_date', '>=', $request->entry_date_from);
        }

        if ($request->filled('entry_date_to')) {
            $query->whereDate('entry_date', '<=', $request->entry_date_to);
        }

        $services = $query->paginate($request->integer('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $services->items(),
            'meta' => [
                'current_page' => $services->currentPage(),
                'from' => $services->firstItem(),
                'last_page' => $services->lastPage(),
                'per_page' => $services->perPage(),
                'to' => $services->lastItem(),
                'total' => $services->total(),
            ],
        ]);
    }

    /**
     * Generate next service number
     */
    private function generateServiceNumber()
    {
        $lastNewService = Service::withTrashed()
            ->where('service_number', 'like', 'SERV%')
            ->orderByDesc('id')
            ->first();

        $nextNumber = $lastNewService
            ? ((int) substr($lastNewService->service_number, 4)) + 1
            : 1;

        return 'SERV' . str_pad((string) $nextNumber, 3, '0', STR_PAD_LEFT);
    }

    /**
     * Create new service
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'entry_date' => ['required', 'date'],
            'customer_id' => ['required', 'integer', 'exists:customers,id'],
            'contact_person' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'asset_id' => ['nullable', 'integer', 'exists:assets,id'],
            'device_type' => ['nullable', 'string'],
            'brand' => ['nullable', 'string', 'max:255'],
            'model' => ['nullable', 'string', 'max:255'],
            'serial_number' => ['nullable', 'string', 'max:255'],
            'amc_id' => ['nullable', 'integer', 'exists:amcs,id'],
            'customer_complaint' => ['nullable', 'string'],
            'technician_diagnosis' => ['nullable', 'string'],
            'work_done' => ['nullable', 'string'],
            'final_remarks' => ['nullable', 'string'],
            'assigned_technician_id' => ['nullable', 'integer', 'exists:users,id'],
            'service_engineer' => ['nullable', 'string', 'max:255'],
            'technician_remarks' => ['nullable', 'string'],
            'labour_charge' => ['nullable', 'numeric', 'min:0'],
            'other_charge' => ['nullable', 'numeric', 'min:0'],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
            'gst_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'priority' => ['required', 'in:Low,Medium,High,Urgent'],
            'expected_delivery_date' => ['nullable', 'date'],
            'service_type' => ['required', 'in:AMC Service,Chargeable Service'],
            'remarks' => ['nullable', 'string'],
            'accessories' => ['nullable', 'array'],
            'accessories.*' => ['string', 'in:Power Adapter,Power Cable,Remote,Mouse,Keyboard,HDD,Bag,Other'],
        ]);

        return DB::transaction(function () use ($validated, $request) {
            // Generate unique service number
            $service = Service::create([
                ...$validated,
                'service_number' => $this->generateServiceNumber(),
                'status' => 'Received',
                'payment_status' => 'Unpaid',
                'created_by' => auth()->id(),
            ]);

            // Calculate charges
            $service->calculateGrandTotal();
            $service->save();

            // Add accessories if provided
            if (!empty($validated['accessories'])) {
                foreach ($validated['accessories'] as $accessory) {
                    ServiceAccessory::create([
                        'service_id' => $service->id,
                        'accessory' => $accessory,
                    ]);
                }
            }

            // Add spares if provided
            if ($request->filled('spares')) {
                foreach ($request->spares as $spare) {
                    $this->addServiceSpare($service, $spare);
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Service created successfully.',
                'data' => $service->load(['customer', 'asset', 'spares.product']),
            ], 201);
        });
    }

    /**
     * Show service detail
     */
    public function show(Service $service)
    {
        $service->load([
            'customer',
            'asset',
            'amc',
            'assignedTechnician',
            'spares.product',
            'accessories',
            'statusHistories.changedBy',
            'payments',
        ]);

        $data = $service->toArray();
        $data['statusHistories'] = $service->statusHistories;

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Update service
     */
    public function update(Request $request, Service $service)
    {
        // Don't allow editing if delivered or closed
        if (in_array($service->status, ['Delivered', 'Closed'])) {
            abort(422, 'Cannot edit service that is delivered or closed.');
        }

        $validated = $request->validate([
            'contact_person' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'asset_id' => ['nullable', 'integer', 'exists:assets,id'],
            'device_type' => ['nullable', 'string'],
            'brand' => ['nullable', 'string', 'max:255'],
            'model' => ['nullable', 'string', 'max:255'],
            'serial_number' => ['nullable', 'string', 'max:255'],
            'customer_complaint' => ['nullable', 'string'],
            'technician_diagnosis' => ['nullable', 'string'],
            'work_done' => ['nullable', 'string'],
            'final_remarks' => ['nullable', 'string'],
            'assigned_technician_id' => ['nullable', 'integer', 'exists:users,id'],
            'service_engineer' => ['nullable', 'string', 'max:255'],
            'technician_remarks' => ['nullable', 'string'],
            'labour_charge' => ['nullable', 'numeric', 'min:0'],
            'other_charge' => ['nullable', 'numeric', 'min:0'],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
            'gst_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'priority' => ['nullable', 'in:Low,Medium,High,Urgent'],
            'expected_delivery_date' => ['nullable', 'date'],
            'remarks' => ['nullable', 'string'],
        ]);

        $service->update($validated);
        $service->calculateGrandTotal();
        $service->save();
        $service->updated_by = auth()->id();
        $service->save();

        return response()->json([
            'success' => true,
            'message' => 'Service updated successfully.',
            'data' => $service,
        ]);
    }

    /**
     * Delete service
     */
    public function destroy(Service $service)
    {
        if (in_array($service->status, ['Delivered', 'Closed'])) {
            abort(422, 'Cannot delete service that is delivered or closed.');
        }

        // Reverse stock if any items were deducted
        $this->reverseStockForService($service);

        $service->delete();

        return response()->json([
            'success' => true,
            'message' => 'Service deleted successfully.',
        ]);
    }

    /**
     * Change service status
     */
    public function changeStatus(Request $request, Service $service)
    {
        $validated = $request->validate([
            'status' => ['required', 'in:Received,Inspection,Waiting for Approval,Approved,In Service,Waiting for Spare,Testing,Ready for Delivery,Delivered,Closed,Cancelled'],
            'remarks' => ['nullable', 'string'],
        ]);

        return DB::transaction(function () use ($service, $validated) {
            $oldStatus = $service->status;
            $newStatus = $validated['status'];

            // Record status change
            ServiceStatusHistory::create([
                'service_id' => $service->id,
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
                'remarks' => $validated['remarks'] ?? null,
                'changed_by' => auth()->id(),
            ]);

            $service->status = $newStatus;

            // If transitioning to Delivered, capture delivery info
            if ($newStatus === 'Delivered' && $oldStatus !== 'Delivered') {
                $service->actual_delivery_date = now()->toDateString();
            }

            // If cancelling, reverse stock
            if ($newStatus === 'Cancelled') {
                $this->reverseStockForService($service);
            }

            // If transitioning to In Service or similar, deduct stock
            if ($newStatus === 'In Service' && $oldStatus !== 'In Service') {
                $this->deductStockForService($service);
            }

            $service->save();

            return response()->json([
                'success' => true,
                'message' => 'Service status updated successfully.',
                'data' => $service,
            ]);
        });
    }

    /**
     * Add service spare/material
     */
    public function addSpare(Request $request, Service $service)
    {
        $validated = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'quantity' => ['required', 'numeric', 'min:0.001'],
            'rate' => ['required', 'numeric', 'min:0'],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
            'gst_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        // Check if product already exists in spares
        $existing = ServiceSpare::where('service_id', $service->id)
            ->where('product_id', $validated['product_id'])
            ->first();

        if ($existing) {
            abort(422, 'This product is already added to this service.');
        }

        return DB::transaction(function () use ($service, $validated) {
            $spare = new ServiceSpare([
                'service_id' => $service->id,
                ...$validated,
                'created_by' => auth()->id(),
            ]);

            $spare->calculateTotal();
            $spare->save();

            // Recalculate service totals
            $this->recalculateServiceTotals($service);

            return response()->json([
                'success' => true,
                'message' => 'Spare added successfully.',
                'data' => $spare->load('product'),
            ], 201);
        });
    }

    /**
     * Update service spare
     */
    public function updateSpare(Request $request, Service $service, ServiceSpare $spare)
    {
        $validated = $request->validate([
            'quantity' => ['required', 'numeric', 'min:0.001'],
            'rate' => ['required', 'numeric', 'min:0'],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
            'gst_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        $spare->update($validated);
        $spare->calculateTotal();
        $spare->save();

        // Recalculate service totals
        $this->recalculateServiceTotals($service);

        return response()->json([
            'success' => true,
            'message' => 'Spare updated successfully.',
            'data' => $spare,
        ]);
    }

    /**
     * Remove service spare
     */
    public function removeSpare(Request $request, Service $service, ServiceSpare $spare)
    {
        // If stock was already deducted, reverse it
        if ($spare->stock_deducted) {
            $product = $spare->product;
            $product->current_stock = bcadd($product->current_stock, $spare->quantity, 3);
            $product->save();
        }

        $spare->delete();

        // Recalculate service totals
        $this->recalculateServiceTotals($service);

        return response()->json([
            'success' => true,
            'message' => 'Spare removed successfully.',
        ]);
    }

    /**
     * Record service payment
     */
    public function recordPayment(Request $request, Service $service)
    {
        $validated = $request->validate([
            'payment_date' => ['required', 'date'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'payment_mode' => ['required', 'in:Cash,Cheque,Bank Transfer,Card,UPI,Other'],
            'reference_no' => ['nullable', 'string', 'max:255'],
            'remarks' => ['nullable', 'string'],
        ]);

        // Check if payment would exceed grand total
        $totalPayments = ServicePayment::where('service_id', $service->id)->sum('amount');

        if (bcadd($totalPayments, $validated['amount'], 2) > $service->grand_total) {
            abort(422, 'Payment amount exceeds service total.');
        }

        return DB::transaction(function () use ($service, $validated) {
            $payment = ServicePayment::create([
                'service_id' => $service->id,
                ...$validated,
                'received_by' => auth()->id(),
            ]);

            // Update service payment status
            $totalPaid = ServicePayment::where('service_id', $service->id)->sum('amount');
            $service->paid_amount = $totalPaid;
            $service->balance_amount = $service->grand_total - $totalPaid;

            if ($totalPaid >= $service->grand_total) {
                $service->payment_status = 'Paid';
            } elseif ($totalPaid > 0) {
                $service->payment_status = 'Partially Paid';
            } else {
                $service->payment_status = 'Unpaid';
            }

            $service->save();

            return response()->json([
                'success' => true,
                'message' => 'Payment recorded successfully.',
                'data' => $payment,
            ], 201);
        });
    }

    /**
     * Mark service as delivered
     */
    public function deliver(Request $request, Service $service)
    {
        $validated = $request->validate([
            'delivered_to' => ['required', 'string', 'max:255'],
            'delivered_by' => ['required', 'string', 'max:255'],
            'customer_acknowledgement' => ['nullable', 'string'],
        ]);

        $service->update([
            ...$validated,
            'actual_delivery_date' => now()->toDateString(),
            'status' => 'Delivered',
        ]);

        ServiceStatusHistory::create([
            'service_id' => $service->id,
            'old_status' => $service->status,
            'new_status' => 'Delivered',
            'changed_by' => auth()->id(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Service marked as delivered.',
            'data' => $service,
        ]);
    }

    /**
     * Get service status history
     */
    public function statusHistory(Service $service)
    {
        $history = $service->statusHistories()
            ->with('changedBy:id,name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $history,
        ]);
    }

    /**
     * Recalculate service totals
     */
    private function recalculateServiceTotals(Service $service)
    {
        $spareCharge = ServiceSpare::where('service_id', $service->id)->sum('total_amount');

        $service->spare_charge = $spareCharge;
        $service->calculateGrandTotal();
        $service->save();
    }

    /**
     * Deduct stock for service
     */
    private function deductStockForService(Service $service)
    {
        $spares = ServiceSpare::where('service_id', $service->id)
            ->where('stock_deducted', false)
            ->get();

        foreach ($spares as $spare) {
            $product = $spare->product;

            // Check if sufficient stock
            if ($product->current_stock < $spare->quantity) {
                abort(422, "Insufficient stock for product: {$product->product_name}");
            }

            // Deduct stock
            $product->current_stock = bcsub($product->current_stock, $spare->quantity, 3);
            $product->save();

            // Mark spare as stock deducted
            $spare->stock_deducted = true;
            $spare->stock_deducted_at = now();
            $spare->save();
        }
    }

    /**
     * Reverse stock for service
     */
    private function reverseStockForService(Service $service)
    {
        $spares = ServiceSpare::where('service_id', $service->id)
            ->where('stock_deducted', true)
            ->get();

        foreach ($spares as $spare) {
            $product = $spare->product;

            // Restore stock
            $product->current_stock = bcadd($product->current_stock, $spare->quantity, 3);
            $product->save();

            // Mark spare as not deducted
            $spare->stock_deducted = false;
            $spare->stock_deducted_at = null;
            $spare->save();
        }
    }

    /**
     * Add service spare (used internally)
     */
    private function addServiceSpare(Service $service, $spare)
    {
        $spareData = ServiceSpare::create([
            'service_id' => $service->id,
            'product_id' => $spare['product_id'],
            'quantity' => $spare['quantity'],
            'rate' => $spare['rate'],
            'discount_amount' => $spare['discount_amount'] ?? 0,
            'gst_percent' => $spare['gst_percent'] ?? 0,
            'created_by' => auth()->id(),
        ]);

        $spareData->calculateTotal();
        $spareData->save();
    }
}
