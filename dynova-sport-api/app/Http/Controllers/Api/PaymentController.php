<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Payments\DynovaSandboxProvider;
use App\Services\VietQrPaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    public function __construct(
        private DynovaSandboxProvider $paymentSandbox,
        private VietQrPaymentService $vietQr,
    ) {}

    /**
     * Tạo phiên thanh toán VNPAY.
     */
    public function create(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'orderId' => ['required', 'integer'],
            'provider' => ['required', 'in:VNPAY,vnpay'],
        ]);

        if (!Schema::hasTable('payment_transactions')) {
            return response()->json([
                'success' => false,
                'message' => 'Vui lòng chạy migration thanh toán trước.',
            ], 503);
        }

        $order = DB::table('orders')
            ->where(
                'id',
                (int) $validated['orderId']
            )
            ->where(
                'user_id',
                $request->user()->id
            )
            ->first();

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy đơn hàng.',
            ], 404);
        }

        if (
            ($order->status ?? '')
            === 'cancelled'
        ) {
            return response()->json([
                'success' => false,
                'message' => 'Đơn hàng đã hủy.',
            ], 422);
        }

        if (
            ($order->payment_status ?? '')
            === 'paid'
        ) {
            return response()->json([
                'success' => false,
                'message' =>
                    'Đơn hàng đã được thanh toán.',
            ], 422);
        }

        $tmnCode = config(
            'services.vnpay.tmn_code'
        );

        $secret = config(
            'services.vnpay.hash_secret'
        );

        $gateway = config(
            'services.vnpay.url'
        );

        $returnUrl = config(
            'services.vnpay.return_url'
        ) ?: url(
            '/api/payments/vnpay/return'
        );

        if (
            !$tmnCode
            || !$secret
            || !$gateway
        ) {
            return response()->json([
                'success' => false,
                'message' =>
                    'VNPAY chưa được cấu hình trên server.',
            ], 503);
        }

        $amount =
            (float) ($order->grand_total ?? 0);

        if ($amount <= 0) {
            return response()->json([
                'success' => false,
                'message' =>
                    'Tổng tiền đơn hàng không hợp lệ.',
            ], 422);
        }

        $txnRef =
            ($order->order_code
                ?? ('DNV' . $order->id))
            . '-'
            . now()->format('YmdHis')
            . '-'
            . strtoupper(
                Str::random(4)
            );

        $params = [
            'vnp_Version' =>
                '2.1.0',

            'vnp_Command' =>
                'pay',

            'vnp_TmnCode' =>
                $tmnCode,

            'vnp_Amount' =>
                (int) round(
                    $amount * 100
                ),

            'vnp_CurrCode' =>
                'VND',

            'vnp_TxnRef' =>
                $txnRef,

            'vnp_OrderInfo' =>
                'Thanh toan don hang '
                . (
                    $order->order_code
                    ?? $order->id
                ),

            'vnp_OrderType' =>
                'other',

            'vnp_Locale' =>
                'vn',

            'vnp_ReturnUrl' =>
                $returnUrl,

            'vnp_IpAddr' =>
                $request->ip()
                ?: '127.0.0.1',

            'vnp_CreateDate' =>
                now()->format('YmdHis'),

            'vnp_ExpireDate' =>
                now()
                    ->addMinutes(15)
                    ->format('YmdHis'),
        ];

        ksort($params);

        $hashData = http_build_query(
            $params,
            '',
            '&',
            PHP_QUERY_RFC1738
        );

        $params['vnp_SecureHash'] =
            hash_hmac(
                'sha512',
                $hashData,
                $secret
            );

        $paymentUrl =
            $gateway
            . '?'
            . http_build_query(
                $params,
                '',
                '&',
                PHP_QUERY_RFC1738
            );

        DB::table(
            'payment_transactions'
        )->insert([
            'order_id' =>
                $order->id,

            'provider' =>
                'vnpay',

            'transaction_ref' =>
                $txnRef,

            'amount' =>
                $amount,

            'status' =>
                'pending',

            'request_payload' =>
                json_encode(
                    [
                        'order_code' =>
                            $order->order_code
                            ?? null,
                    ],
                    JSON_UNESCAPED_UNICODE
                ),

            'created_at' =>
                now(),

            'updated_at' =>
                now(),
        ]);

        return response()->json([
            'success' => true,
            'message' =>
                'Đã tạo phiên thanh toán VNPAY.',

            'data' => [
                'paymentUrl' =>
                    $paymentUrl,

                'transactionRef' =>
                    $txnRef,

                'amount' =>
                    $amount,
            ],
        ]);
    }

    /**
     * Lấy trạng thái thanh toán QR.
     *
     * Frontend đang dùng endpoint này để polling.
     * Trong DATN hiện tại provider là sandbox.
     */
    public function vietQrStatus(
        Request $request,
        $id
    ): JsonResponse {
        try {
            $state =
                $this->paymentSandbox
                    ->stateForOrder(
                        (int) $id,
                        (int) $request
                            ->user()
                            ->id
                    );

            return response()->json([
                'success' => true,
                'data' => $state,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' =>
                    $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Làm mới thông tin QR sandbox.
     */
    public function refreshVietQr(
        Request $request,
        $id
    ): JsonResponse {
        try {
            $state =
                $this->paymentSandbox
                    ->refreshForOrder(
                        (int) $id,
                        (int) $request
                            ->user()
                            ->id
                    );

            return response()->json([
                'success' => true,
                'message' =>
                    'Đã tạo lại mã thanh toán.',
                'data' => $state,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' =>
                    $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Điện thoại quét QR sandbox.
     *
     * Token trong QR sẽ được DynovaSandboxProvider
     * kiểm tra trước khi đổi trạng thái thanh toán.
     */
    public function sandboxScan(
        $id,
        $token
    ) {
        try {
            $state =
                $this->paymentSandbox
                    ->confirmScan(
                        (int) $id,
                        (string) $token
                    );

            return response()->view(
                'payments.success',
                [
                    'payment' => $state,
                ]
            );
        } catch (\Throwable $e) {
            return response()->view(
                'payments.error',
                [
                    'message' =>
                        $e->getMessage(),
                ],
                422
            );
        }
    }

    /**
     * Webhook VietQR thật.
     *
     * Sandbox không dùng webhook này.
     */
    public function vietQrWebhook(
        Request $request
    ): JsonResponse {
        try {
            $result =
                $this->vietQr
                    ->handleWebhook(
                        $request->all(),
                        $request->header(
                            'X-VietQR-Secret'
                        ) ?: $request->input(
                            'secret'
                        )
                    );

            return response()->json([
                'success' => true,
                'data' => $result,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' =>
                    $e->getMessage(),
            ], 422);
        }
    }

    /**
     * VNPAY return URL.
     */
    public function vnpayReturn(
        Request $request
    ) {
        $result =
            $this->processVnpayResponse(
                $request
            );

        $frontend =
            rtrim(
                config(
                    'services.vnpay.frontend_url',
                    'http://localhost:3000'
                ),
                '/'
            );

        $status =
            $result['success']
                ? 'success'
                : 'failed';

        $orderId =
            $result['order_id']
            ?? '';

        return redirect()->away(
            $frontend
            . '/orders/'
            . $orderId
            . '?payment='
            . $status
        );
    }

    /**
     * VNPAY IPN.
     */
    public function vnpayIpn(
        Request $request
    ): JsonResponse {
        $result =
            $this->processVnpayResponse(
                $request
            );

        return response()->json([
            'RspCode' =>
                $result['success']
                    ? '00'
                    : (
                        $result['code']
                        ?? '99'
                    ),

            'Message' =>
                $result['message'],
        ]);
    }

    /**
     * Xử lý response/IPN từ VNPAY.
     */
    private function processVnpayResponse(
        Request $request
    ): array {
        $secret =
            config(
                'services.vnpay.hash_secret'
            );

        if (
            !$secret
            || !Schema::hasTable(
                'payment_transactions'
            )
        ) {
            return [
                'success' => false,
                'code' => '99',
                'message' =>
                    'Payment configuration unavailable.',
            ];
        }

        $params =
            $request->query();

        $secureHash =
            $params['vnp_SecureHash']
            ?? null;

        unset(
            $params['vnp_SecureHash'],
            $params['vnp_SecureHashType']
        );

        ksort($params);

        $calculated =
            hash_hmac(
                'sha512',
                http_build_query(
                    $params,
                    '',
                    '&',
                    PHP_QUERY_RFC1738
                ),
                $secret
            );

        if (
            !$secureHash
            || !hash_equals(
                strtolower(
                    $calculated
                ),
                strtolower(
                    $secureHash
                )
            )
        ) {
            return [
                'success' => false,
                'code' => '97',
                'message' =>
                    'Chữ ký VNPAY không hợp lệ.',
            ];
        }

        $txnRef =
            (string) (
                $request->query(
                    'vnp_TxnRef'
                ) ?? ''
            );

        return DB::transaction(
            function () use (
                $request,
                $txnRef
            ) {

                $txn =
                    DB::table(
                        'payment_transactions'
                    )
                        ->where(
                            'transaction_ref',
                            $txnRef
                        )
                        ->lockForUpdate()
                        ->first();

                if (!$txn) {
                    return [
                        'success' => false,
                        'code' => '01',
                        'message' =>
                            'Không tìm thấy giao dịch.',
                    ];
                }

                $order =
                    DB::table('orders')
                        ->where(
                            'id',
                            $txn->order_id
                        )
                        ->lockForUpdate()
                        ->first();

                if (!$order) {
                    return [
                        'success' => false,
                        'code' => '01',
                        'message' =>
                            'Không tìm thấy đơn hàng.',
                    ];
                }

                $receivedAmount =
                    (
                        (int)
                        $request->query(
                            'vnp_Amount',
                            0
                        )
                    ) / 100;

                if (
                    abs(
                        $receivedAmount
                        - (float)
                            $txn->amount
                    ) > 0.01
                ) {
                    return [
                        'success' => false,
                        'code' => '04',
                        'message' =>
                            'Số tiền giao dịch không khớp.',
                        'order_id' =>
                            $order->id,
                    ];
                }

                if (
                    ($txn->status ?? '')
                    === 'paid'
                ) {
                    return [
                        'success' => true,
                        'code' => '00',
                        'message' =>
                            'Giao dịch đã được ghi nhận.',
                        'order_id' =>
                            $order->id,
                    ];
                }

                $paid =
                    $request->query(
                        'vnp_ResponseCode'
                    ) === '00'
                    && $request->query(
                        'vnp_TransactionStatus'
                    ) === '00';

                DB::table(
                    'payment_transactions'
                )
                    ->where(
                        'id',
                        $txn->id
                    )
                    ->update([
                        'provider_transaction_no' =>
                            $request->query(
                                'vnp_TransactionNo'
                            ),

                        'status' =>
                            $paid
                                ? 'paid'
                                : 'failed',

                        'response_payload' =>
                            json_encode(
                                $request->query(),
                                JSON_UNESCAPED_UNICODE
                            ),

                        'paid_at' =>
                            $paid
                                ? now()
                                : null,

                        'updated_at' =>
                            now(),
                    ]);

                DB::table('orders')
                    ->where(
                        'id',
                        $order->id
                    )
                    ->update([
                        'payment_status' =>
                            $paid
                                ? 'paid'
                                : 'failed',

                        'updated_at' =>
                            now(),
                    ]);

                return [
                    'success' =>
                        $paid,

                    'code' =>
                        $paid
                            ? '00'
                            : '99',

                    'message' =>
                        $paid
                            ? 'Thanh toán thành công.'
                            : 'Thanh toán không thành công.',

                    'order_id' =>
                        $order->id,
                ];
            }
        );
    }
}