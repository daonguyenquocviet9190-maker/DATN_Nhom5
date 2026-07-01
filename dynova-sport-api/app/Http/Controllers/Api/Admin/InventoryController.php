<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Inventory;
use App\Models\InventoryLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InventoryController extends Controller
{
    // 1. Lấy danh sách tồn kho kèm thông tin sản phẩm
    public function index()
    {
        $inventory = Inventory::with('product')->get();
        return response()->json($inventory, 200);
    }

    // 2. Cập nhật tồn kho và tự động ghi log
    public function update(Request $request, $id)
{
    // 1. Kiểm tra dữ liệu đầu vào
    $request->validate([
        'quantity_on_hand' => 'required|integer|min:0',
    ]);

    // 2. Tìm bản ghi và cập nhật
    $inventory = Inventory::findOrFail($id);
    
    // Lưu lại giá trị cũ để tính chênh lệch ghi log
    $oldQuantity = $inventory->quantity_on_hand;
    $newQuantity = $request->quantity_on_hand;

    // 3. Cập nhật bảng kho
    $inventory->quantity_on_hand = $newQuantity;
    $inventory->save(); // Lưu ý: dùng save() thường an toàn hơn update() nếu có quan hệ

    // 4. Ghi log nếu có thay đổi
    if ($newQuantity != $oldQuantity) {
        \App\Models\InventoryLog::create([
            'product_id' => $inventory->product_id,
            'change_quantity' => ($newQuantity - $oldQuantity),
            'type' => ($newQuantity > $oldQuantity) ? 'import' : 'export',
            'note' => 'Cập nhật kho thủ công'
        ]);
    }

    return response()->json(['success' => true]);
}

    // 3. Lấy lịch sử xuất nhập kho của 1 sản phẩm
public function getHistory($productId)
{
    try {
        // Kiểm tra xem Model có tồn tại không
        if (!class_exists('\App\Models\InventoryLog')) {
            return response()->json(['error' => 'Model InventoryLog không tồn tại'], 500);
        }

        $logs = \App\Models\InventoryLog::where('product_id', $productId)
                                        ->orderBy('created_at', 'desc')
                                        ->get();
                                        
        return response()->json($logs, 200);
    } catch (\Exception $e) {
        // Trả về lỗi chi tiết để bạn biết chính xác tại sao
        return response()->json(['error' => $e->getMessage()], 500);
    }
}}