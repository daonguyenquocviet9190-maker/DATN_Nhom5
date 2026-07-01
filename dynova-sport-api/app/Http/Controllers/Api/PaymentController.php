<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function create(Request $request)
    {
        $validated = $request->validate([
            'orderId' => ['required'],
            'provider' => ['required', 'in:VNPAY,MOMO'],
            'amount' => ['required', 'numeric'],
            'returnUrl' => ['required', 'string'],
        ]);

        // Demo mode: khi chưa có merchant key thật.
        if (!config('services.payment.online_enabled')) {
            return response()->json([
                'success' => true,
                'message' => 'Chưa cấu hình merchant key, đang chạy payment demo.',
                'data' => [
                    'payment_url' => null,
                    'provider' => $validated['provider'],
                    'demo' => true,
                ],
            ]);
        }

        // Khi có merchant thật:
        // - VNPAY: tạo signed payment URL bằng vnp_TmnCode, vnp_HashSecret.
        // - MOMO: gọi API create payment session và nhận payUrl.
        // Sau đó return payment_url cho frontend redirect.

        return response()->json([
            'success' => true,
            'message' => 'Payment provider chưa được triển khai chi tiết.',
            'data' => [
                'payment_url' => null,
                'provider' => $validated['provider'],
                'demo' => true,
            ],
        ]);
    }
}