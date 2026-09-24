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
}

