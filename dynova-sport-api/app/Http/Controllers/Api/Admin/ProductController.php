<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    // Lấy danh sách: Trả về thẳng mảng dữ liệu để Next.js map() dòng vòng lặp dễ dàng
    public function index()
    {
        return response()->json(Product::all(), 200);
    }

    // Thêm mới
    public function store(Request $request)
    {
        $product = Product::create($request->all());
        return response()->json($product, 201); // Trả về thẳng object vừa tạo
    }

    // Chi tiết
    public function show(Product $product)
    {
        return response()->json($product, 200);
    }

    // Cập nhật
    public function update(Request $request, Product $product)
    {
        $product->update($request->all());
        return response()->json($product, 200);
    }

    // Xóa
    public function destroy(Product $product)
    {
        $product->delete();
        return response()->json(['success' => true], 200);
    }
}