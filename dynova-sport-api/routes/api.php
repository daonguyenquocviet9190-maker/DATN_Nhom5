<?php

use Illuminate\Support\Facades\Route;

// Sử dụng bí danh (alias) để tránh xung đột giữa Controller User và Admin
use App\Http\Controllers\Api as Client;
use App\Http\Controllers\Api\Admin as Admin;

/*
|--------------------------------------------------------------------------
| API ROUTES - CLIENT SIDE
|--------------------------------------------------------------------------
*/

// Auth
Route::post('/auth/register', [Client\AuthController::class, 'register']);
Route::post('/auth/login', [Client\AuthController::class, 'login']);
Route::post('/auth/forgot-password', [Client\AuthController::class, 'forgotPassword']);
Route::post('/auth/reset-password', [Client\AuthController::class, 'resetPassword']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [Client\AuthController::class, 'logout']);
    Route::get('/auth/me', [Client\AuthController::class, 'me']);
});

// Public
Route::get('/home', [Client\HomeController::class, 'index']);
Route::get('/products', [Client\ProductController::class, 'index']);
Route::get('/products/{id}', [Client\ProductController::class, 'show']);
Route::get('/categories', [Client\CategoryController::class, 'index']);
Route::get('/banners', [Client\BannerController::class, 'index']);
Route::get('/brands', [Client\BrandController::class, 'index']);
Route::get('/reviews', [Client\ReviewController::class, 'index']);
Route::post('/shipping/fee', [Client\ShippingController::class, 'fee']);
Route::post('/payments/create', [Client\PaymentController::class, 'create']);

// Private Client
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/profile', [Client\ProfileController::class, 'show']);
    Route::put('/profile', [Client\ProfileController::class, 'update']);
    Route::put('/profile/password', [Client\ProfileController::class, 'updatePassword']);
    Route::post('/profile/avatar', [Client\ProfileController::class, 'uploadAvatar']);

    Route::post('/orders', [Client\OrderController::class, 'store']);
    Route::get('/orders', [Client\OrderController::class, 'myOrders']);
    Route::get('/orders/{id}', [Client\OrderController::class, 'show']);
    Route::post('/orders/{id}/cancel', [Client\OrderController::class, 'cancel']);
    Route::post('/orders/{id}/reorder', [Client\OrderController::class, 'reorder']);

    Route::post('/reviews', [Client\ReviewController::class, 'store']);
    Route::get('/my-reviews', [Client\ReviewController::class, 'myReviews']);
    Route::put('/reviews/{id}', [Client\ReviewController::class, 'update']);
    Route::delete('/reviews/{id}', [Client\ReviewController::class, 'destroy']);

    Route::get('/wishlist', [Client\WishlistController::class, 'index']);
    Route::post('/wishlist', [Client\WishlistController::class, 'store']);
    Route::post('/wishlist/toggle', [Client\WishlistController::class, 'toggle']);
    Route::delete('/wishlist/{productId}', [Client\WishlistController::class, 'destroy']);
    Route::get('/wishlist/check/{productId}', [Client\WishlistController::class, 'check']);
});

/*
|--------------------------------------------------------------------------
| API ROUTES - ADMIN SIDE
|--------------------------------------------------------------------------
*/

// Lưu ý: Hãy đảm bảo bạn đã tạo middleware 'is_admin' để bảo vệ các route này
Route::prefix('admin')->middleware(['auth:sanctum', 'is_admin'])->group(function () {
    
    Route::apiResource('banners', Admin\BannerController::class);
    Route::apiResource('brands', Admin\BrandController::class);
    Route::apiResource('categories', Admin\CategoryController::class);
    Route::apiResource('products', Admin\ProductController::class);
    Route::apiResource('users', Admin\UserController::class);
    Route::apiResource('orders', Admin\OrderController::class);
    Route::apiResource('promotions', Admin\PromotionController::class);
    Route::apiResource('ratings', Admin\RatingController::class);
    
    // Inventory (Đặt route cụ thể trước apiResource)
    Route::get('inventory/{productId}/history', [Admin\InventoryController::class, 'getHistory']);
    Route::apiResource('inventory', Admin\InventoryController::class)->only(['index', 'update']);
    
    // Settings
    Route::get('settings', [Admin\SettingController::class, 'index']);
    Route::post('settings', [Admin\SettingController::class, 'store']);
});