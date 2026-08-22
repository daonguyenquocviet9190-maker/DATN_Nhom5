<?php

namespace App\Services;

use Illuminate\Support\Carbon;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use RuntimeException;

class ShippingService
{
    public function settings(): array
    {
        $defaults = [
            'free_shipping_threshold' => 500000,
            'default_shipping_fee' => 30000,
        ];

        if (!Schema::hasTable('settings')) {
            return $defaults;
        }

        $row = DB::table('settings')->first();
        if (!$row) {
            return $defaults;
        }

        return [
            'free_shipping_threshold' => (float) ($row->free_shipping_threshold ?? $defaults['free_shipping_threshold']),
            'default_shipping_fee' => (float) ($row->default_shipping_fee ?? $defaults['default_shipping_fee']),
        ];
    }

    public function configured(): bool
    {
        if (!filled(config('services.ghn.token')) || !filled(config('services.ghn.shop_id'))) {
            return false;
        }

        try {
            $this->baseUrl();
            return true;
        } catch (\Throwable) {
            return false;
        }
    }

    public function configurationStatus(): array
    {
        $configurationError = null;
        $baseUrl = null;

        try {
            $baseUrl = $this->baseUrl();
        } catch (\Throwable $e) {
            $configurationError = $e->getMessage();
        }

        return [
            'configured' => $this->configured(),
            'environment' => $this->environment(),
            'base_url' => $baseUrl,
            'configuration_error' => $configurationError,
            'production_mutations_enabled' => (bool) config('services.ghn.production_enabled', false),
            'shop_id_configured' => filled(config('services.ghn.shop_id')),
            'client_id_configured' => filled(config('services.ghn.client_id')),
            'token_configured' => filled(config('services.ghn.token')),
            'verify_ssl' => (bool) config('services.ghn.verify_ssl', true),
            'connect_timeout' => (int) config('services.ghn.connect_timeout', 10),
            'timeout' => (int) config('services.ghn.timeout', 30),
            'insurance_value_limit' => $this->insuranceValue(PHP_INT_MAX),
            'webhook_configured' => filled(config('services.ghn.webhook_secret')),
        ];
    }

    public function calculate(array $address, float $subtotal, int $weight = 500): array
    {
        $this->assertConfigured();

        $toDistrictId = $address['districtCode'] ?? $address['district_code'] ?? null;
        $toWardCode = $address['wardCode'] ?? $address['ward_code'] ?? null;

        if (!$toDistrictId || !$toWardCode) {
            throw new RuntimeException('Vui lòng chọn địa chỉ từ danh sách Giao Hàng Nhanh.');
        }

        $pickup = $this->pickupLocation();
        $service = $this->resolveService((int) $toDistrictId, $pickup);
        $shippingWeight = $this->validateShippingWeight($weight);

        $payload = [
            'to_district_id' => (int) $toDistrictId,
            'to_ward_code' => (string) $toWardCode,
            'weight' => $shippingWeight,
            'insurance_value' => $this->insuranceValue($subtotal),
            'length' => $this->defaultLength(),
            'width' => $this->defaultWidth(),
            'height' => $this->defaultHeight(),
            'items' => [[
                'name' => 'Đơn hàng Dynova Sport',
                'quantity' => 1,
                'weight' => $shippingWeight,
                'length' => $this->defaultLength(),
                'width' => $this->defaultWidth(),
                'height' => $this->defaultHeight(),
            ]],
        ];

        if (!empty($pickup['district_id'])) {
            $payload['from_district_id'] = (int) $pickup['district_id'];
        }
        if (!empty($pickup['ward_code'])) {
            $payload['from_ward_code'] = (string) $pickup['ward_code'];
        }

        if (!empty($service['service_id'])) {
            $payload['service_id'] = (int) $service['service_id'];
        } else {
            $payload['service_type_id'] = (int) $service['service_type_id'];
        }

        $json = $this->request('POST', '/shiip/public-api/v2/shipping-order/fee', $payload, true);
        $carrierFee = (float) data_get($json, 'data.total', data_get($json, 'data.service_fee', 0));

        if ($carrierFee < 0) {
            throw new RuntimeException('Phí vận chuyển GHN trả về không hợp lệ.');
        }

        $settings = $this->settings();
        $freeShipping = $subtotal >= (float) $settings['free_shipping_threshold'];

        return [
            'fee' => $freeShipping ? 0.0 : $carrierFee,
            'carrier_fee' => $carrierFee,
            'provider' => 'ghn',
            'free_shipping' => $freeShipping,
            'service_id' => $service['service_id'],
            'service_type_id' => $service['service_type_id'],
            'service_name' => $service['short_name'] ?? 'GHN',
            'raw' => data_get($json, 'data', []),
        ];
    }

