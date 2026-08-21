<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Banner;
use Illuminate\Support\Carbon;

class BannerController extends Controller
{
    public function index()
    {
        $now = Carbon::now();

        $banners = Banner::query()
            ->where('position', 'home_hero')
            ->where('is_active', 1)
            ->where(function ($query) use ($now) {
                $query->whereNull('start_at')->orWhere('start_at', '<=', $now);
            })
            ->where(function ($query) use ($now) {
                $query->whereNull('end_at')->orWhere('end_at', '>=', $now);
            })
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Lấy banner thành công.',
            'data' => $banners,
        ]);
    }
}
