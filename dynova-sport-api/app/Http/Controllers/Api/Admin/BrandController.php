<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BrandController extends Controller
{
    /**
     * Lấy danh sách thương hiệu
     */
    public function index()
    {
        try {
            // Lấy dữ liệu từ bảng brands
            $brands = DB::table('brands')->get();
            return response()->json($brands, 200);
        } catch (\Exception $e) {
            // Nếu bảng chưa có hoặc lỗi DB, trả về mảng rỗng để Front-end không bị crash 500
            return response()->json([], 200);
        }
    }

    public function store(Request $request)
    {
        try {
            $id = DB::table('brands')->insertGetId([
                'name' => $request->input('name'),
                'created_at' => now(),
                'updated_at' => now()
            ]);
            return response()->json(['message' => 'Thêm thương hiệu thành công', 'id' => $id], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $brand = DB::table('brands')->where('id', $id)->first();
        if (!$brand) return response()->json(['message' => 'Không tìm thấy'], 404);
        return response()->json($brand);
    }

    public function update(Request $request, $id)
    {
        try {
            DB::table('brands')->where('id', $id)->update([
                'name' => $request->input('name'),
                'updated_at' => now()
            ]);
            return response()->json(['message' => 'Cập nhật thành công']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        try {
            DB::table('brands')->where('id', $id)->delete();
            return response()->json(['message' => 'Xóa thương hiệu thành công']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}