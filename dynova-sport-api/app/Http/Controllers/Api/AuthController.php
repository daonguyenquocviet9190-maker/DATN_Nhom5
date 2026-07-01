<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    private function userResource(User $user): array
{
    return [
        'id' => $user->id,
        'name' => $user->name ?: $user->full_name,
        'fullName' => $user->full_name ?: $user->name,
        'email' => $user->email,
        'phone' => $user->phone,
        'role' => $user->role ?: 'customer',
        'created_at' => $user->created_at,
    ];
}

    public function register(Request $request)
    {
        $validated = $request->validate([
            'fullName' => ['nullable', 'string', 'max:255'],
            'name' => ['nullable', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['required', 'string', 'max:20'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ], [
            'email.unique' => 'Email này đã được sử dụng.',
            'password.confirmed' => 'Mật khẩu xác nhận không khớp.',
        ]);

       $displayName = $validated['fullName'] ?? $validated['name'] ?? 'Khách hàng';

            $user = User::create([
                'name' => $displayName,
                'full_name' => $displayName,
                'email' => $validated['email'],
                'phone' => $validated['phone'],
                'role' => 'customer',
                'password' => Hash::make($validated['password']),
            ]);

        $token = $user->createToken('dynova-web-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Đăng ký tài khoản thành công.',
            'data' => [
                'token' => $token,
                'user' => $this->userResource($user),
            ],
        ], 201);
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'remember' => ['nullable', 'boolean'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email hoặc mật khẩu không đúng.'],
            ]);
        }

        $user->tokens()->where('name', 'dynova-web-token')->delete();

        $token = $user->createToken('dynova-web-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Đăng nhập thành công.',
            'data' => [
                'token' => $token,
                'user' => $this->userResource($user),
            ],
        ]);
    }

    public function forgotPassword(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user) {
            throw ValidationException::withMessages([
                'email' => ['Email này chưa tồn tại trong hệ thống.'],
            ]);
        }

        $otp = (string) random_int(100000, 999999);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $validated['email']],
            [
                'token' => Hash::make($otp),
                'created_at' => now(),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Mã OTP đặt lại mật khẩu đã được tạo.',
            'data' => [
                // demo DATN: trả OTP để test nhanh
                // lên production thì bỏ dòng này và gửi OTP qua email
                'dev_otp' => $otp,
            ],
        ]);
    }

    public function resetPassword(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'otp' => ['required', 'string'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ], [
            'password.confirmed' => 'Mật khẩu xác nhận không khớp.',
        ]);

        $record = DB::table('password_reset_tokens')
            ->where('email', $validated['email'])
            ->first();

        if (!$record) {
            throw ValidationException::withMessages([
                'otp' => ['Mã OTP không tồn tại hoặc đã hết hạn.'],
            ]);
        }

        $createdAt = Carbon::parse($record->created_at);

        if ($createdAt->diffInMinutes(now()) > 10) {
            DB::table('password_reset_tokens')
                ->where('email', $validated['email'])
                ->delete();

            throw ValidationException::withMessages([
                'otp' => ['Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.'],
            ]);
        }

        if (!Hash::check($validated['otp'], $record->token)) {
            throw ValidationException::withMessages([
                'otp' => ['Mã OTP không đúng.'],
            ]);
        }

        $user = User::where('email', $validated['email'])->firstOrFail();

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        DB::table('password_reset_tokens')
            ->where('email', $validated['email'])
            ->delete();

        $user->tokens()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.',
        ]);
    }

    public function me(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => [
                'user' => $this->userResource($request->user()),
            ],
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'success' => true,
            'message' => 'Đăng xuất thành công.',
        ]);
    }
}