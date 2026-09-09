<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Service extends Model
{
    use SoftDeletes;

    protected static function booted(): void
    {
        static::created(function (Service $service) {
            ServiceStatusHistory::create([
                'service_id' => $service->id,
                'old_status' => null,
                'new_status' => $service->status,
                'changed_by' => $service->created_by,
            ]);
        });
    }

    protected $table = 'services';

    protected $fillable = [
        'service_number',
        'entry_date',
        'expected_delivery_date',
        'actual_delivery_date',
        'customer_id',
        'contact_person',
        'phone',
        'asset_id',
        'device_type',
        'brand',
        'model',
        'serial_number',
        'amc_id',
        'customer_complaint',
        'technician_diagnosis',
        'work_done',
        'final_remarks',
        'assigned_technician_id',
        'service_engineer',
        'technician_remarks',
        'labour_charge',
        'spare_charge',
        'other_charge',
        'discount_amount',
        'taxable_amount',
        'gst_percent',
        'gst_amount',
        'grand_total',
        'paid_amount',
        'balance_amount',
        'payment_status',
        'status',
        'priority',
        'delivered_to',
        'delivered_by',
        'customer_acknowledgement',
        'service_type',
        'remarks',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'entry_date' => 'datetime',
        'expected_delivery_date' => 'date',
        'actual_delivery_date' => 'date',
        'labour_charge' => 'decimal:2',
        'spare_charge' => 'decimal:2',
        'other_charge' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'taxable_amount' => 'decimal:2',
        'gst_percent' => 'decimal:2',
        'gst_amount' => 'decimal:2',
        'grand_total' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'balance_amount' => 'decimal:2',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function asset()
    {
        return $this->belongsTo(Asset::class);
    }

    public function amc()
    {
        return $this->belongsTo(Amc::class);
    }

    public function assignedTechnician()
    {
        return $this->belongsTo(User::class, 'assigned_technician_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function accessories()
    {
        return $this->hasMany(ServiceAccessory::class);
    }

    public function spares()
    {
        return $this->hasMany(ServiceSpare::class);
    }

    public function statusHistories()
    {
        return $this->hasMany(ServiceStatusHistory::class)->orderBy('changed_at');
    }

    public function payments()
    {
        return $this->hasMany(ServicePayment::class);
    }

    /**
     * Calculate grand total from components
     */
    public function calculateGrandTotal()
    {
        $subtotal = ($this->labour_charge ?? 0)
            + ($this->spare_charge ?? 0)
            + ($this->other_charge ?? 0);

        $this->taxable_amount = $subtotal - ($this->discount_amount ?? 0);

        if ($this->taxable_amount < 0) {
            $this->taxable_amount = 0;
        }

        $this->gst_amount = ($this->taxable_amount * ($this->gst_percent ?? 0)) / 100;
        $this->grand_total = $this->taxable_amount + $this->gst_amount;
        $this->balance_amount = $this->grand_total - ($this->paid_amount ?? 0);
    }
}