    public function provinces(): array
    {
        $this->assertConfigured();
        return $this->masterData('/shiip/public-api/master-data/province', []);
    }

    public function districts(int $provinceId): array
    {
        $this->assertConfigured();
        return $this->masterData('/shiip/public-api/master-data/district', ['province_id' => $provinceId]);
    }

    public function wards(int $districtId): array
    {
        $this->assertConfigured();
        return $this->masterData('/shiip/public-api/master-data/ward', ['district_id' => $districtId]);
    }

    public function availableServices(int $toDistrictId, ?array $pickup = null): array
    {
        $this->assertConfigured();

        $pickup ??= $this->pickupLocation();
        $fromDistrictId = (int) ($pickup['district_id'] ?? 0);

        if ($fromDistrictId <= 0) {
            throw new RuntimeException('Cửa hàng GHN chưa có Quận/Huyện lấy hàng hợp lệ. Vui lòng kiểm tra địa chỉ cửa hàng trên GHN.');
        }

        $json = $this->request('POST', '/shiip/public-api/v2/shipping-order/available-services', [
            'shop_id' => (int) config('services.ghn.shop_id'),
            'from_district' => $fromDistrictId,
            'to_district' => $toDistrictId,
        ], false);

        return (array) data_get($json, 'data', []);
    }

    public function createOrderForOrder(int $orderId): array
    {
        $this->assertConfigured();
        $this->assertMutationAllowed('tạo vận đơn');

        $order = DB::table('orders')->where('id', $orderId)->first();
        if (!$order) {
            throw new RuntimeException('Không tìm thấy đơn hàng để tạo vận đơn GHN.');
        }

        if (!empty($order->tracking_code)) {
            $tracking = $this->tracking((string) $order->tracking_code);
            if ($tracking) {
                return $tracking;
            }
        }

        $existing = $this->findByClientOrderCode((string) $order->order_code);
        if ($existing && !empty($existing['order_code'])) {
            $this->persistTracking($orderId, $existing, null);
            return $existing;
        }

        $items = DB::table('order_items')->where('order_id', $orderId)->orderBy('id')->get();
        if ($items->isEmpty()) {
            throw new RuntimeException('Đơn hàng chưa có sản phẩm để tạo vận đơn GHN.');
        }

        $weight = (int) ($order->shipping_weight_grams ?? 0);
        if ($weight <= 0) {
            $weight = $items->sum(fn ($item) => max(1, (int) ($item->quantity ?? 1)) * $this->defaultItemWeight());
        }
        $weight = $this->validateShippingWeight($weight);

        $toDistrictId = (int) ($order->district_code ?? 0);
        $toWardCode = trim((string) ($order->ward_code ?? ''));

        if ($toDistrictId <= 0 || $toWardCode === '') {
            throw new RuntimeException('Đơn hàng thiếu mã Quận/Huyện hoặc Phường/Xã của GHN. Vui lòng kiểm tra lại địa chỉ nhận hàng của đơn.');
        }

        // Xác minh điểm lấy hàng trước khi gọi API tạo vận đơn.
        // Nếu .env có GHN_FROM_DISTRICT_ID/GHN_FROM_WARD_CODE thì dùng cấu hình đó;
        // nếu không, dịch vụ tự đọc địa chỉ từ Shop ID GHN.
        $pickup = $this->pickupLocation();

        $service = [
            'service_id' => !empty($order->ghn_service_id) ? (int) $order->ghn_service_id : null,
            'service_type_id' => !empty($order->ghn_service_type_id)
                ? (int) $order->ghn_service_type_id
                : (int) config('services.ghn.service_type_id', 2),
        ];

        if (!$service['service_id'] && $toDistrictId > 0) {
            $service = array_merge($service, $this->resolveService($toDistrictId, $pickup));
        }

        $codAmount = 0;
        if (($order->payment_method ?? '') === 'cod' && ($order->payment_status ?? '') !== 'paid') {
            $codAmount = max(0, (int) round((float) ($order->grand_total ?? 0)));
            if ($codAmount > 10000000) {
                throw new RuntimeException('GHN chỉ hỗ trợ COD tối đa 10.000.000đ cho cấu hình này. Vui lòng chọn thanh toán online/chuyển khoản.');
            }
        }

        $payload = [
            'payment_type_id' => (int) config('services.ghn.payment_type_id', 1),
            'required_note' => (string) config('services.ghn.required_note', 'CHOXEMHANGKHONGTHU'),
            'client_order_code' => (string) $order->order_code,
            'to_name' => (string) $order->customer_name,
            'to_phone' => (string) $order->customer_phone,
            'to_address' => (string) $order->shipping_address,
            'cod_amount' => $codAmount,
            'content' => $items->pluck('product_name')->filter()->take(5)->implode(', '),
            'note' => (string) ($order->note ?? ''),
            'weight' => $weight,
            'length' => (int) ($order->shipping_length_cm ?? $this->defaultLength()),
            'width' => (int) ($order->shipping_width_cm ?? $this->defaultWidth()),
            'height' => (int) ($order->shipping_height_cm ?? $this->defaultHeight()),
            'insurance_value' => $this->insuranceValue((float) (($order->subtotal ?? 0) - ($order->discount_amount ?? 0))),
            'items' => $items->map(function ($item) {
                return [
                    'name' => mb_substr((string) ($item->product_name ?? 'Sản phẩm'), 0, 200),
                    'code' => mb_substr((string) ($item->sku ?? ('SP-' . $item->product_id)), 0, 50),
                    'quantity' => max(1, (int) ($item->quantity ?? 1)),
                    'price' => max(0, (int) round((float) ($item->price ?? 0))),
                    'weight' => $this->defaultItemWeight(),
                    'length' => $this->defaultLength(),
                    'width' => $this->defaultWidth(),
                    'height' => $this->defaultHeight(),
                ];
            })->values()->all(),
        ];

        $payload['to_district_id'] = $toDistrictId;
        $payload['to_ward_code'] = $toWardCode;

        if (!empty($service['service_id'])) {
            $payload['service_id'] = (int) $service['service_id'];
        } else {
            $payload['service_type_id'] = (int) ($service['service_type_id'] ?: 2);
        }

        $json = $this->request('POST', '/shiip/public-api/v2/shipping-order/create', $payload, true);
        $data = (array) data_get($json, 'data', []);
        $trackingCode = (string) ($data['order_code'] ?? '');

        if ($trackingCode === '') {
            throw new RuntimeException('GHN không trả về mã vận đơn.');
        }

        $tracking = [
            'order_code' => $trackingCode,
            'status' => 'ready_to_pick',
            'status_label' => $this->statusLabel('ready_to_pick'),
            'leadtime' => $data['expected_delivery_time'] ?? null,
            'expected_delivery_time' => $data['expected_delivery_time'] ?? null,
            'created_date' => now()->toIso8601String(),
            'updated_date' => now()->toIso8601String(),
            'logs' => [[
                'status' => 'ready_to_pick',
                'status_label' => $this->statusLabel('ready_to_pick'),
                'updated_date' => now()->toIso8601String(),
            ]],
            'fee' => $data['fee'] ?? null,
            'total_fee' => isset($data['total_fee']) ? (float) $data['total_fee'] : null,
            'raw' => $data,
        ];

        $this->persistTracking($orderId, $tracking, $json);
        $this->recordShippingEvent($orderId, $trackingCode, 'ready_to_pick', 'GHN đã tiếp nhận yêu cầu giao hàng.', now(), $data);

        return $tracking;
    }

