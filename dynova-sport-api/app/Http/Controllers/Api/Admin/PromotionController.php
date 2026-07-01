<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Promotion;
use Illuminate\Http\Request;

class PromotionController extends Controller
{
    /**
     * 1. Lấy danh sách mã giảm giá (Trả về mảng thô để Next.js .map mượt mà)
     */
    public function index()
    {
        // Sắp xếp mã mới tạo lên đầu danh sách
        return response()->json(Promotion::orderBy('id', 'desc')->get(), 200);
    }

    /**
     * 2. Thêm mới mã giảm giá (Fix triệt để lỗi ép trường trống từ Front-end)
     */
    public function store(Request $request)
    {
        $data = $request->all();

        // Tự động kiểm tra và điền giá trị mặc định nếu Front-end bỏ trống ô dữ liệu
        if (empty($data['title'])) {
            $data['title'] = 'Mã giảm giá ' . ($data['code'] ?? '');
        }
        if (empty($data['description'])) {
            $data['description'] = 'Ưu đãi đặc biệt từ Dynova Sport Shop';
        }
        if (!isset($data['discount_type'])) {
            $data['discount_type'] = 'fixed'; // Mặc định là giảm theo số tiền cố định
        }
        if (!isset($data['discount_value'])) {
            $data['discount_value'] = 0;
        }
        if (!isset($data['min_order_value'])) {
            $data['min_order_value'] = 0;
        }
        if (!isset($data['used_count'])) {
            $data['used_count'] = 0;
        }
        if (!isset($data['is_active'])) {
            $data['is_active'] = 1; // Mặc định kích hoạt luôn mã sau khi tạo
        }

        // Tạo mới bản ghi vào bảng vouchers
        $promotion = Promotion::create($data);

        return response()->json($promotion, 201);
    }

    /**
     * 3. Xem chi tiết một mã giảm giá
     */
    public function show($id)
    {
        $promotion = Promotion::find($id);

        if (!$promotion) {
            return response()->json(['message' => 'Không tìm thấy mã giảm giá này'], 404);
        }

        return response()->json($promotion, 200);
    }

    /**
     * 4. Cập nhật thông tin mã giảm giá
     */
    public function update(Request $request, $id)
    {
        $promotion = Promotion::find($id);

        if (!$promotion) {
            return response()->json(['message' => 'Không tìm thấy mã giảm giá cần cập nhật'], 404);
        }

        $promotion->update($request->all());

        return response()->json($promotion, 200);
    }

    /**
     * 5. Xóa mã giảm giá
     */
    public function destroy($id)
    {
        $promotion = Promotion::find($id);

        if (!$promotion) {
            return response()->json(['message' => 'Không tìm thấy mã giảm giá cần xóa'], 404);
        }

        $promotion->delete();

        return response()->json(['success' => true], 200);
    }
}