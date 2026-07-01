<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
<<<<<<< Updated upstream
use Illuminate\Support\Facades\Validator;

class ProfileController extends Controller
{
    private function userResource($user)
    {
        if (!$user) {
            return null;
=======
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
>>>>>>> Stashed changes
        }

        return [
            'id' => $user->id,
<<<<<<< Updated upstream
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
=======
            'name' => $user->name ?? $user->full_name ?? null,
            'fullName' => $user->full_name ?? $user->name ?? null,
            'full_name' => $user->full_name ?? $user->name ?? null,
            'email' => $user->email ?? null,
            'phone' => $user->phone ?? null,
            'role' => $user->role ?? 'customer',
            'address' => $user->address ?? null,
            'province' => $user->province ?? null,
            'ward' => $user->ward ?? null,
            'avatar_url' => $user->avatar_url ?? null,
>>>>>>> Stashed changes
            'created_at' => $user->created_at ?? null,
        ];
    }

<<<<<<< Updated upstream
    private function profileData($user)
=======
    private function getProfileData($user): array
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
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
=======
        if (
            $user &&
            Schema::hasTable('orders') &&
            Schema::hasColumn('orders', 'user_id')
        ) {
            $orders = DB::table('orders')
                ->where('user_id', $user->id)
                ->get();

            $stats = [
                'total_orders' => $orders->count(),
                'pending_orders' => $orders->where('status', 'pending')->count(),
                'shipping_orders' => $orders->where('status', 'shipping')->count(),
                'completed_orders' => $orders->where('status', 'completed')->count(),
                'cancelled_orders' => $orders->where('status', 'cancelled')->count(),
                'total_spent' => $orders->where('status', 'completed')->sum('grand_total')
                    ?: $orders->where('status', 'completed')->sum('total'),
            ];

            $recentOrders = DB::table('orders')
                ->where('user_id', $user->id)
                ->orderByDesc('created_at')
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
        $user = $request->user();
=======
        $user = $this->currentUser($request);
>>>>>>> Stashed changes

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn cần đăng nhập để xem hồ sơ.',
            ], 401);
        }

        return response()->json([
            'success' => true,
            'message' => 'Lấy hồ sơ thành công.',
<<<<<<< Updated upstream
            'data' => $this->profileData($user),
=======
            'data' => $this->getProfileData($user),
>>>>>>> Stashed changes
        ]);
    }

    public function update(Request $request)
    {
<<<<<<< Updated upstream
        $user = $request->user();
=======
        $user = $this->currentUser($request);
>>>>>>> Stashed changes

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn cần đăng nhập để cập nhật hồ sơ.',
            ], 401);
        }

<<<<<<< Updated upstream
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
=======
        $validated = $request->validate([
            'fullName' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'phone' => ['required', 'string', 'max:20'],
            'address' => ['nullable', 'string', 'max:255'],
            'province' => ['nullable', 'string', 'max:255'],
            'ward' => ['nullable', 'string', 'max:255'],
            'avatar_url' => ['nullable', 'string'],
        ], [
            'email.unique' => 'Email này đã được tài khoản khác sử dụng.',
        ]);

        $updates = [
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'updated_at' => now(),
        ];

        if (Schema::hasColumn('users', 'name')) {
            $updates['name'] = $validated['fullName'];
        }

        if (Schema::hasColumn('users', 'full_name')) {
            $updates['full_name'] = $validated['fullName'];
        }

        if (Schema::hasColumn('users', 'address')) {
            $updates['address'] = $validated['address'] ?? null;
        }

        if (Schema::hasColumn('users', 'province')) {
            $updates['province'] = $validated['province'] ?? null;
        }

        if (Schema::hasColumn('users', 'ward')) {
            $updates['ward'] = $validated['ward'] ?? null;
        }

        if (Schema::hasColumn('users', 'avatar_url')) {
            $updates['avatar_url'] = $validated['avatar_url'] ?? null;
>>>>>>> Stashed changes
        }

        DB::table('users')
            ->where('id', $user->id)
<<<<<<< Updated upstream
            ->update($payload);

        $freshUser = DB::table('users')->where('id', $user->id)->first();
=======
            ->update($updates);

        $updatedUser = DB::table('users')
            ->where('id', $user->id)
            ->first();
>>>>>>> Stashed changes

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật hồ sơ thành công.',
<<<<<<< Updated upstream
            'data' => $this->profileData($freshUser),
=======
            'data' => $this->getProfileData($updatedUser),
>>>>>>> Stashed changes
        ]);
    }

    public function updatePassword(Request $request)
    {
<<<<<<< Updated upstream
        $user = $request->user();
=======
        $user = $this->currentUser($request);
>>>>>>> Stashed changes

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn cần đăng nhập để đổi mật khẩu.',
            ], 401);
        }

        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
<<<<<<< Updated upstream
=======
        ], [
            'password.confirmed' => 'Mật khẩu xác nhận không khớp.',
>>>>>>> Stashed changes
        ]);

        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Mật khẩu hiện tại không đúng.',
            ], 422);
        }

<<<<<<< Updated upstream
        DB::table('users')->where('id', $user->id)->update([
            'password' => Hash::make($validated['password']),
            'updated_at' => now(),
        ]);
=======
        DB::table('users')
            ->where('id', $user->id)
            ->update([
                'password' => Hash::make($validated['password']),
                'updated_at' => now(),
            ]);
>>>>>>> Stashed changes

        return response()->json([
            'success' => true,
            'message' => 'Đổi mật khẩu thành công.',
        ]);
    }

    public function uploadAvatar(Request $request)
    {
<<<<<<< Updated upstream
        $user = $request->user();
=======
        $user = $this->currentUser($request);
>>>>>>> Stashed changes

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn cần đăng nhập để cập nhật ảnh đại diện.',
            ], 401);
        }

<<<<<<< Updated upstream
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
=======
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

        if (Schema::hasColumn('users', 'avatar_url')) {
            DB::table('users')
                ->where('id', $user->id)
                ->update([
                    'avatar_url' => $avatarUrl,
                    'updated_at' => now(),
                ]);
        }

        $updatedUser = DB::table('users')
            ->where('id', $user->id)
            ->first();
>>>>>>> Stashed changes

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật ảnh đại diện thành công.',
<<<<<<< Updated upstream
            'data' => $this->profileData($freshUser),
=======
            'data' => [
                'user' => $this->userResource($updatedUser),
            ],
>>>>>>> Stashed changes
        ]);
    }
}