    public function tracking(?string $trackingCode): ?array
    {
        if (!$trackingCode) {
            return null;
        }

        $this->assertConfigured();
        $json = $this->request('POST', '/shiip/public-api/v2/shipping-order/detail', [
            'order_code' => $trackingCode,
        ], false);

        $data = (array) data_get($json, 'data', []);
        return $this->normalizeTracking($data, $trackingCode);
    }

    public function syncOrderTracking(int $orderId): ?array
    {
        $order = DB::table('orders')->where('id', $orderId)->first();
        if (!$order || empty($order->tracking_code)) {
            return null;
        }

        $tracking = $this->tracking((string) $order->tracking_code);
        if (!$tracking) {
            return null;
        }

        $this->persistTracking($orderId, $tracking, $tracking['raw'] ?? null);
        $this->syncInternalOrderFromGhn($order, $tracking);

        foreach ((array) ($tracking['logs'] ?? []) as $entry) {
            $this->recordShippingEvent(
                $orderId,
                (string) $order->tracking_code,
                (string) ($entry['status'] ?? ''),
                (string) ($entry['status_label'] ?? ''),
                $entry['updated_date'] ?? null,
                $entry
            );
        }

        return $tracking;
    }

    public function cancelShipment(string $trackingCode): bool
    {
        $this->assertConfigured();
        $this->assertMutationAllowed('hủy vận đơn');
        $json = $this->request('POST', '/shiip/public-api/v2/switch-status/cancel', [
            'order_codes' => [$trackingCode],
        ], true);

        $row = collect((array) data_get($json, 'data', []))->firstWhere('order_code', $trackingCode);
        return (bool) data_get($row, 'result', false);
    }

