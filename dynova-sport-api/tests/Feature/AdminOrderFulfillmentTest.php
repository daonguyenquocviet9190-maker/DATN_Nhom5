<?php

namespace Tests\Feature;

use App\Http\Controllers\Api\Admin\AdminSimpleController;
use App\Models\User;
use App\Services\ShippingService;
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
        $controller = new AdminSimpleController($shipping);

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

        $complete = $controller->updateOrderStatus(
            $this->adminRequest(['status' => 'completed']),
            $orderId,
        );

        $this->assertSame(200, $complete->getStatusCode());
        $this->assertDatabaseHas('orders', [
            'id' => $orderId,
            'status' => 'completed',
            'payment_status' => 'paid',
        ]);
        $this->assertDatabaseCount('order_status_histories', 2);
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
        $controller = new AdminSimpleController($shipping);

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
        $controller = new AdminSimpleController($shipping);

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

    private function confirmedOrder(): int
    {
        return DB::table('orders')->insertGetId([
            'order_code' => 'DNV-' . uniqid(),
            'status' => 'confirmed',
            'shipping_provider' => 'ghn',
            'tracking_code' => null,
            'payment_method' => 'cod',
            'payment_status' => 'unpaid',
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
