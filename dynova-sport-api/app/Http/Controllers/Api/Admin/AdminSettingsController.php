<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AdminSettingsController extends Controller
{
    private function defaults(): array
    {
        return [
            'site_name' => 'Dynova Sport',
            'hotline' => '0866 347 730',
            'email' => 'cskh@dynova.vn',
            'address' => 'TP. Hồ Chí Minh',
            'facebook' => '',
            'instagram' => '',
            'tiktok' => '',
            'shipping_note' => 'Miễn phí giao hàng cho đơn từ 500K',
            'return_policy' => 'Đổi trả 30 ngày',
            'free_shipping_threshold' => 500000,
            'default_shipping_fee' => 30000,
            'return_days' => 30,
            'currency' => 'VND',
            'locale' => 'vi-VN',
            'bank_name' => '',
            'bank_code' => '',
            'bank_account_number' => '',
            'bank_account_name' => '',
            'bank_branch' => '',
        ];
    }

    public function show()
    {
        $defaults = $this->defaults();

        if (!Schema::hasTable('settings')) {
            return response()->json([
                'success' => true,
                'data' => [
                    'settings' => $defaults,
                    'database_ready' => false,
                ],
            ]);
        }

        $settings = DB::table('settings')->orderBy('id')->first();
        $payload = $settings ? (array) $settings : [];

        return response()->json([
            'success' => true,
            'data' => [
                'settings' => array_merge($defaults, $payload),
                'database_ready' => true,
            ],
        ]);
    }

    public function update(Request $request)
    {
        if (!Schema::hasTable('settings')) {
            return response()->json([
                'success' => false,
                'message' => 'Bảng settings chưa tồn tại. Hãy chạy php artisan migrate.',
            ], 503);
        }

        $data = $request->validate([
            'site_name' => ['nullable', 'string', 'max:160'],
            'hotline' => ['nullable', 'string', 'max:40'],
            'email' => ['nullable', 'email', 'max:160'],
            'address' => ['nullable', 'string', 'max:500'],
            'facebook' => ['nullable', 'string', 'max:600'],
            'instagram' => ['nullable', 'string', 'max:600'],
            'tiktok' => ['nullable', 'string', 'max:600'],
            'shipping_note' => ['nullable', 'string'],
            'return_policy' => ['nullable', 'string'],
            'free_shipping_threshold' => ['nullable', 'numeric', 'min:0'],
            'default_shipping_fee' => ['nullable', 'numeric', 'min:0'],
            'return_days' => ['nullable', 'integer', 'min:0', 'max:365'],
            'currency' => ['nullable', 'string', 'max:10'],
            'locale' => ['nullable', 'string', 'max:20'],
            'bank_name' => ['nullable', 'string', 'max:120'],
            'bank_code' => ['nullable', 'string', 'max:40'],
            'bank_account_number' => ['nullable', 'string', 'max:80'],
            'bank_account_name' => ['nullable', 'string', 'max:180'],
            'bank_branch' => ['nullable', 'string', 'max:180'],
        ]);

        $bankKeys = [
            'bank_name',
            'bank_code',
            'bank_account_number',
            'bank_account_name',
        ];

        $hasAnyBankValue = collect($bankKeys)->contains(
            fn (string $key) => trim((string) ($data[$key] ?? '')) !== ''
        );

        if ($hasAnyBankValue) {
            $missing = collect($bankKeys)->filter(
                fn (string $key) => trim((string) ($data[$key] ?? '')) === ''
            )->values();

            if ($missing->isNotEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vui lòng nhập đủ ngân hàng, mã VietQR, số tài khoản và chủ tài khoản.',
                    'missing_fields' => $missing,
                ], 422);
            }
        }

        if (isset($data['bank_code'])) {
            $data['bank_code'] = strtoupper(trim((string) $data['bank_code']));
        }

        if (isset($data['bank_account_name'])) {
            $data['bank_account_name'] = strtoupper(trim((string) $data['bank_account_name']));
        }

        $now = now();
        $first = DB::table('settings')->orderBy('id')->first();

        if ($first) {
            $update = array_merge($data, ['updated_at' => $now]);
            DB::table('settings')->where('id', $first->id)->update($update);
            $id = $first->id;
        } else {
            $insert = array_merge($this->defaults(), $data, [
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            $id = DB::table('settings')->insertGetId($insert);
        }

        $settings = DB::table('settings')->where('id', $id)->first();

        return response()->json([
            'success' => true,
            'message' => 'Đã lưu cấu hình website.',
            'data' => [
                'settings' => $settings,
            ],
        ]);
    }
}