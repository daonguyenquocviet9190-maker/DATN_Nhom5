<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\VoucherService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

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

        try {
            $result = $this->vouchers->validateAndCalculate($code, $subtotal, $request->user()?->id);
            $voucher = $result['voucher'];

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
        } catch (ValidationException $e) {
            $errors = $e->errors();
            $message = reset($errors)[0] ?? 'Mã giảm giá không hợp lệ.';

            return response()->json([
                'success' => false,
                'message' => $message,
            ], 422);
        }
    }

    public function index(): JsonResponse
    {
        if (!Schema::hasTable('vouchers')) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $query = DB::table('vouchers')
            ->where('is_active', 1)
            ->where(function ($builder) {
                $builder->whereNull('start_date')->orWhere('start_date', '<=', now());
            })
            ->where(function ($builder) {
                $builder->whereNull('end_date')->orWhere('end_date', '>=', now());
            });

        if (Schema::hasColumn('vouchers', 'usage_limit') && Schema::hasColumn('vouchers', 'used_count')) {
            $query->where(function ($builder) {
                $builder
                    ->whereNull('usage_limit')
                    ->orWhere('usage_limit', 0)
                    ->orWhereColumn('used_count', '<', 'usage_limit');
            });
        }

        $items = $query
            ->orderByDesc('id')
            ->get();

        return response()->json(['success' => true, 'data' => $items]);
    }
}