    public function handleWebhook(array $payload): ?array
    {
        $trackingCode = (string) ($payload['OrderCode'] ?? $payload['order_code'] ?? '');
        $clientOrderCode = (string) ($payload['ClientOrderCode'] ?? $payload['client_order_code'] ?? '');
        $status = strtolower(trim((string) ($payload['Status'] ?? $payload['status'] ?? '')));

        if ($trackingCode === '' && $clientOrderCode === '') {
            return null;
        }

        $query = DB::table('orders');
        if ($trackingCode !== '') {
            $query->where('tracking_code', $trackingCode);
        } else {
            $query->where('order_code', $clientOrderCode);
        }

        $order = $query->first();
        if (!$order) {
            return null;
        }

        $updates = ['updated_at' => now()];
        if ($trackingCode !== '' && Schema::hasColumn('orders', 'tracking_code')) {
            $updates['tracking_code'] = $trackingCode;
        }
        if ($status !== '' && Schema::hasColumn('orders', 'ghn_status')) {
            $updates['ghn_status'] = $status;
        }
        if (Schema::hasColumn('orders', 'ghn_last_synced_at')) {
            $updates['ghn_last_synced_at'] = now();
        }
        if (Schema::hasColumn('orders', 'ghn_response')) {
            $updates['ghn_response'] = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }
        DB::table('orders')->where('id', $order->id)->update($updates);

        $occurredAt = $payload['Time'] ?? $payload['time'] ?? $payload['UpdatedDate'] ?? $payload['updated_date'] ?? now();
        $description = (string) ($payload['Description'] ?? $payload['description'] ?? $this->statusLabel($status));
        $this->recordShippingEvent((int) $order->id, $trackingCode, $status, $description, $occurredAt, $payload);

        if ($status === 'delivered') {
            $fresh = DB::table('orders')->where('id', $order->id)->first();
            $this->markDelivered($fresh);
        }

        return [
            'order_id' => (int) $order->id,
            'tracking_code' => $trackingCode,
            'status' => $status,
        ];
    }

    public function statusLabel(?string $status): string
    {
        return match (strtolower((string) $status)) {
            'ready_to_pick' => 'Đã tạo vận đơn, chờ GHN lấy hàng',
            'picking' => 'Nhân viên GHN đang đến lấy hàng',
            'money_collect_picking' => 'GHN đang làm việc với người gửi',
            'picked' => 'GHN đã lấy hàng',
            'storing' => 'Hàng đã vào kho GHN',
            'transporting' => 'Hàng đang được trung chuyển',
            'sorting' => 'Hàng đang được phân loại tại kho',
            'delivering' => 'Nhân viên GHN đang giao hàng',
            'money_collect_delivering' => 'GHN đang giao và thu hộ',
            'delivered' => 'Giao hàng thành công',
            'delivery_fail' => 'Giao hàng chưa thành công',
            'waiting_to_return' => 'Đang chờ xử lý giao lại hoặc hoàn hàng',
            'return' => 'Đang chuẩn bị hoàn hàng',
            'return_transporting' => 'Hàng hoàn đang được trung chuyển',
            'return_sorting' => 'Hàng hoàn đang được phân loại',
            'returning' => 'Nhân viên GHN đang hoàn hàng',
            'return_fail' => 'Hoàn hàng chưa thành công',
            'returned' => 'Đã hoàn hàng về người gửi',
            'cancel' => 'Vận đơn GHN đã hủy',
            'exception' => 'Vận đơn đang được GHN xử lý ngoại lệ',
            'damage' => 'Hàng hóa được ghi nhận hư hỏng',
            'lost' => 'Hàng hóa được ghi nhận thất lạc',
            default => $status ? strtoupper($status) : 'Chưa có trạng thái',
        };
    }

