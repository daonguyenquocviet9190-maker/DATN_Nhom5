<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index()
    {
        return response()->json(Category::latest()->get(), 200);
    }

    public function store(Request $request)
    {
        $category = Category::create($request->all());
        return response()->json(['message' => 'Tạo danh mục thành công!', 'data' => $category], 201);
    }

    public function show(Category $category)
    {
        return response()->json($category, 200);
    }

    public function update(Request $request, Category $category)
    {
        $category->update($request->all());
        return response()->json(['message' => 'Cập nhật danh mục thành công!', 'data' => $category], 200);
    }

    public function destroy(Category $category)
    {
        $category->delete();
        return response()->json(['message' => 'Xóa danh mục thành công!'], 200);
    }
}