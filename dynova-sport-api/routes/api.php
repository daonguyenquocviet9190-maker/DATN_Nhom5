<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Admin\BannerController;
use App\Http\Controllers\Api\Admin\BrandController;
use App\Http\Controllers\Api\Admin\CategoryController;
use App\Http\Controllers\Api\Admin\ProductController;
use App\Http\Controllers\Api\Admin\UserController;
use App\Http\Controllers\Api\Admin\OrderController;
use App\Http\Controllers\Api\Admin\InventoryController;
use App\Http\Controllers\Api\Admin\PromotionController;
use App\Http\Controllers\Api\Admin\RatingController;
use App\Http\Controllers\Api\Admin\SettingController;

/*
|--------------------------------------------------------------------------
| API Routes - Hệ thống quản trị Dynova Sport Shop
|--------------------------------------------------------------------------
*/

// Nhóm các Route Admin (Tự động có tiền tố /api/admin)
Route::prefix('admin')->group(function () {
    
    // Module cốt lõi
    Route::apiResource('banners', BannerController::class);
    Route::apiResource('brands', BrandController::class);
    Route::apiResource('categories', CategoryController::class);
    Route::apiResource('products', ProductController::class);
    
    // Module mới bổ sung (Đã kết nối trực tiếp qua Controller)
    Route::apiResource('users', UserController::class);
    Route::apiResource('orders', OrderController::class);
    Route::apiResource('inventory', InventoryController::class);
    Route::apiResource('promotions', PromotionController::class);
    Route::apiResource('ratings', RatingController::class);
    
    // Cấu hình hệ thống (Settings)
    Route::get('settings', [SettingController::class, 'index']);
    Route::post('settings', [SettingController::class, 'store']);
});