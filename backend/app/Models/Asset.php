<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Asset extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'customer_id',
        'amc_id',
        'asset_code',
        'device_name',
        'device_type',
        'category',
        'brand',
        'model',
        'serial_number',
        'location',
        'department',
        'assigned_user',
        'manufacturer',
        'purchase_date',
        'vendor',
        'warranty_start',
        'warranty_end',
        'status',
        'remarks',
        'processor',
        'motherboard',
        'ram',
        'ram_type',
        'storage_type',
        'storage_capacity',
        'gpu',
        'monitor',
        'keyboard',
        'mouse',
        'os',
        'os_version',
        'os_edition',
        'os_build',
        'license_info',
        'hostname',
        'ip_address',
        'mac_address',
        'dhcp_static',
        'vlan',
        'gateway',
        'dns',
        'domain_workgroup',
        'antivirus',
        'firewall',
        'backup_configured',
        'encryption',
        'policies_applied',
        'gpo_domain_info',
        'other_configuration',
        'printer_type',
        'connection_type',
        'printer_location',
        'firmware_version',
        'management_ip',
        'configuration_notes',
        'cctv_type',
        'camera_resolution',
        'recording_capacity',
        'power_backup',
        'security_notes',
    ];

    protected $casts = [
        'purchase_date' => 'date',
        'warranty_start' => 'date',
        'warranty_end' => 'date',
        'backup_configured' => 'boolean',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function amc()
    {
        return $this->belongsTo(Amc::class);
    }

    public function amcAssociations()
    {
        return $this->hasMany(AmcAsset::class);
    }

    public function assetServiceRecords()
    {
        return $this->hasMany(AssetServiceRecord::class);
    }

    public function amcServiceRecords()
    {
        return $this->hasMany(AmcServiceRecord::class);
    }

    public function services()
    {
        return $this->hasMany(Service::class);
    }
}