    private function pickupLocation(): array
    {
        $configuredDistrictId = (int) config('services.ghn.from_district_id', 0);
        $configuredWardCode = trim((string) config('services.ghn.from_ward_code', ''));

        if ($configuredDistrictId > 0) {
            return [
                'district_id' => $configuredDistrictId,
                'ward_code' => $configuredWardCode ?: null,
            ];
        }

        $shopId = (int) config('services.ghn.shop_id', 0);
        if ($shopId <= 0) {
            throw new RuntimeException('Shop ID GHN chưa được cấu hình.');
        }

        $cacheKey = 'ghn_pickup_shop_' . $shopId;

        return Cache::remember($cacheKey, now()->addMinutes(10), function () use ($shopId) {
            $json = $this->request('POST', '/shiip/public-api/v2/shop/all', [
                'offset' => 0,
                'limit' => 200,
                'client_phone' => '',
            ], false);

            $shops = collect((array) data_get($json, 'data.shops', []));
            $shop = $shops->first(function ($row) use ($shopId) {
                return (int) data_get($row, '_id', data_get($row, 'shop_id', 0)) === $shopId;
            });

            if (!$shop) {
                throw new RuntimeException('Không tìm thấy Shop ID GHN trong tài khoản của Token hiện tại.');
            }

            $districtId = (int) data_get($shop, 'district_id', 0);
            $wardCode = trim((string) data_get($shop, 'ward_code', ''));

            if ($districtId <= 0 || $wardCode === '') {
                throw new RuntimeException('Cửa hàng GHN chưa có địa chỉ lấy hàng đầy đủ. Hãy cập nhật Quận/Huyện và Phường/Xã trong GHN.');
            }

            return [
                'district_id' => $districtId,
                'ward_code' => $wardCode,
                'name' => (string) data_get($shop, 'name', ''),
                'phone' => (string) data_get($shop, 'phone', ''),
                'address' => (string) data_get($shop, 'address', ''),
            ];
        });
    }

    private function resolveService(int $toDistrictId, ?array $pickup = null): array
    {
        $configuredType = (int) config('services.ghn.service_type_id', 2);
        $services = $this->availableServices($toDistrictId, $pickup);

        if (!$services) {
            return [
                'service_id' => null,
                'service_type_id' => $configuredType,
                'short_name' => $configuredType === 5 ? 'Hàng nặng' : 'Hàng nhẹ',
            ];
        }

        $selected = collect($services)->first(
            fn ($service) => (int) data_get($service, 'service_type_id') === $configuredType
        ) ?? $services[0];

        return [
            'service_id' => data_get($selected, 'service_id'),
            'service_type_id' => (int) data_get($selected, 'service_type_id', $configuredType),
            'short_name' => (string) data_get($selected, 'short_name', 'GHN'),
        ];
    }

    private function findByClientOrderCode(string $clientOrderCode): ?array
    {
        if ($clientOrderCode === '') {
            return null;
        }

        try {
            $json = $this->request('POST', '/shiip/public-api/v2/shipping-order/detail-by-client-code', [
                'client_order_code' => $clientOrderCode,
            ], false);
            $rawData = data_get($json, 'data', []);
            $data = is_array($rawData) && array_is_list($rawData)
                ? (array) ($rawData[0] ?? [])
                : (array) $rawData;

            if (empty($data['order_code'])) {
                return null;
            }

            return $this->normalizeTracking($data, (string) $data['order_code']);
        } catch (\Throwable) {
            return null;
        }
    }

    private function masterData(string $path, array $payload): array
    {
        $json = $this->request($payload ? 'POST' : 'GET', $path, $payload, false);
        return (array) data_get($json, 'data', []);
    }

