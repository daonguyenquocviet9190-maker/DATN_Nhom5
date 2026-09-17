<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;

class OrderController extends Controller
{
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
            'shippingAddress.provinceCode' => ['nullable'],
            'shippingAddress.district' => ['nullable', 'string'],
            'shippingAddress.ward' => ['required', 'string'],
            'shippingAddress.wardCode' => ['nullable'],
            'shippingAddress.address' => ['required', 'string'],
            'shippingAddress.note' => ['nullable', 'string'],

            'items' => ['required', 'array', 'min:1'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:99'],
            'paymentMethod' => ['required', 'string'],

            'subtotal' => ['required', 'numeric'],
            'discount' => ['nullable', 'numeric', 'min:0'],
            'shippingFee' => ['nullable', 'numeric', 'min:0'],
            'total' => ['required', 'numeric'],
            'coupon' => ['nullable', 'string'],
        ]);

        $frontendPaymentMethod = strtoupper($validated['paymentMethod']);

        $paymentMethod = match ($frontendPaymentMethod) {
            'COD' => 'cod',
            'BANK', 'BANK_TRANSFER' => 'bank_transfer',
            'VNPAY', 'MOMO', 'ONLINE' => 'online',
            default => 'cod',
        };

        $paymentStatus = 'unpaid';
        $orderStatus = 'pending';
        $orderCode = 'DNV' . now()->format('ymdHis') . strtoupper(Str::random(3));

        $orderId = DB::transaction(function () use (
            $validated,
            $request,
            $user,
            $orderCode,
            $paymentMethod,
            $paymentStatus,
            $orderStatus
        ) {
            $customerName = data_get($validated, 'customer.fullName');
            $customerEmail = data_get($validated, 'customer.email');
            $customerPhone = data_get($validated, 'customer.phone');

            $address = data_get($validated, 'shippingAddress.address');
            $province = data_get($validated, 'shippingAddress.province');
            $district = data_get($validated, 'shippingAddress.district');
            $ward = data_get($validated, 'shippingAddress.ward');

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

            foreach ($validated['items'] as $index => $item) {
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
            $shippingFee = max(0, (float) ($validated['shippingFee'] ?? 0));
            $discount = min($serverSubtotal, max(0, (float) ($validated['discount'] ?? 0)));
            $serverTotal = max(0, $serverSubtotal - $discount) + $shippingFee;

            $couponCode = !empty($validated['coupon']) ? strtoupper(trim($validated['coupon'])) : null;

            if ($couponCode && Schema::hasTable('vouchers')) {
                $voucher = DB::table('vouchers')
                    ->where('code', $couponCode)
                    ->where('is_active', 1)
                    ->lockForUpdate()
                    ->first();

                if ($voucher && Schema::hasColumn('vouchers', 'used_count')) {
                    DB::table('vouchers')
                        ->where('id', $voucher->id)
                        ->increment('used_count');
                }
            }

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
                'district' => $district,
                'ward' => $ward,
                'note' => data_get($request->all(), 'shippingAddress.note'),
                'payment_method' => $paymentMethod,
                'payment_status' => $paymentStatus,
                'status' => $orderStatus,
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

            // Checkout thành công thì giỏ server phải được làm sạch.
            if (Schema::hasTable('cart_items')) {
                DB::table('cart_items')->where('user_id', $user->id)->delete();
            }

            return $orderId;
        });

        $order = $this->getOrderWithItems($orderId);

        return response()->json([
            'success' => true,
            'message' => 'Tạo đơn hàng thành công.',
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

        $status = $order->status ?? 'pending';

        if (!in_array($status, ['pending', 'confirmed', 'processing'])) {
            return response()->json([
                'success' => false,
                'message' => 'Đơn hàng này không thể hủy ở trạng thái hiện tại.',
            ], 422);
        }

        $updates = [];

        if (Schema::hasColumn('orders', 'status')) {
            $updates['status'] = 'cancelled';
        }

        if (Schema::hasColumn('orders', 'updated_at')) {
            $updates['updated_at'] = now();
        }

        if (!empty($updates)) {
            DB::table('orders')
                ->where('id', $id)
                ->update($updates);
        }

        $updatedOrder = $this->getOrderWithItems($id);

        return response()->json([
            'success' => true,
            'message' => 'Hủy đơn hàng thành công.',
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