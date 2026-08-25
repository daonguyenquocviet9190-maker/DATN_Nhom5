<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Banner;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Throwable;

class HomeController extends Controller
{
    public function index(): JsonResponse
    {
        try {

            $banners = collect();

            if (Schema::hasTable('banners')) {
                $banners = Banner::query()
                    ->where('position', 'home_hero')
                    ->where('is_active', true)
                    ->orderBy('sort_order')
                    ->orderBy('id')
                    ->get();
            }

            $categories = Category::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get();

            $brands = Brand::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get();

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
                ->withAvg([
                    'reviews as average_rating' => function ($reviewQuery) {
                        $reviewQuery->where('status', 'approved');
                    },
                ], 'rating')
                ->withCount([
                    'reviews as reviews_count' => function ($reviewQuery) {
                        $reviewQuery->where('status', 'approved');
                    },
                ])
                ->addSelect([
                    'sold_count' => DB::table('order_items')
                        ->selectRaw('COALESCE(SUM(order_items.quantity), 0)')
                        ->join('orders', 'orders.id', '=', 'order_items.order_id')
                        ->whereColumn('order_items.product_id', 'products.id')
                        ->where('orders.status', 'completed'),
                ])
                ->latest('id')
                ->limit(12)
                ->get()
                ->map(function (Product $product) {

                    $product->setAttribute('brand_data', $product->brand);

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