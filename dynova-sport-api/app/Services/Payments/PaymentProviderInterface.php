<?php
namespace App\Services\Payments;
interface PaymentProviderInterface
{
    public function createPendingForOrder(int $orderId): void;
    public function stateForOrder(int $orderId, ?int $userId = null): array;
    public function refreshForOrder(int $orderId, ?int $userId = null): array;
    public function confirmScan(int $orderId, string $token): array;
}