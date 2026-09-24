<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ShippingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
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
            'district' => ['nullable', 'string', 'max:120'],
            'districtCode' => ['required', 'integer'],
            'ward' => ['required', 'string', 'max:120'],
            'wardCode' => ['required', 'string', 'max:40'],
            'address' => ['required', 'string', 'max:500'],
            'weight' => ['nullable', 'integer', 'min:1', 'max:30000'],
            'value' => ['required', 'numeric', 'min:0'],
            'items' => ['nullable', 'array'],
            'items.*.product_id' => ['nullable', 'integer'],
            'items.*.productId' => ['nullable', 'integer'],
            'items.*.id' => ['nullable', 'integer'],
            'items.*.product_variant_id' => ['nullable', 'integer'],
            'items.*.variant_id' => ['nullable', 'integer'],
            'items.*.variantId' => ['nullable', 'integer'],
            'items.*.quantity' => ['nullable', 'integer', 'min:1', 'max:99'],
        ]);

        try {
            $package = $this->packageFromProducts($validated['items'] ?? []);
            $value = $package['subtotal'] ?? (float) $validated['value'];
            $weight = $package['weight']
                ?? (int) ($validated['weight'] ?? config('services.ghn.default_item_weight', 300));

            $result = $this->shipping->calculate(
                $validated,
                (float) $value,
                (int) $weight
            );
            $result['calculated_weight'] = (int) $weight;
            $result['calculated_subtotal'] = (float) $value;

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
                'data' => null,
            ], 503);
        }
    }

    private function packageFromProducts(array $items): ?array
    {
        if (empty($items) || !Schema::hasTable('products')) {
            return null;
        }

        $defaultWeight = max(1, (int) config('services.ghn.default_item_weight', 300));
        $subtotal = 0.0;
        $weight = 0;
        $matched = 0;

        foreach ($items as $item) {
            $productId = (int) (
                $item['product_id']
                ?? $item['productId']
                ?? $item['id']
                ?? 0
            );
            $variantId = (int) (
                $item['product_variant_id']
                ?? $item['variant_id']
                ?? $item['variantId']
                ?? 0
            );
            $quantity = max(1, (int) ($item['quantity'] ?? 1));

            if ($productId <= 0) {
                continue;
            }

            $product = DB::table('products')->where('id', $productId)->first();
            if (!$product) {
                continue;
            }

            $variant = null;
            if ($variantId > 0 && Schema::hasTable('product_variants')) {
                $variant = DB::table('product_variants')
                    ->where('id', $variantId)
                    ->where('product_id', $productId)
                    ->first();
            }

            $basePrice = (float) ($variant->price ?? $product->price ?? 0);
            $discountPrice = (float) ($variant->discount_price ?? 0);
            $unitPrice = $discountPrice > 0 && $discountPrice < $basePrice
                ? $discountPrice
                : $basePrice;
            $rawWeight = (int) ($variant->weight ?? $product->weight ?? 0);
            $unitWeight = $rawWeight > 0 ? $rawWeight : $defaultWeight;

            $subtotal += $unitPrice * $quantity;
            $weight += $unitWeight * $quantity;
            $matched++;
        }

        return $matched > 0
            ? [
                'subtotal' => round($subtotal, 2),
                'weight' => max(1, $weight),
            ]
            : null;
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
