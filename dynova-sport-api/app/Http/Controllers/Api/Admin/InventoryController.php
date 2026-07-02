<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Inventory;
use App\Models\InventoryLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class InventoryController extends Controller
{
    // 1. Lấy danh sách tồn kho
    public function index()
    {
        // Lấy danh sách kèm tên sản phẩm
        $inventory = Inventory::with('product:id,name')->get();
        return response()->json($inventory, 200);
    }

    // 2. Cập nhật tồn kho và ghi log kèm người thực hiện (user_id)
    public function update(Request $request, $id)
    {
        $request->validate([
            'quantity_on_hand' => 'required|integer|min:0',
            'note' => 'nullable|string|max:255',
        ]);

        try {
            return DB::transaction(function () use ($request, $id) {
                $inventory = Inventory::findOrFail($id);
                $oldQuantity = $inventory->quantity_on_hand;
                $newQuantity = (int)$request->quantity_on_hand;

                // Cập nhật số lượng
                $inventory->quantity_on_hand = $newQuantity;
                $inventory->save();

                // Chỉ ghi log nếu số lượng có thay đổi
                if ($newQuantity !== $oldQuantity) {
                    InventoryLog::create([
                        'product_id'      => $inventory->product_id,
                        'user_id'         => Auth::id(), // Lấy ID admin đang đăng nhập
                        'change_quantity' => ($newQuantity - $oldQuantity),
                        'type'            => ($newQuantity > $oldQuantity) ? 'import' : 'export',
                        'note'            => $request->note ?? 'Cập nhật thủ công',
                    ]);
                }

                return response()->json([
                    'success' => true, 
                    'message' => 'Cập nhật thành công'
                ], 200);
            });
        } catch (\Exception $e) {
            Log::error("Lỗi cập nhật kho: " . $e->getMessage());
            return response()->json(['error' => 'Không thể cập nhật, vui lòng thử lại'], 500);
        }
    }

    // 3. Lấy lịch sử xuất nhập kho
    public function getHistory($productId)
    {
        try {
            // Lấy log kèm theo thông tin người thực hiện (user) nếu cần
            $logs = InventoryLog::where('product_id', $productId)
                                ->orderBy('created_at', 'desc')
                                ->get();
                                
            return response()->json($logs, 200);
        } catch (\Exception $e) {
            Log::error("Lỗi tải lịch sử kho: " . $e->getMessage());
            return response()->json(['error' => 'Lỗi hệ thống khi tải lịch sử'], 500);
        }
    }
}