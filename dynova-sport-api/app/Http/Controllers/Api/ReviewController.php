<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

class ReviewController extends Controller
{
    private function onlyExistingReviewColumns(array $data): array
    {
        if (!Schema::hasTable('reviews')) {
            return [];
        }

        return collect($data)
            ->filter(function ($value, $key) {
                return Schema::hasColumn('reviews', $key);
            })
            ->toArray();
    }

    private function productExists($productId): bool
    {
        if (!Schema::hasTable('products')) {
            return false;
        }

        return DB::table('products')
            ->where('id', $productId)
            ->exists();
    }

    private function normalizeUser($user)
    {
        if (!$user) {
            return [
                'id' => null,
                'name' => 'Khách hàng',
                'email' => null,
                'avatar_url' => null,
            ];
        }

        return [
            'id' => $user->id ?? null,
            'name' => $user->name ?? $user->full_name ?? 'Khách hàng',
            'email' => $user->email ?? null,
            'avatar_url' => $user->avatar_url ?? null,
        ];
    }

    private function normalizeProduct($product)
    {
        if (!$product) {
            return null;
        }

        $image = $product->image_url
            ?? $product->image
            ?? $product->thumbnail
            ?? null;

        return [
            'id' => $product->id ?? null,
            'name' => $product->name ?? 'Sản phẩm',
            'slug' => $product->slug ?? null,
            'image' => $image,
            'image_url' => $image,
            'price' => (float) ($product->price ?? $product->sale_price ?? 0),
        ];
    }

    private function normalizeReview($review)
    {
        $user = null;
        $product = null;

        if (Schema::hasTable('users') && isset($review->user_id)) {
            $user = DB::table('users')
                ->where('id', $review->user_id)
                ->first();
        }

        if (Schema::hasTable('products') && isset($review->product_id)) {
            $product = DB::table('products')
                ->where('id', $review->product_id)
                ->first();
        }

        return [
            'id' => $review->id,
            'user_id' => $review->user_id ?? null,
            'product_id' => $review->product_id ?? null,
            'order_id' => $review->order_id ?? null,
            'rating' => (int) ($review->rating ?? 5),
            'content' => $review->content ?? '',
            'status' => $review->status ?? 'approved',
            'created_at' => $review->created_at ?? null,
            'updated_at' => $review->updated_at ?? null,
            'user' => $this->normalizeUser($user),
            'product' => $this->normalizeProduct($product),
        ];
    }

    private function getReviewStats($productId = null): array
    {
        if (!Schema::hasTable('reviews')) {
            return [
                'average' => 0,
                'total' => 0,
                'breakdown' => [
                    5 => 0,
                    4 => 0,
                    3 => 0,
                    2 => 0,
                    1 => 0,
                ],
            ];
        }

        $query = DB::table('reviews');

        if (Schema::hasColumn('reviews', 'status')) {
            $query->where('status', 'approved');
        }

        if ($productId && Schema::hasColumn('reviews', 'product_id')) {
            $query->where('product_id', $productId);
        }

        $reviews = $query->get();

        $total = $reviews->count();

        $average = $total > 0
            ? round((float) $reviews->avg('rating'), 1)
            : 0;

        $breakdown = [
            5 => 0,
            4 => 0,
            3 => 0,
            2 => 0,
            1 => 0,
        ];

        foreach ($reviews as $review) {
            $rating = (int) ($review->rating ?? 5);

            if (isset($breakdown[$rating])) {
                $breakdown[$rating]++;
            }
        }

        return [
            'average' => $average,
            'total' => $total,
            'breakdown' => $breakdown,
        ];
    }

