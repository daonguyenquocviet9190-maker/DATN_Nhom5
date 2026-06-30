<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::query()
            ->with([
                'category:id,name,slug',
                'brandInfo:id,name,slug,logo',
            ])
            ->where('status', 'active');

        if ($request->filled('category')) {
            $query->where('category_id', $request->input('category'));
        }

        if ($request->filled('brand')) {
            $query->where('brand_id', $request->input('brand'));
        }

        if ($request->filled('q')) {
            $keyword = $request->input('q');

            $query->where(function ($item) use ($keyword) {
                $item->where('name', 'like', "%{$keyword}%")
                    ->orWhere('brand', 'like', "%{$keyword}%")
                    ->orWhere('short_description', 'like', "%{$keyword}%")
                    ->orWhere('description', 'like', "%{$keyword}%");
            });
        }

        $perPage = min((int) $request->input('per_page', 12), 100);

        $products = $query
            ->latest()
            ->paginate($perPage);

        $products->getCollection()->transform(function ($product) {
            $product->brand_data = $product->brandInfo;
            return $product;
        });

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách sản phẩm thành công.',
            'data' => $products,
        ]);
    }

    public function show($id)
    {
        $product = Product::query()
            ->with([
                'category:id,name,slug',
                'brandInfo:id,name,slug,logo',
                'variants',
                'reviews',
            ])
            ->where('status', 'active')
            ->findOrFail($id);

        $product->brand_data = $product->brandInfo;

        return response()->json([
            'success' => true,
            'message' => 'Lấy chi tiết sản phẩm thành công.',
            'data' => $product,
        ]);
    }
}