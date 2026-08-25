<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\VoucherService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class VoucherController extends Controller
{
    public function __construct(private readonly VoucherService $vouchers)
    {
    }

    public function applyVoucher(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['nullable', 'string', 'max:80'],
            'coupon' => ['nullable', 'string', 'max:80'],
            'voucher' => ['nullable', 'string', 'max:80'],
            'voucher_code' => ['nullable', 'string', 'max:80'],
            'cart_total' => ['nullable', 'numeric', 'min:0'],
            'subtotal' => ['nullable', 'numeric', 'min:0'],
        ]);

        $code = $validated['code']
            ?? $validated['coupon']
            ?? $validated['voucher']
            ?? $validated['voucher_code']
            ?? '';

        $subtotal = (float) ($validated['cart_total'] ?? $validated['subtotal'] ?? 0);
        $result = $this->vouchers->validateAndCalculate($code, $subtotal, $request->user()?->id);
        $voucher = $result['voucher'];

        if (!$voucher) {
            return response()->json([
                'success' => false,
                'message' => 'Vui lòng nhập mã giảm giá.',
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Áp dụng mã giảm giá thành công.',
            'data' => [
                'id' => $voucher->id,
                'code' => $voucher->code,
                'title' => $voucher->title ?? $voucher->code,
                'discount_type' => $voucher->discount_type ?? 'fixed',
                'discount_value' => (float) ($voucher->discount_value ?? 0),
                'discount_amount' => $result['discount'],
                'min_order_value' => (float) ($voucher->min_order_value ?? 0),
                'max_discount' => $voucher->max_discount !== null ? (float) $voucher->max_discount : null,
                'per_user_limit' => property_exists($voucher, 'per_user_limit') ? $voucher->per_user_limit : null,
            ],
            'discount' => $result['discount'],
            'discount_amount' => $result['discount'],
        ]);
    }

    public function index(): JsonResponse
    {
        if (!Schema::hasTable('vouchers')) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $items = DB::table('vouchers')
            ->where('is_active', 1)
            ->orderByDesc('id')
            ->get();

        return response()->json(['success' => true, 'data' => $items]);
    }
}
