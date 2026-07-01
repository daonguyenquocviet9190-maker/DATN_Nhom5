<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;

class ProfileController extends Controller
{
    private function userResource($user)
    {
        if (!$user) {
            return null;
        }

        return [
            'id' => $user->id,
            'name' => $user->name ?? '',
            'fullName' => $user->name ?? '',
            'full_name' => $user->name ?? '',
            'email' => $user->email ?? '',
            'phone' => $user->phone ?? '',
            'address' => $user->address ?? '',
            'province' => $user->province ?? '',
            'ward' => $user->ward ?? '',
            'avatar_url' => $user->avatar_url ?? null,
            'role' => $user->role ?? 'customer',
            'created_at' => $user->created_at ?? null,
        ];
    }

    private function profileData($user)
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

        if (Schema::hasTable('orders')) {
            $ordersQuery = DB::table('orders')->where('user_id', $user->id);

            $stats['total_orders'] = (clone $ordersQuery)->count();
            $stats['pending_orders'] = (clone $ordersQuery)->where('status', 'pending')->count();
            $stats['shipping_orders'] = (clone $ordersQuery)->whereIn('status', ['shipping', 'delivering'])->count();
            $stats['completed_orders'] = (clone $ordersQuery)->whereIn('status', ['completed', 'success'])->count();
            $stats['cancelled_orders'] = (clone $ordersQuery)->whereIn('status', ['cancelled', 'canceled'])->count();

            $totalColumn = Schema::hasColumn('orders', 'grand_total')
                ? 'grand_total'
                : (Schema::hasColumn('orders', 'total') ? 'total' : null);

            if ($totalColumn) {
                $stats['total_spent'] = (float) (clone $ordersQuery)
                    ->whereIn('status', ['completed', 'success'])
                    ->sum($totalColumn);
            }

            $recentOrders = (clone $ordersQuery)
                ->orderByDesc('id')
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
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn cần đăng nhập để xem hồ sơ.',
            ], 401);
        }

        return response()->json([
            'success' => true,
            'message' => 'Lấy hồ sơ thành công.',
            'data' => $this->profileData($user),
        ]);
    }

    public function update(Request $request)
    {
        $user = $request->user();

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
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string', 'max:255'],
            'province' => ['nullable', 'string', 'max:255'],
            'ward' => ['nullable', 'string', 'max:255'],
            'avatar_url' => ['nullable', 'string', 'max:1000'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $name = $request->input('fullName')
            ?? $request->input('full_name')
            ?? $request->input('name')
            ?? $user->name;

        $payload = [
            'name' => $name,
            'email' => $request->input('email', $user->email),
            'updated_at' => now(),
        ];

        $optionalColumns = [
            'phone',
            'address',
            'province',
            'ward',
            'avatar_url',
        ];

        foreach ($optionalColumns as $column) {
            if (Schema::hasColumn('users', $column)) {
                $payload[$column] = $request->input($column, $user->{$column} ?? null);
            }
        }

        DB::table('users')
            ->where('id', $user->id)
            ->update($payload);

        $freshUser = DB::table('users')->where('id', $user->id)->first();

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật hồ sơ thành công.',
            'data' => $this->profileData($freshUser),
        ]);
    }

    public function updatePassword(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn cần đăng nhập để đổi mật khẩu.',
            ], 401);
        }

        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ]);

        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Mật khẩu hiện tại không đúng.',
            ], 422);
        }

        DB::table('users')->where('id', $user->id)->update([
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
        $user = $request->user();

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
            'avatar' => ['required', 'image', 'max:2048'],
        ]);

        $path = $request->file('avatar')->store('avatars', 'public');
        $avatarUrl = asset('storage/' . $path);

        DB::table('users')->where('id', $user->id)->update([
            'avatar_url' => $avatarUrl,
            'updated_at' => now(),
        ]);

        $freshUser = DB::table('users')->where('id', $user->id)->first();

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật ảnh đại diện thành công.',
            'data' => $this->profileData($freshUser),
        ]);
    }
}