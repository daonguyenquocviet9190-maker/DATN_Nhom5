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

// ... (các dòng use phía trên giữ nguyên)

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
    Route::get('inventory/{productId}/history', [App\Http\Controllers\Api\Admin\InventoryController::class, 'getHistory']);
    Route::apiResource('inventory', App\Http\Controllers\Api\Admin\InventoryController::class);
    
    // --- KHU VỰC KHO HÀNG (Inventory) ---
    
    // 1. Đặt route cụ thể lên TRƯỚC resource để tránh bị hiểu nhầm là {id}
    Route::get('inventory/{productId}/history', [InventoryController::class, 'getHistory']);
    
    // 2. Chỉ cho phép index (danh sách) và update (cập nhật)
    Route::apiResource('inventory', InventoryController::class)->only(['index', 'update']);
    
    // ------------------------------------
    
    // Cấu hình hệ thống
    Route::get('settings', [SettingController::class, 'index']);
    Route::post('settings', [SettingController::class, 'store']);
});