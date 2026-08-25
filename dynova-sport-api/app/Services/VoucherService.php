<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class VoucherService
{
    public function validateAndCalculate(?string $code, float $subtotal, ?int $userId = null, bool $lock = false): array
    {
        $cleanCode = strtoupper(trim((string) $code));

        if ($cleanCode === '') {
            return [
                'voucher' => null,
                'discount' => 0.0,
            ];
        }

        if (!Schema::hasTable('vouchers')) {
            throw ValidationException::withMessages([
                'coupon' => ['Chức năng mã giảm giá hiện chưa khả dụng.'],
            ]);
        }

        $query = DB::table('vouchers')->whereRaw('UPPER(code) = ?', [$cleanCode]);
        if ($lock) {
            $query->lockForUpdate();
        }

        $voucher = $query->first();

        if (!$voucher || !(bool) ($voucher->is_active ?? false)) {
            throw ValidationException::withMessages([
                'coupon' => ['Mã giảm giá không tồn tại hoặc đã ngừng áp dụng.'],
            ]);
        }

        $now = Carbon::now();
        if (!empty($voucher->start_date) && $now->lt(Carbon::parse($voucher->start_date))) {
            throw ValidationException::withMessages(['coupon' => ['Mã giảm giá chưa đến thời gian áp dụng.']]);
        }
        if (!empty($voucher->end_date) && $now->gt(Carbon::parse($voucher->end_date))) {
            throw ValidationException::withMessages(['coupon' => ['Mã giảm giá đã hết hạn.']]);
        }

        $usageLimit = isset($voucher->usage_limit) ? (int) $voucher->usage_limit : null;
        $usedCount = (int) ($voucher->used_count ?? 0);
        if ($usageLimit && $usedCount >= $usageLimit) {
            throw ValidationException::withMessages(['coupon' => ['Mã giảm giá đã hết lượt sử dụng.']]);
        }

        if ($userId && Schema::hasTable('voucher_usages') && property_exists($voucher, 'per_user_limit')) {
            $perUserLimit = $voucher->per_user_limit !== null ? (int) $voucher->per_user_limit : null;
            if ($perUserLimit && $perUserLimit > 0) {
                $userUsed = DB::table('voucher_usages')
                    ->where('voucher_id', $voucher->id)
                    ->where('user_id', $userId)
                    ->where('status', 'used')
                    ->count();

                if ($userUsed >= $perUserLimit) {
                    throw ValidationException::withMessages([
                        'coupon' => ['Bạn đã sử dụng hết số lượt cho mã giảm giá này.'],
                    ]);
                }
            }
        }

        $minimum = (float) ($voucher->min_order_value ?? 0);
        if ($subtotal < $minimum) {
            throw ValidationException::withMessages([
                'coupon' => ['Đơn hàng chưa đạt giá trị tối thiểu để áp dụng mã này.'],
            ]);
        }

        $type = strtolower((string) ($voucher->discount_type ?? 'fixed'));
        $value = max(0, (float) ($voucher->discount_value ?? 0));
        $discount = $type === 'percent' ? $subtotal * ($value / 100) : $value;

        $maxDiscount = isset($voucher->max_discount) && $voucher->max_discount !== null
            ? (float) $voucher->max_discount
            : null;

        if ($maxDiscount && $maxDiscount > 0) {
            $discount = min($discount, $maxDiscount);
        }

        $discount = round(min(max(0, $discount), $subtotal), 2);

        return [
            'voucher' => $voucher,
            'discount' => $discount,
        ];
    }

    public function consume(object $voucher, int $userId, int $orderId, float $discount): void
    {
        if (Schema::hasColumn('vouchers', 'used_count')) {
            DB::table('vouchers')->where('id', $voucher->id)->increment('used_count');
        }

        if (Schema::hasTable('voucher_usages')) {
            DB::table('voucher_usages')->insert([
                'voucher_id' => $voucher->id,
                'user_id' => $userId,
                'order_id' => $orderId,
                'discount_amount' => $discount,
                'status' => 'used',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function releaseForCancelledOrder(int $orderId): void
    {
        if (!Schema::hasTable('voucher_usages')) {
            return;
        }

        $usage = DB::table('voucher_usages')
            ->where('order_id', $orderId)
            ->where('status', 'used')
            ->lockForUpdate()
            ->first();

        if (!$usage) {
            return;
        }

        DB::table('voucher_usages')->where('id', $usage->id)->update([
            'status' => 'cancelled',
            'updated_at' => now(),
        ]);

        if (Schema::hasColumn('vouchers', 'used_count')) {
            DB::table('vouchers')
                ->where('id', $usage->voucher_id)
                ->where('used_count', '>', 0)
                ->decrement('used_count');
        }
    }
}
