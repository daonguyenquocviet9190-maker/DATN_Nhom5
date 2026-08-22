<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class VietQrPaymentService
{
    public function createPendingForOrder(int $orderId): void
    {
        $this->assertReady();

        DB::transaction(function () use ($orderId) {
            $order = DB::table('orders')->where('id', $orderId)->lockForUpdate()->first();

            if (!$order) {
                throw new RuntimeException('Không tìm thấy đơn hàng.');
            }

            if (($order->payment_method ?? '') !== 'bank') {
                throw new RuntimeException('Đơn hàng không sử dụng thanh toán QR.');
            }

            $existing = DB::table('payment_transactions')
                ->where('order_id', $orderId)
                ->where('provider', 'vietqr')
                ->lockForUpdate()
                ->first();

            if ($existing) {
                return;
            }

            $requestPayload = [
                'order_code' => $order->order_code,
                'transfer_content' => $order->order_code,
                'payment_mode' => $this->isDemoScanMode() ? 'demo_scan' : 'bank',
            ];

            if (!$this->isDemoScanMode()) {
                $settings = $this->bankSettings();
                $requestPayload['bank_code'] = $settings['bank_code'];
                $requestPayload['account_number'] = $settings['account_number'];
            }

            DB::table('payment_transactions')->insert([
                'order_id' => $orderId,
                'provider' => 'vietqr',
                'transaction_ref' => 'VQR-' . (string) $order->order_code,
                'amount' => (float) ($order->grand_total ?? 0),
                'status' => 'pending',
                'request_payload' => json_encode(
                    $requestPayload,
                    JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
                ),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }, 3);
    }

    public function stateForOrder(int $orderId, ?int $userId = null): array
    {
        $this->assertReady();
        $this->assertOrderAccess($orderId, $userId);
        $this->createPendingForOrderIfMissing($orderId);

        return $this->buildState($orderId);
    }

    public function refreshForOrder(int $orderId, ?int $userId = null): array
    {
        $this->assertReady();
        $this->assertOrderAccess($orderId, $userId);

        DB::transaction(function () use ($orderId) {
            $order = DB::table('orders')->where('id', $orderId)->lockForUpdate()->first();

            if (!$order) {
                throw new RuntimeException('Không tìm thấy đơn hàng.');
            }

            if (($order->payment_method ?? '') !== 'bank') {
                throw new RuntimeException('Đơn hàng không sử dụng thanh toán QR.');
            }

            if (($order->status ?? '') === 'cancelled') {
                throw new RuntimeException('Đơn hàng đã hủy.');
            }

            if (($order->payment_status ?? '') === 'paid') {
                return;
            }

            $transaction = DB::table('payment_transactions')
                ->where('order_id', $orderId)
                ->where('provider', 'vietqr')
                ->lockForUpdate()
                ->first();

            if (!$transaction) {
                return;
            }

            DB::table('payment_transactions')->where('id', $transaction->id)->update([
                'status' => 'pending',
                'updated_at' => now(),
            ]);
        }, 3);

        $this->createPendingForOrderIfMissing($orderId);

        return $this->buildState($orderId);
    }

    /**
     * Demo-only flow: scanning the QR opens a tokenized URL on the backend.
     * The URL itself is the simulated "payment provider callback". No bank
     * account is touched and no money is transferred.
     */
    public function confirmByScan(int $orderId, string $token): array
    {
        $this->assertReady();

        if (!$this->isDemoScanMode()) {
            throw new RuntimeException('Chế độ quét QR mô phỏng hiện không được bật.');
        }

        $order = DB::table('orders')->where('id', $orderId)->first();
        $transaction = DB::table('payment_transactions')
            ->where('order_id', $orderId)
            ->where('provider', 'vietqr')
            ->orderByDesc('id')
            ->first();

        if (!$order || !$transaction || ($order->payment_method ?? '') !== 'bank') {
            throw new RuntimeException('Không tìm thấy giao dịch thanh toán QR.');
        }

        if (($order->status ?? '') === 'cancelled') {
            throw new RuntimeException('Đơn hàng đã hủy.');
        }

        $expectedToken = $this->scanToken($order, $transaction);

        if (!hash_equals($expectedToken, trim($token))) {
            throw new RuntimeException('Mã thanh toán không hợp lệ hoặc đã bị thay đổi.');
        }

        if (($order->payment_status ?? '') !== 'paid') {
            $providerTransactionNo = 'VQR-DEMO-' . strtoupper(substr(hash(
                'sha256',
                (string) $transaction->transaction_ref . '|' . $expectedToken
            ), 0, 18));

            $this->markPaid($orderId, $providerTransactionNo, [
                'mode' => 'demo_scan',
                'simulated' => true,
                'money_transferred' => false,
                'order_code' => (string) $order->order_code,
                'amount' => (float) ($transaction->amount ?? $order->grand_total ?? 0),
                'status' => 'paid',
                'reference' => $providerTransactionNo,
            ]);
        }

        return $this->buildState($orderId);
    }

    public function handleWebhook(array $payload, ?string $providedSecret): array
    {
        $this->assertReady();

        $secret = trim((string) config('services.vietqr.webhook_secret', ''));

        if ($secret === '' || !$providedSecret || !hash_equals($secret, trim($providedSecret))) {
            throw new RuntimeException('Webhook không hợp lệ.');
        }

        $status = strtolower(trim((string) ($payload['status'] ?? $payload['transaction_status'] ?? 'paid')));

        if (!in_array($status, ['paid', 'success', 'successful', 'completed', '00'], true)) {
            return [
                'processed' => false,
                'message' => 'Giao dịch chưa ở trạng thái thành công.',
            ];
        }

        $content = trim((string) ($payload['content'] ?? $payload['description'] ?? $payload['transfer_content'] ?? ''));
        $orderCode = trim((string) ($payload['order_code'] ?? ''));

        if ($orderCode === '' && preg_match('/DNV[A-Z0-9]{8,32}/i', $content, $match)) {
            $orderCode = strtoupper($match[0]);
        }

        if ($orderCode === '') {
            throw new RuntimeException('Không xác định được mã đơn hàng từ giao dịch.');
        }

        $order = DB::table('orders')->where('order_code', $orderCode)->first();

        if (!$order || ($order->payment_method ?? '') !== 'bank') {
            throw new RuntimeException('Không tìm thấy đơn QR phù hợp.');
        }

        $receivedAmount = (float) ($payload['amount'] ?? $payload['transfer_amount'] ?? 0);
        $expectedAmount = (float) ($order->grand_total ?? 0);

        if ($receivedAmount <= 0 || abs($receivedAmount - $expectedAmount) > 0.01) {
            throw new RuntimeException('Số tiền giao dịch không khớp với đơn hàng.');
        }

        $providerTransactionNo = trim((string) (
            $payload['transaction_id']
            ?? $payload['reference']
            ?? $payload['transaction_no']
            ?? $payload['id']
            ?? ''
        ));

        $this->markPaid(
            (int) $order->id,
            $providerTransactionNo !== '' ? $providerTransactionNo : null,
            $payload
        );

        return [
            'processed' => true,
            'message' => 'Thanh toán đã được ghi nhận.',
            'order_id' => (int) $order->id,
            'order_code' => (string) $order->order_code,
        ];
    }

    private function createPendingForOrderIfMissing(int $orderId): void
    {
        $exists = DB::table('payment_transactions')
            ->where('order_id', $orderId)
            ->where('provider', 'vietqr')
            ->exists();

        if (!$exists) {
            $this->createPendingForOrder($orderId);
        }
    }

    private function markPaid(int $orderId, ?string $providerTransactionNo, array $responsePayload): void
    {
        DB::transaction(function () use ($orderId, $providerTransactionNo, $responsePayload) {
            $transaction = DB::table('payment_transactions')
                ->where('order_id', $orderId)
                ->where('provider', 'vietqr')
                ->lockForUpdate()
                ->first();

            $order = DB::table('orders')->where('id', $orderId)->lockForUpdate()->first();

            if (!$transaction || !$order) {
                throw new RuntimeException('Không tìm thấy giao dịch QR.');
            }

            if (($transaction->status ?? '') === 'paid' && ($order->payment_status ?? '') === 'paid') {
                return;
            }

            if (($order->status ?? '') === 'cancelled') {
                throw new RuntimeException('Đơn hàng đã hủy.');
            }

            $expectedAmount = (float) ($order->grand_total ?? 0);
            $transactionAmount = (float) ($transaction->amount ?? 0);

            if (abs($expectedAmount - $transactionAmount) > 0.01) {
                throw new RuntimeException('Số tiền giao dịch không khớp với đơn hàng.');
            }

            if ($providerTransactionNo) {
                $duplicate = DB::table('payment_transactions')
                    ->where('provider', 'vietqr')
                    ->where('provider_transaction_no', $providerTransactionNo)
                    ->where('id', '<>', $transaction->id)
                    ->where('status', 'paid')
                    ->exists();

                if ($duplicate) {
                    throw new RuntimeException('Giao dịch đã được sử dụng cho đơn hàng khác.');
                }
            }

            DB::table('payment_transactions')->where('id', $transaction->id)->update([
                'provider_transaction_no' => $providerTransactionNo,
                'status' => 'paid',
                'response_payload' => json_encode($responsePayload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'paid_at' => now(),
                'updated_at' => now(),
            ]);

            $orderUpdate = [
                'payment_status' => 'paid',
                'updated_at' => now(),
            ];

            $fromStatus = strtolower((string) ($order->status ?? 'pending'));

            if ($fromStatus === 'pending') {
                $orderUpdate['status'] = 'confirmed';
            }

            DB::table('orders')->where('id', $orderId)->update($orderUpdate);

            if ($fromStatus === 'pending' && Schema::hasTable('order_status_histories')) {
                DB::table('order_status_histories')->insert([
                    'order_id' => $orderId,
                    'changed_by' => null,
                    'from_status' => 'pending',
                    'to_status' => 'confirmed',
                    'source' => 'payment',
                    'note' => $this->isDemoScanMode()
                        ? 'Thanh toán QR mô phỏng đã được xác nhận bằng lượt quét.'
                        : 'Thanh toán VietQR đã được xác nhận.',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }, 3);
    }

    private function buildState(int $orderId): array
    {
        $order = DB::table('orders')->where('id', $orderId)->first();
        $transaction = DB::table('payment_transactions')
            ->where('order_id', $orderId)
            ->where('provider', 'vietqr')
            ->orderByDesc('id')
            ->first();

        if (!$order || !$transaction) {
            throw new RuntimeException('Không tìm thấy giao dịch QR.');
        }

        $requestPayload = $this->decodePayload($transaction->request_payload ?? null);
        $transferContent = (string) ($requestPayload['transfer_content'] ?? $order->order_code);
        $amount = (float) ($transaction->amount ?? $order->grand_total ?? 0);
        $demoMode = $this->isDemoScanMode();

        if ($demoMode) {
            $scanUrl = $this->buildDemoScanUrl($order, $transaction);
            $bank = [
                'name' => 'DYNOVA PAY DEMO',
                'code' => 'DEMO',
                'account_number' => 'KHONG-CHUYEN-TIEN',
                'account_name' => 'DYNOVA SPORT DEMO',
                'branch' => 'Môi trường mô phỏng',
            ];
            $qrUrl = $this->buildDemoQrImageUrl($scanUrl);
        } else {
            $settings = $this->bankSettings();
            $bank = [
                'name' => $settings['bank_name'],
                'code' => $settings['bank_code'],
                'account_number' => $settings['account_number'],
                'account_name' => $settings['account_name'],
                'branch' => $settings['branch'],
            ];
            $qrUrl = $this->buildBankQrUrl($settings, $amount, $transferContent);
            $scanUrl = null;
        }

        return [
            'order_id' => (int) $order->id,
            'order_code' => (string) $order->order_code,
            'order_status' => (string) $order->status,
            'payment_status' => (string) $order->payment_status,
            'transaction_status' => (string) $transaction->status,
            'transaction_ref' => (string) $transaction->transaction_ref,
            'provider_transaction_no' => $transaction->provider_transaction_no ?? null,
            'amount' => $amount,
            'transfer_content' => $transferContent,
            'qr_url' => $qrUrl,
            'payment_mode' => $demoMode ? 'demo_scan' : 'bank',
            'simulated' => $demoMode,
            'money_transfer_required' => !$demoMode,
            'demo_scan_local_only' => $demoMode ? $this->isLocalOnlyUrl($scanUrl) : false,
            'bank' => $bank,
            'paid_at' => $transaction->paid_at ?? null,
        ];
    }

    private function assertOrderAccess(int $orderId, ?int $userId): void
    {
        $query = DB::table('orders')->where('id', $orderId);

        if ($userId !== null) {
            $query->where('user_id', $userId);
        }

        $order = $query->first();

        if (!$order) {
            throw new RuntimeException('Không tìm thấy đơn hàng.');
        }

        if (($order->payment_method ?? '') !== 'bank') {
            throw new RuntimeException('Đơn hàng không sử dụng thanh toán QR.');
        }
    }

    private function bankSettings(): array
    {
        if (!Schema::hasTable('settings')) {
            throw ValidationException::withMessages([
                'payment' => 'VietQR chưa được cấu hình.',
            ]);
        }

        $settings = DB::table('settings')->orderBy('id')->first();

        $bankName = trim((string) ($settings->bank_name ?? ''));
        $bankCode = trim((string) ($settings->bank_code ?? ''));
        $accountNumber = preg_replace('/\s+/', '', (string) ($settings->bank_account_number ?? ''));
        $accountName = trim((string) ($settings->bank_account_name ?? ''));
        $branch = trim((string) ($settings->bank_branch ?? ''));

        if ($bankName === '' || $bankCode === '' || $accountNumber === '' || $accountName === '') {
            throw ValidationException::withMessages([
                'payment' => 'VietQR chưa được cấu hình đầy đủ.',
            ]);
        }

        return [
            'bank_name' => $bankName,
            'bank_code' => $bankCode,
            'account_number' => $accountNumber,
            'account_name' => $accountName,
            'branch' => $branch,
        ];
    }

    private function buildBankQrUrl(array $settings, float $amount, string $transferContent): string
    {
        $baseUrl = rtrim((string) config('services.vietqr.image_base_url', 'https://img.vietqr.io/image'), '/');
        $bankCode = rawurlencode($settings['bank_code']);
        $accountNumber = rawurlencode($settings['account_number']);
        $params = http_build_query([
            'amount' => max(1, (int) round($amount)),
            'addInfo' => $transferContent,
            'accountName' => $settings['account_name'],
        ], '', '&', PHP_QUERY_RFC3986);

        return "{$baseUrl}/{$bankCode}-{$accountNumber}-compact2.png?{$params}";
    }

    private function buildDemoScanUrl(object $order, object $transaction): string
    {
        $baseUrl = $this->demoScanBaseUrl();
        $token = $this->scanToken($order, $transaction);

        return $baseUrl
            . '/api/payments/vietqr/scan/'
            . rawurlencode((string) $order->id)
            . '/'
            . rawurlencode($token);
    }

    private function buildDemoQrImageUrl(string $scanUrl): string
    {
        $baseUrl = rtrim((string) config('services.vietqr.demo_qr_image_url', 'https://quickchart.io/qr'), '?&');
        $params = http_build_query([
            'text' => $scanUrl,
            'size' => 360,
            'margin' => 2,
            'ecLevel' => 'M',
            'format' => 'png',
        ], '', '&', PHP_QUERY_RFC3986);

        return $baseUrl . '?' . $params;
    }

    private function scanToken(object $order, object $transaction): string
    {
        $secret = trim((string) config('services.vietqr.demo_scan_secret', ''));

        if ($secret === '') {
            $secret = (string) config('app.key', 'dynova-demo-scan-secret');
        }

        $payload = implode('|', [
            (string) $order->id,
            (string) $order->order_code,
            (string) $transaction->transaction_ref,
            number_format((float) ($transaction->amount ?? $order->grand_total ?? 0), 2, '.', ''),
        ]);

        return hash_hmac('sha256', $payload, $secret);
    }

    private function demoScanBaseUrl(): string
    {
        $configured = trim((string) config('services.vietqr.demo_scan_base_url', ''));

        if ($configured !== '') {
            return rtrim($configured, '/');
        }

        $appUrl = rtrim((string) config('app.url', 'http://127.0.0.1:8000'), '/');
        $scheme = parse_url($appUrl, PHP_URL_SCHEME) ?: 'http';
        $port = parse_url($appUrl, PHP_URL_PORT) ?: 8000;

        $host = gethostbyname(gethostname());

        if (
            $host
            && filter_var($host, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)
            && !str_starts_with($host, '127.')
        ) {
            return $scheme . '://' . $host . ':' . $port;
        }

        return $appUrl;
    }

    private function isLocalOnlyUrl(?string $url): bool
    {
        if (!$url) {
            return true;
        }

        $host = strtolower((string) parse_url($url, PHP_URL_HOST));

        return in_array($host, ['localhost', '127.0.0.1', '::1'], true);
    }

    private function isDemoScanMode(): bool
    {
        $environment = strtolower((string) config('services.vietqr.environment', 'demo'));
        $enabled = (bool) config('services.vietqr.demo_scan_enabled', false);

        return $enabled && in_array($environment, ['demo', 'development', 'local', 'testing'], true);
    }

    private function decodePayload(mixed $value): array
    {
        if (is_array($value)) {
            return $value;
        }

        $decoded = json_decode((string) $value, true);

        return is_array($decoded) ? $decoded : [];
    }

    private function assertReady(): void
    {
        if (!Schema::hasTable('orders') || !Schema::hasTable('payment_transactions')) {
            throw new RuntimeException('Hệ thống thanh toán chưa sẵn sàng.');
        }
    }
}