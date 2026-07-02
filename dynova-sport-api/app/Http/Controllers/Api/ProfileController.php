<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    private function currentUser(Request $request)
    {
        $authUser = $request->user();

        if (!$authUser) {
            return null;
        }

        return DB::table('users')
            ->where('id', $authUser->id)
            ->first();
    }

    private function userResource($user): array
    {
        if (!$user) {
            return [];
        }

        return [
            'id' => $user->id,
            'name' => $user->name ?? $user->full_name ?? '',
            'fullName' => $user->full_name ?? $user->name ?? '',
            'full_name' => $user->full_name ?? $user->name ?? '',
            'email' => $user->email ?? '',
            'phone' => $user->phone ?? '',
            'role' => $user->role ?? 'customer',
            'address' => $user->address ?? '',
            'province' => $user->province ?? '',
            'ward' => $user->ward ?? '',
            'avatar_url' => $user->avatar_url ?? null,
            'created_at' => $user->created_at ?? null,
        ];
    }

    private function getProfileData($user): array
    {
        $stats = [
            'total_orders' => 0,
            'pending_orders' => 0,
            'shipping_orders' => 0,
            'completed_orders' => 0,
            'cancelled_orders' => 0,
            'total_spent' => 0,
        ];

        $recentOrders = [];

        if (
            $user &&
            Schema::hasTable('orders') &&
            Schema::hasColumn('orders', 'user_id')
        ) {
            $ordersQuery = DB::table('orders')
                ->where('user_id', $user->id);

            $stats['total_orders'] = (clone $ordersQuery)->count();

            if (Schema::hasColumn('orders', 'status')) {
                $stats['pending_orders'] = (clone $ordersQuery)
                    ->where('status', 'pending')
                    ->count();

                $stats['shipping_orders'] = (clone $ordersQuery)
                    ->whereIn('status', ['shipping', 'delivering'])
                    ->count();

                $stats['completed_orders'] = (clone $ordersQuery)
                    ->whereIn('status', ['completed', 'success'])
                    ->count();

                $stats['cancelled_orders'] = (clone $ordersQuery)
                    ->whereIn('status', ['cancelled', 'canceled'])
                    ->count();
            }

            $totalColumn = null;

            if (Schema::hasColumn('orders', 'grand_total')) {
                $totalColumn = 'grand_total';
            } elseif (Schema::hasColumn('orders', 'total')) {
                $totalColumn = 'total';
            } elseif (Schema::hasColumn('orders', 'total_price')) {
                $totalColumn = 'total_price';
            }

            if ($totalColumn) {
                $spentQuery = clone $ordersQuery;

                if (Schema::hasColumn('orders', 'status')) {
                    $spentQuery->whereIn('status', ['completed', 'success']);
                }

                $stats['total_spent'] = (float) $spentQuery->sum($totalColumn);
            }

            $orderByColumn = Schema::hasColumn('orders', 'created_at')
                ? 'created_at'
                : 'id';

            $recentOrders = (clone $ordersQuery)
                ->orderByDesc($orderByColumn)
                ->limit(5)
                ->get();
        }

        return [
            'user' => $this->userResource($user),
            'stats' => $stats,
            'recent_orders' => $recentOrders,
        ];
    }

    public function show(Request $request)
    {
        $user = $this->currentUser($request);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn cần đăng nhập để xem hồ sơ.',
            ], 401);
        }

        return response()->json([
            'success' => true,
            'message' => 'Lấy hồ sơ thành công.',
            'data' => $this->getProfileData($user),
        ]);
    }

    public function update(Request $request)
    {
        $user = $this->currentUser($request);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn cần đăng nhập để cập nhật hồ sơ.',
            ], 401);
        }

        $validator = Validator::make($request->all(), [
            'fullName' => ['nullable', 'string', 'max:255'],
            'full_name' => ['nullable', 'string', 'max:255'],
            'name' => ['nullable', 'string', 'max:255'],

            'email' => [
                'nullable',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],

            'phone' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string', 'max:255'],
            'province' => ['nullable', 'string', 'max:255'],
            'ward' => ['nullable', 'string', 'max:255'],
            'avatar_url' => ['nullable', 'string', 'max:1000'],
        ], [
            'email.unique' => 'Email này đã được tài khoản khác sử dụng.',
            'email.email' => 'Email không đúng định dạng.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();

        $fullName = $validated['fullName']
            ?? $validated['full_name']
            ?? $validated['name']
            ?? $user->name
            ?? $user->full_name
            ?? '';

        $updates = [];

        if (Schema::hasColumn('users', 'name')) {
            $updates['name'] = $fullName;
        }

        if (Schema::hasColumn('users', 'full_name')) {
            $updates['full_name'] = $fullName;
        }

        if (Schema::hasColumn('users', 'email')) {
            $updates['email'] = $validated['email'] ?? $user->email;
        }

        $optionalColumns = [
            'phone',
            'address',
            'province',
            'ward',
            'avatar_url',
        ];

        foreach ($optionalColumns as $column) {
            if (Schema::hasColumn('users', $column)) {
                $updates[$column] = array_key_exists($column, $validated)
                    ? $validated[$column]
                    : ($user->{$column} ?? null);
            }
        }

        if (Schema::hasColumn('users', 'updated_at')) {
            $updates['updated_at'] = now();
        }

        if (!empty($updates)) {
            DB::table('users')
                ->where('id', $user->id)
                ->update($updates);
        }

        $updatedUser = DB::table('users')
            ->where('id', $user->id)
            ->first();

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật hồ sơ thành công.',
            'data' => $this->getProfileData($updatedUser),
        ]);
    }

    public function updatePassword(Request $request)
    {
        $user = $this->currentUser($request);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn cần đăng nhập để đổi mật khẩu.',
            ], 401);
        }

        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ], [
            'current_password.required' => 'Vui lòng nhập mật khẩu hiện tại.',
            'password.required' => 'Vui lòng nhập mật khẩu mới.',
            'password.min' => 'Mật khẩu mới phải có ít nhất 6 ký tự.',
            'password.confirmed' => 'Mật khẩu xác nhận không khớp.',
        ]);

        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Mật khẩu hiện tại không đúng.',
            ], 422);
        }

        DB::table('users')
            ->where('id', $user->id)
            ->update([
                'password' => Hash::make($validated['password']),
                'updated_at' => now(),
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Đổi mật khẩu thành công.',
        ]);
    }

    public function uploadAvatar(Request $request)
    {
        $user = $this->currentUser($request);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn cần đăng nhập để cập nhật ảnh đại diện.',
            ], 401);
        }

        if (!Schema::hasColumn('users', 'avatar_url')) {
            return response()->json([
                'success' => false,
                'message' => 'Cột avatar_url chưa tồn tại trong bảng users.',
            ], 500);
        }

        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ], [
            'avatar.required' => 'Vui lòng chọn ảnh đại diện.',
            'avatar.image' => 'File tải lên phải là hình ảnh.',
            'avatar.mimes' => 'Ảnh chỉ hỗ trợ jpg, jpeg, png hoặc webp.',
            'avatar.max' => 'Ảnh không được vượt quá 2MB.',
        ]);

        $path = $request->file('avatar')->store('avatars', 'public');
        $avatarUrl = asset('storage/' . $path);

        DB::table('users')
            ->where('id', $user->id)
            ->update([
                'avatar_url' => $avatarUrl,
                'updated_at' => now(),
            ]);

        $updatedUser = DB::table('users')
            ->where('id', $user->id)
            ->first();

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật ảnh đại diện thành công.',
            'data' => $this->getProfileData($updatedUser),
        ]);
    }
}