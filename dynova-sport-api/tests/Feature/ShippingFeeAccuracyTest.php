<?php

namespace Tests\Feature;

use App\Services\ShippingService;
use Mockery;
use RuntimeException;
use Tests\TestCase;

class ShippingFeeAccuracyTest extends TestCase
{
    public function test_checkout_does_not_use_an_inaccurate_default_fee_when_ghn_is_unavailable(): void
    {
        $shipping = Mockery::mock(ShippingService::class);
        $shipping->shouldReceive('calculate')
            ->once()
            ->andThrow(new RuntimeException('GHN is unavailable'));
        $this->app->instance(ShippingService::class, $shipping);

        $response = $this->postJson('/api/shipping/fee', [
            'province' => 'HÃ  Ná»™i',
            'provinceCode' => '1',
            'district' => 'Quáº­n HoÃ n Kiáº¿m',
            'districtCode' => '1',
            'ward' => 'PhÆ°á»ng HÃ ng Báº¡c',
            'wardCode' => '1',
            'address' => '1 HÃ ng Báº¡c',
            'weight' => 500,
            'value' => 300000,
        ]);

        $response->assertStatus(503)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'GHN is unavailable')
            ->assertJsonPath('data', null);
    }

    public function test_checkout_rejects_zero_fee_when_backend_has_not_enforced_free_shipping(): void
    {
        $shipping = Mockery::mock(ShippingService::class);
        $shipping->shouldReceive('calculate')
            ->once()
            ->andReturn([
                'fee' => 0,
                'carrier_fee' => 0,
                'provider' => 'ghn',
                'free_shipping' => false,
                'service_id' => 53320,
                'service_type_id' => 2,
                'service_name' => 'GHN',
                'raw' => ['total' => 0],
            ]);
        $this->app->instance(ShippingService::class, $shipping);

        $response = $this->postJson('/api/shipping/fee', [
            'province' => 'Hà Nội',
            'provinceCode' => '1',
            'district' => 'Quận Hoàn Kiếm',
            'districtCode' => '1',
            'ward' => 'Phường Hàng Bạc',
            'wardCode' => '1',
            'address' => '1 Hàng Bạc',
            'weight' => 500,
            'value' => 300000,
        ]);

        $response->assertStatus(503)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'GHN trả về phí vận chuyển 0 nhưng chưa xác nhận miễn phí vận chuyển.');
    }
}

