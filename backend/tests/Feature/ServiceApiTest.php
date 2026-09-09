<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Service;
use App\Models\Customer;
use App\Models\Asset;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ServiceApiTest extends TestCase
{
    use RefreshDatabase;

    private $customer;
    private $asset;
    private $product;
    private $user;

    protected function setUp(): void
    {
        parent::setUp();

        // Create or find test data using firstOrCreate to avoid conflicts
        $this->customer = Customer::firstOrCreate(
            ['customer_code' => 'TEST_SERVICE_001'],
            [
                'company_name' => 'Service Test Company',
                'contact_person' => 'John Doe',
                'mobile' => '9876543210',
                'email' => 'service-test@company.com',
                'address' => '123 Test St',
                'city' => 'Test City',
                'state' => 'Test State',
                'country' => 'India',
                'pincode' => '123456',
            ]
        );

        $this->asset = Asset::firstOrCreate(
            ['asset_code' => 'SERVICE_AST001'],
            [
                'customer_id' => $this->customer->id,
                    'category' => 'Computer',
                'brand' => 'Dell',
                'model' => 'Inspiron 15',
                'serial_number' => 'SN123456',
                'status' => 'Working',
            ]
        );

        $this->product = Product::firstOrCreate(
            ['product_code' => 'SERVICE_PROD001'],
            [
                'product_name' => 'SSD 512GB',
                'category' => 'Hardware',
                'purchase_price' => 2500,
                'selling_price' => 3000,
                'opening_stock' => 50,
                'current_stock' => 50,
                'gst_percentage' => 18,
            ]
        );

        $this->user = User::firstOrCreate(
            ['email' => 'tech-support@company.com'],
            [
                'name' => 'Tech Support User',
                'password' => bcrypt('password'),
            ]
        );

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
     * Test retrieving service with relationships
     */
    public function test_can_retrieve_service_with_relations()
    {
        $service = Service::whereCustomerId($this->customer->id)->first();
        
        if (!$service) {
            $service = Service::create([
                'service_number' => 'SV' . str_pad(Service::max('id') + 1, 6, '0', STR_PAD_LEFT),
                'entry_date' => now(),
                'customer_id' => $this->customer->id,
                'status' => 'Received',
                'labour_charge' => 500,
                'gst_percent' => 18,
            ]);
        }

        $response = $this->getJson("/api/services/{$service->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'id',
                    'service_number',
                    'customer',
                    'spares',
                    'accessories',
                    'statusHistories',
                    'payments',
                ],
            ]);
    }

    /**
     * Test service list endpoint
     */
    public function test_can_list_services()
    {
        $response = $this->getJson('/api/services?per_page=5');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data',
                'meta',
            ]);
    }

    /**
     * Test service filtering by customer
     */
    public function test_can_filter_services_by_customer()
    {
        $response = $this->getJson('/api/services?customer_id=' . $this->customer->id);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data',
                'meta',
            ]);
    }

    /**
     * Test service filtering by status
     */
    public function test_can_filter_services_by_status()
    {
        $response = $this->getJson('/api/services?status=Received&per_page=5');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data',
                'meta',
            ]);
    }

    /**
     * Test service search by service number
     */
    public function test_can_search_services()
    {
        $response = $this->getJson('/api/services?search=SV');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data',
                'meta',
            ]);
    }

    /**
     * Test adding spare to service
     */
    public function test_can_add_spare_to_service()
    {
        $service = Service::whereCustomerId($this->customer->id)->first();
        
        if (!$service) {
            $service = Service::create([
                'service_number' => 'SV' . str_pad(Service::max('id') + 1, 6, '0', STR_PAD_LEFT),
                'entry_date' => now(),
                'customer_id' => $this->customer->id,
                'status' => 'Received',
            ]);
        }

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
    }

    /**
     * Test status change
     */
    public function test_can_change_service_status()
    {
        $service = Service::whereCustomerId($this->customer->id)->first();
        
        if (!$service) {
            $service = Service::create([
                'service_number' => 'SV' . str_pad(Service::max('id') + 1, 6, '0', STR_PAD_LEFT),
                'entry_date' => now(),
                'customer_id' => $this->customer->id,
                'status' => 'Received',
            ]);
        }

        $response = $this->postJson("/api/services/{$service->id}/change-status", [
            'status' => 'Inspection',
            'remarks' => 'Initial inspection started',
        ]);

        $response->assertStatus(200);

        $service->refresh();
        $this->assertEquals('Inspection', $service->status);
    }

    /**
     * Test recording payment
     */
    public function test_can_record_payment()
    {
        $service = Service::whereCustomerId($this->customer->id)->first();
        
        if (!$service) {
            $service = Service::create([
                'service_number' => 'SV' . str_pad(Service::max('id') + 1, 6, '0', STR_PAD_LEFT),
                'entry_date' => now(),
                'customer_id' => $this->customer->id,
                'status' => 'Ready for Delivery',
                'grand_total' => 5000,
            ]);
        }

        $response = $this->postJson("/api/services/{$service->id}/payment", [
            'payment_date' => now()->toDateString(),
            'amount' => 2500,
            'payment_mode' => 'Cash',
        ]);

        $response->assertStatus(201);

        $service->refresh();
        $this->assertEquals(2500, $service->paid_amount);
    }

    /**
     * Test status history retrieval
     */
    public function test_can_get_status_history()
    {
        $service = Service::whereCustomerId($this->customer->id)->first();
        
        if (!$service) {
            $service = Service::create([
                'service_number' => 'SV' . str_pad(Service::max('id') + 1, 6, '0', STR_PAD_LEFT),
                'entry_date' => now(),
                'customer_id' => $this->customer->id,
                'status' => 'Received',
            ]);
        }

        $response = $this->getJson("/api/services/{$service->id}/status-history");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data',
            ]);
    }

    /**
     * Test unauthenticated access is denied
     */
    public function test_unauthenticated_user_cannot_access_services()
    {
        $this->app['auth']->forgetGuards();
        
        $response = $this->getJson('/api/services');

        $response->assertStatus(401);
    }
}
