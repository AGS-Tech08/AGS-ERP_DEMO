<?php

namespace App\Http\Controllers;

use App\Models\Amc;
use App\Models\Asset;
use Illuminate\Http\Request;

class AssetController extends Controller
{
    public function index(Request $request)
    {
        $query = Asset::with([
            'customer:id,company_name,contact_person,mobile,email,city,state',
            'amc:id,amc_number,start_date,end_date,status',
        ])->latest('id');

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->filled('amc_id')) {
            $query->where('amc_id', $request->amc_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('asset_code', 'like', "%{$search}%")
                    ->orWhere('device_name', 'like', "%{$search}%")
                    ->orWhere('device_type', 'like', "%{$search}%")
                    ->orWhere('serial_number', 'like', "%{$search}%")
                    ->orWhere('brand', 'like', "%{$search}%");
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
            'amc_id' => ['nullable', 'integer', 'exists:amcs,id'],
            'device_name' => ['required', 'string', 'max:255'],
            'device_type' => ['required', 'string', 'max:100'],
            'category' => ['nullable', 'string', 'max:120'],
            'brand' => ['nullable', 'string', 'max:120'],
            'model' => ['nullable', 'string', 'max:120'],
            'serial_number' => ['nullable', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:255'],
            'department' => ['nullable', 'string', 'max:255'],
            'assigned_user' => ['nullable', 'string', 'max:255'],
            'manufacturer' => ['nullable', 'string', 'max:255'],
            'purchase_date' => ['nullable', 'date'],
            'vendor' => ['nullable', 'string', 'max:255'],
            'warranty_start' => ['nullable', 'date'],
            'warranty_end' => ['nullable', 'date'],
            'status' => ['nullable', 'string', 'max:80'],
            'remarks' => ['nullable', 'string'],
            'processor' => ['nullable', 'string', 'max:255'],
            'motherboard' => ['nullable', 'string', 'max:255'],
            'ram' => ['nullable', 'string', 'max:255'],
            'ram_type' => ['nullable', 'string', 'max:255'],
            'storage_type' => ['nullable', 'string', 'max:255'],
            'storage_capacity' => ['nullable', 'string', 'max:255'],
            'gpu' => ['nullable', 'string', 'max:255'],
            'monitor' => ['nullable', 'string', 'max:255'],
            'keyboard' => ['nullable', 'string', 'max:255'],
            'mouse' => ['nullable', 'string', 'max:255'],
            'os' => ['nullable', 'string', 'max:255'],
            'os_version' => ['nullable', 'string', 'max:255'],
            'os_edition' => ['nullable', 'string', 'max:255'],
            'os_build' => ['nullable', 'string', 'max:255'],
            'license_info' => ['nullable', 'string', 'max:255'],
            'hostname' => ['nullable', 'string', 'max:255'],
            'ip_address' => ['nullable', 'string', 'max:255'],
            'mac_address' => ['nullable', 'string', 'max:255'],
            'dhcp_static' => ['nullable', 'string', 'max:50'],
            'vlan' => ['nullable', 'string', 'max:100'],
            'gateway' => ['nullable', 'string', 'max:255'],
            'dns' => ['nullable', 'string', 'max:255'],
            'domain_workgroup' => ['nullable', 'string', 'max:255'],
            'antivirus' => ['nullable', 'string', 'max:255'],
            'firewall' => ['nullable', 'string', 'max:255'],
            'backup_configured' => ['nullable', 'boolean'],
            'encryption' => ['nullable', 'string', 'max:255'],
            'policies_applied' => ['nullable', 'string', 'max:255'],
            'gpo_domain_info' => ['nullable', 'string', 'max:255'],
            'other_configuration' => ['nullable', 'string'],
            'printer_type' => ['nullable', 'string', 'max:255'],
            'connection_type' => ['nullable', 'string', 'max:255'],
            'printer_location' => ['nullable', 'string', 'max:255'],
            'firmware_version' => ['nullable', 'string', 'max:255'],
            'management_ip' => ['nullable', 'string', 'max:255'],
            'configuration_notes' => ['nullable', 'string'],
            'cctv_type' => ['nullable', 'string', 'max:255'],
            'camera_resolution' => ['nullable', 'string', 'max:255'],
            'recording_capacity' => ['nullable', 'string', 'max:255'],
            'power_backup' => ['nullable', 'string', 'max:255'],
            'security_notes' => ['nullable', 'string'],
        ]);

        $validated['asset_code'] = $this->generateAssetCode();
        $validated['status'] = $validated['status'] ?? 'Working';

        $asset = Asset::create($validated);

        if (!empty($validated['amc_id'])) {
            $amc = Amc::findOrFail($validated['amc_id']);
            $amc->amcAssets()->create([
                'asset_id' => $asset->id,
                'status' => 'Active',
                'notes' => 'Created from asset module',
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Asset created successfully.',
            'data' => $asset->load(['customer', 'amc']),
        ], 201);
    }

    public function show(Asset $asset)
    {
        return response()->json([
            'success' => true,
            'data' => $asset->load([
                'customer',
                'amc',
                'assetServiceRecords',
                'amcServiceRecords',
                'amcAssociations.amc',
            ]),
        ]);
    }

    public function update(Request $request, Asset $asset)
    {
        $validated = $request->validate([
            'customer_id' => ['nullable', 'integer', 'exists:customers,id'],
            'amc_id' => ['nullable', 'integer', 'exists:amcs,id'],
            'device_name' => ['nullable', 'string', 'max:255'],
            'device_type' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'string', 'max:120'],
            'brand' => ['nullable', 'string', 'max:120'],
            'model' => ['nullable', 'string', 'max:120'],
            'serial_number' => ['nullable', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:255'],
            'department' => ['nullable', 'string', 'max:255'],
            'assigned_user' => ['nullable', 'string', 'max:255'],
            'manufacturer' => ['nullable', 'string', 'max:255'],
            'purchase_date' => ['nullable', 'date'],
            'vendor' => ['nullable', 'string', 'max:255'],
            'warranty_start' => ['nullable', 'date'],
            'warranty_end' => ['nullable', 'date'],
            'status' => ['nullable', 'string', 'max:80'],
            'remarks' => ['nullable', 'string'],
            'processor' => ['nullable', 'string', 'max:255'],
            'motherboard' => ['nullable', 'string', 'max:255'],
            'ram' => ['nullable', 'string', 'max:255'],
            'ram_type' => ['nullable', 'string', 'max:255'],
            'storage_type' => ['nullable', 'string', 'max:255'],
            'storage_capacity' => ['nullable', 'string', 'max:255'],
            'gpu' => ['nullable', 'string', 'max:255'],
            'monitor' => ['nullable', 'string', 'max:255'],
            'keyboard' => ['nullable', 'string', 'max:255'],
            'mouse' => ['nullable', 'string', 'max:255'],
            'os' => ['nullable', 'string', 'max:255'],
            'os_version' => ['nullable', 'string', 'max:255'],
            'os_edition' => ['nullable', 'string', 'max:255'],
            'os_build' => ['nullable', 'string', 'max:255'],
            'license_info' => ['nullable', 'string', 'max:255'],
            'hostname' => ['nullable', 'string', 'max:255'],
            'ip_address' => ['nullable', 'string', 'max:255'],
            'mac_address' => ['nullable', 'string', 'max:255'],
            'dhcp_static' => ['nullable', 'string', 'max:50'],
            'vlan' => ['nullable', 'string', 'max:100'],
            'gateway' => ['nullable', 'string', 'max:255'],
            'dns' => ['nullable', 'string', 'max:255'],
            'domain_workgroup' => ['nullable', 'string', 'max:255'],
            'antivirus' => ['nullable', 'string', 'max:255'],
            'firewall' => ['nullable', 'string', 'max:255'],
            'backup_configured' => ['nullable', 'boolean'],
            'encryption' => ['nullable', 'string', 'max:255'],
            'policies_applied' => ['nullable', 'string', 'max:255'],
            'gpo_domain_info' => ['nullable', 'string', 'max:255'],
            'other_configuration' => ['nullable', 'string'],
            'printer_type' => ['nullable', 'string', 'max:255'],
            'connection_type' => ['nullable', 'string', 'max:255'],
            'printer_location' => ['nullable', 'string', 'max:255'],
            'firmware_version' => ['nullable', 'string', 'max:255'],
            'management_ip' => ['nullable', 'string', 'max:255'],
            'configuration_notes' => ['nullable', 'string'],
            'cctv_type' => ['nullable', 'string', 'max:255'],
            'camera_resolution' => ['nullable', 'string', 'max:255'],
            'recording_capacity' => ['nullable', 'string', 'max:255'],
            'power_backup' => ['nullable', 'string', 'max:255'],
            'security_notes' => ['nullable', 'string'],
        ]);

        $asset->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Asset updated successfully.',
            'data' => $asset->fresh()->load(['customer', 'amc']),
        ]);
    }

    public function destroy(Asset $asset)
    {
        $asset->delete();

        return response()->json([
            'success' => true,
            'message' => 'Asset deleted successfully.',
        ]);
    }

    public function addServiceRecord(Request $request, Asset $asset)
    {
        $validated = $request->validate([
            'service_date' => ['required', 'date'],
            'complaint' => ['required', 'string'],
            'work_done' => ['nullable', 'string'],
            'engineer' => ['nullable', 'string', 'max:255'],
            'parts_replaced' => ['nullable', 'string'],
            'service_cost' => ['nullable', 'numeric', 'min:0'],
            'remarks' => ['nullable', 'string'],
            'status' => ['nullable', 'in:Open,In Progress,Closed'],
        ]);

        $record = $asset->assetServiceRecords()->create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Asset service record added.',
            'data' => $record,
        ], 201);
    }

    protected function generateAssetCode(): string
    {
        $last = Asset::withTrashed()->latest('id')->first();

        $number = 1;

        if ($last && !empty($last->asset_code)) {
            $digits = preg_replace('/\D+/', '', $last->asset_code);
            $number = $digits ? ((int) $digits + 1) : 1;
        }

        return 'AST' . str_pad((string) $number, 6, '0', STR_PAD_LEFT);
    }
}
