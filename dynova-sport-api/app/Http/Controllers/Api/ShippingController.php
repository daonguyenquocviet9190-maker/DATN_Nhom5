<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ShippingService;
use Illuminate\Http\Request;
use RuntimeException;

class ShippingController extends Controller
{
    public function __construct(private ShippingService $shipping) {}

    public function status()
    {
        return response()->json([
            'success' => true,
            'data' => $this->shipping->configurationStatus(),
        ]);
    }

    public function fee(Request $request)
    {
        $validated = $request->validate([
            'province' => ['required', 'string', 'max:120'],
            'provinceCode' => ['required'],
            // district là dữ liệu tương thích nội bộ GHN, không còn hiển thị trên UI.
            'district' => ['nullable', 'string', 'max:120'],
            'districtCode' => ['required', 'integer'],
            'ward' => ['required', 'string', 'max:120'],
            'wardCode' => ['required', 'string', 'max:40'],
            'address' => ['required', 'string', 'max:500'],
            'weight' => ['nullable', 'integer', 'min:1', 'max:30000'],
            'value' => ['required', 'numeric', 'min:0'],
        ]);

        try {
            $result = $this->shipping->calculate(
                $validated,
                (float) $validated['value'],
                (int) ($validated['weight'] ?? config('services.ghn.default_item_weight', 300))
            );

            return response()->json([
                'success' => true,
                'message' => $result['free_shipping']
                    ? 'Đơn hàng được miễn phí vận chuyển.'
                    : 'Đã tính phí vận chuyển GHN.',
                'fee' => $result['fee'],
                'data' => $result,
            ]);
        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 503);
        }
    }

    public function provinces()
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $this->shipping->provinces(),
            ]);
        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => [],
            ], 503);
        }
    }

    /**
     * Tương thích API cũ: vẫn cho phép lấy district nếu màn admin hoặc
     * endpoint khác còn dùng. Checkout mới không gọi endpoint này.
     */
    public function districts(Request $request)
    {
        $validated = $request->validate([
            'province_id' => ['required', 'integer'],
        ]);

        try {
            return response()->json([
                'success' => true,
                'data' => $this->shipping->districts((int) $validated['province_id']),
            ]);
        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => [],
            ], 503);
        }
    }

    /**
     * Checkout 2 cấp: nhận province_id, backend tự gom toàn bộ ward của
     * các district thuộc province và đính kèm DistrictID ẩn cho GHN.
     *
     * GET /api/shipping/wards?province_id=...
     * GET /api/shipping/wards?district_id=... vẫn được giữ cho tương thích cũ.
     */
    public function wards(Request $request)
    {
        $validated = $request->validate([
            'province_id' => ['nullable', 'integer'],
            'district_id' => ['nullable', 'integer'],
        ]);

        if (!empty($validated['province_id'])) {
            try {
                $provinceId = (int) $validated['province_id'];
                $districts = $this->shipping->districts($provinceId);
                $result = [];

                foreach ($districts as $district) {
                    $districtId = (int) ($district['DistrictID'] ?? $district['DistrictId'] ?? $district['id'] ?? 0);
                    if ($districtId <= 0) {
                        continue;
                    }

                    $districtName = (string) ($district['DistrictName'] ?? $district['District_Name'] ?? $district['name'] ?? '');
                    $wards = $this->shipping->wards($districtId);

                    foreach ($wards as $ward) {
                        $result[] = array_merge(
                            $ward,
                            [
                                'DistrictID' => $districtId,
                                'DistrictName' => $districtName,
                                'ProvinceID' => $provinceId,
                            ]
                        );
                    }
                }

                return response()->json([
                    'success' => true,
                    'data' => $result,
                ]);
            } catch (RuntimeException $e) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage(),
                    'data' => [],
                ], 503);
            }
        }

        $request->validate([
            'district_id' => ['required', 'integer'],
        ]);

        try {
            return response()->json([
                'success' => true,
                'data' => $this->shipping->wards((int) $validated['district_id']),
            ]);
        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => [],
            ], 503);
        }
    }

    public function services(Request $request)
    {
        $validated = $request->validate([
            'district_id' => ['required', 'integer'],
        ]);

        try {
            return response()->json([
                'success' => true,
                'data' => $this->shipping->availableServices((int) $validated['district_id']),
            ]);
        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => [],
            ], 503);
        }
    }

    public function webhook(Request $request, string $secret)
    {
        $configuredSecret = (string) config('services.ghn.webhook_secret');
        if ($configuredSecret === '' || !hash_equals($configuredSecret, $secret)) {
            return response()->json([
                'success' => false,
                'message' => 'Webhook không hợp lệ.',
            ], 403);
        }

        $result = $this->shipping->handleWebhook($request->all());

        return response()->json([
            'success' => true,
            'message' => 'OK',
            'data' => $result,
        ]);
    }
}
