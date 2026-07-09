<?php

use Illuminate\Support\Facades\Route;

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
use App\Http\Controllers\Api\Admin\AdminSimpleController;

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
});

Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
    Route::get('/dashboard', [AdminSimpleController::class, 'dashboard']);

    Route::get('/products', [AdminSimpleController::class, 'products']);
    Route::post('/products', [AdminSimpleController::class, 'storeProduct']);
    Route::put('/products/{id}', [AdminSimpleController::class, 'updateProduct']);
    Route::delete('/products/{id}', [AdminSimpleController::class, 'deleteProduct']);

    Route::get('/categories', [AdminSimpleController::class, 'categories']);
    Route::post('/categories', [AdminSimpleController::class, 'storeCategory']);
    Route::put('/categories/{id}', [AdminSimpleController::class, 'updateCategory']);
    Route::delete('/categories/{id}', [AdminSimpleController::class, 'deleteCategory']);

    Route::get('/brands', [AdminSimpleController::class, 'brands']);
    Route::post('/brands', [AdminSimpleController::class, 'storeBrand']);
    Route::put('/brands/{id}', [AdminSimpleController::class, 'updateBrand']);
    Route::delete('/brands/{id}', [AdminSimpleController::class, 'deleteBrand']);

    Route::get('/orders', [AdminSimpleController::class, 'orders']);
    // Route::patch('/orders/{id}/status', [AdminSimpleController::class, 'updateOrderStatus']);
    Route::get('/orders/{id}', [AdminSimpleController::class, 'showOrder']);
    Route::patch('/orders/{id}/status', [AdminSimpleController::class, 'updateOrderStatus']);

    Route::get('/customers', [AdminSimpleController::class, 'customers']);
    Route::patch('/customers/{id}/status', [AdminSimpleController::class, 'updateCustomerStatus']);

    Route::get('/banners', [AdminSimpleController::class, 'banners']);
    Route::post('/banners', [AdminSimpleController::class, 'storeBanner']);
    Route::put('/banners/{id}', [AdminSimpleController::class, 'updateBanner']);
    Route::delete('/banners/{id}', [AdminSimpleController::class, 'deleteBanner']);

    Route::get('/settings', [AdminSimpleController::class, 'settings']);
    Route::put('/settings', [AdminSimpleController::class, 'updateSettings']);

    Route::get('/inventory', [AdminSimpleController::class, 'inventory']);
    Route::get('/promotions', [AdminSimpleController::class, 'promotions']);
    Route::get('/ratings', [AdminSimpleController::class, 'ratings']);
});