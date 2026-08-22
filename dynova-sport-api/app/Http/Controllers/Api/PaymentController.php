<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\VietQrPaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    public function __construct(private VietQrPaymentService $vietQr) {}

    public function create(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'orderId' => ['required', 'integer'],
            'provider' => ['required', 'in:VNPAY,vnpay'],
        ]);

        if (!Schema::hasTable('payment_transactions')) {
            return response()->json(['success' => false, 'message' => 'Vui lòng chạy migration thanh toán trước.'], 503);
        }

        $order = DB::table('orders')
            ->where('id', (int) $validated['orderId'])
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$order) return response()->json(['success' => false, 'message' => 'Không tìm thấy đơn hàng.'], 404);
        if (($order->status ?? '') === 'cancelled') return response()->json(['success' => false, 'message' => 'Đơn hàng đã hủy.'], 422);
        if (($order->payment_status ?? '') === 'paid') return response()->json(['success' => false, 'message' => 'Đơn hàng đã được thanh toán.'], 422);

        $tmnCode = config('services.vnpay.tmn_code');
        $secret = config('services.vnpay.hash_secret');
        $gateway = config('services.vnpay.url');
        $returnUrl = config('services.vnpay.return_url') ?: url('/api/payments/vnpay/return');

        if (!$tmnCode || !$secret || !$gateway) {
            return response()->json(['success' => false, 'message' => 'VNPAY chưa được cấu hình trên server.'], 503);
        }

        $amount = (float) ($order->grand_total ?? 0);
        if ($amount <= 0) return response()->json(['success' => false, 'message' => 'Tổng tiền đơn hàng không hợp lệ.'], 422);

        $txnRef = ($order->order_code ?? ('DNV'.$order->id)) . '-' . now()->format('YmdHis') . '-' . strtoupper(Str::random(4));
        $params = [
            'vnp_Version' => '2.1.0',
            'vnp_Command' => 'pay',
            'vnp_TmnCode' => $tmnCode,
            'vnp_Amount' => (int) round($amount * 100),
            'vnp_CurrCode' => 'VND',
            'vnp_TxnRef' => $txnRef,
            'vnp_OrderInfo' => 'Thanh toan don hang ' . ($order->order_code ?? $order->id),
            'vnp_OrderType' => 'other',
            'vnp_Locale' => 'vn',
            'vnp_ReturnUrl' => $returnUrl,
            'vnp_IpAddr' => $request->ip() ?: '127.0.0.1',
            'vnp_CreateDate' => now()->format('YmdHis'),
            'vnp_ExpireDate' => now()->addMinutes(15)->format('YmdHis'),
        ];
        ksort($params);
        $hashData = http_build_query($params, '', '&', PHP_QUERY_RFC1738);
        $params['vnp_SecureHash'] = hash_hmac('sha512', $hashData, $secret);
        $paymentUrl = $gateway . '?' . http_build_query($params, '', '&', PHP_QUERY_RFC1738);

        DB::table('payment_transactions')->insert([
            'order_id' => $order->id,
            'provider' => 'vnpay',
            'transaction_ref' => $txnRef,
            'amount' => $amount,
            'status' => 'pending',
            'request_payload' => json_encode(['order_code' => $order->order_code ?? null], JSON_UNESCAPED_UNICODE),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Đã tạo phiên thanh toán VNPAY.',
            'data' => ['paymentUrl' => $paymentUrl, 'transactionRef' => $txnRef, 'amount' => $amount],
        ]);
    }

    public function vietQrStatus(Request $request, $id): JsonResponse
    {
        try {
            $state = $this->vietQr->stateForOrder((int) $id, (int) $request->user()->id);

            return response()->json([
                'success' => true,
                'data' => $state,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function refreshVietQr(Request $request, $id): JsonResponse
    {
        try {
            $state = $this->vietQr->refreshForOrder((int) $id, (int) $request->user()->id);

            return response()->json([
                'success' => true,
                'message' => 'Đã tạo lại mã thanh toán.',
                'data' => $state,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function vietQrWebhook(Request $request): JsonResponse
    {
        try {
            $result = $this->vietQr->handleWebhook(
                $request->all(),
                $request->header('X-VietQR-Secret') ?: $request->input('secret')
            );

            return response()->json([
                'success' => true,
                'data' => $result,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function vietQrScan($id, $token)
    {
        try {
            $state = $this->vietQr->confirmByScan((int) $id, (string) $token);

            return response(
                $this->renderDemoScanPage(
                    true,
                    'Thanh toán mô phỏng thành công',
                    'Máy tính sẽ tự nhận trạng thái thanh toán trong vài giây.',
                    $state
                ),
                200
            )->header('Content-Type', 'text/html; charset=UTF-8');
        } catch (\Throwable $e) {
            return response(
                $this->renderDemoScanPage(
                    false,
                    'Không thể xác nhận thanh toán',
                    $e->getMessage(),
                    null
                ),
                422
            )->header('Content-Type', 'text/html; charset=UTF-8');
        }
    }

    private function renderDemoScanPage(
        bool $success,
        string $title,
        string $message,
        ?array $state = null
    ): string {
        $safeTitle = e($title);
        $safeMessage = e($message);
        $orderCode = e((string) ($state['order_code'] ?? ''));
        $amount = number_format((float) ($state['amount'] ?? 0), 0, ',', '.');
        $statusText = $success ? 'ĐÃ XÁC NHẬN' : 'KHÔNG THÀNH CÔNG';
        $statusClass = $success ? 'success' : 'error';
        $icon = $success ? '&#10003;' : '!';
        $detail = $success
            ? '<p class="note">Đây là giao dịch <strong>mô phỏng cho DATN</strong>. Không có tiền thật được chuyển và không có tài khoản ngân hàng nào bị trừ tiền.</p>'
            : '<p class="note">Bạn có thể đóng trang này và quét lại mã QR đang hiển thị trên máy tính.</p>';

        $orderBlock = $orderCode !== ''
            ? '<div class="details"><div><span>Mã đơn</span><b>' . $orderCode . '</b></div><div><span>Giá trị mô phỏng</span><b>' . $amount . 'đ</b></div></div>'
            : '';

        return '<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<title>' . $safeTitle . '</title>
<style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#f8fafc;color:#0f172a;display:flex;align-items:center;justify-content:center;padding:24px}.card{width:min(100%,460px);background:#fff;border:1px solid #e2e8f0;border-radius:32px;padding:28px;box-shadow:0 24px 70px rgba(15,23,42,.12)}.brand{font-size:12px;font-weight:900;letter-spacing:.18em;color:#f97316;text-transform:uppercase}.icon{width:76px;height:76px;margin:26px auto 0;border-radius:999px;display:flex;align-items:center;justify-content:center;font-size:38px;font-weight:900}.icon.success{background:#ecfdf5;color:#059669}.icon.error{background:#fff1f2;color:#e11d48}h1{font-size:27px;line-height:1.15;text-align:center;margin:18px 0 0;font-weight:900}p.message{text-align:center;color:#64748b;font-size:14px;line-height:1.65;margin:10px 0 0}.pill{display:block;width:max-content;margin:18px auto 0;border-radius:999px;padding:8px 12px;font-size:11px;font-weight:900;letter-spacing:.08em}.pill.success{background:#ecfdf5;color:#047857}.pill.error{background:#fff1f2;color:#be123c}.details{margin-top:24px;border-radius:20px;background:#f8fafc;padding:6px 16px}.details>div{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:13px 0;border-bottom:1px solid #e2e8f0}.details>div:last-child{border-bottom:0}.details span{font-size:12px;font-weight:700;color:#64748b}.details b{font-size:14px;text-align:right}.note{margin:20px 0 0;border-radius:18px;background:#fff7ed;padding:14px 16px;color:#9a3412;font-size:12px;line-height:1.6}.footer{text-align:center;margin-top:20px;color:#94a3b8;font-size:11px;font-weight:700}
</style>
</head>
<body>
<main class="card">
<div class="brand">Dynova Sport · QR Demo</div>
<div class="icon ' . $statusClass . '">' . $icon . '</div>
<h1>' . $safeTitle . '</h1>
<p class="message">' . $safeMessage . '</p>
<span class="pill ' . $statusClass . '">' . $statusText . '</span>
' . $orderBlock . '
' . $detail . '
<div class="footer">Bạn có thể đóng trang này sau khi máy tính chuyển sang đơn hàng.</div>
</main>
</body>
</html>';
    }

    public function vnpayReturn(Request $request)
    {
        $result = $this->processVnpayResponse($request);
        $frontend = rtrim(config('services.vnpay.frontend_url', 'http://localhost:3000'), '/');
        $status = $result['success'] ? 'success' : 'failed';
        $orderId = $result['order_id'] ?? '';
        return redirect()->away($frontend . '/orders/' . $orderId . '?payment=' . $status);
    }

    public function vnpayIpn(Request $request): JsonResponse
    {
        $result = $this->processVnpayResponse($request);
        return response()->json([
            'RspCode' => $result['success'] ? '00' : ($result['code'] ?? '99'),
            'Message' => $result['message'],
        ]);
    }

    private function processVnpayResponse(Request $request): array
    {
        $secret = config('services.vnpay.hash_secret');
        if (!$secret || !Schema::hasTable('payment_transactions')) return ['success' => false, 'code' => '99', 'message' => 'Payment configuration unavailable.'];

        $params = $request->query();
        $secureHash = $params['vnp_SecureHash'] ?? null;
        unset($params['vnp_SecureHash'], $params['vnp_SecureHashType']);
        ksort($params);
        $calculated = hash_hmac('sha512', http_build_query($params, '', '&', PHP_QUERY_RFC1738), $secret);
        if (!$secureHash || !hash_equals(strtolower($calculated), strtolower($secureHash))) {
            return ['success' => false, 'code' => '97', 'message' => 'Chữ ký VNPAY không hợp lệ.'];
        }

        $txnRef = (string) ($request->query('vnp_TxnRef') ?? '');
        return DB::transaction(function () use ($request, $txnRef) {
            $txn = DB::table('payment_transactions')->where('transaction_ref', $txnRef)->lockForUpdate()->first();
            if (!$txn) return ['success' => false, 'code' => '01', 'message' => 'Không tìm thấy giao dịch.'];

            $order = DB::table('orders')->where('id', $txn->order_id)->lockForUpdate()->first();
            if (!$order) return ['success' => false, 'code' => '01', 'message' => 'Không tìm thấy đơn hàng.'];

            $receivedAmount = ((int) $request->query('vnp_Amount', 0)) / 100;
            if (abs($receivedAmount - (float) $txn->amount) > 0.01) {
                return ['success' => false, 'code' => '04', 'message' => 'Số tiền giao dịch không khớp.', 'order_id' => $order->id];
            }

            if (($txn->status ?? '') === 'paid') return ['success' => true, 'code' => '00', 'message' => 'Giao dịch đã được ghi nhận.', 'order_id' => $order->id];

            $paid = $request->query('vnp_ResponseCode') === '00' && $request->query('vnp_TransactionStatus') === '00';
            DB::table('payment_transactions')->where('id', $txn->id)->update([
                'provider_transaction_no' => $request->query('vnp_TransactionNo'),
                'status' => $paid ? 'paid' : 'failed',
                'response_payload' => json_encode($request->query(), JSON_UNESCAPED_UNICODE),
                'paid_at' => $paid ? now() : null,
                'updated_at' => now(),
            ]);
            DB::table('orders')->where('id', $order->id)->update([
                'payment_status' => $paid ? 'paid' : 'failed',
                'updated_at' => now(),
            ]);

            return ['success' => $paid, 'code' => $paid ? '00' : '99', 'message' => $paid ? 'Thanh toán thành công.' : 'Thanh toán không thành công.', 'order_id' => $order->id];
        });
    }
}