<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ShippingController extends Controller
{
    private const FREESHIP_THRESHOLD = 500000; // Freeship từ 500.000 đ

    public function fee(Request $request)
    {
        $validated = $request->validate([
            'province' => ['required', 'string'],
            'district' => ['required', 'string'],
            'ward'     => ['nullable', 'string'],
            'address'  => ['required', 'string'],
            'weight'   => ['nullable', 'numeric'],
            'value'    => ['nullable', 'numeric'],
        ]);

        $value = (float) ($validated['value'] ?? 0);
        $weight = (float) ($validated['weight'] ?? 500);

        // 1. Kiểm tra Freeship nội bộ
        if ($value >= self::FREESHIP_THRESHOLD) {
            return response()->json([
                'success' => true,
                'message' => 'Đơn hàng từ 500.000 đ trở lên được MIỄN PHÍ vận chuyển!',
                'fee'     => 0,
                'data'    => ['fee' => 0, 'provider' => 'PROMOTION_FREESHIP'],
            ]);
        }

        $token = config('services.ghtk.token');
        $partnerCode = config('services.ghtk.partner_code');
        $baseUrl = rtrim(config('services.ghtk.base_url', 'https://services.giaohangtietkiem.vn'), '/');

        // 2. Không có token -> Dùng phí mặc định
        if (!$token) {
            $fallbackFee = $this->fallbackFee($value, $weight);
            return response()->json([
                'success' => true,
                'message' => 'Áp dụng phí giao hàng tiêu chuẩn.',
                'fee'     => $fallbackFee,
                'data'    => ['fee' => $fallbackFee, 'provider' => 'FALLBACK'],
            ]);
        }

        // 3. Gọi API GHTK
        try {
            $queryParams = [
                'pick_province' => config('services.ghtk.pick_province', 'Hồ Chí Minh'),
                'pick_district' => config('services.ghtk.pick_district', 'Thủ Đức'),
                'province'      => $validated['province'],
                'district'      => $validated['district'],
                'address'       => $validated['address'],
                'weight'        => $weight,
                'value'         => $value,
                'deliver_option' => 'none',
            ];

            if (!empty($validated['ward'])) {
                $queryParams['ward'] = $validated['ward'];
            }

            $response = Http::withHeaders([
                'Token'           => $token,
                'X-Client-Source' => $partnerCode,
            ])->timeout(8)->get("{$baseUrl}/services/shipment/fee", $queryParams);

            if ($response->successful()) {
                $data = $response->json();
                if (data_get($data, 'success') === true) {
                    $fee = (int) data_get($data, 'fee.fee', data_get($data, 'fee', 30000));
                    return response()->json([
                        'success' => true,
                        'message' => 'Tính phí vận chuyển thành công qua GHTK.',
                        'fee'     => $fee,
                        'data'    => ['fee' => $fee, 'provider' => 'GHTK', 'raw' => $data],
                    ]);
                }
            }
        } catch (\Exception $e) {
            Log::error('GHTK Exception: ' . $e->getMessage());
        }

        // 4. Nếu API lỗi -> Dùng phí mặc định
        $fallbackFee = $this->fallbackFee($value, $weight);
        return response()->json([
            'success' => true,
            'message' => 'Áp dụng phí giao hàng tiêu chuẩn.',
            'fee'     => $fallbackFee,
            'data'    => ['fee' => $fallbackFee, 'provider' => 'FALLBACK'],
        ]);
    }

    private function fallbackFee(float $value, float $weight): int
    {
        if ($value >= self::FREESHIP_THRESHOLD) return 0;
        if ($weight <= 500) return 25000;
        if ($weight <= 1500) return 35000;
        if ($weight <= 3000) return 45000;
        return 45000 + (int)(ceil(($weight - 3000) / 500) * 5000);
    }
}