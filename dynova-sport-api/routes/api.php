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

Route::prefix('admin')->group(function () {
    
    // Module cốt lõi
    Route::apiResource('banners', BannerController::class);
    Route::apiResource('brands', BrandController::class);
    Route::apiResource('categories', CategoryController::class);
    Route::apiResource('products', ProductController::class);
    Route::apiResource('users', UserController::class);
    Route::apiResource('orders', OrderController::class);
    Route::apiResource('promotions', PromotionController::class);
    Route::apiResource('ratings', RatingController::class);
    
    // Module Kho hàng (Inventory) - Tối ưu hóa cho tính năng Lịch sử
    // Loại bỏ các route không dùng (show, destroy, store) để bảo mật
    Route::apiResource('inventory', InventoryController::class)->except(['show', 'destroy', 'store']);
    
    // Route riêng để xem lịch sử xuất nhập kho (Khắc phục lỗi 404 trước đó)
    Route::get('inventory/{productId}/history', [InventoryController::class, 'getHistory']);
    
    // Cấu hình hệ thống
    Route::get('settings', [SettingController::class, 'index']);
    Route::post('settings', [SettingController::class, 'store']);
});