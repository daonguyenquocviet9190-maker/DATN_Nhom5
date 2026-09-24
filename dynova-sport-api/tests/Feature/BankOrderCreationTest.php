<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\ShippingService;
use App\Services\VietQrPaymentService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Mockery;
use Tests\TestCase;

class BankOrderCreationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->decimal('price', 14, 2);
            $table->unsignedInteger('stock');
            $table->string('status')->default('active');
            $table->string('image')->nullable();
        });

        Schema::create('product_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id');
            $table->decimal('price', 14, 2)->nullable();
            $table->decimal('discount_price', 14, 2)->nullable();
            $table->unsignedInteger('stock')->default(0);
            $table->boolean('is_active')->default(true);
        });

        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('order_code');
            $table->string('customer_name');
            $table->string('customer_email')->nullable();
            $table->string('customer_phone');
            $table->string('shipping_address');
            $table->string('province');
            $table->string('province_code')->nullable();
            $table->string('district');
            $table->string('district_code')->nullable();
            $table->string('ward');
            $table->string('ward_code')->nullable();
            $table->string('shipping_provider')->nullable();
            $table->unsignedInteger('shipping_weight_grams')->nullable();
            $table->unsignedInteger('ghn_service_id')->nullable();
            $table->unsignedInteger('ghn_service_type_id')->nullable();
            $table->decimal('ghn_carrier_fee', 14, 2)->default(0);
            $table->string('payment_method');
            $table->string('payment_status');
            $table->string('status');
            $table->decimal('subtotal', 14, 2);
            $table->decimal('discount_amount', 14, 2)->default(0);
            $table->decimal('shipping_fee', 14, 2)->default(0);
            $table->decimal('grand_total', 14, 2);
            $table->timestamps();
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id');
            $table->foreignId('product_id');
            $table->unsignedBigInteger('product_variant_id')->nullable();
            $table->string('product_name');
            $table->unsignedInteger('quantity');
            $table->decimal('price', 14, 2);
            $table->decimal('line_total', 14, 2);
            $table->timestamps();
        });

        Schema::create('payment_transactions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('order_id');
            $table->string('provider')->nullable();
            $table->string('transaction_ref')->nullable();
            $table->decimal('amount', 14, 2)->default(0);
            $table->string('status')->default('pending');
            $table->string('provider_transaction_no')->nullable();
            $table->text('request_payload')->nullable();
            $table->text('response_payload')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });

        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('bank_name')->nullable();
            $table->string('bank_code')->nullable();
            $table->string('bank_account_number')->nullable();
            $table->string('bank_account_name')->nullable();
            $table->string('bank_branch')->nullable();
            $table->timestamps();
        });
    }

    public function test_bank_order_remains_pending_until_admin_confirmation_after_qr_scan(): void
    {
        config()->set('services.sepay.environment', 'test');
        putenv('SEPAY_TEST_SCAN_QR=true');
        putenv('SEPAY_WEBHOOK_ALLOW_NO_AUTH=true');

        DB::table('settings')->insert([
            'bank_name' => 'Vietcombank',
            'bank_code' => 'VCB',
            'bank_account_number' => '1234567890',
            'bank_account_name' => 'CÔNG TY DYNOVA SPORT',
            'bank_branch' => 'Chi nhánh Hà Nội',
        ]);

        $order = DB::table('orders')->insertGetId([
            'user_id' => 4,
            'order_code' => 'DNVTEST123',
            'customer_name' => 'Nguyễn Văn A',
            'customer_email' => 'a@example.com',
            'customer_phone' => '0937781823',
            'shipping_address' => 'C2/1 Ấp 3',
            'province' => 'Hồ Chí Minh',
            'district' => 'Huyện Bình Chánh',
            'ward' => 'Xã Vĩnh Lộc B',
            'payment_method' => 'bank',
            'payment_status' => 'unpaid',
            'status' => 'pending',
            'subtotal' => 1000000,
            'discount_amount' => 0,
            'shipping_fee' => 25000,
            'grand_total' => 1025000,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $paymentCode = 'DNV' . str_pad((string) $order, 7, '0', STR_PAD_LEFT);
        DB::table('payment_transactions')->insert([
            'order_id' => $order,
            'provider' => 'sepay_test',
            'transaction_ref' => $paymentCode,
            'amount' => 1025000,
            'status' => 'pending',
            'request_payload' => json_encode(['payment_code' => $paymentCode], JSON_UNESCAPED_UNICODE),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $service = new VietQrPaymentService();
        $result = $service->handleWebhook([
            'transferType' => 'in',
            'transferAmount' => 1025000,
            'code' => $paymentCode,
            'content' => $paymentCode,
            'id' => 'TXN-123456',
        ]);

        $this->assertTrue($result['processed'] ?? false);
        $this->assertSame('paid', DB::table('orders')->where('id', $order)->value('payment_status'));
        $this->assertSame('pending', DB::table('orders')->where('id', $order)->value('status'));
    }

    public function test_bank_order_uses_database_enum_values_and_server_shipping_quote(): void
    {
        DB::table('products')->insert([
            'id' => 1,
            'name' => 'Giày chạy bộ',
            'price' => 1000000,
            'stock' => 5,
            'status' => 'active',
        ]);

        $shipping = Mockery::mock(ShippingService::class);
        $shipping->shouldReceive('calculate')
            ->once()
            ->andReturn([
                'fee' => 25000,
                'carrier_fee' => 25000,
                'service_id' => 53320,
                'service_type_id' => 2,
            ]);
        $this->app->instance(ShippingService::class, $shipping);

        $user = new User();
        $user->id = 4;
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/orders', [
            'customer' => [
                'fullName' => 'Nguyễn Văn A',
                'email' => 'a@example.com',
                'phone' => '0937781823',
            ],
            'shippingAddress' => [
                'province' => 'Hồ Chí Minh',
                'provinceCode' => 202,
                'district' => 'Huyện Bình Chánh',
                'districtCode' => 1442,
                'ward' => 'Xã Vĩnh Lộc B',
                'wardCode' => '21012',
                'address' => 'C2/1 Ấp 3',
            ],
            'items' => [[
                'product_id' => 1,
                'quantity' => 2,
            ]],
            'paymentMethod' => 'BANK',
            'subtotal' => 1,
            'discount' => 999999,
            'shippingFee' => 1,
            'total' => 1,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.payment_method', 'bank')
            ->assertJsonPath('data.payment_status', 'unpaid')
            ->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseHas('orders', [
            'user_id' => 4,
            'payment_method' => 'bank',
            'payment_status' => 'unpaid',
            'status' => 'pending',
            'subtotal' => 2000000,
            'shipping_fee' => 25000,
            'grand_total' => 2025000,
            'district_code' => '1442',
            'ward_code' => '21012',
        ]);
        $this->assertDatabaseHas('products', [
            'id' => 1,
            'stock' => 3,
        ]);
    }
}
