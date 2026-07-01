<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    // Lấy danh sách đơn hàng
    public function index()
    {
        return response()->json(Order::with('user')->orderBy('id', 'asc')->get(), 200);
    }

    // Chi tiết đơn hàng (Load đầy đủ thông tin khách hàng và sản phẩm đã mua)
    public function show($id)
    {
        $order = Order::with(['user', 'items.product'])->find($id);
        if (!$order) {
            return response()->json(['message' => 'Không tìm thấy đơn hàng'], 404);
        }
        return response()->json($order, 200);
    }

    // Cập nhật trạng thái đơn hàng
    public function update(Request $request, $id)
    {
        $order = Order::find($id);
        if (!$order) {
            return response()->json(['message' => 'Không tìm thấy đơn hàng'], 404);
        }
        $order->update($request->all());
        return response()->json($order, 200);
    }

    // Xóa đơn hàng
    public function destroy($id)
    {
        $order = Order::find($id);
        if (!$order) {
            return response()->json(['message' => 'Không tìm thấy đơn hàng'], 404);
        }
        $order->delete();
        return response()->json(['success' => true], 200);
    }
}