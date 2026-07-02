<?php

use Illuminate\Support\Facades\Route;
<<<<<<< HEAD

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\HomeController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\BannerController;
use App\Http\Controllers\Api\BrandController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ShippingController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\WishlistController;

/*
|--------------------------------------------------------------------------
| AUTH
|--------------------------------------------------------------------------
*/

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
});

/*
|--------------------------------------------------------------------------
| PUBLIC API
|--------------------------------------------------------------------------
*/

Route::get('/home', [HomeController::class, 'index']);

Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{id}', [ProductController::class, 'show']);

Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/banners', [BannerController::class, 'index']);
Route::get('/brands', [BrandController::class, 'index']);

/*
|--------------------------------------------------------------------------
| PUBLIC REVIEWS
|--------------------------------------------------------------------------
| Xem danh sách đánh giá không cần đăng nhập.
|--------------------------------------------------------------------------
*/

Route::get('/reviews', [ReviewController::class, 'index']);

Route::post('/shipping/fee', [ShippingController::class, 'fee']);
Route::post('/payments/create', [PaymentController::class, 'create']);

/*
|--------------------------------------------------------------------------
| PRIVATE API
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {
    /*
    |--------------------------------------------------------------------------
    | PROFILE
    |--------------------------------------------------------------------------
    */

    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::put('/profile/password', [ProfileController::class, 'updatePassword']);
    Route::post('/profile/avatar', [ProfileController::class, 'uploadAvatar']);

    /*
    |--------------------------------------------------------------------------
    | ORDERS
    |--------------------------------------------------------------------------
    */

    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders', [OrderController::class, 'myOrders']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::post('/orders/{id}/cancel', [OrderController::class, 'cancel']);
    Route::post('/orders/{id}/reorder', [OrderController::class, 'reorder']);

    /*
    |--------------------------------------------------------------------------
    | PRIVATE REVIEWS
    |--------------------------------------------------------------------------
    | Gửi, sửa, xóa, xem đánh giá của tôi cần đăng nhập.
    |--------------------------------------------------------------------------
    */

    Route::post('/reviews', [ReviewController::class, 'store']);
    Route::get('/my-reviews', [ReviewController::class, 'myReviews']);
    Route::put('/reviews/{id}', [ReviewController::class, 'update']);
    Route::delete('/reviews/{id}', [ReviewController::class, 'destroy']);

    /*
    |--------------------------------------------------------------------------
    | WISHLIST
    |--------------------------------------------------------------------------
    */

    Route::get('/wishlist', [WishlistController::class, 'index']);
    Route::post('/wishlist', [WishlistController::class, 'store']);
    Route::post('/wishlist/toggle', [WishlistController::class, 'toggle']);
    Route::delete('/wishlist/{productId}', [WishlistController::class, 'destroy']);
    Route::get('/wishlist/check/{productId}', [WishlistController::class, 'check']);
=======
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
>>>>>>> tuananhbach
});