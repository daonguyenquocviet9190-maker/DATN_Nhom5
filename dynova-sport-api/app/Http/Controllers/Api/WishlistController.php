<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class WishlistController extends Controller
{
<<<<<<< Updated upstream
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
=======
    private function getCurrentUser(Request $request)
    {
        return $request->user();
    }

    private function productSelectColumns(): array
    {
        $columns = [
            'products.id',
        ];

        $possibleColumns = [
            'name',
            'slug',
            'description',
            'price',
            'sale_price',
            'old_price',
>>>>>>> Stashed changes
            'image',
            'image_url',
            'thumbnail',
            'stock',
<<<<<<< Updated upstream
            'quantity',
=======
>>>>>>> Stashed changes
            'status',
            'category_id',
            'brand_id',
            'created_at',
        ];

<<<<<<< Updated upstream
        foreach ($possible as $column) {
=======
        foreach ($possibleColumns as $column) {
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
        $image = $product->image_url ?? $product->image ?? $product->thumbnail ?? null;
        $price = $product->sale_price ?? $product->price ?? 0;
        $oldPrice = $product->old_price ?? $product->compare_price ?? null;
=======
        $image = $product->image_url
            ?? $product->image
            ?? $product->thumbnail
            ?? null;

        $price = $product->sale_price
            ?? $product->price
            ?? 0;

        $oldPrice = $product->old_price
            ?? null;
>>>>>>> Stashed changes

        return [
            'id' => $product->id,
            'name' => $product->name ?? 'Sản phẩm',
            'slug' => $product->slug ?? null,
            'description' => $product->description ?? null,
<<<<<<< Updated upstream
            'short_description' => $product->short_description ?? null,
=======
>>>>>>> Stashed changes
            'price' => (float) $price,
            'old_price' => $oldPrice ? (float) $oldPrice : null,
            'image' => $image,
            'image_url' => $image,
<<<<<<< Updated upstream
            'stock' => $product->stock ?? $product->quantity ?? null,
=======
            'stock' => $product->stock ?? null,
>>>>>>> Stashed changes
            'status' => $product->status ?? null,
            'category_id' => $product->category_id ?? null,
            'brand_id' => $product->brand_id ?? null,
            'created_at' => $product->created_at ?? null,
        ];
    }

    public function index(Request $request)
    {
<<<<<<< Updated upstream
        $user = $request->user();
=======
        $user = $this->getCurrentUser($request);
>>>>>>> Stashed changes

        if (!$user) {
            return response()->json([
                'success' => false,
<<<<<<< Updated upstream
                'message' => 'Bạn cần đăng nhập để xem yêu thích.',
=======
                'message' => 'Bạn cần đăng nhập để xem danh sách yêu thích.',
>>>>>>> Stashed changes
            ], 401);
        }

        if (!Schema::hasTable('wishlists')) {
            return response()->json([
                'success' => true,
<<<<<<< Updated upstream
                'message' => 'Chưa có bảng wishlist.',
=======
                'message' => 'Danh sách yêu thích chưa được khởi tạo.',
>>>>>>> Stashed changes
                'data' => [
                    'items' => [],
                    'total' => 0,
                ],
            ]);
        }

<<<<<<< Updated upstream
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
=======
        $items = DB::table('wishlists')
            ->join('products', 'wishlists.product_id', '=', 'products.id')
            ->where('wishlists.user_id', $user->id)
            ->orderByDesc('wishlists.created_at')
            ->select(array_merge(
                [
                    'wishlists.id as wishlist_id',
                    'wishlists.product_id',
                    'wishlists.created_at as wishlisted_at',
                ],
                $this->productSelectColumns()
            ))
            ->get()
            ->map(function ($item) {
                return [
                    'wishlist_id' => $item->wishlist_id,
                    'product_id' => $item->product_id,
                    'wishlisted_at' => $item->wishlisted_at,
                    'product' => $this->normalizeProduct($item),
                ];
            });
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream
        return $this->toggle($request);
    }

    public function toggle(Request $request)
    {
        $user = $request->user();
=======
        $user = $this->getCurrentUser($request);
>>>>>>> Stashed changes

        if (!$user) {
            return response()->json([
                'success' => false,
<<<<<<< Updated upstream
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
=======
                'message' => 'Bạn cần đăng nhập để thêm sản phẩm yêu thích.',
            ], 401);
        }

        $validated = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
        ], [
            'product_id.required' => 'Thiếu mã sản phẩm.',
            'product_id.exists' => 'Sản phẩm không tồn tại.',
        ]);

        $exists = DB::table('wishlists')
            ->where('user_id', $user->id)
            ->where('product_id', $validated['product_id'])
            ->exists();

        if (!$exists) {
            DB::table('wishlists')->insert([
                'user_id' => $user->id,
                'product_id' => $validated['product_id'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Đã thêm sản phẩm vào danh sách yêu thích.',
            'data' => [
                'product_id' => $validated['product_id'],
                'wishlisted' => true,
            ],
        ]);
    }

    public function toggle(Request $request)
    {
        $user = $this->getCurrentUser($request);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn cần đăng nhập để lưu sản phẩm yêu thích.',
            ], 401);
        }

        $validated = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
        ], [
            'product_id.required' => 'Thiếu mã sản phẩm.',
            'product_id.exists' => 'Sản phẩm không tồn tại.',
        ]);

        $wishlist = DB::table('wishlists')
            ->where('user_id', $user->id)
            ->where('product_id', $validated['product_id'])
            ->first();

        if ($wishlist) {
            DB::table('wishlists')
                ->where('id', $wishlist->id)
                ->delete();
>>>>>>> Stashed changes

            return response()->json([
                'success' => true,
                'message' => 'Đã xóa sản phẩm khỏi danh sách yêu thích.',
                'data' => [
<<<<<<< Updated upstream
                    'product_id' => $productId,
=======
                    'product_id' => $validated['product_id'],
>>>>>>> Stashed changes
                    'wishlisted' => false,
                ],
            ]);
        }

        DB::table('wishlists')->insert([
            'user_id' => $user->id,
<<<<<<< Updated upstream
            'product_id' => $productId,
=======
            'product_id' => $validated['product_id'],
>>>>>>> Stashed changes
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Đã thêm sản phẩm vào danh sách yêu thích.',
            'data' => [
<<<<<<< Updated upstream
                'product_id' => $productId,
=======
                'product_id' => $validated['product_id'],
>>>>>>> Stashed changes
                'wishlisted' => true,
            ],
        ]);
    }

    public function destroy(Request $request, $productId)
    {
<<<<<<< Updated upstream
        $user = $request->user();
=======
        $user = $this->getCurrentUser($request);
>>>>>>> Stashed changes

        if (!$user) {
            return response()->json([
                'success' => false,
<<<<<<< Updated upstream
                'message' => 'Bạn cần đăng nhập.',
=======
                'message' => 'Bạn cần đăng nhập để xóa sản phẩm yêu thích.',
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
                'product_id' => $productId,
=======
                'product_id' => (int) $productId,
>>>>>>> Stashed changes
                'wishlisted' => false,
            ],
        ]);
    }

    public function check(Request $request, $productId)
    {
<<<<<<< Updated upstream
        $user = $request->user();

        if (!$user || !Schema::hasTable('wishlists')) {
            return response()->json([
                'success' => true,
                'data' => [
                    'product_id' => $productId,
=======
        $user = $this->getCurrentUser($request);

        if (!$user) {
            return response()->json([
                'success' => true,
                'message' => 'Chưa đăng nhập.',
                'data' => [
                    'product_id' => (int) $productId,
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
            'data' => [
                'product_id' => $productId,
=======
            'message' => 'Kiểm tra yêu thích thành công.',
            'data' => [
                'product_id' => (int) $productId,
>>>>>>> Stashed changes
                'wishlisted' => $exists,
            ],
        ]);
    }
}