    public function index(Request $request)
    {
        if (!Schema::hasTable('reviews')) {
            return response()->json([
                'success' => true,
                'message' => 'Chưa có bảng đánh giá.',
                'data' => [
                    'reviews' => [],
                    'total' => 0,
                    'average' => 0,
                    'breakdown' => [
                        5 => 0,
                        4 => 0,
                        3 => 0,
                        2 => 0,
                        1 => 0,
                    ],
                ],
            ]);
        }

        $query = DB::table('reviews');

        if ($request->filled('product_id') && Schema::hasColumn('reviews', 'product_id')) {
            $query->where('product_id', $request->product_id);
        }

        if ($request->filled('status') && Schema::hasColumn('reviews', 'status')) {
            $query->where('status', $request->status);
        } elseif (Schema::hasColumn('reviews', 'status')) {
            $query->where('status', 'approved');
        }

        $orderByColumn = Schema::hasColumn('reviews', 'created_at')
            ? 'created_at'
            : 'id';

        $reviews = $query
            ->orderByDesc($orderByColumn)
            ->get()
            ->map(function ($review) {
                return $this->normalizeReview($review);
            });

        $stats = $this->getReviewStats($request->product_id);

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách đánh giá thành công.',
            'data' => [
                'reviews' => $reviews,
                'total' => $stats['total'],
                'average' => $stats['average'],
                'breakdown' => $stats['breakdown'],
            ],
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn cần đăng nhập để đánh giá sản phẩm.',
            ], 401);
        }

        if (!Schema::hasTable('reviews')) {
            return response()->json([
                'success' => false,
                'message' => 'Bảng reviews chưa tồn tại trong database.',
            ], 500);
        }

        $validated = $request->validate([
            'product_id' => ['required', 'integer'],
            'order_id' => ['nullable', 'integer'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'content' => ['required', 'string', 'min:5', 'max:1000'],
        ], [
            'product_id.required' => 'Thiếu mã sản phẩm.',
            'rating.required' => 'Vui lòng chọn số sao.',
            'rating.min' => 'Số sao tối thiểu là 1.',
            'rating.max' => 'Số sao tối đa là 5.',
            'content.required' => 'Vui lòng nhập nội dung đánh giá.',
            'content.min' => 'Nội dung đánh giá phải có ít nhất 5 ký tự.',
            'content.max' => 'Nội dung đánh giá không được vượt quá 1000 ký tự.',
        ]);

        $productId = (int) $validated['product_id'];

        if (!$this->productExists($productId)) {
            return response()->json([
                'success' => false,
                'message' => 'Sản phẩm không tồn tại.',
            ], 422);
        }

        $existing = DB::table('reviews')
            ->where('user_id', $user->id)
            ->where('product_id', $productId)
            ->first();

        $payload = $this->onlyExistingReviewColumns([
            'user_id' => $user->id,
            'product_id' => $productId,
            'order_id' => $validated['order_id'] ?? null,
            'rating' => $validated['rating'],
            'content' => $validated['content'],
            'status' => 'approved',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        if ($existing) {
            unset($payload['created_at']);

            DB::table('reviews')
                ->where('id', $existing->id)
                ->update($payload);

            $reviewId = $existing->id;
            $message = 'Cập nhật đánh giá thành công.';
        } else {
            $reviewId = DB::table('reviews')->insertGetId($payload);
            $message = 'Gửi đánh giá thành công.';
        }

        $review = DB::table('reviews')
            ->where('id', $reviewId)
            ->first();

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => [
                'review' => $this->normalizeReview($review),
                'stats' => $this->getReviewStats($productId),
            ],
        ]);
    }

    public function myReviews(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn cần đăng nhập để xem đánh giá của mình.',
            ], 401);
        }

        if (!Schema::hasTable('reviews')) {
            return response()->json([
                'success' => true,
                'message' => 'Chưa có bảng đánh giá.',
                'data' => [
                    'reviews' => [],
                    'total' => 0,
                ],
            ]);
        }

        $query = DB::table('reviews')
            ->where('user_id', $user->id);

        $orderByColumn = Schema::hasColumn('reviews', 'created_at')
            ? 'created_at'
            : 'id';

        $reviews = $query
            ->orderByDesc($orderByColumn)
            ->get()
            ->map(function ($review) {
                return $this->normalizeReview($review);
            });

        return response()->json([
            'success' => true,
            'message' => 'Lấy đánh giá của tôi thành công.',
            'data' => [
                'reviews' => $reviews,
                'total' => $reviews->count(),
            ],
        ]);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn cần đăng nhập để sửa đánh giá.',
            ], 401);
        }

        $review = DB::table('reviews')
            ->where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$review) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy đánh giá.',
            ], 404);
        }

        $validated = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'content' => ['required', 'string', 'min:5', 'max:1000'],
        ]);

        $payload = $this->onlyExistingReviewColumns([
            'rating' => $validated['rating'],
            'content' => $validated['content'],
            'status' => 'approved',
            'updated_at' => now(),
        ]);

        DB::table('reviews')
            ->where('id', $id)
            ->update($payload);

        $updatedReview = DB::table('reviews')
            ->where('id', $id)
            ->first();

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật đánh giá thành công.',
            'data' => [
                'review' => $this->normalizeReview($updatedReview),
                'stats' => $this->getReviewStats($updatedReview->product_id),
            ],
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn cần đăng nhập để xóa đánh giá.',
            ], 401);
        }

        $review = DB::table('reviews')
            ->where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$review) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy đánh giá.',
            ], 404);
        }

        DB::table('reviews')
            ->where('id', $id)
            ->delete();

        return response()->json([
            'success' => true,
            'message' => 'Xóa đánh giá thành công.',
        ]);
    }
}