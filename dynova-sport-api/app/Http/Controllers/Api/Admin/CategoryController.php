<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    // Lấy danh sách danh mục sản phẩm
    public function index()
    {
        return response()->json(Category::orderBy('id', 'desc')->get(), 200);
    }

    // Thêm danh mục
    public function store(Request $request)
    {
        $category = Category::create($request->all());
        return response()->json($category, 201);
    }

    // Chi tiết danh mục
    public function show($id)
    {
        $category = Category::find($id);
        if (!$category) {
            return response()->json(['message' => 'Không tìm thấy danh mục'], 404);
        }
        return response()->json($category, 200);
    }

    // Cập nhật danh mục
    public function update(Request $request, $id)
    {
        $category = Category::find($id);
        if (!$category) {
            return response()->json(['message' => 'Không tìm thấy danh mục'], 404);
        }
        $category->update($request->all());
        return response()->json($category, 200);
    }

    // Xóa danh mục
    public function destroy($id)
    {
        $category = Category::find($id);
        if (!$category) {
            return response()->json(['message' => 'Không tìm thấy danh mục'], 404);
        }
        $category->delete();
        return response()->json(['success' => true], 200);
    }
}