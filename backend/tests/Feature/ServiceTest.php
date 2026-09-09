<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Service;
use App\Models\Customer;
use App\Models\Asset;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ServiceTest extends TestCase
{
    use RefreshDatabase;

    private $customer;
    private $asset;
    private $product;
    private $user;

    protected function setUp(): void
    {
        parent::setUp();

        // Create test data
        $this->customer = Customer::create([
            'customer_code' => 'TEST001',
            'company_name' => 'Test Company',
            'contact_person' => 'John Doe',
            'mobile' => '9876543210',
            'email' => 'test@company.com',
            'address' => '123 Test St',
            'city' => 'Test City',
            'state' => 'Test State',
            'country' => 'India',
            'pincode' => '123456',
        ]);

        $this->asset = Asset::create([
            'customer_id' => $this->customer->id,
            'asset_code' => 'AST000001',
                'category' => 'Computer',
            'brand' => 'Dell',
            'model' => 'Inspiron 15',
            'serial_number' => 'SN123456',
            'status' => 'Working',
        ]);

        $this->product = Product::create([
            'product_code' => 'PROD001',
            'product_name' => 'SSD 512GB',
            'category' => 'Hardware',
            'purchase_price' => 2500,
            'selling_price' => 3000,
            'opening_stock' => 10,
            'current_stock' => 10,
            'gst_percentage' => 18,
        ]);

        $this->user = User::create([
            'name' => 'Tech Support',
            'email' => 'tech@company.com',
            'password' => bcrypt('password'),
        ]);

        $this->actingAs($this->user, 'sanctum');
    }

    /**
     * Test creating a new service
     */
    public function test_can_create_service()
    {
        $response = $this->postJson('/api/services', [
            'entry_date' => now()->toDateString(),
            'customer_id' => $this->customer->id,
            'contact_person' => 'John Doe',
            'phone' => '9876543210',
            'device_type' => 'Computer',
            'brand' => 'Dell',
            'model' => 'Inspiron 15',
            'serial_number' => 'SN123456',
            'customer_complaint' => 'Computer not booting',
            'expected_delivery_date' => now()->addDays(3)->toDateString(),
            'priority' => 'High',
            'service_type' => 'Chargeable Service',
            'accessories' => ['Power Adapter', 'Power Cable'],
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'id',
                    'service_number',
                    'entry_date',
                    'status',
                    'customer_id',
                ],
            ]);

        $this->assertDatabaseHas('services', [
            'customer_id' => $this->customer->id,
            'service_type' => 'Chargeable Service',
            'status' => 'Received',
        ]);
    }

    /**
     * Test service number generation is unique
     */
    public function test_service_number_is_unique()
    {
        $service1 = Service::create([
            'service_number' => 'SV000001',
            'entry_date' => now(),
            'customer_id' => $this->customer->id,
            'status' => 'Received',
        ]);

        $response = $this->postJson('/api/services', [
            'entry_date' => now()->toDateString(),
            'customer_id' => $this->customer->id,
            'device_type' => 'Computer',
            'customer_complaint' => 'Test complaint',
            'priority' => 'Medium',
            'service_type' => 'Chargeable Service',
        ]);

        $service2 = Service::find($response->json('data.id'));

        $this->assertNotEquals($service1->service_number, $service2->service_number);
    }

    /**
     * Test adding spare to service
     */
    public function test_can_add_spare_to_service()
    {
        $service = Service::create([
            'service_number' => 'SV000001',
            'entry_date' => now(),
            'customer_id' => $this->customer->id,
            'status' => 'Received',
        ]);

        $response = $this->postJson("/api/services/{$service->id}/spares", [
            'product_id' => $this->product->id,
            'quantity' => 1,
            'rate' => 3000,
            'gst_percent' => 18,
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'id',
                    'service_id',
                    'product_id',
                    'quantity',
                    'total_amount',
                ],
            ]);

        $this->assertDatabaseHas('service_spares', [
            'service_id' => $service->id,
            'product_id' => $this->product->id,
        ]);
    }

    /**
     * Test status change workflow
     */
    public function test_can_change_service_status()
    {
        $service = Service::create([
            'service_number' => 'SV000001',
            'entry_date' => now(),
            'customer_id' => $this->customer->id,
            'status' => 'Received',
        ]);

        $response = $this->postJson("/api/services/{$service->id}/change-status", [
            'status' => 'Inspection',
            'remarks' => 'Initial inspection started',
        ]);

        $response->assertStatus(200);

        $service->refresh();
        $this->assertEquals('Inspection', $service->status);
    }

    /**
     * Test status history is recorded
     */
    public function test_status_history_is_recorded()
    {
        $service = Service::create([
            'service_number' => 'SV000001',
            'entry_date' => now(),
            'customer_id' => $this->customer->id,
            'status' => 'Received',
        ]);

        $this->postJson("/api/services/{$service->id}/change-status", [
            'status' => 'Inspection',
        ]);

        $this->postJson("/api/services/{$service->id}/change-status", [
            'status' => 'In Service',
        ]);

        $response = $this->getJson("/api/services/{$service->id}/status-history");

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data'); // Received (initial), Inspection, In Service
    }

    /**
     * Test payment recording
     */
    public function test_can_record_payment()
    {
        $service = Service::create([
            'service_number' => 'SV000001',
            'entry_date' => now(),
            'customer_id' => $this->customer->id,
            'status' => 'Ready for Delivery',
            'grand_total' => 5000,
        ]);

        $response = $this->postJson("/api/services/{$service->id}/payment", [
            'payment_date' => now()->toDateString(),
            'amount' => 5000,
            'payment_mode' => 'Cash',
        ]);

        $response->assertStatus(201);

        $service->refresh();
        $this->assertEquals(5000, $service->paid_amount);
        $this->assertEquals('Paid', $service->payment_status);
    }

    /**
     * Test stock deduction on service status change
     */
    public function test_stock_deduction_on_service()
    {
        $service = Service::create([
            'service_number' => 'SV000001',
            'entry_date' => now(),
            'customer_id' => $this->customer->id,
            'status' => 'Approved',
        ]);

        // Add spare
        $this->postJson("/api/services/{$service->id}/spares", [
            'product_id' => $this->product->id,
            'quantity' => 2,
            'rate' => 3000,
            'gst_percent' => 18,
        ]);

        $initialStock = $this->product->current_stock;

        // Change status to In Service (should deduct stock)
        $this->postJson("/api/services/{$service->id}/change-status", [
            'status' => 'In Service',
        ]);

        $this->product->refresh();
        $this->assertEquals($initialStock - 2, $this->product->current_stock);
    }

    /**
     * Test stock reversal on service cancellation
     */
    public function test_stock_reversal_on_cancellation()
    {
        $service = Service::create([
            'service_number' => 'SV000001',
            'entry_date' => now(),
            'customer_id' => $this->customer->id,
            'status' => 'In Service',
        ]);

        // Add spare and deduct stock
        $spare = \App\Models\ServiceSpare::create([
            'service_id' => $service->id,
            'product_id' => $this->product->id,
            'quantity' => 2,
            'rate' => 3000,
            'taxable_amount' => 6000,
            'total_amount' => 7080,
            'stock_deducted' => true,
            'stock_deducted_at' => now(),
        ]);

        $this->product->current_stock = 8;
        $this->product->save();

        // Cancel service (should reverse stock)
        $this->postJson("/api/services/{$service->id}/change-status", [
            'status' => 'Cancelled',
        ]);

        $this->product->refresh();
        $this->assertEquals(10, $this->product->current_stock);
    }

    /**
     * Test service retrieval with relationships
     */
    public function test_can_retrieve_service_with_relations()
    {
        $service = Service::create([
            'service_number' => 'SV000001',
            'entry_date' => now(),
            'customer_id' => $this->customer->id,
            'status' => 'Received',
            'labour_charge' => 500,
            'gst_percent' => 18,
        ]);

        $response = $this->getJson("/api/services/{$service->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'id',
                    'service_number',
                    'customer',
                    'asset',
                    'spares',
                    'accessories',
                    'statusHistories',
                    'payments',
                ],
            ]);
    }

    /**
     * Test service list with filters
     */
    public function test_can_list_services_with_filters()
    {
        Service::create([
            'service_number' => 'SV000001',
            'entry_date' => now(),
            'customer_id' => $this->customer->id,
            'device_type' => 'Computer',
            'status' => 'Received',
        ]);

        $response = $this->getJson('/api/services?customer_id=' . $this->customer->id);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data',
                'meta',
            ]);
    }

    /**
     * Test grand total calculation
     */
    public function test_grand_total_calculation()
    {
        $service = Service::create([
            'service_number' => 'SV000001',
            'entry_date' => now(),
            'customer_id' => $this->customer->id,
            'status' => 'Received',
            'labour_charge' => 500,
            'spare_charge' => 2500,
            'other_charge' => 100,
            'discount_amount' => 100,
            'gst_percent' => 18,
        ]);

        $service->calculateGrandTotal();
        $service->save();

        $service->refresh();

        // (500 + 2500 + 100) - 100 = 3000 (taxable)
        // 3000 * 18% = 540 (gst)
        // 3000 + 540 = 3540 (grand total)
        $this->assertEquals(3000, $service->taxable_amount);
        $this->assertEquals(540, $service->gst_amount);
        $this->assertEquals(3540, $service->grand_total);
    }

    /**
     * Test cannot edit delivered service
     */
    public function test_cannot_edit_delivered_service()
    {
        $service = Service::create([
            'service_number' => 'SV000001',
            'entry_date' => now(),
            'customer_id' => $this->customer->id,
            'status' => 'Delivered',
        ]);

        $response = $this->putJson("/api/services/{$service->id}", [
            'contact_person' => 'New Contact',
        ]);

        $response->assertStatus(422);
    }

    /**
     * Test cannot add duplicate spare product
     */
    public function test_cannot_add_duplicate_spare()
    {
        $service = Service::create([
            'service_number' => 'SV000001',
            'entry_date' => now(),
            'customer_id' => $this->customer->id,
            'status' => 'Approved',
        ]);

        // Add first spare
        $this->postJson("/api/services/{$service->id}/spares", [
            'product_id' => $this->product->id,
            'quantity' => 1,
            'rate' => 3000,
            'gst_percent' => 18,
        ]);

        // Try to add same product again
        $response = $this->postJson("/api/services/{$service->id}/spares", [
            'product_id' => $this->product->id,
            'quantity' => 1,
            'rate' => 3000,
            'gst_percent' => 18,
        ]);

        $response->assertStatus(422);
    }
}
