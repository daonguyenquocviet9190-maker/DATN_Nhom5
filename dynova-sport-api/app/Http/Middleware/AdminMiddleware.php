<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn cần đăng nhập.',
            ], 401);
        }

        if (isset($user->status) && in_array(strtolower((string) $user->status), ['inactive', 'blocked'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Tài khoản của bạn hiện không được phép truy cập.',
            ], 403);
        }

        $roleName = null;

        if (Schema::hasTable('roles') && isset($user->role_id)) {
            $roleName = DB::table('roles')
                ->where('id', $user->role_id)
                ->value('name');
        }

        if (strtolower((string) $roleName) !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không có quyền truy cập quản trị.',
            ], 403);
        }

        return $next($request);
    }
}
