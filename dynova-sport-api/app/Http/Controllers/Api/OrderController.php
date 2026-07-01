<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer.fullName' => ['required', 'string'],
            'customer.email' => ['nullable', 'email'],
            'customer.phone' => ['required', 'string'],
            'shippingAddress.province' => ['required', 'string'],
            'shippingAddress.district' => ['required', 'string'],
            'shippingAddress.ward' => ['nullable', 'string'],
            'shippingAddress.address' => ['required', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'paymentMethod' => ['required', 'string'],
            'subtotal' => ['required', 'numeric'],
            'discount' => ['nullable', 'numeric'],
            'shippingFee' => ['nullable', 'numeric'],
            'total' => ['required', 'numeric'],
            'coupon' => ['nullable', 'string'],
        ]);

        $orderCode = 'DNV' . now()->format('ymdHis') . strtoupper(Str::random(3));

        $orderId = DB::transaction(function () use ($validated, $request, $orderCode) {
            $orderId = DB::table('orders')->insertGetId([
                'order_code' => $orderCode,
                'customer_name' => data_get($validated, 'customer.fullName'),
                'email' => data_get($validated, 'customer.email'),
                'phone' => data_get($validated, 'customer.phone'),
                'address' => data_get($validated, 'shippingAddress.address'),
                'province' => data_get($validated, 'shippingAddress.province'),
                'district' => data_get($validated, 'shippingAddress.district'),
                'ward' => data_get($validated, 'shippingAddress.ward'),
                'note' => data_get($request->all(), 'shippingAddress.note'),
                'payment_method' => $validated['paymentMethod'],
                'payment_status' => in_array($validated['paymentMethod'], ['VNPAY', 'MOMO'])
                    ? 'pending'
                    : ($validated['paymentMethod'] === 'BANK' ? 'waiting_bank_transfer' : 'cod_pending'),
                'status' => 'pending',
                'coupon' => $validated['coupon'] ?? null,
                'subtotal' => $validated['subtotal'],
                'discount' => $validated['discount'] ?? 0,
                'shipping_fee' => $validated['shippingFee'] ?? 0,
                'total' => $validated['total'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            foreach ($validated['items'] as $item) {
                DB::table('order_items')->insert([
                    'order_id' => $orderId,
                    'product_id' => $item['id'] ?? null,
                    'variant_id' => $item['variantId'] ?? null,
                    'product_name' => $item['name'] ?? 'Sản phẩm',
                    'image' => $item['image'] ?? null,
                    'size' => $item['size'] ?? null,
                    'color' => $item['color'] ?? null,
                    'quantity' => $item['quantity'] ?? 1,
                    'price' => $item['price'] ?? 0,
                    'total' => ($item['price'] ?? 0) * ($item['quantity'] ?? 1),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            return $orderId;
        });

        $order = DB::table('orders')->where('id', $orderId)->first();

        return response()->json([
            'success' => true,
            'message' => 'Tạo đơn hàng thành công.',
            'data' => $order,
        ]);
    }
}