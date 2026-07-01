<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ShippingController extends Controller
{
    public function fee(Request $request)
    {
        $validated = $request->validate([
            'province' => ['required', 'string'],
            'district' => ['required', 'string'],
            'ward' => ['nullable', 'string'],
            'address' => ['required', 'string'],
            'weight' => ['nullable', 'numeric'],
            'value' => ['nullable', 'numeric'],
        ]);

        $token = config('services.ghtk.token');
        $partnerCode = config('services.ghtk.partner_code');

        if (!$token) {
            $fallbackFee = $this->fallbackFee(
                (float) ($validated['value'] ?? 0),
                (float) ($validated['weight'] ?? 500)
            );

            return response()->json([
                'success' => true,
                'message' => 'Chưa có token GHTK, đang dùng phí demo.',
                'data' => [
                    'fee' => $fallbackFee,
                    'provider' => 'DEMO',
                ],
            ]);
        }

        $response = Http::withHeaders([
            'Token' => $token,
            'X-Client-Source' => $partnerCode,
        ])->get(config('services.ghtk.base_url') . '/services/shipment/fee', [
            'pick_province' => config('services.ghtk.pick_province'),
            'pick_district' => config('services.ghtk.pick_district'),
            'province' => $validated['province'],
            'district' => $validated['district'],
            'address' => $validated['address'],
            'weight' => $validated['weight'] ?? 500,
            'value' => $validated['value'] ?? 0,
            'deliver_option' => 'none',
        ]);

        if (!$response->successful()) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể tính phí GHTK.',
                'data' => [
                    'fee' => $this->fallbackFee(
                        (float) ($validated['value'] ?? 0),
                        (float) ($validated['weight'] ?? 500)
                    ),
                    'provider' => 'DEMO',
                ],
            ], 200);
        }

        $data = $response->json();
        $fee = data_get($data, 'fee.fee', data_get($data, 'fee', 30000));

        return response()->json([
            'success' => true,
            'message' => 'Tính phí vận chuyển thành công.',
            'data' => [
                'fee' => (int) $fee,
                'provider' => 'GHTK',
                'raw' => $data,
            ],
        ]);
    }

    private function fallbackFee(float $value, float $weight): int
    {
        if ($value >= 799000) {
            return 0;
        }

        if ($weight <= 500) {
            return 25000;
        }

        if ($weight <= 1500) {
            return 35000;
        }

        return 45000;
    }
}