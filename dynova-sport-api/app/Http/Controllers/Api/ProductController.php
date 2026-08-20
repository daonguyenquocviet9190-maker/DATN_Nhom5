<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Product::query()
            ->active()
            ->with([
                'category:id,name,slug',
                'brand:id,name,slug,logo',
                'variants' => function ($variantQuery) {
                    $variantQuery
                        ->active()
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
            ]);

        if ($request->filled('category')) {
            $query->where(
                'category_id',
                (int) $request->input('category')
            );
        }

        if ($request->filled('brand')) {
            $query->where(
                'brand_id',
                (int) $request->input('brand')
            );
        }

        $keyword = trim((string) (
            $request->input('q')
            ?? $request->input('search')
            ?? ''
        ));

        if ($keyword !== '') {
            $query->where(function (Builder $searchQuery) use ($keyword) {
                $searchQuery
                    ->where('name', 'like', "%{$keyword}%")
                    ->orWhere('slug', 'like', "%{$keyword}%")
                    ->orWhere('short_description', 'like', "%{$keyword}%")
                    ->orWhere('description', 'like', "%{$keyword}%")
                    ->orWhereHas('brand', function (Builder $brandQuery) use ($keyword) {
                        $brandQuery->where('name', 'like', "%{$keyword}%");
                    })
                    ->orWhereHas('category', function (Builder $categoryQuery) use ($keyword) {
                        $categoryQuery->where('name', 'like', "%{$keyword}%");
                    })
                    ->orWhereHas('variants', function (Builder $variantQuery) use ($keyword) {
                        $variantQuery->where('sku', 'like', "%{$keyword}%");
                    });
            });
        }

        if ($request->boolean('featured')) {
            $query->where('is_featured', true);
        }

        $sort = (string) $request->input('sort', 'newest');

        match ($sort) {
            'price-asc' => $query->orderBy('price'),
            'price-desc' => $query->orderByDesc('price'),
            'name-asc' => $query->orderBy('name'),
            'name-desc' => $query->orderByDesc('name'),
            default => $query->latest('id'),
        };

        $perPage = min(
            max((int) $request->input('per_page', 12), 1),
            400
        );

        $products = $query->paginate($perPage);

        $products->getCollection()->transform(function (Product $product) {
            // Giữ alias brand_data để frontend cũ vẫn chạy,
            // đồng thời API vẫn có relationship chuẩn là brand.
            $product->setAttribute('brand_data', $product->brand);

            return $product;
        });

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách sản phẩm thành công.',
            'data' => $products,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $product = Product::query()
            ->active()
            ->with([
                'category:id,name,slug',
                'brand:id,name,slug,logo',
                'variants' => function ($variantQuery) {
                    $variantQuery
                        ->active()
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
            ->findOrFail($id);

        $product->setAttribute('brand_data', $product->brand);

        return response()->json([
            'success' => true,
            'message' => 'Lấy chi tiết sản phẩm thành công.',
            'data' => $product,
        ]);
    }
}