    private function request(string $method, string $path, array $payload = [], bool $withShopId = false): array
    {
        $headers = [
            'Token' => trim((string) config('services.ghn.token')),
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
        ];

        if ($withShopId) {
            $headers['ShopId'] = (string) ((int) config('services.ghn.shop_id'));
        }

        $baseUrl = $this->baseUrl();
        $url = $baseUrl . $path;
        $timeout = max(8, min(60, (int) config('services.ghn.timeout', 30)));
        $connectTimeout = max(3, min(30, (int) config('services.ghn.connect_timeout', 10)));
        $verifySsl = (bool) config('services.ghn.verify_ssl', true);

        try {
            $client = Http::withHeaders($headers)
                ->acceptJson()
                ->asJson()
                ->connectTimeout($connectTimeout)
                ->timeout($timeout)
                ->retry(2, 350, function ($exception) {
                    if ($exception instanceof ConnectionException) {
                        return true;
                    }

                    return $exception instanceof RequestException
                        && $exception->response
                        && $exception->response->serverError();
                }, false);

            if (!$verifySsl) {
                $client = $client->withoutVerifying();
            }

            $response = strtoupper($method) === 'GET'
                ? $client->get($url, $payload)
                : $client->post($url, $payload);
        } catch (\Throwable $e) {
            Log::warning('GHN request exception', [
                'path' => $path,
                'url' => $url,
                'verify_ssl' => $verifySsl,
                'message' => $e->getMessage(),
            ]);

            throw new RuntimeException($this->connectionErrorMessage($e), 0, $e);
        }

        $json = (array) $response->json();
        if (!$response->successful() || (int) ($json['code'] ?? 0) !== 200) {
            Log::warning('GHN request failed', [
                'path' => $path,
                'status' => $response->status(),
                'code' => $json['code'] ?? null,
                'code_message' => $json['code_message'] ?? null,
                'code_message_value' => $json['code_message_value'] ?? null,
                'message' => $json['message'] ?? null,
                'data' => $json['data'] ?? null,
            ]);

            $message = trim((string) (
                $json['code_message_value']
                ?? $json['message']
                ?? $json['code_message']
                ?? ''
            ));
            $lower = mb_strtolower($message);
            $codeMessage = strtoupper(trim((string) ($json['code_message'] ?? '')));

            if (str_contains($codeMessage, 'PRICE_DECL') || str_contains($lower, 'khai giá')) {
                throw new RuntimeException(
                    'GHN giới hạn giá trị khai giá tối đa 500.000đ cho tài khoản hiện tại. Hệ thống đã tự giới hạn giá trị khai giá; vui lòng bấm Lưu trạng thái lại.'
                );
            }

            if ($response->status() === 401 || str_contains($lower, 'token')) {
                throw new RuntimeException('Token GHN không hợp lệ hoặc đã hết hiệu lực. Hãy tạo Token mới trên GHN rồi cập nhật GHN_TOKEN.');
            }

            if (str_contains($lower, 'shop')) {
                throw new RuntimeException('Shop ID GHN không hợp lệ, không thuộc Token hiện tại hoặc cửa hàng chưa đủ thông tin lấy hàng.');
            }

            if (str_contains($lower, 'ward') || str_contains($lower, 'phường') || str_contains($lower, 'xa')) {
                throw new RuntimeException('GHN từ chối Phường/Xã của đơn hoặc cửa hàng. Hãy chọn lại địa chỉ GHN và kiểm tra địa chỉ lấy hàng của Shop.');
            }

            if (str_contains($lower, 'district') || str_contains($lower, 'quận') || str_contains($lower, 'huyện')) {
                throw new RuntimeException('GHN từ chối Quận/Huyện của đơn hoặc cửa hàng. Hãy chọn lại địa chỉ GHN và kiểm tra địa chỉ lấy hàng của Shop.');
            }

            throw new RuntimeException($message !== '' ? 'GHN: ' . $message : 'GHN từ chối yêu cầu vận chuyển.');
        }

        return $json;
    }

    private function connectionErrorMessage(\Throwable $e): string
    {
        $message = (string) $e->getMessage();
        $lower = mb_strtolower($message);

        if (str_contains($lower, 'curl error 60') || str_contains($lower, 'certificate') || str_contains($lower, 'ssl certificate')) {
            return 'PHP/XAMPP không xác minh được chứng chỉ SSL của GHN. Nếu đang chạy local để demo, đặt GHN_VERIFY_SSL=false trong .env rồi chạy php artisan optimize:clear. Khi deploy thật hãy bật lại GHN_VERIFY_SSL=true.';
        }

        if (str_contains($lower, 'curl error 6') || str_contains($lower, 'could not resolve host')) {
            return 'Máy backend không phân giải được tên miền GHN. Hãy kiểm tra Internet/DNS rồi thử lại.';
        }

        if (str_contains($lower, 'curl error 7') || str_contains($lower, 'failed to connect') || str_contains($lower, 'connection refused')) {
            return 'Máy backend không kết nối được máy chủ GHN. Hãy kiểm tra Internet, firewall hoặc proxy.';
        }

        if (str_contains($lower, 'curl error 28') || str_contains($lower, 'timed out') || str_contains($lower, 'timeout')) {
            return 'Kết nối tới GHN bị quá thời gian. Hãy thử lại hoặc tăng GHN_TIMEOUT lên 30.';
        }

        if (app()->environment('local') && $message !== '') {
            return 'Không thể kết nối Giao Hàng Nhanh. Chi tiết local: ' . mb_substr($message, 0, 280);
        }

        return 'Không thể kết nối Giao Hàng Nhanh. Vui lòng thử lại.';
    }

    private function normalizeTracking(array $data, string $trackingCode): array
    {
        $logs = collect((array) ($data['log'] ?? []))
            ->map(function ($entry) {
                $status = strtolower((string) data_get($entry, 'status', ''));
                return [
                    'status' => $status,
                    'status_label' => $this->statusLabel($status),
                    'updated_date' => data_get($entry, 'updated_date'),
                ];
            })
            ->filter(fn ($entry) => $entry['status'] !== '')
            ->values()
            ->all();

        $status = strtolower((string) ($data['status'] ?? ''));
        if ($status !== '' && !collect($logs)->contains(fn ($entry) => $entry['status'] === $status)) {
            $logs[] = [
                'status' => $status,
                'status_label' => $this->statusLabel($status),
                'updated_date' => $data['updated_date'] ?? null,
            ];
        }

        return [
            'order_code' => $trackingCode ?: ($data['order_code'] ?? null),
            'client_order_code' => $data['client_order_code'] ?? null,
            'status' => $status ?: null,
            'status_label' => $this->statusLabel($status),
            'leadtime' => $data['leadtime'] ?? null,
            'expected_delivery_time' => $data['leadtime'] ?? null,
            'finish_date' => $data['finish_date'] ?? null,
            'created_date' => $data['created_date'] ?? null,
            'updated_date' => $data['updated_date'] ?? null,
            'current_warehouse_id' => $data['current_warehouse_id'] ?? null,
            'next_warehouse_id' => $data['next_warehouse_id'] ?? null,
            'cod_amount' => isset($data['cod_amount']) ? (float) $data['cod_amount'] : null,
            'service_id' => $data['service_id'] ?? null,
            'service_type_id' => $data['service_type_id'] ?? null,
            'total_fee' => isset($data['total_fee']) ? (float) $data['total_fee'] : null,
            'logs' => $logs,
            'raw' => $data,
        ];
    }

