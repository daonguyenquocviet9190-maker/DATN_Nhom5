<?php

namespace Tests\Feature;

use App\Http\Controllers\Api\Admin\AdminSimpleController;
use App\Models\User;
use App\Services\ShippingService;
use App\Services\VoucherService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Mockery;
use Tests\TestCase;

class AdminOrderFulfillmentTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_code');
            $table->string('status');
            $table->string('shipping_provider')->nullable();
            $table->string('tracking_code')->nullable();
            $table->string('ghn_status')->nullable();
            $table->string('payment_method')->default('cod');
            $table->string('payment_status')->default('unpaid');
            $table->decimal('grand_total', 14, 2)->default(350000);
            $table->decimal('cod_collected_amount', 14, 2)->nullable();
            $table->string('cod_collection_method')->nullable();
            $table->timestamp('cod_collected_at')->nullable();
            $table->unsignedBigInteger('cod_collected_by')->nullable();
            $table->text('cod_collection_note')->nullable();
            $table->timestamp('stock_deducted_at')->nullable();
            $table->timestamp('stock_restored_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();
        });

        Schema::create('order_status_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('order_id');
            $table->unsignedBigInteger('changed_by')->nullable();
            $table->string('from_status')->nullable();
            $table->string('to_status');
            $table->string('source')->nullable();
            $table->text('note')->nullable();
            $table->timestamps();
        });

        Schema::create('payment_transactions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('order_id');
            $table->string('provider');
            $table->string('transaction_ref')->unique();
            $table->decimal('amount', 14, 2);
            $table->string('status');
            $table->json('request_payload')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });

        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('stock')->default(0);
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('order_id');
            $table->unsignedBigInteger('product_id');
            $table->unsignedInteger('quantity');
        });
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_shop_staff_can_take_and_complete_a_confirmed_order(): void
    {
        $orderId = $this->confirmedOrder();
        $shipping = Mockery::mock(ShippingService::class);
        $shipping->shouldReceive('startDeliverySimulationIfIdle')->once()->with($orderId)->andReturn([]);
        $controller = new AdminSimpleController($shipping, new VoucherService());

        $dispatch = $controller->updateOrderStatus(
            $this->adminRequest(['status' => 'shipping', 'shipping_provider' => 'shop_staff']),
            $orderId,
        );

        $this->assertSame(200, $dispatch->getStatusCode());
        $this->assertDatabaseHas('orders', [
            'id' => $orderId,
            'status' => 'shipping',
            'shipping_provider' => 'shop_staff',
        ]);

        $missingCollection = $controller->updateOrderStatus(
            $this->adminRequest(['status' => 'completed']),
            $orderId,
        );
        $this->assertSame(422, $missingCollection->getStatusCode());
        $this->assertStringContainsString('khách hàng đã nhận hàng', mb_strtolower((string) $missingCollection->getContent()));
        $this->assertDatabaseHas('orders', [
            'id' => $orderId,
            'status' => 'shipping',
            'payment_status' => 'unpaid',
        ]);

        $wrongAmount = $controller->updateOrderStatus(
            $this->adminRequest([
                'status' => 'completed',
                'customer_received' => true,
                'payment_collected' => true,
                'collected_amount' => 300000,
                'collection_method' => 'cash',
            ]),
            $orderId,
        );
        $this->assertSame(422, $wrongAmount->getStatusCode());

        $complete = $controller->updateOrderStatus(
            $this->adminRequest([
                'status' => 'completed',
                'customer_received' => true,
                'payment_collected' => true,
                'collected_amount' => 350000,
                'collection_method' => 'cash',
                'collection_note' => 'Khách đã nhận và kiểm tra hàng.',
            ]),
            $orderId,
        );

        $this->assertSame(200, $complete->getStatusCode());
        $this->assertDatabaseHas('orders', [
            'id' => $orderId,
            'status' => 'completed',
            'payment_status' => 'paid',
            'cod_collected_amount' => 350000,
            'cod_collection_method' => 'cash',
            'cod_collected_by' => 99,
            'cod_collection_note' => 'Khách đã nhận và kiểm tra hàng.',
        ]);
        $this->assertNotNull(DB::table('orders')->where('id', $orderId)->value('cod_collected_at'));
        $this->assertDatabaseHas('payment_transactions', [
            'order_id' => $orderId,
            'provider' => 'shop_staff_cod',
            'transaction_ref' => 'SHOPCOD-' . $orderId,
            'amount' => 350000,
            'status' => 'paid',
        ]);
        $this->assertDatabaseCount('order_status_histories', 2);
        $completionHistory = DB::table('order_status_histories')
            ->where('order_id', $orderId)
            ->where('to_status', 'completed')
            ->first();
        $this->assertSame(99, (int) $completionHistory->changed_by);
        $this->assertStringContainsString('Khách hàng đã nhận hàng', (string) $completionHistory->note);
        $this->assertStringContainsString('350.000đ', (string) $completionHistory->note);
    }

    public function test_ghn_order_waits_for_carrier_pickup_after_waybill_creation(): void
    {
        $orderId = $this->confirmedOrder();
        $shipping = Mockery::mock(ShippingService::class);
        $shipping->shouldReceive('createOrderForOrder')->once()->with($orderId)->andReturn([
            'order_code' => 'GHN-TEST-001',
            'status' => 'ready_to_pick',
        ]);
        $shipping->shouldReceive('startDeliverySimulationIfIdle')->once()->with($orderId)->andReturn([]);
        $controller = new AdminSimpleController($shipping, new VoucherService());

        $response = $controller->updateOrderStatus(
            $this->adminRequest(['status' => 'shipping', 'shipping_provider' => 'ghn']),
            $orderId,
        );

        $this->assertSame(200, $response->getStatusCode());
        $this->assertDatabaseHas('orders', [
            'id' => $orderId,
            'status' => 'confirmed',
            'shipping_provider' => 'ghn',
            'tracking_code' => 'GHN-TEST-001',
        ]);
        $this->assertDatabaseCount('order_status_histories', 0);
    }

    public function test_cancelling_an_awaiting_ghn_order_cancels_the_waybill_too(): void
    {
        $orderId = $this->confirmedOrder();
        DB::table('orders')->where('id', $orderId)->update([
            'tracking_code' => 'GHN-CANCEL-001',
            'ghn_status' => 'ready_to_pick',
        ]);

        $shipping = Mockery::mock(ShippingService::class);
        $shipping->shouldReceive('cancelShipment')->once()->with('GHN-CANCEL-001')->andReturn(true);
        $controller = new AdminSimpleController($shipping, new VoucherService());

        $response = $controller->updateOrderStatus(
            $this->adminRequest(['status' => 'cancelled']),
            $orderId,
        );

        $this->assertSame(200, $response->getStatusCode());
        $this->assertDatabaseHas('orders', [
            'id' => $orderId,
            'status' => 'cancelled',
            'ghn_status' => 'cancel',
        ]);
    }

    public function test_cancelling_an_order_restores_reserved_stock_once(): void
    {
        $orderId = $this->confirmedOrder();
        DB::table('orders')->where('id', $orderId)->update(['stock_deducted_at' => now()]);
        DB::table('products')->insert(['id' => 20, 'stock' => 8]);
        DB::table('order_items')->insert([
            'order_id' => $orderId,
            'product_id' => 20,
            'quantity' => 2,
        ]);

        $shipping = Mockery::mock(ShippingService::class);
        $controller = new AdminSimpleController($shipping, new VoucherService());
        $response = $controller->updateOrderStatus(
            $this->adminRequest(['status' => 'cancelled']),
            $orderId,
        );

        $this->assertSame(200, $response->getStatusCode());
        $this->assertDatabaseHas('products', ['id' => 20, 'stock' => 10]);
        $this->assertNotNull(DB::table('orders')->where('id', $orderId)->value('stock_restored_at'));

        $second = $controller->updateOrderStatus(
            $this->adminRequest(['status' => 'cancelled']),
            $orderId,
        );
        $this->assertSame(200, $second->getStatusCode());
        $this->assertDatabaseHas('products', ['id' => 20, 'stock' => 10]);
    }

    private function confirmedOrder(): int
    {
        return DB::table('orders')->insertGetId([
            'order_code' => 'DNV-' . uniqid(),
            'status' => 'confirmed',
            'shipping_provider' => 'ghn',
            'tracking_code' => null,
            'payment_method' => 'cod',
            'payment_status' => 'unpaid',
            'grand_total' => 350000,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function adminRequest(array $payload): Request
    {
        $request = Request::create('/api/admin/orders/status', 'PATCH', $payload);
        $admin = new User();
        $admin->forceFill(['id' => 99, 'role' => 'admin']);
        $request->setUserResolver(fn () => $admin);

        return $request;
    }
}
