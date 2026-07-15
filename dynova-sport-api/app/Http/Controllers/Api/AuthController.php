<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    private function normalizeEmail(?string $email): string
    {
        return mb_strtolower(trim((string) $email));
    }

    private function normalizePhone(?string $phone): string
    {
        $phone = preg_replace('/[\s.\-()]/', '', (string) $phone);

        if (str_starts_with($phone, '+84')) {
            $phone = '0' . substr($phone, 3);
        }

        return $phone;
    }

    private function userResource(User $user): array
{
    $user->loadMissing('role:id,name');

    $rawRole = mb_strtolower(
        trim((string) ($user->role?->name ?? 'customer'))
    );

    $adminRoles = [
        'admin',
        'administrator',
        'quản trị',
        'quản trị viên',
        'quan tri',
        'quan tri vien',
    ];

    $roleName = in_array($rawRole, $adminRoles, true)
        ? 'admin'
        : 'customer';

    return [
        'id' => $user->id,
        'role_id' => $user->role_id,
        'name' => $user->name ?: $user->full_name,
        'fullName' => $user->full_name ?: $user->name,
        'full_name' => $user->full_name ?: $user->name,
        'email' => $user->email,
        'phone' => $user->phone,
        'role' => $roleName,
        'role_name' => $roleName,
        'role_data' => $user->role
            ? [
                'id' => $user->role->id,
                'name' => $user->role->name,
            ]
            : null,
        'created_at' => $user->created_at,
    ];
}


    private function customerRole(): Role
{
    $role = Role::query()
        ->where(function ($query) {
            $query
                ->whereRaw('LOWER(name) = ?', ['customer'])
                ->orWhere('name', 'Khách hàng')
                ->orWhere('name', 'khách hàng');
        })
        ->first();

    if (!$role) {
        throw ValidationException::withMessages([
            'role' => [
                'Hệ thống chưa có quyền khách hàng.',
            ],
        ]);
    }

    return $role;
}


    private function tokenName(Request $request): string
    {
        $device = sha1(
            (string) $request->userAgent() .
            '|' .
            (string) $request->ip()
        );

        return 'dynova-web-' . substr($device, 0, 16);
    }

    public function register(Request $request): JsonResponse
    {
        $request->merge([
            'email' => $this->normalizeEmail($request->input('email')),
            'phone' => $this->normalizePhone($request->input('phone')),
        ]);

        $validated = $request->validate([
            'fullName' => [
                'nullable',
                'required_without:name',
                'string',
                'min:2',
                'max:100',
            ],
            'name' => [
                'nullable',
                'required_without:fullName',
                'string',
                'min:2',
                'max:100',
            ],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email'),
            ],
            'phone' => [
                'required',
                'regex:/^0[0-9]{9}$/',
                Rule::unique('users', 'phone'),
            ],
            'password' => [
                'required',
                'confirmed',
                Password::min(8)->letters()->numbers(),
            ],
        ], [
            'fullName.required_without' => 'Vui lòng nhập họ và tên.',
            'name.required_without' => 'Vui lòng nhập họ và tên.',
            'fullName.min' => 'Họ và tên cần tối thiểu 2 ký tự.',
            'name.min' => 'Họ và tên cần tối thiểu 2 ký tự.',
            'email.required' => 'Vui lòng nhập email.',
            'email.email' => 'Email chưa đúng định dạng.',
            'email.unique' => 'Email này đã được sử dụng.',
            'phone.required' => 'Vui lòng nhập số điện thoại.',
            'phone.regex' => 'Số điện thoại chưa đúng định dạng.',
            'phone.unique' => 'Số điện thoại này đã được sử dụng.',
            'password.required' => 'Vui lòng nhập mật khẩu.',
            'password.confirmed' => 'Mật khẩu xác nhận không khớp.',
            'password.min' => 'Mật khẩu cần tối thiểu 8 ký tự.',
        ]);

        $displayName = trim((string) ($validated['fullName'] ?? $validated['name']));
        $customerRole = $this->customerRole();

        $user = DB::transaction(function () use (
            $validated,
            $displayName,
            $customerRole
        ) {
            return User::query()->create([
                'role_id' => $customerRole->id,
                'name' => $displayName,
                'full_name' => $displayName,
                'email' => $validated['email'],
                'phone' => $validated['phone'],
                'password' => $validated['password'],
            ]);
        });

        $user->load('role:id,name');

        $token = $user
            ->createToken($this->tokenName($request))
            ->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Đăng ký tài khoản thành công.',
            'data' => [
                'token' => $token,
                'user' => $this->userResource($user),
            ],
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $request->merge([
            'email' => $this->normalizeEmail($request->input('email')),
        ]);

        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'remember' => ['nullable', 'boolean'],
        ], [
            'email.required' => 'Vui lòng nhập email.',
            'email.email' => 'Email chưa đúng định dạng.',
            'password.required' => 'Vui lòng nhập mật khẩu.',
        ]);

        $user = User::query()
            ->with('role:id,name')
            ->where('email', $validated['email'])
            ->first();

        if (
            !$user ||
            !$user->password ||
            !Hash::check($validated['password'], $user->password)
        ) {
            throw ValidationException::withMessages([
                'email' => ['Email hoặc mật khẩu không đúng.'],
            ]);
        }

        if (
            array_key_exists('is_active', $user->getAttributes()) &&
            !$user->is_active
        ) {
            throw ValidationException::withMessages([
                'email' => ['Tài khoản đã bị khóa.'],
            ]);
        }

        if (
            array_key_exists('status', $user->getAttributes()) &&
            in_array(
                mb_strtolower((string) $user->status),
                ['inactive', 'blocked', 'locked'],
                true
            )
        ) {
            throw ValidationException::withMessages([
                'email' => ['Tài khoản đã bị khóa.'],
            ]);
        }

        $tokenName = $this->tokenName($request);

        $user->tokens()
            ->where('name', $tokenName)
            ->delete();

        $token = $user
            ->createToken($tokenName)
            ->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Đăng nhập thành công.',
            'data' => [
                'token' => $token,
                'user' => $this->userResource($user),
            ],
        ]);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $request->merge([
            'email' => $this->normalizeEmail($request->input('email')),
        ]);

        $validated = $request->validate([
            'email' => ['required', 'email'],
        ], [
            'email.required' => 'Vui lòng nhập email.',
            'email.email' => 'Email chưa đúng định dạng.',
        ]);

        $user = User::query()
            ->where('email', $validated['email'])
            ->first();

        $responseData = [];

        if ($user) {
            $otp = (string) random_int(100000, 999999);

            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $validated['email']],
                [
                    'token' => Hash::make($otp),
                    'created_at' => now(),
                ]
            );

            if (app()->isLocal() || config('app.debug')) {
                $responseData['dev_otp'] = $otp;
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Nếu email tồn tại, mã xác nhận sẽ được gửi đến bạn.',
            'data' => $responseData,
        ]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $request->merge([
            'email' => $this->normalizeEmail($request->input('email')),
            'otp' => trim((string) (
                $request->input('otp')
                ?? $request->input('token')
                ?? $request->input('code')
            )),
        ]);

        $validated = $request->validate([
            'email' => ['required', 'email'],
            'otp' => ['required', 'digits:6'],
            'password' => [
                'required',
                'confirmed',
                Password::min(8)->letters()->numbers(),
            ],
        ], [
            'email.required' => 'Vui lòng nhập email.',
            'email.email' => 'Email chưa đúng định dạng.',
            'otp.required' => 'Vui lòng nhập mã OTP.',
            'otp.digits' => 'Mã OTP phải gồm 6 chữ số.',
            'password.required' => 'Vui lòng nhập mật khẩu mới.',
            'password.confirmed' => 'Mật khẩu xác nhận không khớp.',
            'password.min' => 'Mật khẩu cần tối thiểu 8 ký tự.',
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

        $user = User::query()
            ->where('email', $validated['email'])
            ->first();

        if (!$user) {
            throw ValidationException::withMessages([
                'email' => ['Không thể đặt lại mật khẩu.'],
            ]);
        }

        DB::transaction(function () use ($validated, $user) {
            $user->update([
                'password' => $validated['password'],
            ]);

            DB::table('password_reset_tokens')
                ->where('email', $validated['email'])
                ->delete();

            $user->tokens()->delete();
        });

        return response()->json([
            'success' => true,
            'message' => 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.',
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->loadMissing('role:id,name');

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $this->userResource($user),
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()
            ->currentAccessToken()
            ?->delete();

        return response()->json([
            'success' => true,
            'message' => 'Đăng xuất thành công.',
        ]);
    }
}