    private function persistTracking(int $orderId, array $tracking, mixed $raw): void
    {
        if (!Schema::hasTable('orders')) {
            return;
        }

        $updates = ['updated_at' => now()];
        $map = [
            'shipping_provider' => 'ghn',
            'tracking_code' => $tracking['order_code'] ?? null,
            'ghn_status' => $tracking['status'] ?? null,
            'ghn_service_id' => $tracking['service_id'] ?? null,
            'ghn_service_type_id' => $tracking['service_type_id'] ?? null,
            'ghn_last_synced_at' => now(),
        ];

        foreach ($map as $column => $value) {
            if ($value !== null && Schema::hasColumn('orders', $column)) {
                $updates[$column] = $value;
            }
        }

        if (isset($tracking['total_fee']) && Schema::hasColumn('orders', 'ghn_carrier_fee')) {
            $updates['ghn_carrier_fee'] = max(0, (float) $tracking['total_fee']);
        }

        $expected = $tracking['expected_delivery_time'] ?? $tracking['leadtime'] ?? null;
        if ($expected && Schema::hasColumn('orders', 'ghn_expected_delivery_at')) {
            try {
                $updates['ghn_expected_delivery_at'] = Carbon::parse($expected);
            } catch (\Throwable) {
            }
        }

        if (Schema::hasColumn('orders', 'ghn_created_at') && empty(DB::table('orders')->where('id', $orderId)->value('ghn_created_at'))) {
            $updates['ghn_created_at'] = now();
        }

        if (Schema::hasColumn('orders', 'ghn_response')) {
            $updates['ghn_response'] = json_encode($raw ?? ($tracking['raw'] ?? []), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }

        DB::table('orders')->where('id', $orderId)->update($updates);
    }

    private function syncInternalOrderFromGhn(object $order, array $tracking): void
    {
        if (($tracking['status'] ?? null) === 'delivered') {
            $this->markDelivered($order);
        }
    }

    private function markDelivered(?object $order): void
    {
        if (!$order || in_array((string) ($order->status ?? ''), ['completed', 'cancelled'], true)) {
            return;
        }

        DB::transaction(function () use ($order) {
            $locked = DB::table('orders')->where('id', $order->id)->lockForUpdate()->first();
            if (!$locked || in_array((string) ($locked->status ?? ''), ['completed', 'cancelled'], true)) {
                return;
            }

            $updates = ['status' => 'completed', 'updated_at' => now()];
            if (Schema::hasColumn('orders', 'completed_at')) {
                $updates['completed_at'] = now();
            }
            if (($locked->payment_method ?? '') === 'cod' && Schema::hasColumn('orders', 'payment_status')) {
                $updates['payment_status'] = 'paid';
            }
            DB::table('orders')->where('id', $locked->id)->update($updates);

            if (Schema::hasTable('order_status_histories')) {
                DB::table('order_status_histories')->insert([
                    'order_id' => $locked->id,
                    'changed_by' => null,
                    'from_status' => $locked->status,
                    'to_status' => 'completed',
                    'source' => 'ghn',
                    'note' => 'GHN xác nhận giao hàng thành công.',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }, 3);
    }

    private function recordShippingEvent(int $orderId, string $trackingCode, string $status, string $description, mixed $occurredAt, array $payload): void
    {
        if (!Schema::hasTable('shipping_status_histories') || $status === '') {
            return;
        }

        try {
            $time = $occurredAt ? Carbon::parse($occurredAt) : now();
        } catch (\Throwable) {
            $time = now();
        }

        $exists = DB::table('shipping_status_histories')
            ->where('order_id', $orderId)
            ->where('status', $status)
            ->where('occurred_at', $time)
            ->exists();

        if ($exists) {
            return;
        }

        DB::table('shipping_status_histories')->insert([
            'order_id' => $orderId,
            'provider' => 'ghn',
            'tracking_code' => $trackingCode ?: null,
            'status' => $status,
            'description' => $description ?: $this->statusLabel($status),
            'payload' => json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'occurred_at' => $time,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function environment(): string
    {
        $environment = strtolower(trim((string) config('services.ghn.environment', 'staging')));

        return match ($environment) {
            'production', 'prod' => 'production',
            'staging', 'stage', 'test', 'testing', 'dev', 'development' => 'staging',
            default => throw new RuntimeException(
                'GHN_ENV không hợp lệ. Với DATN hãy dùng GHN_ENV=staging; chỉ dùng production khi triển khai giao hàng thật.'
            ),
        };
    }

    private function baseUrl(): string
    {
        $environment = $this->environment();
        $expected = $environment === 'production'
            ? rtrim((string) config('services.ghn.production_base_url', 'https://online-gateway.ghn.vn'), '/')
            : rtrim((string) config('services.ghn.staging_base_url', 'https://dev-online-gateway.ghn.vn'), '/');

        $configured = rtrim(trim((string) config('services.ghn.base_url', '')), '/');
        $baseUrl = $configured !== '' ? $configured : $expected;

        if (!filter_var($baseUrl, FILTER_VALIDATE_URL) || parse_url($baseUrl, PHP_URL_SCHEME) !== 'https') {
            throw new RuntimeException('GHN_BASE_URL không hợp lệ. GHN API phải dùng HTTPS.');
        }

        $actualHost = strtolower((string) parse_url($baseUrl, PHP_URL_HOST));
        $expectedHost = strtolower((string) parse_url($expected, PHP_URL_HOST));

        if ($actualHost !== $expectedHost) {
            throw new RuntimeException(sprintf(
                'GHN_ENV=%s nhưng GHN_BASE_URL đang trỏ tới %s. Hệ thống đã chặn để tránh gửi nhầm đơn sang môi trường khác. URL đúng là %s.',
                $environment,
                $actualHost !== '' ? $actualHost : '(không xác định)',
                $expected
            ));
        }

        return $baseUrl;
    }

    private function assertMutationAllowed(string $action): void
    {
        if ($this->environment() !== 'production') {
            return;
        }

        if (!(bool) config('services.ghn.production_enabled', false)) {
            throw new RuntimeException(
                'Đã chặn ' . $action . ' trên GHN Production. Nếu thật sự triển khai giao hàng thật, đặt GHN_PRODUCTION_ENABLED=true rồi chạy php artisan optimize:clear.'
            );
        }
    }

    private function assertConfigured(): void
    {
        // Gọi baseUrl() trước để phát hiện cấu hình staging/production bị trộn.
        $this->baseUrl();

        if (!filled(config('services.ghn.token'))) {
            throw new RuntimeException('Chưa cấu hình GHN_TOKEN. Với DATN hãy dùng Token của tài khoản GHN Staging.');
        }
        if (!filled(config('services.ghn.shop_id'))) {
            throw new RuntimeException('Chưa cấu hình GHN_SHOP_ID. Với DATN hãy dùng Shop ID của tài khoản GHN Staging.');
        }
    }

    private function insuranceValue(float $value): int
    {
        // GHN đang trả giới hạn PRICE_DECL tối đa 500.000đ cho Shop/Token hiện tại.
        // Tổng tiền đơn, COD và giá item vẫn giữ nguyên; chỉ trường khai giá gửi GHN bị giới hạn.
        $accountSafeLimit = 500000;
        $configuredLimit = (int) config('services.ghn.max_insurance_value', $accountSafeLimit);

        if ($configuredLimit <= 0) {
            $configuredLimit = $accountSafeLimit;
        }

        $max = min($accountSafeLimit, $configuredLimit);

        return max(0, min($max, (int) round($value)));
    }

    private function validateShippingWeight(int $weight): int
    {
        $weight = max(1, $weight);
        if ($weight > 30000) {
            throw new RuntimeException('Khối lượng đơn vượt 30kg, vượt giới hạn tạo vận đơn GHN hiện tại của hệ thống.');
        }

        return $weight;
    }

    private function defaultItemWeight(): int
    {
        return max(1, min(50000, (int) config('services.ghn.default_item_weight', 300)));
    }

    private function defaultLength(): int
    {
        return max(1, min(150, (int) config('services.ghn.default_length', 20)));
    }

    private function defaultWidth(): int
    {
        return max(1, min(150, (int) config('services.ghn.default_width', 15)));
    }

    private function defaultHeight(): int
    {
        return max(1, min(150, (int) config('services.ghn.default_height', 10)));
    }
}