<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    private function onlyExistingOrderColumns(array $data): array
    {
        return collect($data)
            ->filter(function ($value, $key) {
                return Schema::hasColumn('orders', $key);
            })
            ->toArray();
    }

    private function onlyExistingOrderItemColumns(array $data): array
    {
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

    private function getOrderWithItems($orderId)
    {
        $order = DB::table('orders')->where('id', $orderId)->first();

        if ($order) {
            $order->items = DB::table('order_items')
                ->where('order_id', $order->id)
                ->get();
        }

        return $order;
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
            'paymentMethod' => ['required', 'string'],

            'subtotal' => ['required', 'numeric'],
            'discount' => ['nullable', 'numeric'],
            'shippingFee' => ['nullable', 'numeric'],
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
                $district,
                $province,
            ])->filter()->implode(', ');

            $orderPayload = $this->onlyExistingOrderColumns([
                'user_id' => $user->id,

                'order_code' => $orderCode,

                'customer_name' => $customerName,

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

                'coupon' => $validated['coupon'] ?? null,

                'total_price' => $validated['subtotal'],
                'discount_amount' => $validated['discount'] ?? 0,
                'shipping_fee' => $validated['shippingFee'] ?? 0,
                'grand_total' => $validated['total'],

                'subtotal' => $validated['subtotal'],
                'discount' => $validated['discount'] ?? 0,
                'total' => $validated['total'],

                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $orderId = DB::table('orders')->insertGetId($orderPayload);

            foreach ($validated['items'] as $item) {
                $quantity = (int) ($item['quantity'] ?? 1);
                $price = (float) ($item['price'] ?? 0);
                $lineTotal = $price * $quantity;

                $productName = $item['name']
                    ?? $item['product_name']
                    ?? 'Sản phẩm';

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

                $orderItemPayload = $this->onlyExistingOrderItemColumns([
                    'order_id' => $orderId,

                    'product_id' => $productId,
                    'product_variant_id' => $variantId,
                    'variant_id' => $variantId,

                    'product_name' => $productName,
                    'name' => $productName,

                    'image' => $item['image'] ?? null,
                    'product_image' => $item['image'] ?? null,

                    'size' => $item['size'] ?? null,
                    'color' => $item['color'] ?? null,

                    'quantity' => $quantity,
                    'qty' => $quantity,

                    'price' => $price,
                    'unit_price' => $price,

                    'total' => $lineTotal,
                    'subtotal' => $lineTotal,
                    'line_total' => $lineTotal,

                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                DB::table('order_items')->insert($orderItemPayload);
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

        $query = DB::table('orders')
            ->where('user_id', $user->id)
            ->orderByDesc('created_at');

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where('order_code', 'like', "%{$search}%");

                if (Schema::hasColumn('orders', 'phone')) {
                    $q->orWhere('phone', 'like', "%{$search}%");
                }

                if (Schema::hasColumn('orders', 'customer_phone')) {
                    $q->orWhere('customer_phone', 'like', "%{$search}%");
                }
            });
        }

        $orders = $query->get();
        $orderIds = $orders->pluck('id')->toArray();

        $items = collect();

        if (count($orderIds) > 0) {
            $items = DB::table('order_items')
                ->whereIn('order_id', $orderIds)
                ->get()
                ->groupBy('order_id');
        }

        $mappedOrders = $orders->map(function ($order) use ($items) {
            $order->items = $items->get($order->id, collect())->values();
            return $order;
        });

        $allOrders = DB::table('orders')
            ->where('user_id', $user->id)
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Lấy lịch sử đơn hàng thành công.',
            'data' => [
                'orders' => $mappedOrders,
                'stats' => [
                    'total' => $allOrders->count(),
                    'pending' => $allOrders->where('status', 'pending')->count(),
                    'shipping' => $allOrders->where('status', 'shipping')->count(),
                    'completed' => $allOrders->where('status', 'completed')->count(),
                    'cancelled' => $allOrders->where('status', 'cancelled')->count(),
                ],
            ],
        ]);
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

        $order->items = DB::table('order_items')
            ->where('order_id', $order->id)
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Lấy chi tiết đơn hàng thành công.',
            'data' => $order,
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

        if (!in_array($order->status, ['pending', 'confirmed'])) {
            return response()->json([
                'success' => false,
                'message' => 'Đơn hàng này không thể hủy ở trạng thái hiện tại.',
            ], 422);
        }

        DB::table('orders')
            ->where('id', $id)
            ->update([
                'status' => 'cancelled',
                'updated_at' => now(),
            ]);

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

        $order->items = DB::table('order_items')
            ->where('order_id', $id)
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Đã lấy dữ liệu mua lại đơn hàng.',
            'data' => $order,
        ]);
    }
}