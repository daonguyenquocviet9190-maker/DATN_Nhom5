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
            'district' => ['required', 'string', 'max:120'],
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
            return response()->json(['success' => true, 'data' => $this->shipping->provinces()]);
        } catch (RuntimeException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage(), 'data' => []], 503);
        }
    }

    public function districts(Request $request)
    {
        $validated = $request->validate(['province_id' => ['required', 'integer']]);
        try {
            return response()->json([
                'success' => true,
                'data' => $this->shipping->districts((int) $validated['province_id']),
            ]);
        } catch (RuntimeException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage(), 'data' => []], 503);
        }
    }

    public function wards(Request $request)
    {
        $validated = $request->validate(['district_id' => ['required', 'integer']]);
        try {
            return response()->json([
                'success' => true,
                'data' => $this->shipping->wards((int) $validated['district_id']),
            ]);
        } catch (RuntimeException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage(), 'data' => []], 503);
        }
    }

    public function services(Request $request)
    {
        $validated = $request->validate(['district_id' => ['required', 'integer']]);
        try {
            return response()->json([
                'success' => true,
                'data' => $this->shipping->availableServices((int) $validated['district_id']),
            ]);
        } catch (RuntimeException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage(), 'data' => []], 503);
        }
    }

    public function webhook(Request $request, string $secret)
    {
        $configuredSecret = (string) config('services.ghn.webhook_secret');
        if ($configuredSecret === '' || !hash_equals($configuredSecret, $secret)) {
            return response()->json(['success' => false, 'message' => 'Webhook không hợp lệ.'], 403);
        }

        $result = $this->shipping->handleWebhook($request->all());

        return response()->json([
            'success' => true,
            'message' => 'OK',
            'data' => $result,
        ]);
    }
}
