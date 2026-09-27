<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAccountIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return $next($request);
        }

        $attributes = method_exists($user, 'getAttributes')
            ? $user->getAttributes()
            : [];
        $inactive = (
            array_key_exists('is_active', $attributes)
            && !(bool) $user->is_active
        ) || in_array(
            strtolower((string) ($user->status ?? '')),
            ['inactive', 'blocked', 'locked'],
            true,
        );

        if ($inactive) {
            return response()->json([
                'success' => false,
                'message' => 'Tài khoản đã bị khóa. Vui lòng liên hệ cửa hàng để được hỗ trợ.',
            ], 403);
        }

        return $next($request);
    }
}
