<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ShippingService;
use App\Services\VoucherService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    public function __construct(
        private VoucherService $vouchers,
        private ShippingService $shipping,
    ) {}

    public function store(Request $request)
    {
        $user = $request->user();
        $validated = $request->validate([
            'customer.fullName' => ['required', 'string', 'max:150'],
            'customer.email' => ['nullable', 'email', 'max:150'],
            'customer.phone' => ['required', 'string', 'max:30'],
            'shippingAddress.province' => ['required', 'string', 'max:120'],
            'shippingAddress.provinceCode' => ['required'],
            'shippingAddress.district' => ['required', 'string', 'max:120'],
            'shippingAddress.districtCode' => ['required', 'integer'],
            'shippingAddress.ward' => ['required', 'string', 'max:120'],
            'shippingAddress.wardCode' => ['required', 'string', 'max:40'],
            'shippingAddress.address' => ['required', 'string', 'max:500'],
            'shippingAddress.note' => ['nullable', 'string', 'max:1000'],
            'items' => ['required', 'array', 'min:1', 'max:100'],
            'items.*.quantity' => ['nullable', 'integer', 'min:1', 'max:99'],
            'paymentMethod' => ['required', 'string'],
            'checkoutMode' => ['nullable', 'in:cart,buy_now'],
            'coupon' => ['nullable', 'string', 'max:80'],
            'weight' => ['nullable', 'integer', 'min:1', 'max:50000'],
            'subtotal' => ['nullable', 'numeric'],
            'discount' => ['nullable', 'numeric'],
            'shippingFee' => ['nullable', 'numeric'],
            'total' => ['nullable', 'numeric'],
        ]);

        $paymentMethod = match (strtoupper((string) $validated['paymentMethod'])) {
            'COD' => 'cod',
            'BANK', 'BANK_TRANSFER', 'VIETQR' => 'bank',
            'VNPAY' => 'vnpay',
            default => throw ValidationException::withMessages(['paymentMethod' => 'Phương thức thanh toán không được hỗ trợ.']),
        };

        $checkoutMode = (string) ($validated['checkoutMode'] ?? 'cart');

        if ($paymentMethod === 'bank') {
            $this->ensureBankTransferConfigured();
        }

        DB::beginTransaction();

        try {
            $orderId = $this->createOrderWithinTransaction(
                $validated,
                (int) $user->id,
                $paymentMethod,
                $checkoutMode
            );
            DB::commit();
        } catch (\Throwable $exception) {
            DB::rollBack();
            throw $exception;
        }

        return response()->json(['success' => true, 'message' => 'Tạo đơn hàng thành công.', 'data' => $this->normalizeOrder($orderId)], 201);
    }


    private function createOrderWithinTransaction(array $validated, int $userId, string $paymentMethod, string $checkoutMode): int
    {
        $orderItems = $this->resolveCheckoutItems($validated, $userId, $checkoutMode);
        $prepared = $this->prepareOrderLines($orderItems);
        $charges = $this->calculateOrderCharges($validated, $prepared['lines'], $prepared['subtotal'], $userId);
        $orderId = $this->insertOrderRecord($validated, $paymentMethod, $userId, $charges);

        $this->insertOrderItems($orderId, $prepared['lines']);
        $this->finalizeOrderCreation($orderId, $userId, $checkoutMode, $paymentMethod, $charges);

        return $orderId;
    }

    /** @return array<int, array<string, mixed>> */
    private function resolveCheckoutItems(array $validated, int $userId, string $checkoutMode): array
    {
        if ($checkoutMode === 'buy_now') {
            return array_values($validated['items']);
        }

        if (!Schema::hasTable('cart_items')) {
            return array_values($validated['items']);
        }

        $cartItems = DB::table('cart_items')
            ->where('user_id', $userId)
            ->lockForUpdate()
            ->get(['product_id', 'product_variant_id', 'quantity']);

        if ($cartItems->isEmpty()) {
            return array_values($validated['items']);
        }

        $items = [];
        foreach ($cartItems as $item) {
            $items[] = [
                'product_id' => (int) $item->product_id,
                'product_variant_id' => $item->product_variant_id !== null ? (int) $item->product_variant_id : null,
                'quantity' => (int) $item->quantity,
            ];
        }

        return $items;
    }

    /**
     * @param array<int, array<string, mixed>> $orderItems
     * @return array{lines: array<int, array<string, mixed>>, subtotal: float}
     */
    private function prepareOrderLines(array $orderItems): array
    {
        $lines = [];
        $subtotal = 0.0;

        foreach ($orderItems as $rawItem) {
            $line = $this->prepareSingleOrderLine($rawItem);
            $lines[] = $line;
            $subtotal += (float) $line['total'];
        }

        return [
            'lines' => $lines,
            'subtotal' => round($subtotal, 2),
        ];
    }

    /** @return array<string, mixed> */
    private function prepareSingleOrderLine(array $rawItem): array
    {
        $productId = (int) ($rawItem['product_id'] ?? $rawItem['productId'] ?? $rawItem['id'] ?? 0);
        $variantId = (int) ($rawItem['product_variant_id'] ?? $rawItem['variant_id'] ?? $rawItem['variantId'] ?? 0);
        $quantity = max(1, (int) ($rawItem['quantity'] ?? $rawItem['qty'] ?? 1));

        if ($productId <= 0) {
            throw ValidationException::withMessages(['items' => 'Có sản phẩm không hợp lệ trong giỏ hàng.']);
        }

        $product = DB::table('products')
            ->where('id', $productId)
            ->lockForUpdate()
            ->first();

        if (!$product || ($product->status ?? 'active') !== 'active') {
            throw ValidationException::withMessages(['items' => "Sản phẩm #{$productId} không còn kinh doanh."]);
        }

        $stockData = $this->reserveStockAndResolveVariant($product, $productId, $variantId, $quantity);
        $price = (float) $stockData['price'];

        if ($price < 0) {
            throw ValidationException::withMessages(['items' => 'Giá sản phẩm không hợp lệ.']);
        }

        $lineTotal = round($price * $quantity, 2);
        $variantName = implode(' / ', array_values(array_filter([
            $stockData['size_name'],
            $stockData['color_name'],
        ])));

        return [
            'product_id' => $productId,
            'product_variant_id' => $stockData['variant_id'],
            'product_name' => (string) $product->name,
            'variant_name' => $variantName !== '' ? $variantName : null,
            'size_name' => $stockData['size_name'],
            'color_name' => $stockData['color_name'],
            'sku' => $stockData['sku'],
            'product_image' => $product->image ?? null,
            'variant_image' => $stockData['variant_image'],
            'price' => $price,
            'quantity' => $quantity,
            'total' => $lineTotal,
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }

    /**
     * @return array{
     *   variant_id: int|null,
     *   price: float,
     *   size_name: string|null,
     *   color_name: string|null,
     *   variant_image: string|null,
     *   sku: string|null
     * }
     */
    private function reserveStockAndResolveVariant(object $product, int $productId, int $variantId, int $quantity): array
    {
        $hasVariantsTable = Schema::hasTable('product_variants');
        $variantCount = $hasVariantsTable
            ? DB::table('product_variants')->where('product_id', $productId)->where('is_active', 1)->count()
            : 0;

        if ($variantCount <= 0) {
            return $this->reserveProductStock($product, $productId, $quantity);
        }

        if ($variantId <= 0) {
            throw ValidationException::withMessages(['items' => "Vui lòng chọn biến thể cho {$product->name}."]);
        }

        $variant = DB::table('product_variants')
            ->where('id', $variantId)
            ->where('product_id', $productId)
            ->where('is_active', 1)
            ->lockForUpdate()
            ->first();

        if (!$variant) {
            throw ValidationException::withMessages(['items' => "Biến thể của {$product->name} không còn khả dụng."]);
        }

        if ((int) $variant->stock < $quantity) {
            throw ValidationException::withMessages(['items' => "{$product->name} chỉ còn {$variant->stock} sản phẩm trong kho."]);
        }

        DB::table('product_variants')->where('id', $variant->id)->decrement('stock', $quantity);

        $price = $variant->discount_price !== null && (float) $variant->discount_price > 0
            ? (float) $variant->discount_price
            : (float) $variant->price;

        return [
            'variant_id' => (int) $variant->id,
            'price' => $price,
            'size_name' => $this->lookupVariantAttributeName('sizes', $variant->size_id ?? null),
            'color_name' => $this->lookupVariantAttributeName('colors', $variant->color_id ?? null),
            'variant_image' => $variant->image ?? null,
            'sku' => $variant->sku ?? null,
        ];
    }

    /**
     * @return array{
     *   variant_id: null,
     *   price: float,
     *   size_name: null,
     *   color_name: null,
     *   variant_image: null,
     *   sku: null
     * }
     */
    private function reserveProductStock(object $product, int $productId, int $quantity): array
    {
        if (!Schema::hasColumn('products', 'stock')) {
            throw ValidationException::withMessages(['items' => "{$product->name} chưa được cấu hình tồn kho/biến thể."]);
        }

        if ((int) $product->stock < $quantity) {
            throw ValidationException::withMessages(['items' => "{$product->name} không đủ tồn kho."]);
        }

        DB::table('products')->where('id', $productId)->decrement('stock', $quantity);

        return [
            'variant_id' => null,
            'price' => (float) ($product->price ?? 0),
            'size_name' => null,
            'color_name' => null,
            'variant_image' => null,
            'sku' => null,
        ];
    }

    private function lookupVariantAttributeName(string $table, mixed $id): ?string
    {
        if (empty($id) || !Schema::hasTable($table)) {
            return null;
        }

        $name = DB::table($table)->where('id', $id)->value('name');
        return $name !== null ? (string) $name : null;
    }

    /**
     * @param array<int, array<string, mixed>> $lines
     * @return array<string, mixed>
     */
    private function calculateOrderCharges(array $validated, array $lines, float $subtotal, int $userId): array
    {
        $voucherResult = $this->calculateVoucherResult($validated, $subtotal, $userId);
        $shippingWeight = $this->calculateShippingWeight($lines);
        $shippingResult = $this->shipping->calculate(
            $validated['shippingAddress'],
            $subtotal - (float) $voucherResult['discount'],
            $shippingWeight
        );

        $discount = (float) $voucherResult['discount'];
        $shippingFee = (float) $shippingResult['fee'];

        return [
            'voucher' => $voucherResult['voucher'],
            'discount' => $discount,
            'shipping_result' => $shippingResult,
            'shipping_weight' => $shippingWeight,
            'subtotal' => $subtotal,
            'shipping_fee' => $shippingFee,
            'grand_total' => max(0, round($subtotal - $discount + $shippingFee, 2)),
        ];
    }

    /** @return array{voucher: mixed, discount: float} */
    private function calculateVoucherResult(array $validated, float $subtotal, int $userId): array
    {
        $coupon = trim((string) ($validated['coupon'] ?? ''));
        if ($coupon === '') {
            return ['voucher' => null, 'discount' => 0.0];
        }

        $result = $this->vouchers->validateAndCalculate($coupon, $subtotal, $userId, true);

        return [
            'voucher' => $result['voucher'] ?? null,
            'discount' => (float) ($result['discount'] ?? 0),
        ];
    }

    /** @param array<int, array<string, mixed>> $lines */
    private function calculateShippingWeight(array $lines): int
    {
        $defaultItemWeight = max(1, (int) config('services.ghn.default_item_weight', 300));
        $weight = 0;

        foreach ($lines as $line) {
            $weight += max(1, (int) ($line['quantity'] ?? 1)) * $defaultItemWeight;
        }

        return max(1, $weight);
    }

    /** @param array<string, mixed> $charges */
    private function insertOrderRecord(array $validated, string $paymentMethod, int $userId, array $charges): int
    {
        $address = $validated['shippingAddress'];
        $fullAddress = $this->buildFullShippingAddress($address);
        $orderCode = 'DNV' . now()->format('ymdHis') . strtoupper(Str::random(4));
        $shippingResult = $charges['shipping_result'];

        $payload = [
            'user_id' => $userId,
            'voucher_id' => $charges['voucher']->id ?? null,
            'order_code' => $orderCode,
            'customer_name' => $validated['customer']['fullName'],
            'customer_email' => $validated['customer']['email'] ?? null,
            'customer_phone' => $validated['customer']['phone'],
            'shipping_address' => $fullAddress,
            'province' => $address['province'],
            'district' => $address['district'] ?? null,
            'ward' => $address['ward'],
            'note' => $address['note'] ?? null,
            'subtotal' => (float) $charges['subtotal'],
            'discount_amount' => (float) $charges['discount'],
            'shipping_fee' => (float) $charges['shipping_fee'],
            'grand_total' => (float) $charges['grand_total'],
            'payment_method' => $paymentMethod,
            'payment_status' => 'unpaid',
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ];

        $payload = $this->appendOptionalOrderFields($payload, $address, $shippingResult, (int) $charges['shipping_weight']);

        return (int) DB::table('orders')->insertGetId($payload);
    }

    /** @return array<string, mixed> */
    private function appendOptionalOrderFields(array $payload, array $address, array $shippingResult, int $shippingWeight): array
    {
        if (Schema::hasColumn('orders', 'stock_deducted_at')) {
            $payload['stock_deducted_at'] = now();
        }

        if (Schema::hasColumn('orders', 'shipping_provider')) {
            $payload['shipping_provider'] = 'ghn';
        }

        $optional = [
            'province_code' => (string) ($address['provinceCode'] ?? ''),
            'district_code' => (string) ($address['districtCode'] ?? ''),
            'ward_code' => (string) ($address['wardCode'] ?? ''),
            'ghn_service_id' => $shippingResult['service_id'] ?? null,
            'ghn_service_type_id' => $shippingResult['service_type_id'] ?? null,
            'ghn_carrier_fee' => (float) ($shippingResult['carrier_fee'] ?? $shippingResult['fee'] ?? 0),
            'shipping_weight_grams' => $shippingWeight,
            'shipping_length_cm' => (int) config('services.ghn.default_length', 20),
            'shipping_width_cm' => (int) config('services.ghn.default_width', 15),
            'shipping_height_cm' => (int) config('services.ghn.default_height', 10),
        ];

        foreach ($optional as $column => $value) {
            if (Schema::hasColumn('orders', $column)) {
                $payload[$column] = $value;
            }
        }

        return $payload;
    }

    private function buildFullShippingAddress(array $address): string
    {
        $parts = [
            $address['address'] ?? null,
            $address['ward'] ?? null,
            $address['district'] ?? null,
            $address['province'] ?? null,
        ];

        return implode(', ', array_values(array_filter($parts)));
    }

    /** @param array<int, array<string, mixed>> $lines */
    private function insertOrderItems(int $orderId, array $lines): void
    {
        foreach ($lines as $line) {
            $line['order_id'] = $orderId;
            DB::table('order_items')->insert($line);
        }
    }

    /** @param array<string, mixed> $charges */
    private function finalizeOrderCreation(int $orderId, int $userId, string $checkoutMode, string $paymentMethod, array $charges): void
    {
        $voucher = $charges['voucher'] ?? null;
        if ($voucher !== null) {
            $this->vouchers->consume($voucher, $userId, $orderId, (float) $charges['discount']);
        }

        if ($paymentMethod === 'bank') {
            $this->createPendingVietQrTransaction($orderId);
        }

        $this->history($orderId, $userId, null, 'pending', 'customer', 'Khách hàng tạo đơn hàng.');

        if ($checkoutMode === 'cart' && Schema::hasTable('cart_items')) {
            DB::table('cart_items')->where('user_id', $userId)->delete();
        }
    }

    private function ensureBankTransferConfigured(): void
    {
        if (!Schema::hasTable('settings')) {
            throw ValidationException::withMessages([
                'paymentMethod' => 'Phương thức chuyển khoản hiện chưa được cấu hình.',
            ]);
        }

        $settings = DB::table('settings')->orderBy('id')->first();
        $bankName = trim((string) ($settings->bank_name ?? ''));
        $bankCode = trim((string) ($settings->bank_code ?? ''));
        $accountNumber = trim((string) ($settings->bank_account_number ?? ''));
        $accountName = trim((string) ($settings->bank_account_name ?? ''));

        if ($bankName === '' || $bankCode === '' || $accountNumber === '' || $accountName === '') {
            throw ValidationException::withMessages([
                'paymentMethod' => 'Phương thức chuyển khoản hiện chưa được cấu hình đầy đủ.',
            ]);
        }
    }

    private function createPendingVietQrTransaction(int $orderId): void
    {
        if (!Schema::hasTable('payment_transactions')) {
            return;
        }

        $order = DB::table('orders')->where('id', $orderId)->first();
        if (!$order) {
            return;
        }

        $transactionRef = 'VQR-' . (string) $order->order_code;
        $exists = DB::table('payment_transactions')
            ->where('transaction_ref', $transactionRef)
            ->exists();

        if ($exists) {
            return;
        }

        DB::table('payment_transactions')->insert([
            'order_id' => $orderId,
            'provider' => 'vietqr',
            'transaction_ref' => $transactionRef,
            'amount' => (float) ($order->grand_total ?? 0),
            'status' => 'pending',
            'request_payload' => json_encode([
                'order_code' => $order->order_code ?? null,
                'mode' => 'bank_transfer',
            ], JSON_UNESCAPED_UNICODE),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function index(Request $request)
    {
        $query = DB::table('orders')->where('user_id', $request->user()->id);
        if ($request->filled('status') && $request->status !== 'all') $query->where('status', $request->status);
        if ($request->filled('search')) {
            $s = trim((string) $request->search);
            $query->where(function ($q) use ($s) { $q->where('order_code', 'like', "%{$s}%")->orWhere('customer_phone', 'like', "%{$s}%"); });
        }
        $orders = $query->orderByDesc('id')->get()->map(fn($o) => $this->normalizeOrder($o->id));
        $statsBase = DB::table('orders')->where('user_id', $request->user()->id);
        $all = (clone $statsBase)->get(['status']);
        return response()->json(['success' => true, 'data' => [
            'orders' => $orders,
            'total' => $orders->count(),
            'stats' => [
                'total' => $all->count(),
                'pending' => $all->whereIn('status', ['pending','confirmed'])->count(),
                'shipping' => $all->where('status', 'shipping')->count(),
                'completed' => $all->where('status', 'completed')->count(),
                'cancelled' => $all->where('status', 'cancelled')->count(),
            ],
        ]]);
    }

    public function myOrders(Request $request) { return $this->index($request); }

    public function show(Request $request, $id)
    {
        $exists = DB::table('orders')->where('id', $id)->where('user_id', $request->user()->id)->exists();
        if (!$exists) return response()->json(['success' => false, 'message' => 'Không tìm thấy đơn hàng.'], 404);
        return response()->json(['success' => true, 'data' => $this->normalizeOrder($id, true)]);
    }

    public function tracking(Request $request, $id)
    {
        $exists = DB::table('orders')->where('id', $id)->where('user_id', $request->user()->id)->exists();
        if (!$exists) return response()->json(['success' => false, 'message' => 'Không tìm thấy đơn hàng.'], 404);

        $order = $this->normalizeOrder((int) $id, true);
        return response()->json([
            'success' => true,
            'message' => 'Đã cập nhật hành trình giao hàng.',
            'data' => [
                'order_id' => $order['id'] ?? (int) $id,
                'order_status' => $order['status'] ?? null,
                'payment_status' => $order['payment_status'] ?? null,
                'shipping_provider' => $order['shipping_provider'] ?? null,
                'tracking_code' => $order['tracking_code'] ?? null,
                'ghn_status' => $order['ghn_status'] ?? null,
                'ghn_expected_delivery_at' => $order['ghn_expected_delivery_at'] ?? null,
                'ghn_last_synced_at' => $order['ghn_last_synced_at'] ?? null,
                'tracking' => $order['tracking'] ?? null,
                'shipping_status_history' => $order['shipping_status_history'] ?? [],
                'status_history' => $order['status_history'] ?? [],
            ],
        ]);
    }

    public function cancel(Request $request, $id)
    {
        $orderId = DB::transaction(function () use ($request, $id) {
            $order = DB::table('orders')->where('id', $id)->where('user_id', $request->user()->id)->lockForUpdate()->first();
            if (!$order) abort(404, 'Không tìm thấy đơn hàng.');
            if (!in_array($order->status, ['pending', 'confirmed'], true)) throw ValidationException::withMessages(['status' => 'Đơn hàng ở trạng thái hiện tại không thể hủy.']);

            $this->restoreStockOnce($order);
            $this->vouchers->releaseForCancelledOrder($order->id);
            DB::table('orders')->where('id', $order->id)->update(array_filter([
                'status' => 'cancelled',
                'cancelled_at' => Schema::hasColumn('orders', 'cancelled_at') ? now() : null,
                'updated_at' => now(),
            ], fn($v) => $v !== null));
            $this->history($order->id, $request->user()->id, $order->status, 'cancelled', 'customer', 'Khách hàng hủy đơn.');
            return $order->id;
        }, 3);

        return response()->json(['success' => true, 'message' => 'Đã hủy đơn hàng và hoàn tồn kho.', 'data' => $this->normalizeOrder($orderId, true)]);
    }

    public function reorder(Request $request, $id)
    {
        $order = DB::table('orders')->where('id', $id)->where('user_id', $request->user()->id)->first();
        if (!$order) return response()->json(['success' => false, 'message' => 'Không tìm thấy đơn hàng.'], 404);
        return response()->json(['success' => true, 'message' => 'Đã tải lại sản phẩm từ đơn cũ. Vui lòng kiểm tra tồn kho và giá mới trước khi đặt.', 'data' => $this->normalizeOrder($id)]);
    }

    private function restoreStockOnce(object $order): void
    {
        if (Schema::hasColumn('orders', 'stock_restored_at') && !empty($order->stock_restored_at)) return;
        $items = DB::table('order_items')->where('order_id', $order->id)->get();
        foreach ($items as $item) {
            $qty = (int) ($item->quantity ?? 0);
            if ($qty <= 0) continue;
            if (!empty($item->product_variant_id)) {
                DB::table('product_variants')->where('id', $item->product_variant_id)->lockForUpdate()->first();
                DB::table('product_variants')->where('id', $item->product_variant_id)->increment('stock', $qty);
            } elseif (Schema::hasColumn('products', 'stock')) {
                DB::table('products')->where('id', $item->product_id)->lockForUpdate()->first();
                DB::table('products')->where('id', $item->product_id)->increment('stock', $qty);
            }
        }
        if (Schema::hasColumn('orders', 'stock_restored_at')) DB::table('orders')->where('id', $order->id)->update(['stock_restored_at' => now()]);
    }

    private function history(int $orderId, ?int $changedBy, ?string $from, string $to, string $source, ?string $note = null): void
    {
        if (!Schema::hasTable('order_status_histories')) return;
        DB::table('order_status_histories')->insert([
            'order_id' => $orderId, 'changed_by' => $changedBy, 'from_status' => $from, 'to_status' => $to,
            'source' => $source, 'note' => $note, 'created_at' => now(), 'updated_at' => now(),
        ]);
    }

    private function normalizeOrder(int $id, bool $withTracking = false): ?array
    {
        $o = DB::table('orders')->where('id', $id)->first();
        if (!$o) return null;
        $items = DB::table('order_items')->where('order_id', $id)->get()->map(function ($i) {
            $i->name = $i->product_name ?? 'Sản phẩm';
            $i->image = $i->variant_image ?: $i->product_image;
            $i->size = $i->size_name ?? null;
            $i->color = $i->color_name ?? null;
            $i->qty = (int) $i->quantity;
            $i->variant_id = $i->product_variant_id;
            return $i;
        });
        $history = Schema::hasTable('order_status_histories') ? DB::table('order_status_histories')->where('order_id', $id)->orderBy('id')->get() : collect();
        $payments = Schema::hasTable('payment_transactions') ? DB::table('payment_transactions')->where('order_id', $id)->orderByDesc('id')->get(['provider','transaction_ref','provider_transaction_no','amount','status','paid_at','created_at']) : collect();
        $tracking = null;
        if ($withTracking && !empty($o->tracking_code)) {
            try {
                $tracking = $this->shipping->syncOrderTracking($id);
                $o = DB::table('orders')->where('id', $id)->first() ?? $o;
            } catch (\Throwable $e) {
                $events = Schema::hasTable('shipping_status_histories')
                    ? DB::table('shipping_status_histories')->where('order_id', $id)->orderBy('occurred_at')->get()
                    : collect();
                $tracking = [
                    'order_code' => $o->tracking_code ?? null,
                    'status' => $o->ghn_status ?? null,
                    'status_label' => $this->shipping->statusLabel($o->ghn_status ?? null),
                    'leadtime' => $o->ghn_expected_delivery_at ?? null,
                    'expected_delivery_time' => $o->ghn_expected_delivery_at ?? null,
                    'updated_date' => $o->ghn_last_synced_at ?? null,
                    'logs' => $events->map(fn ($event) => [
                        'status' => $event->status,
                        'status_label' => $event->description ?: $this->shipping->statusLabel($event->status),
                        'description' => $event->description ?: $this->shipping->statusLabel($event->status),
                        'updated_date' => $event->occurred_at,
                        'source' => $event->source ?? ($event->provider ?? 'ghn'),
                        'location' => $event->location ?? null,
                        'is_simulated' => (bool) ($event->is_simulated ?? false),
                    ])->values()->all(),
                    'sync_error' => $e->getMessage(),
                ];
                $tracking['delivery_map'] = $this->shipping->deliveryMapForOrder((int) $id, $tracking);
            }
        }

        $shippingEvents = Schema::hasTable('shipping_status_histories')
            ? DB::table('shipping_status_histories')->where('order_id', $id)->orderBy('occurred_at')->get()
            : collect();

        return [
            'id' => $o->id, 'order_code' => $o->order_code, 'status' => $o->status,
            'payment_method' => $o->payment_method, 'payment_status' => $o->payment_status,
            'customer_name' => $o->customer_name, 'customer_email' => $o->customer_email, 'customer_phone' => $o->customer_phone,
            'shipping_address' => $o->shipping_address, 'province' => $o->province, 'district' => $o->district, 'ward' => $o->ward, 'note' => $o->note,
            'subtotal' => (float) $o->subtotal, 'discount' => (float) $o->discount_amount, 'discount_amount' => (float) $o->discount_amount,
            'shipping_fee' => (float) $o->shipping_fee, 'total' => (float) $o->grand_total, 'grand_total' => (float) $o->grand_total,
            'shipping_provider' => $o->shipping_provider ?? null, 'tracking_code' => $o->tracking_code ?? null, 'tracking' => $tracking,
            'ghn_status' => $o->ghn_status ?? null,
            'ghn_service_id' => $o->ghn_service_id ?? null,
            'ghn_service_type_id' => $o->ghn_service_type_id ?? null,
            'ghn_carrier_fee' => isset($o->ghn_carrier_fee) ? (float) $o->ghn_carrier_fee : null,
            'ghn_expected_delivery_at' => $o->ghn_expected_delivery_at ?? null,
            'ghn_last_synced_at' => $o->ghn_last_synced_at ?? null,
            'items_count' => $items->count(), 'items' => $items, 'order_items' => $items,
            'status_history' => $history, 'shipping_status_history' => $shippingEvents, 'payment_transactions' => $payments,
            'created_at' => $o->created_at, 'updated_at' => $o->updated_at,
        ];
    }
}