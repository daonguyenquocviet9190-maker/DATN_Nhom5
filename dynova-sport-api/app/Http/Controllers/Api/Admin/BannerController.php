<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Banner;
use Illuminate\Http\Request;

class BannerController extends Controller
{
    public function index()
    {
        return response()->json(Banner::latest()->get(), 200);
    }

    public function store(Request $request)
    {
        $banner = Banner::create($request->all());
        return response()->json(['message' => 'Tạo banner thành công!', 'data' => $banner], 201);
    }

    public function show(Banner $banner)
    {
        return response()->json($banner, 200);
    }

    public function update(Request $request, Banner $banner)
    {
        $banner->update($request->all());
        return response()->json(['message' => 'Cập nhật banner thành công!', 'data' => $banner], 200);
    }

    public function destroy(Banner $banner)
    {
        $banner->delete();
        return response()->json(['message' => 'Xóa banner thành công!'], 200);
    }
}