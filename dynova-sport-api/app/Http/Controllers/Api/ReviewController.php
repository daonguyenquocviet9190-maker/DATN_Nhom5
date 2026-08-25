<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class ReviewController extends Controller
{
    public function index(Request $request)
    {
        $query = DB::table('reviews')->where('status', 'approved');
        if ($request->filled('product_id')) $query->where('product_id', (int) $request->product_id);
        $rows = $query->orderByDesc('id')->get()->map(fn($r) => $this->normalize($r));
        $ratings = $rows->pluck('rating');
        $breakdown = [5=>0,4=>0,3=>0,2=>0,1=>0];
        foreach ($ratings as $rating) if (isset($breakdown[(int)$rating])) $breakdown[(int)$rating]++;
        return response()->json(['success' => true, 'data' => [
            'reviews' => $rows,
            'total' => $rows->count(),
            'average' => $rows->count() ? round((float)$ratings->avg(), 1) : 0,
            'breakdown' => $breakdown,
        ]]);
    }

    public function eligibility(Request $request)
    {
        $validated = $request->validate([
            'product_id' => ['required', 'integer'],
        ]);

        $userId = (int) $request->user()->id;
        $productId = (int) $validated['product_id'];

        $purchase = DB::table('order_items as oi')
            ->join('orders as o', 'o.id', '=', 'oi.order_id')
            ->where('o.user_id', $userId)
            ->where('o.status', 'completed')
            ->where('oi.product_id', $productId)
            ->whereNotExists(function ($query) use ($userId) {
                $query->select(DB::raw(1))
                    ->from('reviews as r')
                    ->whereColumn('r.order_item_id', 'oi.id')
                    ->where('r.user_id', $userId);
            })
            ->select('oi.id as order_item_id', 'o.id as order_id')
            ->orderByDesc('o.id')
            ->first();

        if (!$purchase) {
            $hasCompletedPurchase = DB::table('order_items as oi')
                ->join('orders as o', 'o.id', '=', 'oi.order_id')
                ->where('o.user_id', $userId)
                ->where('o.status', 'completed')
                ->where('oi.product_id', $productId)
                ->exists();

            return response()->json([
                'success' => true,
                'data' => [
                    'can_review' => false,
                    'order_id' => null,
                    'order_item_id' => null,
                    'reason' => $hasCompletedPurchase
                        ? 'Bạn đã đánh giá sản phẩm ở lần mua đã hoàn tất.'
                        : 'Bạn có thể đánh giá sau khi đơn hàng chứa sản phẩm này hoàn tất.',
                ],
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'can_review' => true,
                'order_id' => (int) $purchase->order_id,
                'order_item_id' => (int) $purchase->order_item_id,
                'reason' => null,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $validated = $request->validate([
            'product_id' => ['required', 'integer'],
            'order_id' => ['nullable', 'integer'],
            'order_item_id' => ['nullable', 'integer'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'content' => ['required', 'string', 'min:5', 'max:1000'],
        ]);

        $productId = (int) $validated['product_id'];
        $purchase = DB::table('order_items as oi')
            ->join('orders as o', 'o.id', '=', 'oi.order_id')
            ->where('o.user_id', $user->id)
            ->where('o.status', 'completed')
            ->where('oi.product_id', $productId)
            ->when(!empty($validated['order_id']), fn($q) => $q->where('o.id', (int)$validated['order_id']))
            ->when(!empty($validated['order_item_id']), fn($q) => $q->where('oi.id', (int)$validated['order_item_id']))
            ->select('oi.id as order_item_id', 'o.id as order_id')
            ->orderByDesc('o.id')
            ->first();

        if (!$purchase) {
            throw ValidationException::withMessages([
                'product_id' => 'Chỉ khách hàng đã mua và hoàn tất đơn hàng mới được đánh giá sản phẩm này.',
            ]);
        }

        $existing = DB::table('reviews')
            ->where('user_id', $user->id)
            ->where('order_item_id', $purchase->order_item_id)
            ->first();
        if ($existing) {
            throw ValidationException::withMessages(['product_id' => 'Bạn đã đánh giá sản phẩm trong lần mua này.']);
        }

        $id = DB::table('reviews')->insertGetId([
            'user_id' => $user->id,
            'product_id' => $productId,
            'order_id' => $purchase->order_id,
            'order_item_id' => $purchase->order_item_id,
            'rating' => (int)$validated['rating'],
            'content' => trim($validated['content']),
            'status' => 'approved',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['success' => true, 'message' => 'Gửi đánh giá xác thực thành công.', 'data' => ['review' => $this->normalize(DB::table('reviews')->where('id', $id)->first())]], 201);
    }

    public function myReviews(Request $request)
    {
        $rows = DB::table('reviews')->where('user_id', $request->user()->id)->orderByDesc('id')->get()->map(fn($r) => $this->normalize($r));
        return response()->json(['success' => true, 'data' => ['reviews' => $rows, 'total' => $rows->count()]]);
    }

    public function update(Request $request, $id)
    {
        $review = DB::table('reviews')->where('id', $id)->where('user_id', $request->user()->id)->first();
        if (!$review) return response()->json(['success' => false, 'message' => 'Không tìm thấy đánh giá.'], 404);
        $validated = $request->validate(['rating' => ['required','integer','min:1','max:5'], 'content' => ['required','string','min:5','max:1000']]);
        DB::table('reviews')->where('id', $id)->update(['rating'=>(int)$validated['rating'], 'content'=>trim($validated['content']), 'updated_at'=>now()]);
        return response()->json(['success'=>true,'message'=>'Cập nhật đánh giá thành công.','data'=>['review'=>$this->normalize(DB::table('reviews')->where('id',$id)->first())]]);
    }

    public function destroy(Request $request, $id)
    {
        $deleted = DB::table('reviews')->where('id', $id)->where('user_id', $request->user()->id)->delete();
        if (!$deleted) return response()->json(['success'=>false,'message'=>'Không tìm thấy đánh giá.'],404);
        return response()->json(['success'=>true,'message'=>'Xóa đánh giá thành công.']);
    }

    private function normalize(object $review): array
    {
        $user = DB::table('users')->where('id', $review->user_id)->first();
        $product = DB::table('products')->where('id', $review->product_id)->first();
        return [
            'id'=>$review->id, 'user_id'=>$review->user_id, 'product_id'=>$review->product_id,
            'order_id'=>$review->order_id ?? null, 'order_item_id'=>$review->order_item_id ?? null,
            'verified_purchase'=>!empty($review->order_item_id),
            'rating'=>(int)$review->rating, 'content'=>$review->content ?? '', 'status'=>$review->status ?? 'approved',
            'created_at'=>$review->created_at ?? null, 'updated_at'=>$review->updated_at ?? null,
            'user'=>['id'=>$user->id ?? null,'name'=>$user->name ?? $user->full_name ?? 'Khách hàng','avatar_url'=>$user->avatar_url ?? null],
            'product'=>$product ? ['id'=>$product->id,'name'=>$product->name,'slug'=>$product->slug ?? null,'image'=>$product->image ?? null,'price'=>(float)($product->price ?? 0)] : null,
        ];
    }
}
