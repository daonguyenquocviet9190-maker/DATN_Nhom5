<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class WishlistController extends Controller
{
    private function productExists($productId): bool
    {
        if (!Schema::hasTable('products')) {
            return false;
        }

        return DB::table('products')->where('id', $productId)->exists();
    }

    private function productColumns(): array
    {
        $columns = ['products.id'];

        $possible = [
            'name',
            'slug',
            'description',
            'short_description',
            'price',
            'sale_price',
            'old_price',
            'compare_price',
            'image',
            'image_url',
            'thumbnail',
            'stock',
            'quantity',
            'status',
            'category_id',
            'brand_id',
            'created_at',
        ];

        foreach ($possible as $column) {
            if (Schema::hasColumn('products', $column)) {
                $columns[] = 'products.' . $column;
            }
        }

        return $columns;
    }

    private function normalizeProduct($product)
    {
        if (!$product) {
            return null;
        }

        $image = $product->image_url ?? $product->image ?? $product->thumbnail ?? null;
        $price = $product->sale_price ?? $product->price ?? 0;
        $oldPrice = $product->old_price ?? $product->compare_price ?? null;

        return [
            'id' => $product->id,
            'name' => $product->name ?? 'Sản phẩm',
            'slug' => $product->slug ?? null,
            'description' => $product->description ?? null,
            'short_description' => $product->short_description ?? null,
            'price' => (float) $price,
            'old_price' => $oldPrice ? (float) $oldPrice : null,
            'image' => $image,
            'image_url' => $image,
            'stock' => $product->stock ?? $product->quantity ?? null,
            'status' => $product->status ?? null,
            'category_id' => $product->category_id ?? null,
            'brand_id' => $product->brand_id ?? null,
            'created_at' => $product->created_at ?? null,
        ];
    }

    public function index(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn cần đăng nhập để xem yêu thích.',
            ], 401);
        }

        if (!Schema::hasTable('wishlists')) {
            return response()->json([
                'success' => true,
                'message' => 'Chưa có bảng wishlist.',
                'data' => [
                    'items' => [],
                    'total' => 0,
                ],
            ]);
        }

        $rows = DB::table('wishlists')
            ->join('products', 'products.id', '=', 'wishlists.product_id')
            ->where('wishlists.user_id', $user->id)
            ->orderByDesc('wishlists.id')
            ->get(array_merge([
                'wishlists.id as wishlist_id',
                'wishlists.product_id',
                'wishlists.created_at as wishlisted_at',
            ], $this->productColumns()));

        $items = $rows->map(function ($row) {
            return [
                'wishlist_id' => $row->wishlist_id,
                'product_id' => $row->product_id,
                'wishlisted_at' => $row->wishlisted_at,
                'product' => $this->normalizeProduct($row),
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách yêu thích thành công.',
            'data' => [
                'items' => $items,
                'total' => $items->count(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        return $this->toggle($request);
    }

    public function toggle(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn cần đăng nhập để sử dụng yêu thích.',
            ], 401);
        }

        if (!Schema::hasTable('wishlists')) {
            return response()->json([
                'success' => false,
                'message' => 'Bảng wishlists chưa tồn tại.',
            ], 500);
        }

        $validated = $request->validate([
            'product_id' => ['required', 'integer'],
        ]);

        $productId = (int) $validated['product_id'];

        if (!$this->productExists($productId)) {
            return response()->json([
                'success' => false,
                'message' => 'Sản phẩm này chưa tồn tại trong database nên chưa thể thêm yêu thích.',
                'data' => [
                    'product_id' => $productId,
                    'wishlisted' => false,
                ],
            ], 422);
        }

        $wishlist = DB::table('wishlists')
            ->where('user_id', $user->id)
            ->where('product_id', $productId)
            ->first();

        if ($wishlist) {
            DB::table('wishlists')->where('id', $wishlist->id)->delete();

            return response()->json([
                'success' => true,
                'message' => 'Đã xóa sản phẩm khỏi danh sách yêu thích.',
                'data' => [
                    'product_id' => $productId,
                    'wishlisted' => false,
                ],
            ]);
        }

        DB::table('wishlists')->insert([
            'user_id' => $user->id,
            'product_id' => $productId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Đã thêm sản phẩm vào danh sách yêu thích.',
            'data' => [
                'product_id' => $productId,
                'wishlisted' => true,
            ],
        ]);
    }

    public function destroy(Request $request, $productId)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn cần đăng nhập.',
            ], 401);
        }

        DB::table('wishlists')
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

    public function check(Request $request, $productId)
    {
        $user = $request->user();

        if (!$user || !Schema::hasTable('wishlists')) {
            return response()->json([
                'success' => true,
                'data' => [
                    'product_id' => $productId,
                    'wishlisted' => false,
                ],
            ]);
        }

        $exists = DB::table('wishlists')
            ->where('user_id', $user->id)
            ->where('product_id', $productId)
            ->exists();

        return response()->json([
            'success' => true,
            'data' => [
                'product_id' => $productId,
                'wishlisted' => $exists,
            ],
        ]);
    }
}