<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Wishlist;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class WishlistController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $wishlists = Wishlist::query()
            ->where('user_id', $user->id)
            ->with([
                'product' => function ($productQuery) {
                    $productQuery
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
                        ]);
                },
            ])
            ->latest('id')
            ->get();

        $items = $wishlists
            ->filter(fn (Wishlist $wishlist) => $wishlist->product !== null)
            ->map(function (Wishlist $wishlist) {
                $product = $wishlist->product;

                if ($product?->brand) {
                    $product->setAttribute('brand_data', $product->brand);
                }

                return [
                    'wishlist_id' => $wishlist->id,
                    'product_id' => $wishlist->product_id,
                    'wishlisted_at' => $wishlist->created_at,
                    'product' => $product,
                ];
            })
            ->values();

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách yêu thích thành công.',
            'data' => [
                'items' => $items,
                'total' => $items->count(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => [
                'required',
                'integer',
                Rule::exists('products', 'id')->where(
                    fn ($query) => $query->where('status', 'active')
                ),
            ],
        ], [
            'product_id.required' => 'Thiếu mã sản phẩm.',
            'product_id.integer' => 'Mã sản phẩm không hợp lệ.',
            'product_id.exists' => 'Sản phẩm không tồn tại hoặc đã bị ẩn.',
        ]);

        $user = $request->user();
        $productId = (int) $validated['product_id'];

        $wishlist = Wishlist::query()->firstOrCreate([
            'user_id' => $user->id,
            'product_id' => $productId,
        ]);

        return response()->json([
            'success' => true,
            'message' => $wishlist->wasRecentlyCreated
                ? 'Đã thêm sản phẩm vào danh sách yêu thích.'
                : 'Sản phẩm đã có trong danh sách yêu thích.',
            'data' => [
                'wishlist_id' => $wishlist->id,
                'product_id' => $productId,
                'wishlisted' => true,
            ],
        ], $wishlist->wasRecentlyCreated ? 201 : 200);
    }

    public function toggle(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => [
                'required',
                'integer',
                Rule::exists('products', 'id')->where(
                    fn ($query) => $query->where('status', 'active')
                ),
            ],
        ], [
            'product_id.required' => 'Thiếu mã sản phẩm.',
            'product_id.integer' => 'Mã sản phẩm không hợp lệ.',
            'product_id.exists' => 'Sản phẩm không tồn tại hoặc đã bị ẩn.',
        ]);

        $user = $request->user();
        $productId = (int) $validated['product_id'];

        $result = DB::transaction(function () use ($user, $productId) {
            $wishlist = Wishlist::query()
                ->where('user_id', $user->id)
                ->where('product_id', $productId)
                ->lockForUpdate()
                ->first();

            if ($wishlist) {
                $wishlist->delete();

                return [
                    'wishlist_id' => null,
                    'wishlisted' => false,
                ];
            }

            $created = Wishlist::query()->create([
                'user_id' => $user->id,
                'product_id' => $productId,
            ]);

            return [
                'wishlist_id' => $created->id,
                'wishlisted' => true,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => $result['wishlisted']
                ? 'Đã thêm sản phẩm vào danh sách yêu thích.'
                : 'Đã xóa sản phẩm khỏi danh sách yêu thích.',
            'data' => [
                'wishlist_id' => $result['wishlist_id'],
                'product_id' => $productId,
                'wishlisted' => $result['wishlisted'],
            ],
        ]);
    }

    public function destroy(Request $request, int $productId): JsonResponse
    {
        $user = $request->user();

        Wishlist::query()
            ->where('user_id', $user->id)
            ->where('product_id', $productId)
            ->delete();

        return response()->json([
            'success' => true,
            'message' => 'Đã xóa sản phẩm khỏi danh sách yêu thích.',
            'data' => [
                'product_id' => $productId,
                'wishlisted' => false,
            ],
        ]);
    }

    public function check(Request $request, int $productId): JsonResponse
    {
        $user = $request->user();

        $wishlisted = Wishlist::query()
            ->where('user_id', $user->id)
            ->where('product_id', $productId)
            ->exists();

        return response()->json([
            'success' => true,
            'message' => 'Kiểm tra yêu thích thành công.',
            'data' => [
                'product_id' => $productId,
                'wishlisted' => $wishlisted,
            ],
        ]);
    }
}
