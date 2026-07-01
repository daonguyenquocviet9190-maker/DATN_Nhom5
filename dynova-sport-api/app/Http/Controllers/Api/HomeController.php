<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Banner;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;

class HomeController extends Controller
{
    public function index()
    {
        $banners = Banner::query()
            ->where('position', 'home_hero')
            ->where('is_active', 1)
            ->orderBy('sort_order')
            ->get();

        $categories = Category::query()
            ->where('is_active', 1)
            ->orderBy('sort_order')
            ->get();

        $brands = Brand::query()
            ->where('is_active', 1)
            ->orderBy('sort_order')
            ->get();

        $products = Product::query()
            ->with([
                'category:id,name,slug',
                'brandInfo:id,name,slug,logo',
            ])
            ->where('status', 'active')
            ->latest()
            ->limit(12)
            ->get()
            ->map(function ($product) {
                $product->brand_data = $product->brandInfo;
                return $product;
            });

        return response()->json([
            'success' => true,
            'message' => 'Lấy dữ liệu trang chủ thành công.',
            'data' => [
                'banners' => $banners,
                'categories' => $categories,
                'brands' => $brands,
                'products' => $products,
            ],
        ]);
    }
}