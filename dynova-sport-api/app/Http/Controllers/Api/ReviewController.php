<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ReviewController extends Controller
{
    public function index(Request $request)
    {
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

        $query = Review::query()
            ->with('user:id,name,email')
            ->latest();

        if ($request->filled('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $reviews = $query->get()->map(function ($review) {
            return [
                'id' => $review->id,
                'user_id' => $review->user_id,
                'product_id' => $review->product_id,
                'rating' => (int) $review->rating,
                'content' => $review->content,
                'status' => $review->status,
                'created_at' => $review->created_at,
                'user' => [
                    'id' => $review->user?->id,
                    'name' => $review->user?->name ?? 'Khách hàng',
                    'email' => $review->user?->email,
                ],
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách đánh giá thành công.',
            'data' => [
                'reviews' => $reviews,
                'total' => $reviews->count(),
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
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'content' => ['required', 'string', 'max:1000'],
        ]);

        $review = Review::updateOrCreate(
            [
                'user_id' => $user->id,
                'product_id' => $validated['product_id'],
            ],
            [
                'rating' => $validated['rating'],
                'content' => $validated['content'],
                'status' => 'approved',
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Gửi đánh giá thành công.',
            'data' => [
                'review' => $review,
            ],
        ]);
    }
}