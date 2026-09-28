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
        private ShippingService $shipping,
        private VoucherService $vouchers,
    ) {}

    private function onlyExistingOrderColumns(array $data): array
    {
        if (!Schema::hasTable('orders')) {
            return [];
        }

        return collect($data)
            ->filter(function ($value, $key) {
                return Schema::hasColumn('orders', $key);
            })
            ->toArray();
    }

    private function onlyExistingOrderItemColumns(array $data): array
    {
        if (!Schema::hasTable('order_items')) {
            return [];
        }

        return collect($data)
            ->filter(function ($value, $key) {
                return Schema::hasColumn('order_items', $key);
            })
            ->toArray();
    }

    private function toNullableInt($value): ?int
    {
        if ($value === null || $value === '' || $value === 'null') {
            return null;
        }

        return is_numeric($value) ? (int) $value : null;
    }

    private function getOrderByColumn(): string
    {
        if (Schema::hasColumn('orders', 'created_at')) {
            return 'created_at';
        }

        return 'id';
    }

    private function getOrderItems($orderId)
    {
        if (
            !Schema::hasTable('order_items') ||
            !Schema::hasColumn('order_items', 'order_id')
        ) {
            return collect();
        }

        return DB::table('order_items')
            ->where('order_id', $orderId)
            ->get();
    }

    private function getOrderWithItems($orderId)
    {
        if (!Schema::hasTable('orders')) {
            return null;
        }

        $order = DB::table('orders')
            ->where('id', $orderId)
            ->first();

        if ($order) {
            $order->items = $this->getOrderItems($order->id);
        }

        return $order;
    }

    private function getOrderTotal($order): float
    {
        return (float) (
            $order->grand_total
            ?? $order->total
            ?? $order->total_price
            ?? $order->subtotal
            ?? 0
        );
    }

    private function normalizeOrder($order)
    {
        $items = $this->getOrderItems($order->id);

        return [
            'id' => $order->id,
            'order_code' => $order->order_code
                ?? ('DH' . str_pad($order->id, 6, '0', STR_PAD_LEFT)),

            'status' => $order->status ?? 'pending',

            'payment_method' => $order->payment_method ?? 'cod',
            'payment_status' => $order->payment_status ?? 'unpaid',

            'customer_name' => $order->customer_name
                ?? $order->name
                ?? null,

            'customer_email' => $order->customer_email
                ?? $order->email
                ?? null,

            'customer_phone' => $order->customer_phone
                ?? $order->phone
                ?? null,

            'shipping_address' => $order->shipping_address
                ?? $order->address
                ?? null,

            'address' => $order->address ?? null,
            'province' => $order->province ?? null,
            'district' => $order->district ?? null,
            'ward' => $order->ward ?? null,
            'note' => $order->note ?? null,

            'coupon' => $order->coupon 
                ?? $order->voucher_code 
                ?? $order->voucher 
                ?? null,

            'subtotal' => (float) ($order->subtotal ?? $order->total_price ?? 0),
            'discount' => (float) ($order->discount ?? $order->discount_amount ?? 0),
            'shipping_fee' => (float) ($order->shipping_fee ?? 0),

            'total' => $this->getOrderTotal($order),
            'grand_total' => $this->getOrderTotal($order),

            'items_count' => $items->count(),
            'items' => $items,

            'created_at' => $order->created_at ?? null,
            'updated_at' => $order->updated_at ?? null,
        ];
    }

    private function getStats($userId): array
    {
        if (!Schema::hasTable('orders') || !Schema::hasColumn('orders', 'user_id')) {
            return [
                'total' => 0,
                'pending' => 0,
                'shipping' => 0,
                'completed' => 0,
                'cancelled' => 0,
            ];
        }

        $orders = DB::table('orders')
            ->where('user_id', $userId)
            ->get();

        return [
            'total' => $orders->count(),
            'pending' => $orders->where('status', 'pending')->count(),
            'shipping' => $orders->whereIn('status', ['shipping', 'delivering'])->count(),
            'completed' => $orders->whereIn('status', ['completed', 'success'])->count(),
            'cancelled' => $orders->whereIn('status', ['cancelled', 'canceled'])->count(),
        ];
    }

    public function store(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn cần đăng nhập để đặt hàng.',
            ], 401);
        }

        if (!Schema::hasTable('orders')) {
            return response()->json([
                'success' => false,
                'message' => 'Bảng orders chưa tồn tại.',
            ], 500);
        }

        $validated = $request->validate([
            'customer.fullName' => ['required', 'string'],
            'customer.email' => ['nullable', 'email'],
            'customer.phone' => ['required', 'string'],

            'shippingAddress.province' => ['required', 'string'],
            'shippingAddress.provinceCode' => ['required', 'integer'],
            'shippingAddress.district' => ['required', 'string'],
            'shippingAddress.districtCode' => ['required', 'integer'],
            'shippingAddress.ward' => ['required', 'string'],
            'shippingAddress.wardCode' => ['required', 'string'],
            'shippingAddress.address' => ['required', 'string'],
            'shippingAddress.note' => ['nullable', 'string'],

            'items' => ['nullable', 'array'],
            'items.*.product_id' => ['nullable', 'integer'],
            'items.*.productId' => ['nullable', 'integer'],
            'items.*.id' => ['nullable', 'integer'],
            'items.*.product_variant_id' => ['nullable', 'integer'],
            'items.*.variant_id' => ['nullable', 'integer'],
            'items.*.variantId' => ['nullable', 'integer'],
            'items.*.quantity' => ['nullable', 'integer', 'min:1', 'max:99'],
            'checkoutMode' => ['nullable', 'string', 'in:cart,buy_now'],
            'paymentMethod' => ['required', 'string', 'in:COD,BANK,BANK_TRANSFER,cod,bank,bank_transfer'],

            'subtotal' => ['required', 'numeric'],
            'discount' => ['nullable', 'numeric', 'min:0'],
            'shippingFee' => ['nullable', 'numeric', 'min:0'],
            'total' => ['required', 'numeric'],
            'coupon' => ['nullable', 'string'],
        ]);

        $frontendPaymentMethod = strtoupper($validated['paymentMethod']);

        $paymentMethod = match ($frontendPaymentMethod) {
            'BANK', 'BANK_TRANSFER' => 'bank',
            default => 'cod',
        };

        $paymentStatus = 'unpaid';
        $orderStatus = 'pending';
        $checkoutMode = strtolower((string) ($validated['checkoutMode'] ?? 'cart'));
        $orderCode = 'DNV' . now()->format('ymdHis') . strtoupper(Str::random(3));

        $orderId = DB::transaction(function () use (
            $validated,
            $request,
            $user,
            $orderCode,
            $paymentMethod,
            $paymentStatus,
            $orderStatus,
            $checkoutMode
        ) {
            $customerName = data_get($validated, 'customer.fullName');
            $customerEmail = data_get($validated, 'customer.email');
            $customerPhone = data_get($validated, 'customer.phone');

            $address = data_get($validated, 'shippingAddress.address');
            $province = data_get($validated, 'shippingAddress.province');
            $district = data_get($validated, 'shippingAddress.district');
            $ward = data_get($validated, 'shippingAddress.ward');
            $provinceCode = (string) data_get($validated, 'shippingAddress.provinceCode', '');
            $districtCode = (string) data_get($validated, 'shippingAddress.districtCode', '');
            $wardCode = (string) data_get($validated, 'shippingAddress.wardCode', '');
            $fullShippingAddress = collect([
                $address,
                $ward,
                $district && $district !== $ward ? $district : null,
                $province,
            ])->filter()->implode(', ');

            /*
             * Không tin số lượng, giá và tồn kho từ frontend.
             * Tại thời điểm đặt hàng phải khóa bản ghi kho, kiểm tra lại và
             * trừ kho trong cùng transaction để tránh oversell khi nhiều người
             * mua cùng lúc.
             */
            $preparedItems = [];
            $serverSubtotal = 0.0;
            $serverWeight = 0;

            /*
             * Với user đã đăng nhập, cart_items trong database là nguồn sự thật.
             * Frontend có thể đang giữ cache cũ nên không dùng items gửi lên nếu
             * server cart đang có dữ liệu. Điều này tránh lỗi 422 vì ID/variant
             * trên localStorage không còn khớp với giỏ thật.
             */
            // Dùng dữ liệu đã chọn trên checkout như nguồn đáng tin cậy nhất.
            // Nếu request gửi subset sản phẩm, server không được lật sang toàn bộ giỏ
            // trên database và tính lại đơn theo mọi item trong giỏ.
            $requestedItems = collect($request->input('items', []))
                ->map(function ($item) {
                    if (!is_array($item)) {
                        return null;
                    }

                    return [
                        'product_id' => $item['product_id']
                            ?? $item['productId']
                            ?? $item['product']['id']
                            ?? $item['id']
                            ?? null,
                        'product_variant_id' => $item['product_variant_id']
                            ?? $item['variant_id']
                            ?? $item['variantId']
                            ?? data_get($item, 'variant.id')
                            ?? null,
                        'quantity' => max(1, (int) ($item['quantity'] ?? 1)),
                    ];
                })
                ->filter(fn ($item) => !empty($item['product_id']))
                ->values()
                ->all();

            $serverCartRows = Schema::hasTable('cart_items')
                ? DB::table('cart_items')
                    ->where('user_id', $user->id)
                    ->lockForUpdate()
                    ->get()
                : collect();

            // Nếu người dùng đã chọn một phần sản phẩm trên checkout, ưu tiên subset đó
            // thay vì dùng tất cả cart_items trong database. Với mua ngay, tuyệt đối
            // không fallback sang giỏ hàng server nếu request bị thiếu items.
            $sourceItems = $requestedItems;

            if (empty($sourceItems) && $checkoutMode === 'cart') {
                // Dọn các dòng cart lỗi/di sản không có product_id. Các dòng này có thể
                // không hiện trên UI (do cart API JOIN products) nhưng trước đây vẫn làm
                // checkout fail 422 "Không xác định được sản phẩm trong giỏ hàng".
                $serverProductIds = $serverCartRows
                    ->pluck('product_id')
                    ->filter()
                    ->map(fn ($id) => (int) $id)
                    ->unique()
                    ->values();

                $existingProductIds = $serverProductIds->isNotEmpty()
                    ? DB::table('products')
                        ->whereIn('id', $serverProductIds->all())
                        ->pluck('id')
                        ->map(fn ($id) => (int) $id)
                        ->flip()
                    : collect();

                $invalidCartIds = $serverCartRows
                    ->filter(function ($row) use ($existingProductIds) {
                        if (empty($row->product_id)) {
                            return true;
                        }

                        return !$existingProductIds->has((int) $row->product_id);
                    })
                    ->pluck('id')
                    ->filter()
                    ->values();

                if ($invalidCartIds->isNotEmpty()) {
                    DB::table('cart_items')
                        ->where('user_id', $user->id)
                        ->whereIn('id', $invalidCartIds->all())
                        ->delete();
                }

                $validServerCartRows = $serverCartRows
                    ->filter(fn ($row) =>
                        !empty($row->product_id) &&
                        $existingProductIds->has((int) $row->product_id)
                    )
                    ->values();

                $sourceItems = $validServerCartRows->map(fn ($row) => [
                    'product_id' => $row->product_id,
                    'product_variant_id' => $row->product_variant_id,
                    'quantity' => max(1, (int) ($row->quantity ?? 1)),
                ])->values()->all();
            }

            if (empty($sourceItems)) {
                $message = $checkoutMode === 'buy_now'
                    ? 'Không xác định được sản phẩm mua ngay. Vui lòng quay lại sản phẩm và thử lại.'
                    : 'Giỏ hàng đang trống hoặc đã thay đổi. Vui lòng quay lại giỏ hàng và thử lại.';

                throw ValidationException::withMessages([
                    'cart' => [$message],
                ]);
            }

            foreach ($sourceItems as $index => $item) {
                $productId = $this->toNullableInt(
                    $item['product_id']
                    ?? $item['productId']
                    ?? $item['id']
                    ?? null
                );

                $variantId = $this->toNullableInt(
                    $item['product_variant_id']
                    ?? $item['variantId']
                    ?? $item['variant_id']
                    ?? null
                );

                $quantity = max(1, (int) ($item['quantity'] ?? 1));

                if (!$productId) {
                    throw ValidationException::withMessages([
                        "items.$index.product_id" => ['Không xác định được sản phẩm trong giỏ hàng.'],
                    ]);
                }

                $product = DB::table('products')
                    ->where('id', $productId)
                    ->lockForUpdate()
                    ->first();

                if (!$product) {
                    throw ValidationException::withMessages([
                        "items.$index.product_id" => ['Sản phẩm không còn tồn tại. Vui lòng cập nhật lại giỏ hàng.'],
                    ]);
                }

                if (property_exists($product, 'status') && !in_array(strtolower((string) $product->status), ['active', 'published'], true)) {
                    throw ValidationException::withMessages([
                        "items.$index.product_id" => ["Sản phẩm {$product->name} hiện đã ngừng bán."],
                    ]);
                }

                $variant = null;
                if ($variantId !== null) {
                    $variant = DB::table('product_variants')
                        ->where('id', $variantId)
                        ->where('product_id', $productId)
                        ->lockForUpdate()
                        ->first();

                    if (!$variant) {
                        throw ValidationException::withMessages([
                            "items.$index.product_variant_id" => ["Phân loại của sản phẩm {$product->name} không còn tồn tại."],
                        ]);
                    }

                    if (property_exists($variant, 'is_active') && !(bool) $variant->is_active) {
                        throw ValidationException::withMessages([
                            "items.$index.product_variant_id" => ["Phân loại của sản phẩm {$product->name} hiện đã ngừng bán."],
                        ]);
                    }
                } else {
                    $hasVariants = DB::table('product_variants')
                        ->where('product_id', $productId)
                        ->when(
                            Schema::hasColumn('product_variants', 'is_active'),
                            fn ($query) => $query->where('is_active', 1)
                        )
                        ->exists();

                    if ($hasVariants) {
                        throw ValidationException::withMessages([
                            "items.$index.product_variant_id" => ["Vui lòng chọn lại màu sắc/kích thước của {$product->name}."],
                        ]);
                    }
                }

                $stock = $variant
                    ? (int) ($variant->stock ?? 0)
                    : (int) ($product->stock ?? 0);

                if ($stock <= 0) {
                    throw ValidationException::withMessages([
                        "items.$index.quantity" => ["{$product->name} đã hết hàng."],
                    ]);
                }

                if ($quantity > $stock) {
                    throw ValidationException::withMessages([
                        "items.$index.quantity" => ["{$product->name} chỉ còn {$stock} sản phẩm trong kho. Vui lòng giảm số lượng trước khi đặt hàng."],
                    ]);
                }

                $basePrice = $variant
                    ? (float) ($variant->price ?? 0)
                    : (float) ($product->price ?? 0);

                if ($basePrice <= 0) {
                    $basePrice = (float) ($product->price ?? 0);
                }

                $discountPrice = $variant
                    ? (float) ($variant->discount_price ?? 0)
                    : 0.0;

                $unitPrice = $discountPrice > 0 && $discountPrice < $basePrice
                    ? $discountPrice
                    : $basePrice;

                $lineTotal = $unitPrice * $quantity;
                $serverSubtotal += $lineTotal;
                $rawUnitWeight = (int) ($variant->weight ?? $product->weight ?? 0);
                $unitWeight = $rawUnitWeight > 0
                    ? $rawUnitWeight
                    : max(1, (int) config('services.ghn.default_item_weight', 300));
                $serverWeight += $unitWeight * $quantity;

                $preparedItems[] = [
                    'product_id' => $productId,
                    'variant_id' => $variantId,
                    'quantity' => $quantity,
                    'price' => $unitPrice,
                    'line_total' => $lineTotal,
                    'name' => $product->name ?? ($item['name'] ?? 'Sản phẩm'),
                    'image' => ($variant->image ?? null) ?: ($product->image ?? ($item['image'] ?? null)),
                    'size' => $item['size'] ?? null,
                    'color' => $item['color'] ?? null,
                ];

                if ($variant) {
                    DB::table('product_variants')
                        ->where('id', $variantId)
                        ->decrement('stock', $quantity);
                } elseif (Schema::hasColumn('products', 'stock')) {
                    DB::table('products')
                        ->where('id', $productId)
                        ->decrement('stock', $quantity);
                }
            }

            $serverSubtotal = round($serverSubtotal, 2);
            $serverWeight = max(1, $serverWeight);

            try {
                $shippingQuote = $this->shipping->calculate([
                    'province' => $province,
                    'provinceCode' => $provinceCode,
                    'district' => $district,
                    'districtCode' => $districtCode,
                    'ward' => $ward,
                    'wardCode' => $wardCode,
                    'address' => $address,
                ], $serverSubtotal, $serverWeight);
            } catch (\RuntimeException $e) {
                throw ValidationException::withMessages([
                    'shippingAddress' => [$e->getMessage()],
                ]);
            }

            $shippingFee = max(0, (float) ($shippingQuote['fee'] ?? 0));
            $freeShipping = (bool) ($shippingQuote['free_shipping'] ?? false);

            // Endpoint tính phí đã chặn trường hợp GHN trả 0đ bất thường; tạo đơn cũng
            // phải kiểm tra lại để frontend không thể gửi thẳng request với phí sai.
            if ($shippingFee <= 0 && !$freeShipping) {
                throw ValidationException::withMessages([
                    'shippingAddress' => ['GHN trả về phí vận chuyển 0 nhưng chưa xác nhận miễn phí vận chuyển.'],
                ]);
            }

            $couponCode = !empty($validated['coupon']) ? strtoupper(trim($validated['coupon'])) : null;
            $discount = 0.0;
            $voucher = null;

            if ($couponCode) {
                $voucherResult = $this->vouchers->validateAndCalculate(
                    $couponCode,
                    $serverSubtotal,
                    (int) $user->id,
                    true,
                );
                $voucher = $voucherResult['voucher'];
                $discount = $voucherResult['discount'];
            }

            $serverTotal = max(0, $serverSubtotal - $discount) + $shippingFee;

            $orderPayload = $this->onlyExistingOrderColumns([
                'user_id' => $user->id,
                'order_code' => $orderCode,
                'customer_name' => $customerName,
                'name' => $customerName,
                'full_name' => $customerName,
                'email' => $customerEmail,
                'customer_email' => $customerEmail,
                'phone' => $customerPhone,
                'customer_phone' => $customerPhone,
                'address' => $address,
                'shipping_address' => $fullShippingAddress,
                'province' => $province,
                'province_code' => $provinceCode,
                'district' => $district,
                'district_code' => $districtCode,
                'ward' => $ward,
                'ward_code' => $wardCode,
                'shipping_provider' => 'ghn',
                'shipping_weight_grams' => $serverWeight,
                'ghn_service_id' => $shippingQuote['service_id'] ?? null,
                'ghn_service_type_id' => $shippingQuote['service_type_id'] ?? null,
                'ghn_carrier_fee' => $shippingQuote['carrier_fee'] ?? $shippingFee,
                'note' => data_get($request->all(), 'shippingAddress.note'),
                'payment_method' => $paymentMethod,
                'payment_status' => $paymentStatus,
                'status' => $orderStatus,
                'stock_deducted_at' => now(),
                'stock_restored_at' => null,
                'coupon' => $couponCode,
                'voucher_code' => $couponCode,
                'voucher' => $couponCode,
                'coupon_code' => $couponCode,
                'total_price' => $serverSubtotal,
                'discount_amount' => $discount,
                'shipping_fee' => $shippingFee,
                'grand_total' => $serverTotal,
                'subtotal' => $serverSubtotal,
                'discount' => $discount,
                'total' => $serverTotal,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $orderId = DB::table('orders')->insertGetId($orderPayload);

            if ($voucher) {
                $this->vouchers->consume(
                    $voucher,
                    (int) $user->id,
                    (int) $orderId,
                    $discount,
                );
            }

            if (Schema::hasTable('order_items')) {
                foreach ($preparedItems as $item) {
                    $orderItemPayload = $this->onlyExistingOrderItemColumns([
                        'order_id' => $orderId,
                        'product_id' => $item['product_id'],
                        'product_variant_id' => $item['variant_id'],
                        'variant_id' => $item['variant_id'],
                        'product_name' => $item['name'],
                        'name' => $item['name'],
                        'image' => $item['image'],
                        'product_image' => $item['image'],
                        'size' => $item['size'],
                        'color' => $item['color'],
                        'quantity' => $item['quantity'],
                        'qty' => $item['quantity'],
                        'price' => $item['price'],
                        'unit_price' => $item['price'],
                        'total' => $item['line_total'],
                        'subtotal' => $item['line_total'],
                        'line_total' => $item['line_total'],
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    if (!empty($orderItemPayload)) {
                        DB::table('order_items')->insert($orderItemPayload);
                    }
                }
            }

            // Lưu địa chỉ vừa đặt để checkout lần sau tự điền lại.
            $userUpdates = [];
            foreach ([
                'name' => $customerName,
                'full_name' => $customerName,
                'phone' => $customerPhone,
                'address' => $address,
                'province' => $province,
                'district' => $district,
                'ward' => $ward,
            ] as $column => $value) {
                if (Schema::hasColumn('users', $column)) {
                    $userUpdates[$column] = $value;
                }
            }
            if (Schema::hasColumn('users', 'updated_at')) {
                $userUpdates['updated_at'] = now();
            }
            if (!empty($userUpdates)) {
                DB::table('users')->where('id', $user->id)->update($userUpdates);
            }

            // Chỉ xóa những item thực sự đã được thanh toán trong đơn hiện tại.
            // Điều này giữ lại các sản phẩm còn lại trong giỏ khi người dùng chọn subset.
            if ($checkoutMode === 'cart' && Schema::hasTable('cart_items') && !empty($sourceItems)) {
                foreach ($sourceItems as $item) {
                    $productId = $this->toNullableInt($item['product_id'] ?? null);
                    if (!$productId) {
                        continue;
                    }

                    $variantId = $this->toNullableInt($item['product_variant_id'] ?? null);
                    $qtyToRemove = max(1, (int) ($item['quantity'] ?? 1));

                    $query = DB::table('cart_items')
                        ->where('user_id', $user->id)
                        ->where('product_id', $productId);

                    if ($variantId !== null) {
                        $query->where('product_variant_id', $variantId);
                    } else {
                        $query->where(function ($sub) {
                            $sub->whereNull('product_variant_id')->orWhere('product_variant_id', 0);
                        });
                    }

                    $matchingRows = $query->get();
                    foreach ($matchingRows as $row) {
                        $currentQty = max(0, (int) ($row->quantity ?? 0));
                        $remainingQty = $currentQty - $qtyToRemove;

                        if ($remainingQty <= 0) {
                            DB::table('cart_items')->where('id', $row->id)->delete();
                        } else {
                            DB::table('cart_items')->where('id', $row->id)->update([
                                'quantity' => $remainingQty,
                                'updated_at' => now(),
                            ]);
                        }
                    }
                }
            }

            return $orderId;
        });

        $order = $this->getOrderWithItems($orderId);

        return response()->json([
            'success' => true,
            'message' => $paymentMethod === 'bank'
                ? 'Đơn hàng đã được tạo và đang chờ chuyển khoản.'
                : 'Tạo đơn hàng thành công.',
            'data' => $order,
        ], 201);
    }

    public function index(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn cần đăng nhập để xem lịch sử đơn hàng.',
            ], 401);
        }

        if (!Schema::hasTable('orders')) {
            return response()->json([
                'success' => true,
                'message' => 'Chưa có bảng đơn hàng.',
                'data' => [
                    'orders' => [],
                    'total' => 0,
                    'stats' => [
                        'total' => 0,
                        'pending' => 0,
                        'shipping' => 0,
                        'completed' => 0,
                        'cancelled' => 0,
                    ],
                ],
            ]);
        }

        if (!Schema::hasColumn('orders', 'user_id')) {
            return response()->json([
                'success' => true,
                'message' => 'Bảng orders chưa có cột user_id.',
                'data' => [
                    'orders' => [],
                    'total' => 0,
                    'stats' => [
                        'total' => 0,
                        'pending' => 0,
                        'shipping' => 0,
                        'completed' => 0,
                        'cancelled' => 0,
                    ],
                ],
            ]);
        }

        $query = DB::table('orders')
            ->where('user_id', $user->id)
            ->orderByDesc($this->getOrderByColumn());

        if (
            $request->filled('status') &&
            $request->status !== 'all' &&
            Schema::hasColumn('orders', 'status')
        ) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                if (Schema::hasColumn('orders', 'order_code')) {
                    $q->where('order_code', 'like', "%{$search}%");
                }

                if (Schema::hasColumn('orders', 'phone')) {
                    $q->orWhere('phone', 'like', "%{$search}%");
                }

                if (Schema::hasColumn('orders', 'customer_phone')) {
                    $q->orWhere('customer_phone', 'like', "%{$search}%");
                }

                if (Schema::hasColumn('orders', 'customer_name')) {
                    $q->orWhere('customer_name', 'like', "%{$search}%");
                }
            });
        }

        $orders = $query->get()->map(function ($order) {
            return $this->normalizeOrder($order);
        });

        return response()->json([
            'success' => true,
            'message' => 'Lấy lịch sử đơn hàng thành công.',
            'data' => [
                'orders' => $orders,
                'total' => $orders->count(),
                'stats' => $this->getStats($user->id),
            ],
        ]);
    }

    public function myOrders(Request $request)
    {
        return $this->index($request);
    }

    public function show(Request $request, $id)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn cần đăng nhập để xem đơn hàng.',
            ], 401);
        }

        if (!Schema::hasTable('orders')) {
            return response()->json([
                'success' => false,
                'message' => 'Bảng orders chưa tồn tại.',
            ], 404);
        }

        $order = DB::table('orders')
            ->where('user_id', $user->id)
            ->where('id', $id)
            ->first();

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy đơn hàng.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Lấy chi tiết đơn hàng thành công.',
            'data' => $this->normalizeOrder($order),
        ]);
    }

    public function tracking(Request $request, $id)
    {
        $order = DB::table('orders')
            ->where('user_id', $request->user()->id)
            ->where('id', $id)
            ->first();

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy đơn hàng.',
            ], 404);
        }

        if (empty($order->tracking_code)) {
            return response()->json([
                'success' => true,
                'message' => 'Đơn hàng chưa có mã vận đơn.',
                'data' => null,
            ]);
        }

        try {
            $tracking = $this->shipping->syncOrderTracking((int) $order->id);
        } catch (\Throwable $exception) {
            report($exception);
            $logs = Schema::hasTable('shipping_status_histories')
                ? DB::table('shipping_status_histories')
                    ->where('order_id', $order->id)
                    ->orderBy('occurred_at')
                    ->orderBy('id')
                    ->get()
                    ->map(fn ($row) => [
                        'status' => $row->status ?? null,
                        'status_label' => $this->shipping->statusLabel($row->status ?? null),
                        'description' => $row->description ?? null,
                        'updated_date' => $row->occurred_at ?? $row->created_at ?? null,
                        'source' => $row->source ?? null,
                        'location' => $row->location ?? null,
                    ])
                    ->values()
                    ->all()
                : [];

            $tracking = [
                'order_code' => $order->tracking_code,
                'status' => $order->ghn_status ?? 'ready_to_pick',
                'status_label' => $this->shipping->statusLabel($order->ghn_status ?? 'ready_to_pick'),
                'leadtime' => $order->ghn_expected_delivery_at ?? null,
                'updated_date' => $order->ghn_last_synced_at ?? null,
                'logs' => $logs,
                'sync_error' => true,
            ];
        }

        return response()->json([
            'success' => true,
            'message' => 'Đã cập nhật trạng thái vận chuyển.',
            'data' => $tracking,
        ]);
    }

    public function cancel(Request $request, $id)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn cần đăng nhập để hủy đơn hàng.',
            ], 401);
        }

        if (!Schema::hasTable('orders')) {
            return response()->json([
                'success' => false,
                'message' => 'Bảng orders chưa tồn tại.',
            ], 404);
        }

        try {
            DB::transaction(function () use ($user, $id) {
                $order = DB::table('orders')
                    ->where('user_id', $user->id)
                    ->where('id', $id)
                    ->lockForUpdate()
                    ->first();

                if (!$order) {
                    throw ValidationException::withMessages([
                        'order' => ['Không tìm thấy đơn hàng.'],
                    ]);
                }

                $status = $order->status ?? 'pending';

                if (!in_array($status, ['pending', 'waiting_bank_transfer', 'confirmed', 'processing'], true)) {
                    throw ValidationException::withMessages([
                        'order' => ['Đơn hàng này không thể hủy ở trạng thái hiện tại.'],
                    ]);
                }

                if (strtolower((string) ($order->payment_status ?? 'unpaid')) === 'paid') {
                    throw ValidationException::withMessages([
                        'order' => ['Đơn hàng đã thanh toán. Vui lòng liên hệ shop để được hỗ trợ hủy và hoàn tiền.'],
                    ]);
                }

                if (!empty($order->tracking_code)) {
                    throw ValidationException::withMessages([
                        'order' => ['Đơn hàng đã được tạo vận đơn. Vui lòng liên hệ shop để được hỗ trợ hủy.'],
                    ]);
                }

                /*
                 * Checkout đã trừ kho khi tạo đơn, vì vậy hủy đơn hợp lệ phải
                 * hoàn lại đúng lượng hàng đã giữ. Toàn bộ thao tác nằm trong
                 * transaction + lock order để hai request hủy đồng thời không
                 * thể hoàn kho hai lần.
                 */
                $stockAlreadyRestored = Schema::hasColumn('orders', 'stock_restored_at')
                    && !empty($order->stock_restored_at);

                if (!$stockAlreadyRestored && Schema::hasTable('order_items') && Schema::hasColumn('order_items', 'order_id')) {
                    $orderItems = DB::table('order_items')
                        ->where('order_id', $order->id)
                        ->get();

                    foreach ($orderItems as $item) {
                        $quantity = max(0, (int) ($item->quantity ?? 0));

                        if ($quantity <= 0) {
                            continue;
                        }

                        $variantId = $item->product_variant_id ?? $item->variant_id ?? null;
                        $productId = $item->product_id ?? null;

                        if ($variantId && Schema::hasTable('product_variants') && Schema::hasColumn('product_variants', 'stock')) {
                            DB::table('product_variants')
                                ->where('id', $variantId)
                                ->increment('stock', $quantity);
                        } elseif ($productId && Schema::hasTable('products') && Schema::hasColumn('products', 'stock')) {
                            DB::table('products')
                                ->where('id', $productId)
                                ->increment('stock', $quantity);
                        }
                    }
                }

                $updates = [];

                if (Schema::hasColumn('orders', 'status')) {
                    $updates['status'] = 'cancelled';
                }

                if (Schema::hasColumn('orders', 'cancelled_at')) {
                    $updates['cancelled_at'] = now();
                }

                if (Schema::hasColumn('orders', 'stock_restored_at') && !$stockAlreadyRestored) {
                    $updates['stock_restored_at'] = now();
                }

                if (Schema::hasColumn('orders', 'updated_at')) {
                    $updates['updated_at'] = now();
                }

                if (!empty($updates)) {
                    DB::table('orders')
                        ->where('id', $id)
                        ->update($updates);
                }

                if (Schema::hasTable('payment_transactions')) {
                    DB::table('payment_transactions')
                        ->where('order_id', $order->id)
                        ->where('status', 'pending')
                        ->update([
                            'status' => 'cancelled',
                            'updated_at' => now(),
                        ]);
                }

                if (Schema::hasTable('order_status_histories')) {
                    DB::table('order_status_histories')->insert([
                        'order_id' => $order->id,
                        'changed_by' => $user->id,
                        'from_status' => $status,
                        'to_status' => 'cancelled',
                        'source' => 'customer',
                        'note' => 'Khách hàng hủy đơn.',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                $couponCode = $order->coupon
                    ?? $order->voucher_code
                    ?? $order->voucher
                    ?? $order->coupon_code
                    ?? null;

                $this->vouchers->releaseForCancelledOrder((int) $order->id, $couponCode);
            });
        } catch (ValidationException $e) {
            $message = collect($e->errors())->flatten()->first() ?: 'Không thể hủy đơn hàng.';

            return response()->json([
                'success' => false,
                'message' => $message,
                'errors' => $e->errors(),
            ], 422);
        }

        $updatedOrder = $this->getOrderWithItems($id);

        return response()->json([
            'success' => true,
            'message' => 'Hủy đơn hàng thành công và đã hoàn lại tồn kho.',
            'data' => $updatedOrder,
        ]);
    }

    public function reorder(Request $request, $id)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn cần đăng nhập để mua lại đơn hàng.',
            ], 401);
        }

        if (!Schema::hasTable('orders')) {
            return response()->json([
                'success' => false,
                'message' => 'Bảng orders chưa tồn tại.',
            ], 404);
        }

        $order = DB::table('orders')
            ->where('user_id', $user->id)
            ->where('id', $id)
            ->first();

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy đơn hàng.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Đã lấy dữ liệu mua lại đơn hàng.',
            'data' => $this->normalizeOrder($order),
        ]);
    }
}
