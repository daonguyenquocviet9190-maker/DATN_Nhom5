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
                throw new RuntimeException('Đơn hàng không sử dụng VietQR.');
            }

            $existing = DB::table('payment_transactions')
                ->where('order_id', $orderId)
                ->where('provider', 'vietqr')
                ->lockForUpdate()
                ->first();

            if ($existing) {
                return;
            }

            $settings = $this->bankSettings();

            $requestPayload = [
                'order_code' => $order->order_code,
                'transfer_content' => $order->order_code,
                'payment_mode' => 'bank',
                'bank_code' => $settings['bank_code'],
                'account_number' => $settings['account_number'],
            ];

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
                throw new RuntimeException('Đơn hàng không sử dụng VietQR.');
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
            throw new RuntimeException('Không tìm thấy đơn VietQR phù hợp.');
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
                throw new RuntimeException('Không tìm thấy giao dịch VietQR.');
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
                    'note' => 'Thanh toán VietQR đã được xác nhận.',
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
            throw new RuntimeException('Không tìm thấy giao dịch VietQR.');
        }

        $requestPayload = $this->decodePayload($transaction->request_payload ?? null);
        $transferContent = (string) ($requestPayload['transfer_content'] ?? $order->order_code);
        $amount = (float) ($transaction->amount ?? $order->grand_total ?? 0);
        $settings = $this->bankSettings();

        $bank = [
            'name' => $settings['bank_name'],
            'code' => $settings['bank_code'],
            'account_number' => $settings['account_number'],
            'account_name' => $settings['account_name'],
            'branch' => $settings['branch'],
        ];

        $qrUrl = $this->buildBankQrUrl($settings, $amount, $transferContent);

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
            'payment_mode' => 'bank',
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
            throw new RuntimeException('Đơn hàng không sử dụng VietQR.');
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
