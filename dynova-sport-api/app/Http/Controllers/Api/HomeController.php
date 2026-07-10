<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Banner;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Schema;
use Throwable;

class HomeController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            /*
            |--------------------------------------------------------------------------
            | BANNERS
            |--------------------------------------------------------------------------
            | Nếu database hiện tại chưa có bảng banners thì trả mảng rỗng,
            | tránh làm toàn bộ API trang chủ bị lỗi 500.
            |--------------------------------------------------------------------------
            */

            $banners = collect();

            if (Schema::hasTable('banners')) {
                $banners = Banner::query()
                    ->where('position', 'home_hero')
                    ->where('is_active', true)
                    ->orderBy('sort_order')
                    ->orderBy('id')
                    ->get();
            }

            /*
            |--------------------------------------------------------------------------
            | CATEGORIES
            |--------------------------------------------------------------------------
            */

            $categories = Category::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get();

            /*
            |--------------------------------------------------------------------------
            | BRANDS
            |--------------------------------------------------------------------------
            */

            $brands = Brand::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get();

            /*
            |--------------------------------------------------------------------------
            | PRODUCTS
            |--------------------------------------------------------------------------
            | Quan hệ đúng là:
            | - brand
            | - category
            | - variants.size
            | - variants.color
            |
            | Không dùng brandInfo vì Product model không có relationship này.
            |--------------------------------------------------------------------------
            */

            $products = Product::query()
                ->where('status', 'active')
                ->with([
                    'category:id,name,slug',
                    'brand:id,name,slug,logo',
                    'variants' => function ($variantQuery) {
                        $variantQuery
                            ->where('is_active', true)
                            ->with([
                                'size:id,name,type,sort_order',
                                'color:id,name,code,hex,sort_order',
                            ])
                            ->orderBy('color_id')
                            ->orderBy('size_id');
                    },
                ])
                ->latest('id')
                ->limit(12)
                ->get()
                ->map(function (Product $product) {
                    /*
                    |--------------------------------------------------------------------------
                    | GIỮ TƯƠNG THÍCH FRONTEND CŨ
                    |--------------------------------------------------------------------------
                    | Frontend mới đọc product.brand.
                    | Frontend cũ có thể vẫn đọc product.brand_data.
                    |--------------------------------------------------------------------------
                    */

                    $product->setAttribute('brand_data', $product->brand);

                    /*
                    |--------------------------------------------------------------------------
                    | DỮ LIỆU TỒN KHO VÀ GIÁ HIỂN THỊ
                    |--------------------------------------------------------------------------
                    */

                    $activeVariants = $product->variants;

                    $totalStock = $activeVariants->sum(function ($variant) {
                        return (int) $variant->stock;
                    });

                    $variantPrices = $activeVariants
                        ->map(function ($variant) {
                            $price = (float) $variant->price;
                            $discountPrice = $variant->discount_price !== null
                                ? (float) $variant->discount_price
                                : null;

                            if (
                                $discountPrice !== null &&
                                $discountPrice > 0 &&
                                $discountPrice < $price
                            ) {
                                return $discountPrice;
                            }

                            return $price;
                        })
                        ->filter(function ($price) {
                            return $price > 0;
                        });

                    $displayPrice = $variantPrices->isNotEmpty()
                        ? $variantPrices->min()
                        : (float) $product->price;

                    $product->setAttribute('total_stock', $totalStock);
                    $product->setAttribute('display_price', $displayPrice);
                    $product->setAttribute(
                        'has_variants',
                        $activeVariants->isNotEmpty()
                    );

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
        } catch (Throwable $error) {
            report($error);

            return response()->json([
                'success' => false,
                'message' => 'Không thể tải dữ liệu trang chủ.',
                'error' => config('app.debug')
                    ? $error->getMessage()
                    : null,
                'data' => [
                    'banners' => [],
                    'categories' => [],
                    'brands' => [],
                    'products' => [],
                ],
            ], 500);
        }
    }
}