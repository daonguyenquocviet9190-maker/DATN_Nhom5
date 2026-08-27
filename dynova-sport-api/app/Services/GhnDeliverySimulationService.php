<?php

namespace App\Services;

use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use RuntimeException;

class GhnDeliverySimulationService
{
    public function state(int $orderId, bool $tick = true): array
    {
        $order = DB::table('orders')->where('id', $orderId)->first();

        if (!$order) {
            throw new RuntimeException('Không tìm thấy đơn hàng.');
        }

        if (!$this->columnsReady()) {
            return $this->disabledState('Theo dõi vận chuyển chưa sẵn sàng.');
        }

        if ($tick && $this->isStaging()) {
            $order = $this->tick($orderId);
        }

        $duration = max(60, (int) ($order->ghn_simulation_duration_seconds ?? $this->defaultDuration()));
        $speed = $this->normalizeSpeed((float) ($order->ghn_simulation_speed ?? $this->defaultSpeed()));
        $elapsed = max(0.0, (float) ($order->ghn_simulation_elapsed_seconds ?? 0));
        $progress = max(0.0, min(100.0, (float) ($order->ghn_simulation_progress ?? 0)));
        $status = (string) ($order->ghn_simulation_status ?? 'idle');
        $currentStatus = $this->statusForProgress($progress);

        return [
            'enabled' => $this->isStaging(),
            'auto_start' => (bool) config('services.ghn.simulation_auto_start', true),
            'status' => $status,
            'running' => $status === 'running',
            'paused' => $status === 'paused',
            'completed' => $status === 'completed',
            'progress' => round($progress, 2),
            'elapsed_seconds' => round($elapsed, 2),
            'duration_seconds' => $duration,
            'speed' => $speed,
            'current_status' => $currentStatus,
            'current_status_label' => $this->statusLabel($currentStatus),
            'started_at' => $order->ghn_simulation_started_at ?? null,
            'paused_at' => $order->ghn_simulation_paused_at ?? null,
            'server_time' => now()->toIso8601String(),
        ];
    }

    public function startIfIdle(int $orderId): array
    {
        if (!$this->isStaging() || !(bool) config('services.ghn.simulation_auto_start', true)) {
            return $this->state($orderId, false);
        }

        if (!$this->columnsReady()) {
            return $this->state($orderId, false);
        }

        $order = DB::table('orders')->where('id', $orderId)->first();

        if (!$order || empty($order->tracking_code)) {
            return $this->state($orderId, false);
        }

        $status = (string) ($order->ghn_simulation_status ?? 'idle');

        if (in_array($status, ['running', 'paused', 'completed'], true)) {
            return $this->state($orderId, true);
        }

        return $this->control($orderId, 'start');
    }

