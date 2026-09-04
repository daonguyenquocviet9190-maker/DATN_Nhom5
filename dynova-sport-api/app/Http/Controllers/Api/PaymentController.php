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

        $txnRef = ($order->order_code ?? ('DNV' . $order->id)) . '-' . now()->format('YmdHis') . '-' . strtoupper(Str::random(4));
        $params = [
            'vnp_Version' => '2.1.0', 'vnp_Command' => 'pay', 'vnp_TmnCode' => $tmnCode,
            'vnp_Amount' => (int) round($amount * 100), 'vnp_CurrCode' => 'VND', 'vnp_TxnRef' => $txnRef,
            'vnp_OrderInfo' => 'Thanh toan don hang ' . ($order->order_code ?? $order->id), 'vnp_OrderType' => 'other',
            'vnp_Locale' => 'vn', 'vnp_ReturnUrl' => $returnUrl, 'vnp_IpAddr' => $request->ip() ?: '127.0.0.1',
            'vnp_CreateDate' => now()->format('YmdHis'), 'vnp_ExpireDate' => now()->addMinutes(15)->format('YmdHis'),
        ];
        ksort($params);
        $hashData = http_build_query($params, '', '&', PHP_QUERY_RFC1738);
        $params['vnp_SecureHash'] = hash_hmac('sha512', $hashData, $secret);
        $paymentUrl = $gateway . '?' . http_build_query($params, '', '&', PHP_QUERY_RFC1738);

        DB::table('payment_transactions')->insert([
            'order_id' => $order->id, 'provider' => 'vnpay', 'transaction_ref' => $txnRef,
            'amount' => $amount, 'status' => 'pending',
            'request_payload' => json_encode(['order_code' => $order->order_code ?? null], JSON_UNESCAPED_UNICODE),
            'created_at' => now(), 'updated_at' => now(),
        ]);

        return response()->json(['success' => true, 'message' => 'Đã tạo phiên thanh toán VNPAY.', 'data' => [
            'paymentUrl' => $paymentUrl, 'transactionRef' => $txnRef, 'amount' => $amount,
        ]]);
    }

    public function sepayStatus(Request $request, $id): JsonResponse
    {
        try {
            return response()->json(['success' => true, 'data' => $this->vietQr->stateForOrder((int) $id, (int) $request->user()->id)]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    public function refreshSepay(Request $request, $id): JsonResponse
    {
        try {
            return response()->json(['success' => true, 'message' => 'Đã cập nhật mã thanh toán.', 'data' => $this->vietQr->refreshForOrder((int) $id, (int) $request->user()->id)]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    public function vietQrStatus(Request $request, $id): JsonResponse { return $this->sepayStatus($request, $id); }
    public function refreshVietQr(Request $request, $id): JsonResponse { return $this->refreshSepay($request, $id); }

    /** QR demo: quét mã -> xác nhận thanh toán demo, không chuyển tiền thật. */
    public function sepayScan($id, $token)
    {
        try {
            $state = $this->vietQr->confirmTestScan((int) $id, (string) $token);
            return response()->view('payments.success', ['payment' => $state]);
        } catch (\Throwable $e) {
            return response()->view('payments.error', ['message' => $e->getMessage()], 422);
        }
    }

    public function sepayWebhook(Request $request): JsonResponse
    {
        try {
            if (!$this->authorizedWebhook($request)) {
                return response()->json(['success' => false, 'message' => 'Webhook SePay không được phép.'], 401);
            }
            $payload = $request->json()->all();
            if (!is_array($payload)) return response()->json(['success' => false, 'message' => 'Payload SePay không hợp lệ.'], 400);
            $result = $this->vietQr->handleWebhook($payload);
            $status = (int) ($result['status'] ?? 200);
            unset($result['status']);
            return response()->json(['success' => true, 'data' => $result], $status >= 200 && $status < 300 ? $status : 200);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function vietQrWebhook(Request $request): JsonResponse { return $this->sepayWebhook($request); }

    private function authorizedWebhook(Request $request): bool
    {
        $environment = strtolower((string) config('services.sepay.environment', 'test'));
        $secret = trim((string) config('services.sepay.webhook_secret', ''));
        $signature = trim((string) $request->header('X-SePay-Signature', ''));
        $timestamp = trim((string) $request->header('X-SePay-Timestamp', ''));

        if ($secret !== '' && $signature !== '' && $timestamp !== '') {
            if (!ctype_digit($timestamp) || abs(time() - (int) $timestamp) > 300) return false;
            $expected = 'sha256=' . hash_hmac('sha256', $timestamp . '.' . (string) $request->getContent(), $secret);
            return hash_equals($expected, $signature);
        }

        $configuredKey = trim((string) config('services.sepay.webhook_api_key', ''));
        if ($configuredKey !== '') {
            $authorization = trim((string) $request->header('Authorization', ''));
            if (stripos($authorization, 'Apikey ') === 0) return hash_equals($configuredKey, trim(substr($authorization, 7)));
            if (stripos($authorization, 'Bearer ') === 0) return hash_equals($configuredKey, trim(substr($authorization, 7)));
        }

        return $environment === 'test' && (bool) config('services.sepay.webhook_allow_no_auth', false);
    }

    public function vnpayReturn(Request $request)
    {
        $result = $this->processVnpayResponse($request);
        $frontend = rtrim(config('services.vnpay.frontend_url', 'http://localhost:3000'), '/');
        return redirect()->away($frontend . '/orders/' . ($result['order_id'] ?? '') . '?payment=' . ($result['success'] ? 'success' : 'failed'));
    }

    public function vnpayIpn(Request $request): JsonResponse
    {
        $result = $this->processVnpayResponse($request);
        return response()->json(['RspCode' => $result['success'] ? '00' : ($result['code'] ?? '99'), 'Message' => $result['message']]);
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
        if (!$secureHash || !hash_equals(strtolower($calculated), strtolower($secureHash))) return ['success' => false, 'code' => '97', 'message' => 'Chữ ký VNPAY không hợp lệ.'];

        $txnRef = (string) ($request->query('vnp_TxnRef') ?? '');
        return DB::transaction(function () use ($request, $txnRef) {
            $txn = DB::table('payment_transactions')->where('transaction_ref', $txnRef)->lockForUpdate()->first();
            if (!$txn) return ['success' => false, 'code' => '01', 'message' => 'Không tìm thấy giao dịch.'];
            $order = DB::table('orders')->where('id', $txn->order_id)->lockForUpdate()->first();
            if (!$order) return ['success' => false, 'code' => '01', 'message' => 'Không tìm thấy đơn hàng.'];
            $receivedAmount = ((int) $request->query('vnp_Amount', 0)) / 100;
            if (abs($receivedAmount - (float) $txn->amount) > 0.01) return ['success' => false, 'code' => '04', 'message' => 'Số tiền giao dịch không khớp.', 'order_id' => $order->id];
            if (($txn->status ?? '') === 'paid') return ['success' => true, 'code' => '00', 'message' => 'Giao dịch đã được ghi nhận.', 'order_id' => $order->id];
            $paid = $request->query('vnp_ResponseCode') === '00' && $request->query('vnp_TransactionStatus') === '00';
            DB::table('payment_transactions')->where('id', $txn->id)->update([
                'provider_transaction_no' => $request->query('vnp_TransactionNo'),
                'status' => $paid ? 'paid' : 'failed',
                'response_payload' => json_encode($request->query(), JSON_UNESCAPED_UNICODE),
                'paid_at' => $paid ? now() : null,
                'updated_at' => now(),
            ]);
            DB::table('orders')->where('id', $order->id)->update(['payment_status' => $paid ? 'paid' : 'failed', 'updated_at' => now()]);
            return ['success' => $paid, 'code' => $paid ? '00' : '99', 'message' => $paid ? 'Thanh toán thành công.' : 'Thanh toán không thành công.', 'order_id' => $order->id];
        });
    }
}