<?php

namespace App\Http\Controllers;

use App\Models\Amc;
use App\Models\Asset;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AmcController extends Controller
{
    public function index(Request $request)
    {
        $query = Amc::with(['customer:id,company_name,contact_person,mobile,email,address,city,state,gst_number'])
            ->latest('start_date');

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('amc_number', 'like', "%{$search}%")
                    ->orWhere('status', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($customerQuery) use ($search) {
                        $customerQuery->where('company_name', 'like', "%{$search}%")
                            ->orWhere('contact_person', 'like', "%{$search}%");
                    });
            });
        }

        return response()->json([
            'success' => true,
            'data' => $query->paginate($request->integer('per_page', 15)),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => ['required', 'integer', 'exists:customers,id'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'agreement_value' => ['nullable', 'numeric', 'min:0'],
            'gst' => ['nullable', 'numeric', 'min:0'],
            'total_cost' => ['nullable', 'numeric', 'min:0'],
            'payment_terms' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'in:Draft,Active,Expired,Cancelled'],
            'notes' => ['nullable', 'string'],
            'agreement_document' => ['nullable', 'string', 'max:255'],
        ]);

        $validated['amc_number'] = $this->generateAmcNumber();
        $validated['status'] = $validated['status'] ?? 'Draft';

        $amc = Amc::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'AMC created successfully.',
            'data' => $amc->load('customer'),
        ], 201);
    }

    public function show(Amc $amc)
    {
        return response()->json([
            'success' => true,
            'data' => $amc->load([
                'customer',
                'assets.customer',
                'amcAssets.asset',
                'serviceRecords.asset',
            ]),
        ]);
    }

    public function update(Request $request, Amc $amc)
    {
        $validated = $request->validate([
            'customer_id' => ['nullable', 'integer', 'exists:customers,id'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'agreement_value' => ['nullable', 'numeric', 'min:0'],
            'gst' => ['nullable', 'numeric', 'min:0'],
            'total_cost' => ['nullable', 'numeric', 'min:0'],
            'payment_terms' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'in:Draft,Active,Expired,Cancelled'],
            'notes' => ['nullable', 'string'],
            'agreement_document' => ['nullable', 'string', 'max:255'],
        ]);

        $amc->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'AMC updated successfully.',
            'data' => $amc->fresh()->load('customer'),
        ]);
    }

    public function destroy(Amc $amc)
    {
        $amc->delete();

        return response()->json([
            'success' => true,
            'message' => 'AMC deleted successfully.',
        ]);
    }

    public function attachAsset(Request $request, Amc $amc)
    {
        $validated = $request->validate([
            'asset_id' => ['required', 'integer', 'exists:assets,id'],
            'notes' => ['nullable', 'string'],
            'status' => ['nullable', 'in:Active,Inactive'],
        ]);

        $asset = Asset::findOrFail($validated['asset_id']);

        if ($asset->customer_id && $asset->customer_id != $amc->customer_id) {
            return response()->json([
                'message' => 'This asset belongs to a different customer and cannot be attached to this AMC.',
            ], 422);
        }

        $existing = $amc->amcAssets()->where('asset_id', $asset->id)->exists();

        if ($existing) {
            return response()->json([
                'message' => 'This asset is already attached to the AMC.',
            ], 409);
        }

        $amc->amcAssets()->create([
            'asset_id' => $asset->id,
            'status' => $validated['status'] ?? 'Active',
            'notes' => $validated['notes'] ?? null,
        ]);

        $asset->update([
            'customer_id' => $amc->customer_id,
            'amc_id' => $amc->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Asset attached to AMC.',
            'data' => $amc->load('amcAssets.asset'),
        ]);
    }

    public function detachAsset(Amc $amc, Asset $asset)
    {
        $amc->amcAssets()->where('asset_id', $asset->id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Asset detached from AMC.',
        ]);
    }

    public function addServiceRecord(Request $request, Amc $amc)
    {
        $validated = $request->validate([
            'asset_id' => ['nullable', 'integer', 'exists:assets,id'],
            'service_date' => ['required', 'date'],
            'complaint' => ['required', 'string'],
            'work_done' => ['nullable', 'string'],
            'engineer' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'in:Open,In Progress,Closed'],
            'remarks' => ['nullable', 'string'],
        ]);

        $record = $amc->serviceRecords()->create($validated);

        return response()->json([
            'success' => true,
            'message' => 'AMC service record added.',
            'data' => $record->load('asset'),
        ], 201);
    }

    protected function generateAmcNumber(): string
    {
        $last = Amc::withTrashed()->latest('id')->first();

        $number = 1;

        if ($last && !empty($last->amc_number)) {
            $digits = preg_replace('/\D+/', '', $last->amc_number);
            $number = $digits ? ((int) $digits + 1) : 1;
        }

        return 'AMC' . str_pad((string) $number, 6, '0', STR_PAD_LEFT);
    }
}