    public function control(int $orderId, string $action, array $options = []): array
    {
        if (!$this->isStaging()) {
            throw new RuntimeException('Chức năng theo dõi tự động không khả dụng trong môi trường hiện tại.');
        }

        if (!$this->columnsReady()) {
            throw new RuntimeException('Theo dõi vận chuyển chưa sẵn sàng.');
        }

        $action = strtolower(trim($action));
        $allowed = ['start', 'pause', 'resume', 'speed'];

        if (!in_array($action, $allowed, true)) {
            throw new RuntimeException('Thao tác vận chuyển không hợp lệ.');
        }


        $order = DB::table('orders')->where('id', $orderId)->first();

        if (!$order) {
            throw new RuntimeException('Không tìm thấy đơn hàng.');
        }

        if (empty($order->tracking_code)) {
            throw new RuntimeException('Đơn hàng chưa có mã vận đơn GHN.');
        }

        $orderStatus = strtolower((string) ($order->status ?? ''));
        $simulationStatus = strtolower((string) ($order->ghn_simulation_status ?? 'idle'));
        $simulationProgress = (float) ($order->ghn_simulation_progress ?? 0);

        if ($orderStatus === 'completed' || $simulationStatus === 'completed' || $simulationProgress >= 100) {
            throw new RuntimeException('Đơn hàng đã hoàn thành và không thể khởi động lại hành trình giao hàng.');
        }

        if ($orderStatus === 'cancelled') {
            throw new RuntimeException('Đơn hàng đã hủy và không thể tiếp tục vận chuyển.');
        }

        if ($orderStatus !== 'shipping') {
            throw new RuntimeException('Đơn hàng chưa ở trạng thái đang giao.');
        }

        if ($action === 'start') {
            if ($simulationStatus !== 'idle' || $simulationProgress > 0) {
                throw new RuntimeException('Hành trình giao hàng đã được khởi tạo.');
            }

            $duration = max(60, min(1800, (int) ($options['duration_seconds'] ?? $this->defaultDuration())));
            $speed = $this->normalizeSpeed((float) ($options['speed'] ?? $this->defaultSpeed()));

            DB::table('orders')->where('id', $orderId)->update([
                'ghn_simulation_status' => 'running',
                'ghn_simulation_started_at' => now(),
                'ghn_simulation_paused_at' => null,
                'ghn_simulation_elapsed_seconds' => 0,
                'ghn_simulation_duration_seconds' => $duration,
                'ghn_simulation_speed' => $speed,
                'ghn_simulation_progress' => 0,
                'ghn_simulation_updated_at' => now(),
                'ghn_status' => 'ready_to_pick',
                'updated_at' => now(),
            ]);

            $this->ensureStageEvent($orderId, (string) $order->tracking_code, 'ready_to_pick', now());
            return $this->state($orderId, true);
        }

        $order = $this->tick($orderId);
        $status = (string) ($order->ghn_simulation_status ?? 'idle');

        if ($action === 'pause') {
            if ($status === 'running') {
                DB::table('orders')->where('id', $orderId)->update([
                    'ghn_simulation_status' => 'paused',
                    'ghn_simulation_started_at' => null,
                    'ghn_simulation_paused_at' => now(),
                    'ghn_simulation_updated_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            return $this->state($orderId, false);
        }

        if ($action === 'resume') {
            if ($status !== 'completed') {
                DB::table('orders')->where('id', $orderId)->update([
                    'ghn_simulation_status' => 'running',
                    'ghn_simulation_started_at' => now(),
                    'ghn_simulation_paused_at' => null,
                    'ghn_simulation_updated_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            return $this->state($orderId, true);
        }

        if ($action === 'speed') {
            $speed = $this->normalizeSpeed((float) ($options['speed'] ?? 1));
            $payload = [
                'ghn_simulation_speed' => $speed,
                'ghn_simulation_updated_at' => now(),
                'updated_at' => now(),
            ];

            if ($status === 'running') {
                $payload['ghn_simulation_started_at'] = now();
            }

            DB::table('orders')->where('id', $orderId)->update($payload);
            return $this->state($orderId, true);
        }

        return $this->state($orderId, false);
    }

    public function tick(int $orderId): object
    {
        $order = DB::table('orders')->where('id', $orderId)->first();

        if (!$order || !$this->columnsReady()) {
            return $order;
        }

        $status = (string) ($order->ghn_simulation_status ?? 'idle');

        if ($status !== 'running') {
            return $order;
        }

        $duration = max(60, (int) ($order->ghn_simulation_duration_seconds ?? $this->defaultDuration()));
        $speed = $this->normalizeSpeed((float) ($order->ghn_simulation_speed ?? $this->defaultSpeed()));
        $storedElapsed = max(0.0, (float) ($order->ghn_simulation_elapsed_seconds ?? 0));
        $startedAt = $order->ghn_simulation_started_at ? Carbon::parse($order->ghn_simulation_started_at) : now();
        $segmentSeconds = max(0.0, $startedAt->diffInMilliseconds(now()) / 1000);
        $elapsed = min((float) $duration, $storedElapsed + ($segmentSeconds * $speed));
        $progress = min(100.0, ($elapsed / $duration) * 100);
        $previousProgress = max(0.0, min(100.0, (float) ($order->ghn_simulation_progress ?? 0)));
        $currentStatus = $this->statusForProgress($progress);
        $trackingCode = (string) ($order->tracking_code ?? '');

        $this->persistCrossedStages($orderId, $trackingCode, $previousProgress, $progress);

        $simulationStatus = $progress >= 100 ? 'completed' : 'running';

        DB::table('orders')->where('id', $orderId)->update([
            'ghn_simulation_status' => $simulationStatus,
            'ghn_simulation_started_at' => $progress >= 100 ? null : now(),
            'ghn_simulation_paused_at' => null,
            'ghn_simulation_elapsed_seconds' => $elapsed,
            'ghn_simulation_progress' => $progress,
            'ghn_simulation_updated_at' => now(),
            'ghn_status' => $currentStatus,
            'ghn_last_synced_at' => now(),
            'updated_at' => now(),
        ]);

        if ($progress >= 100) {
            $this->completeOrder($orderId);
        }

        return DB::table('orders')->where('id', $orderId)->first() ?? $order;
    }

    private function persistCrossedStages(int $orderId, string $trackingCode, float $previousProgress, float $progress): void
    {
        foreach ($this->stages() as $stage) {
            $threshold = (float) $stage['progress'];

            if ($threshold <= 0 || $threshold <= $previousProgress || $threshold > $progress) {
                continue;
            }

            $this->ensureStageEvent($orderId, $trackingCode, $stage['status'], now());
        }
    }

    private function ensureStageEvent(int $orderId, string $trackingCode, string $status, CarbonInterface $occurredAt): void
    {
        if (!Schema::hasTable('shipping_status_histories')) {
            return;
        }

        $eventQuery = DB::table('shipping_status_histories')
            ->where('order_id', $orderId)
            ->where('status', $status);

        if (Schema::hasColumn('shipping_status_histories', 'source')) {
            $eventQuery->where('source', 'ghn_auto_simulator');
        }

        $exists = $eventQuery->exists();

        if ($exists) {
            return;
        }

        $payload = [
            'order_id' => $orderId,
            'provider' => 'ghn',
            'tracking_code' => $trackingCode ?: null,
            'status' => $status,
            'description' => $this->statusLabel($status),
            'payload' => json_encode([
                'status' => $status,
                'progress' => $this->progressForStatus($status),
                'environment' => 'staging',
            ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'occurred_at' => $occurredAt,
            'created_at' => now(),
            'updated_at' => now(),
        ];

        if (Schema::hasColumn('shipping_status_histories', 'source')) {
            $payload['source'] = 'ghn_auto_simulator';
        }

        if (Schema::hasColumn('shipping_status_histories', 'location')) {
            $payload['location'] = $this->locationForStatus($status);
        }

        if (Schema::hasColumn('shipping_status_histories', 'is_simulated')) {
            $payload['is_simulated'] = true;
        }

        DB::table('shipping_status_histories')->insert($payload);
    }

    private function completeOrder(int $orderId): void
    {
        DB::transaction(function () use ($orderId) {
            $order = DB::table('orders')->where('id', $orderId)->lockForUpdate()->first();

            if (!$order || in_array((string) ($order->status ?? ''), ['completed', 'cancelled'], true)) {
                return;
            }

            $updates = [
                'status' => 'completed',
                'updated_at' => now(),
            ];

            if (Schema::hasColumn('orders', 'completed_at')) {
                $updates['completed_at'] = now();
            }

            if (($order->payment_method ?? '') === 'cod' && Schema::hasColumn('orders', 'payment_status')) {
                $updates['payment_status'] = 'paid';
            }

            DB::table('orders')->where('id', $orderId)->update($updates);

            if (Schema::hasTable('order_status_histories')) {
                DB::table('order_status_histories')->insert([
                    'order_id' => $orderId,
                    'changed_by' => null,
                    'from_status' => $order->status,
                    'to_status' => 'completed',
                    'source' => 'ghn_auto_simulator',
                    'note' => 'Giao hàng thành công.',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }, 3);
    }

    private function statusForProgress(float $progress): string
    {
        $current = 'ready_to_pick';

        foreach ($this->stages() as $stage) {
            if ($progress >= $stage['progress']) {
                $current = $stage['status'];
            }
        }

        return $current;
    }

    private function progressForStatus(string $status): float
    {
        foreach ($this->stages() as $stage) {
            if ($stage['status'] === $status) {
                return (float) $stage['progress'];
            }
        }

        return 0;
    }

    private function stages(): array
    {
        return [
            ['progress' => 0, 'status' => 'ready_to_pick'],
            ['progress' => 8, 'status' => 'picking'],
            ['progress' => 18, 'status' => 'picked'],
            ['progress' => 30, 'status' => 'storing'],
            ['progress' => 45, 'status' => 'transporting'],
            ['progress' => 62, 'status' => 'sorting'],
            ['progress' => 76, 'status' => 'delivering'],
            ['progress' => 100, 'status' => 'delivered'],
        ];
    }

    private function statusLabel(string $status): string
    {
        return match ($status) {
            'ready_to_pick' => 'Đã tạo vận đơn, chờ GHN lấy hàng',
            'picking' => 'Nhân viên GHN đang đến lấy hàng',
            'picked' => 'GHN đã lấy hàng',
            'storing' => 'Hàng đã vào kho GHN',
            'transporting' => 'Hàng đang được trung chuyển',
            'sorting' => 'Hàng đang được phân loại tại kho',
            'delivering' => 'Nhân viên GHN đang giao hàng',
            'delivered' => 'Giao hàng thành công',
            default => strtoupper($status),
        };
    }

    private function locationForStatus(string $status): string
    {
        return match ($status) {
            'ready_to_pick', 'picking' => 'Điểm lấy hàng Dynova Sport',
            'picked', 'storing' => 'Kho GHN khu vực người gửi',
            'transporting' => 'Tuyến trung chuyển GHN',
            'sorting' => 'Trung tâm phân loại GHN',
            'delivering' => 'Khu vực giao hàng người nhận',
            'delivered' => 'Địa chỉ nhận hàng',
            default => 'GHN',
        };
    }

    private function columnsReady(): bool
    {
        return Schema::hasTable('orders')
            && Schema::hasColumn('orders', 'ghn_simulation_status')
            && Schema::hasColumn('orders', 'ghn_simulation_started_at')
            && Schema::hasColumn('orders', 'ghn_simulation_elapsed_seconds')
            && Schema::hasColumn('orders', 'ghn_simulation_duration_seconds')
            && Schema::hasColumn('orders', 'ghn_simulation_speed')
            && Schema::hasColumn('orders', 'ghn_simulation_progress');
    }

    private function isStaging(): bool
    {
        $environment = strtolower((string) config('services.ghn.environment', 'staging'));
        return in_array($environment, ['staging', 'stage', 'test', 'testing', 'dev', 'development'], true);
    }

    private function defaultDuration(): int
    {
        return max(60, min(1800, (int) config('services.ghn.simulation_duration_seconds', 240)));
    }

    private function defaultSpeed(): float
    {
        return $this->normalizeSpeed((float) config('services.ghn.simulation_speed', 1));
    }

    private function normalizeSpeed(float $speed): float
    {
        return max(0.5, min(8.0, round($speed, 2)));
    }

    private function disabledState(string $message): array
    {
        return [
            'enabled' => false,
            'auto_start' => false,
            'status' => 'disabled',
            'running' => false,
            'paused' => false,
            'completed' => false,
            'progress' => 0,
            'elapsed_seconds' => 0,
            'duration_seconds' => $this->defaultDuration(),
            'speed' => $this->defaultSpeed(),
            'current_status' => null,
            'current_status_label' => 'Chưa sẵn sàng',
            'started_at' => null,
            'paused_at' => null,
            'server_time' => now()->toIso8601String(),
            'message' => $message,
        ];
    }
}