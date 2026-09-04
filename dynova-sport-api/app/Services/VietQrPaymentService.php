<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class VietQrPaymentService
{
    private const SUPPORTED_PAYMENT_METHODS = [
        'bank', 'bank_transfer', 'banktransfer', 'vietqr', 'sepay', 'sepay_test', 'sepay_sandbox',
    ];

    private const PAYMENT_PROVIDERS = [
        'sepay_test', 'sepay_sandbox', 'sepay', 'vietqr', 'dynova_sandbox',
    ];

    public function createPendingForOrder(int $orderId): void
    {
        $this->assertReady();
        DB::transaction(function () use ($orderId) {
            $order = DB::table('orders')->where('id', $orderId)->lockForUpdate()->first();
            if (!$order) throw new RuntimeException('Không tìm thấy đơn hàng.');
            if (!$this->isBankPaymentMethod($order->payment_method ?? null)) throw new RuntimeException('Đơn hàng không sử dụng thanh toán QR.');
            if (($order->status ?? '') === 'cancelled') throw new RuntimeException('Đơn hàng đã hủy.');
            if (($order->payment_status ?? '') === 'paid') return;

            $paymentCode = $this->paymentCodeForOrder((int) $order->id);
            $amount = (float) ($order->grand_total ?? $order->total ?? 0);
            if ($amount <= 0) throw new RuntimeException('Tổng tiền đơn hàng không hợp lệ.');

            $transaction = DB::table('payment_transactions')->where('order_id', $orderId)->whereIn('provider', self::PAYMENT_PROVIDERS)->orderByDesc('id')->lockForUpdate()->first();
            $settings = $this->bankSettings();
            $payload = [
                'order_code' => (string) ($order->order_code ?? ''),
                'payment_code' => $paymentCode,
                'transfer_content' => $paymentCode,
                'bank_code' => $settings['bank_code'],
                'account_number' => $settings['account_number'],
                'account_name' => $settings['account_name'],
                'environment' => config('services.sepay.environment', 'test'),
                'provider' => 'sepay_test',
            ];
            $data = [
                'provider' => 'sepay_test', 'transaction_ref' => $paymentCode, 'amount' => $amount, 'status' => 'pending',
                'request_payload' => json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), 'updated_at' => now(),
            ];
            if ($transaction) {
                if (($transaction->status ?? '') === 'paid') return;
                DB::table('payment_transactions')->where('id', $transaction->id)->update($data);
            } else {
                $data['order_id'] = $orderId; $data['created_at'] = now();
                DB::table('payment_transactions')->insert($data);
            }
        }, 3);
    }

    public function stateForOrder(int $orderId, ?int $userId = null): array
    {
        $this->assertReady();
        $this->assertOrderAccess($orderId, $userId);
        $this->createPendingIfMissing($orderId);
        return $this->buildState($orderId);
    }

    public function refreshForOrder(int $orderId, ?int $userId = null): array
    {
        $this->assertReady();
        $this->assertOrderAccess($orderId, $userId);
        $this->createPendingIfMissing($orderId);
        return $this->buildState($orderId);
    }

    public function handleWebhook(array $payload): array
    {
        $this->assertReady();
        if (strtolower(trim((string) ($payload['transferType'] ?? ''))) !== 'in') return ['processed' => false, 'message' => 'Bỏ qua giao dịch tiền ra.'];

        $transferAmount = (float) ($payload['transferAmount'] ?? 0);
        if ($transferAmount <= 0) throw new RuntimeException('Số tiền giao dịch không hợp lệ.');

        $paymentCode = strtoupper(trim((string) ($payload['code'] ?? '')));
        $content = trim((string) ($payload['content'] ?? ''));
        $prefix = strtoupper((string) config('services.sepay.payment_code_prefix', 'DNV'));
        $digits = max(1, (int) config('services.sepay.payment_code_digits', 7));
        $exact = '/^' . preg_quote($prefix, '/') . '\\d{' . $digits . '}$/i';

        if ($paymentCode === '' || !preg_match($exact, $paymentCode)) {
            $contentPattern = '/\\b(' . preg_quote($prefix, '/') . '\\d{' . $digits . '})\\b/i';
            if (preg_match($contentPattern, $content, $matches)) $paymentCode = strtoupper($matches[1]);
        }

        if (!preg_match('/^' . preg_quote($prefix, '/') . '(\\d{' . $digits . '})$/i', $paymentCode, $matches)) {
            return ['processed' => false, 'message' => 'Bỏ qua giao dịch không có mã thanh toán Dynova hợp lệ.'];
        }

        return $this->markPaidFromSePay((int) $matches[1], $transferAmount, $paymentCode, $payload);
    }

    private function markPaidFromSePay(int $orderId, float $transferAmount, string $paymentCode, array $payload): array
    {
        $providerTransactionNo = trim((string) ($payload['id'] ?? $payload['referenceCode'] ?? ''));
        return DB::transaction(function () use ($orderId, $transferAmount, $paymentCode, $payload, $providerTransactionNo) {
            $order = DB::table('orders')->where('id', $orderId)->lockForUpdate()->first();
            if (!$order) return ['processed' => false, 'status' => 404, 'message' => 'Không tìm thấy đơn hàng.'];
            if (!$this->isBankPaymentMethod($order->payment_method ?? null)) return ['processed' => false, 'status' => 422, 'message' => 'Đơn hàng không sử dụng thanh toán QR.'];
            if (strtolower((string) ($order->status ?? '')) === 'cancelled') return ['processed' => false, 'status' => 422, 'message' => 'Đơn hàng đã hủy.', 'order_id' => $order->id];

            $expectedAmount = (float) ($order->grand_total ?? $order->total ?? 0);
            if (abs($transferAmount - $expectedAmount) > 0.01) return ['processed' => false, 'status' => 422, 'message' => 'Số tiền giao dịch không khớp đơn hàng.', 'order_id' => $order->id, 'expected_amount' => $expectedAmount, 'received_amount' => $transferAmount];
            if (($order->payment_status ?? '') === 'paid') return ['processed' => true, 'status' => 200, 'message' => 'Đơn hàng đã được thanh toán trước đó.', 'order_id' => $order->id, 'order_code' => $order->order_code ?? null];

            if (Schema::hasTable('payment_transactions') && $providerTransactionNo !== '') {
                $duplicate = DB::table('payment_transactions')->where('provider', 'sepay_test')->where('provider_transaction_no', $providerTransactionNo)->where('status', 'paid')->where('order_id', '<>', $order->id)->exists();
                if ($duplicate) return ['processed' => false, 'status' => 409, 'message' => 'Giao dịch SePay đã được dùng cho đơn hàng khác.'];
            }

            $transaction = DB::table('payment_transactions')->where('order_id', $order->id)->whereIn('provider', self::PAYMENT_PROVIDERS)->orderByDesc('id')->lockForUpdate()->first();
            $txData = ['provider' => 'sepay_test', 'transaction_ref' => $paymentCode, 'amount' => $transferAmount, 'status' => 'paid', 'updated_at' => now(), 'paid_at' => now()];
            if (Schema::hasColumn('payment_transactions', 'provider_transaction_no')) $txData['provider_transaction_no'] = $providerTransactionNo !== '' ? $providerTransactionNo : null;
            if (Schema::hasColumn('payment_transactions', 'response_payload')) $txData['response_payload'] = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

            if ($transaction) DB::table('payment_transactions')->where('id', $transaction->id)->update($txData);
            else {
                $txData['order_id'] = $order->id; $txData['created_at'] = now();
                $txData['request_payload'] = json_encode(['payment_code' => $paymentCode, 'source' => 'sepay_webhook'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                DB::table('payment_transactions')->insert($txData);
            }

            $previousStatus = (string) ($order->status ?? 'pending');
            $nextStatus = $this->nextPaidOrderStatus($previousStatus);
            DB::table('orders')->where('id', $order->id)->update(['payment_status' => 'paid', 'status' => $nextStatus, 'updated_at' => now()]);
            $this->writePaymentHistory($order->id, $previousStatus, $nextStatus, 'SePay xác nhận thanh toán ' . $paymentCode . '.');

            return ['processed' => true, 'status' => 200, 'message' => 'Thanh toán SePay đã được ghi nhận.', 'order_id' => (int) $order->id, 'order_code' => (string) ($order->order_code ?? ''), 'payment_status' => 'paid', 'order_status' => $nextStatus, 'transaction_ref' => $paymentCode, 'provider_transaction_no' => $providerTransactionNo !== '' ? $providerTransactionNo : null, 'amount' => $transferAmount];
        }, 3);
    }

    /** QR demo: không cần PAYMENT_SANDBOX_ENABLED. Chỉ cần TEST + SEPAY_TEST_SCAN_QR=true. */
    public function confirmTestScan(int $orderId, string $token): array
    {
        $this->assertReady();
        if (!$this->isTestScanQrEnabled()) throw new RuntimeException('QR demo chưa được bật. Vui lòng đặt SEPAY_TEST_SCAN_QR=true.');
        if (strtolower((string) config('services.sepay.environment', 'test')) !== 'test') throw new RuntimeException('Chức năng quét QR demo chỉ dùng trong môi trường test.');

        $order = DB::table('orders')->where('id', $orderId)->first();
        if (!$order) throw new RuntimeException('Không tìm thấy đơn hàng.');
        if (!$this->isBankPaymentMethod($order->payment_method ?? null)) throw new RuntimeException('Đơn hàng không sử dụng thanh toán ngân hàng.');
        if (strtolower((string) ($order->status ?? '')) === 'cancelled') throw new RuntimeException('Đơn hàng đã hủy.');

        $transaction = DB::table('payment_transactions')->where('order_id', $orderId)->whereIn('provider', self::PAYMENT_PROVIDERS)->orderByDesc('id')->first();
        if (!$transaction) {
            $this->createPendingForOrder($orderId);
            $transaction = DB::table('payment_transactions')->where('order_id', $orderId)->whereIn('provider', self::PAYMENT_PROVIDERS)->orderByDesc('id')->first();
        }
        if (!$transaction) throw new RuntimeException('Không tìm thấy giao dịch thanh toán.');

        $expectedToken = $this->makeTestScanToken($order, $transaction);
        if (trim($token) === '' || !hash_equals($expectedToken, trim($token))) throw new RuntimeException('Mã QR thanh toán không hợp lệ hoặc đã thay đổi.');
        if (($order->payment_status ?? '') === 'paid') return $this->buildState($orderId);

        return DB::transaction(function () use ($orderId, $transaction) {
            $order = DB::table('orders')->where('id', $orderId)->lockForUpdate()->first();
            $tx = DB::table('payment_transactions')->where('id', $transaction->id)->lockForUpdate()->first();
            if (!$order || !$tx) throw new RuntimeException('Không tìm thấy giao dịch thanh toán.');
            if (($order->payment_status ?? '') === 'paid') return $this->buildState($orderId);

            $previousStatus = (string) ($order->status ?? 'pending');
            $nextStatus = $this->nextPaidOrderStatus($previousStatus);
            $scanRef = 'SCAN-' . strtoupper(substr(hash('sha256', $tx->transaction_ref . '|' . $order->id), 0, 18));
            $txUpdate = ['provider' => 'sepay_test', 'status' => 'paid', 'paid_at' => now(), 'updated_at' => now()];
            if (Schema::hasColumn('payment_transactions', 'provider_transaction_no')) $txUpdate['provider_transaction_no'] = $scanRef;
            if (Schema::hasColumn('payment_transactions', 'response_payload')) $txUpdate['response_payload'] = json_encode(['source' => 'qr_scan_demo', 'status' => 'paid', 'reference' => $scanRef], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

            DB::table('payment_transactions')->where('id', $tx->id)->update($txUpdate);
            DB::table('orders')->where('id', $orderId)->update(['payment_status' => 'paid', 'status' => $nextStatus, 'updated_at' => now()]);
            $this->writePaymentHistory($orderId, $previousStatus, $nextStatus, 'QR xác nhận thanh toán thành công.');
            return $this->buildState($orderId);
        }, 3);
    }

    private function isTestScanQrEnabled(): bool
    {
        return strtolower((string) config('services.sepay.environment', 'test')) === 'test'
            && filter_var(env('SEPAY_TEST_SCAN_QR', 'false'), FILTER_VALIDATE_BOOL);
    }

    private function makeTestScanToken(object $order, object $transaction): string
    {
        $secret = trim((string) config('services.payment_sandbox.secret', ''));
        if ($secret === '') throw new RuntimeException('PAYMENT_SANDBOX_SECRET chưa được cấu hình.');
        $payload = implode('|', [
            (string) $order->id,
            (string) ($order->order_code ?? ''),
            (string) ($transaction->transaction_ref ?? ''),
            number_format((float) ($transaction->amount ?? $order->grand_total ?? 0), 2, '.', ''),
        ]);
        return hash_hmac('sha256', $payload, $secret);
    }

    private function buildTestScanUrl(object $order, object $transaction): string
    {
        $baseUrl = trim((string) config('services.sepay.public_url', env('SEPAY_PUBLIC_URL', config('services.payment_sandbox.base_url', config('app.url')))));
        $baseUrl = rtrim($baseUrl, '/');
        if ($baseUrl === '') throw new RuntimeException('SEPAY_PUBLIC_URL chưa được cấu hình.');
        return $baseUrl . '/api/payments/sepay/scan/' . (int) $order->id . '/' . $this->makeTestScanToken($order, $transaction);
    }

    private function buildTestScanQrUrl(string $scanUrl): string
    {
        $qrBase = rtrim((string) config('services.payment_sandbox.qr_image_url', env('PAYMENT_SANDBOX_QR_IMAGE_URL', 'https://quickchart.io/qr')), '?&');
        return $qrBase . '?' . http_build_query(['text' => $scanUrl, 'size' => 420, 'margin' => 2, 'ecLevel' => 'M', 'format' => 'png'], '', '&', PHP_QUERY_RFC3986);
    }

    private function buildState(int $orderId): array
    {
        $order = DB::table('orders')->where('id', $orderId)->first();
        $transaction = DB::table('payment_transactions')->where('order_id', $orderId)->whereIn('provider', self::PAYMENT_PROVIDERS)->orderByDesc('id')->first();
        if (!$order || !$transaction) throw new RuntimeException('Không tìm thấy giao dịch thanh toán QR.');

        $settings = $this->bankSettings();
        $payload = $this->decodePayload($transaction->request_payload ?? null);
        $paymentCode = (string) ($payload['payment_code'] ?? $this->paymentCodeForOrder((int) $order->id));
        $amount = (float) ($transaction->amount ?? $order->grand_total ?? 0);
        $useScanQr = $this->isTestScanQrEnabled();

        $scanUrl = null;
        $qrUrl = $this->buildQrUrl($settings, $amount, $paymentCode);
        if ($useScanQr) {
            $scanUrl = $this->buildTestScanUrl($order, $transaction);
            $qrUrl = $this->buildTestScanQrUrl($scanUrl);
        }

        return [
            'order_id' => (int) $order->id,
            'order_code' => (string) ($order->order_code ?? ''),
            'payment_code' => $paymentCode,
            'order_status' => (string) ($order->status ?? 'pending'),
            'payment_status' => (string) ($order->payment_status ?? 'unpaid'),
            'transaction_status' => (string) ($transaction->status ?? 'pending'),
            'transaction_ref' => (string) ($transaction->transaction_ref ?? $paymentCode),
            'provider_transaction_no' => $transaction->provider_transaction_no ?? null,
            'amount' => $amount,
            'transfer_content' => $paymentCode,
            'qr_url' => $qrUrl,
            'scan_url' => $scanUrl,
            'payment_mode' => $useScanQr ? 'scan' : 'sepay_test',
            'simulated' => $useScanQr,
            'money_transfer_required' => !$useScanQr,
            'bank' => [
                'name' => $settings['bank_name'], 'code' => $settings['bank_code'],
                'account_number' => $settings['account_number'], 'account_name' => $settings['account_name'], 'branch' => $settings['branch'],
            ],
            'paid_at' => $transaction->paid_at ?? null,
        ];
    }

    private function createPendingIfMissing(int $orderId): void
    {
        $exists = DB::table('payment_transactions')->where('order_id', $orderId)->whereIn('provider', self::PAYMENT_PROVIDERS)->exists();
        if (!$exists) $this->createPendingForOrder($orderId);
    }

    private function paymentCodeForOrder(int $orderId): string
    {
        $prefix = strtoupper((string) config('services.sepay.payment_code_prefix', 'DNV'));
        $digits = max(1, (int) config('services.sepay.payment_code_digits', 7));
        return $prefix . str_pad((string) $orderId, $digits, '0', STR_PAD_LEFT);
    }

    private function buildQrUrl(array $settings, float $amount, string $transferContent): string
    {
        $baseUrl = rtrim((string) config('services.sepay.qr_base_url', 'https://vietqr.app/img'), '/');
        $query = [
            'acc' => $settings['account_number'], 'bank' => $settings['bank_code'], 'amount' => (int) round($amount),
            'des' => $transferContent, 'template' => (string) config('services.sepay.qr_template', 'compact'),
        ];
        if ((bool) config('services.sepay.qr_showinfo', true)) $query['showinfo'] = 'true';
        $store = trim((string) config('services.sepay.qr_store', 'Dynova Sport'));
        if ($store !== '') $query['store'] = $store;
        $holder = trim((string) $settings['account_name']);
        if ($holder !== '') {
            $asciiHolder = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $holder);
            $query['holder'] = strtoupper(preg_replace('/[^A-Z0-9 ._-]/i', '', $asciiHolder ?: $holder));
        }
        return $baseUrl . '?' . http_build_query($query, '', '&', PHP_QUERY_RFC3986);
    }

    private function bankSettings(): array
    {
        $bankName = trim((string) config('services.sepay.bank_name', ''));
        $bankCode = trim((string) config('services.sepay.bank_code', ''));
        $accountNumber = preg_replace('/\s+/', '', (string) config('services.sepay.account_number', ''));
        $accountName = trim((string) config('services.sepay.account_name', ''));
        $branch = trim((string) config('services.sepay.branch', ''));

        if (($bankCode === '' || $accountNumber === '' || $accountName === '') && Schema::hasTable('settings')) {
            $settings = DB::table('settings')->orderBy('id')->first();
            $bankName = $bankName !== '' ? $bankName : trim((string) ($settings->bank_name ?? ''));
            $bankCode = $bankCode !== '' ? $bankCode : trim((string) ($settings->bank_code ?? ''));
            $accountNumber = $accountNumber !== '' ? $accountNumber : preg_replace('/\s+/', '', (string) ($settings->bank_account_number ?? ''));
            $accountName = $accountName !== '' ? $accountName : trim((string) ($settings->bank_account_name ?? ''));
            $branch = $branch !== '' ? $branch : trim((string) ($settings->bank_branch ?? ''));
        }

        if ($bankCode === '' || $accountNumber === '' || $accountName === '') throw ValidationException::withMessages(['payment' => 'SePay Test chưa được cấu hình đầy đủ tài khoản nhận tiền.']);
        if ($bankName === '') $bankName = $bankCode;

        return ['bank_name' => $bankName, 'bank_code' => $bankCode, 'account_number' => $accountNumber, 'account_name' => $accountName, 'branch' => $branch];
    }

    private function assertOrderAccess(int $orderId, ?int $userId): void
    {
        $query = DB::table('orders')->where('id', $orderId);
        if ($userId !== null) $query->where('user_id', $userId);
        $order = $query->first();
        if (!$order) throw new RuntimeException('Không tìm thấy đơn hàng.');
        if (!$this->isBankPaymentMethod($order->payment_method ?? null)) throw new RuntimeException('Đơn hàng không sử dụng thanh toán QR.');
    }

    private function isBankPaymentMethod(?string $method): bool
    {
        return in_array(strtolower(trim((string) $method)), self::SUPPORTED_PAYMENT_METHODS, true);
    }

    private function decodePayload(mixed $value): array
    {
        if (is_array($value)) return $value;
        $decoded = json_decode((string) $value, true);
        return is_array($decoded) ? $decoded : [];
    }

    private function nextPaidOrderStatus(string $previousStatus): string
    {
        return in_array(strtolower($previousStatus), ['pending', 'waiting_bank_transfer', 'bank_pending', 'waiting_payment', 'payment_pending'], true)
            ? 'confirmed'
            : $previousStatus;
    }

    private function writePaymentHistory(int $orderId, string $fromStatus, string $toStatus, string $note): void
    {
        if ($fromStatus === $toStatus || !Schema::hasTable('order_status_histories')) return;
        $columns = Schema::getColumnListing('order_status_histories');
        $history = [];
        if (in_array('order_id', $columns, true)) $history['order_id'] = $orderId;
        if (in_array('changed_by', $columns, true)) $history['changed_by'] = null;
        if (in_array('from_status', $columns, true)) $history['from_status'] = $fromStatus;
        if (in_array('to_status', $columns, true)) $history['to_status'] = $toStatus;
        if (in_array('source', $columns, true)) $history['source'] = 'payment';
        if (in_array('note', $columns, true)) $history['note'] = $note;
        if (in_array('created_at', $columns, true)) $history['created_at'] = now();
        if (in_array('updated_at', $columns, true)) $history['updated_at'] = now();
        if (isset($history['order_id'], $history['to_status'])) DB::table('order_status_histories')->insert($history);
    }

    private function assertReady(): void
    {
        if (!Schema::hasTable('orders') || !Schema::hasTable('payment_transactions')) throw new RuntimeException('Hệ thống thanh toán chưa sẵn sàng.');
    }
}