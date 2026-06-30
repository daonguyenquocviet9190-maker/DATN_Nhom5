<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Brand;

class BrandController extends Controller
{
    public function index()
    {
        $brands = Brand::query()
            ->where('is_active', 1)
            ->orderBy('sort_order')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Lấy thương hiệu thành công.',
            'data' => $brands,
        ]);
    }
}