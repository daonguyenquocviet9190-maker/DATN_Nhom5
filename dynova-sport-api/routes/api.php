<?php

use App\Http\Controllers\Api\Admin\AdminChatController;
use App\Http\Controllers\Api\Admin\AdminDashboardController;
use App\Http\Controllers\Api\Admin\AdminProductController;
use App\Http\Controllers\Api\Admin\AdminSettingsController;
use App\Http\Controllers\Api\Admin\AdminSimpleController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BannerController;
use App\Http\Controllers\Api\BrandController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\HomeController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\ShippingController;
use App\Http\Controllers\Api\VoucherController;
use App\Http\Controllers\Api\WishlistController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });
});

/*
|--------------------------------------------------------------------------
| Public
|--------------------------------------------------------------------------
*/

Route::get('/home', [HomeController::class, 'index']);

Route::get('/products', [ProductController::class, 'index']);

Route::get(
    '/products/{id}',
    [ProductController::class, 'show']
)->whereNumber('id');

Route::get('/categories', [CategoryController::class, 'index']);

Route::get('/brands', [BrandController::class, 'index']);

Route::get('/banners', [BannerController::class, 'index']);

Route::get('/settings', [SettingsController::class, 'show']);

Route::post('/contact', [ContactController::class, 'store']);

Route::get('/reviews', [ReviewController::class, 'index']);

Route::get('/vouchers', [VoucherController::class, 'index']);

Route::post(
    '/vouchers/apply',
    [VoucherController::class, 'applyVoucher']
);

/*
|--------------------------------------------------------------------------
| Shipping
|--------------------------------------------------------------------------
*/

Route::get(
    '/shipping/status',
    [ShippingController::class, 'status']
);

Route::get(
    '/shipping/provinces',
    [ShippingController::class, 'provinces']
);

Route::get(
    '/shipping/districts',
    [ShippingController::class, 'districts']
);

Route::get(
    '/shipping/wards',
    [ShippingController::class, 'wards']
);

Route::get(
    '/shipping/services',
    [ShippingController::class, 'services']
);

Route::post(
    '/shipping/fee',
    [ShippingController::class, 'fee']
);

/*
|--------------------------------------------------------------------------
| GHN Webhook
|--------------------------------------------------------------------------
*/

Route::post(
    '/webhooks/ghn/{secret}',
    [ShippingController::class, 'webhook']
);

/*
|--------------------------------------------------------------------------
| SePay
|--------------------------------------------------------------------------
|
| Webhook: SePay -> Laravel
| QR Demo: Điện thoại -> Laravel
|
| QR demo KHÔNG yêu cầu đăng nhập.
| Không đặt route này vào auth/admin group.
|
*/

Route::post(
    '/payments/sepay/webhook',
    [PaymentController::class, 'sepayWebhook']
);

Route::get(
    '/payments/sepay/scan/{id}/{token}',
    [PaymentController::class, 'sepayScan']
);

/*
|--------------------------------------------------------------------------
| VNPAY
|--------------------------------------------------------------------------
| Giữ route legacy để không ảnh hưởng backend cũ.
*/

Route::get(
    '/payments/vnpay/return',
    [PaymentController::class, 'vnpayReturn']
);

Route::get(
    '/payments/vnpay/ipn',
    [PaymentController::class, 'vnpayIpn']
);

/*
|--------------------------------------------------------------------------
| Authenticated user
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Profile
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/profile',
        [ProfileController::class, 'show']
    );

    Route::put(
        '/profile',
        [ProfileController::class, 'update']
    );

    Route::put(
        '/profile/password',
        [ProfileController::class, 'updatePassword']
    );

    Route::post(
        '/profile/avatar',
        [ProfileController::class, 'uploadAvatar']
    );

    /*
    |--------------------------------------------------------------------------
    | Cart
    |--------------------------------------------------------------------------
    */

    Route::prefix('cart')->group(function () {
        Route::get(
            '/',
            [CartController::class, 'index']
        );

        Route::post(
            '/items',
            [CartController::class, 'store']
        );

        Route::post(
            '/merge',
            [CartController::class, 'merge']
        );

        Route::patch(
            '/items/{cartItem}',
            [CartController::class, 'update']
        )->whereNumber('cartItem');

        Route::delete(
            '/items/{cartItem}',
            [CartController::class, 'destroy']
        )->whereNumber('cartItem');

        Route::delete(
            '/',
            [CartController::class, 'clear']
        );
    });

    /*
    |--------------------------------------------------------------------------
    | Orders
    |--------------------------------------------------------------------------
    */

    Route::post(
        '/orders',
        [OrderController::class, 'store']
    );

    Route::get(
        '/orders',
        [OrderController::class, 'index']
    );

    Route::get(
        '/my-orders',
        [OrderController::class, 'myOrders']
    );

    Route::get(
        '/orders/{id}',
        [OrderController::class, 'show']
    )->whereNumber('id');

    Route::get(
        '/orders/{id}/tracking',
        [OrderController::class, 'tracking']
    )->whereNumber('id');

    Route::post(
        '/orders/{id}/cancel',
        [OrderController::class, 'cancel']
    )->whereNumber('id');

    Route::post(
        '/orders/{id}/reorder',
        [OrderController::class, 'reorder']
    )->whereNumber('id');

    /*
    |--------------------------------------------------------------------------
    | Payment
    |--------------------------------------------------------------------------
    */

    Route::post(
        '/payments/create',
        [PaymentController::class, 'create']
    );

    Route::get(
        '/payments/sepay/orders/{id}',
        [PaymentController::class, 'sepayStatus']
    )->whereNumber('id');

    Route::post(
        '/payments/sepay/orders/{id}/refresh',
        [PaymentController::class, 'refreshSepay']
    )->whereNumber('id');

    /*
    |--------------------------------------------------------------------------
    | Chat
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/chat',
        [ChatController::class, 'show']
    );

    Route::post(
        '/chat/messages',
        [ChatController::class, 'send']
    );

    /*
    |--------------------------------------------------------------------------
    | Reviews
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/reviews/eligibility',
        [ReviewController::class, 'eligibility']
    );

    Route::post(
        '/reviews',
        [ReviewController::class, 'store']
    );

    Route::get(
        '/my-reviews',
        [ReviewController::class, 'myReviews']
    );

    Route::put(
        '/reviews/{id}',
        [ReviewController::class, 'update']
    )->whereNumber('id');

    Route::delete(
        '/reviews/{id}',
        [ReviewController::class, 'destroy']
    )->whereNumber('id');

    /*
    |--------------------------------------------------------------------------
    | Wishlist
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/wishlist',
        [WishlistController::class, 'index']
    );

    Route::post(
        '/wishlist',
        [WishlistController::class, 'store']
    );

    Route::post(
        '/wishlist/toggle',
        [WishlistController::class, 'toggle']
    );

    Route::delete(
        '/wishlist/{productId}',
        [WishlistController::class, 'destroy']
    )->whereNumber('productId');

    Route::get(
        '/wishlist/check/{productId}',
        [WishlistController::class, 'check']
    )->whereNumber('productId');
});

/*
|--------------------------------------------------------------------------
| Admin
|--------------------------------------------------------------------------
*/

Route::middleware([
    'auth:sanctum',
    'admin',
])->prefix('admin')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Dashboard
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/dashboard',
        [AdminDashboardController::class, 'index']
    );

    /*
    |--------------------------------------------------------------------------
    | Product
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/product-options',
        [AdminProductController::class, 'options']
    );

    Route::get(
        '/products',
        [AdminProductController::class, 'index']
    );

    Route::post(
        '/products',
        [AdminProductController::class, 'store']
    );

    Route::get(
        '/products/{id}',
        [AdminProductController::class, 'show']
    )->whereNumber('id');

    Route::put(
        '/products/{id}',
        [AdminProductController::class, 'update']
    )->whereNumber('id');

    Route::delete(
        '/products/{id}',
        [AdminProductController::class, 'destroy']
    )->whereNumber('id');

    /*
    |--------------------------------------------------------------------------
    | Categories
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/categories',
        [AdminSimpleController::class, 'categories']
    );

    Route::post(
        '/categories',
        [AdminSimpleController::class, 'storeCategory']
    );

    Route::put(
        '/categories/{id}',
        [AdminSimpleController::class, 'updateCategory']
    )->whereNumber('id');

    Route::delete(
        '/categories/{id}',
        [AdminSimpleController::class, 'deleteCategory']
    )->whereNumber('id');

    /*
    |--------------------------------------------------------------------------
    | Brands
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/brands',
        [AdminSimpleController::class, 'brands']
    );

    Route::post(
        '/brands',
        [AdminSimpleController::class, 'storeBrand']
    );

    Route::put(
        '/brands/{id}',
        [AdminSimpleController::class, 'updateBrand']
    )->whereNumber('id');

    Route::delete(
        '/brands/{id}',
        [AdminSimpleController::class, 'deleteBrand']
    )->whereNumber('id');

    /*
    |--------------------------------------------------------------------------
    | Orders
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/orders',
        [AdminSimpleController::class, 'orders']
    );

    Route::get(
        '/orders/{id}',
        [AdminSimpleController::class, 'showOrder']
    )->whereNumber('id');

    Route::patch(
        '/orders/{id}/status',
        [AdminSimpleController::class, 'updateOrderStatus']
    )->whereNumber('id');

    Route::post(
        '/orders/{id}/shipping/sync',
        [AdminSimpleController::class, 'syncOrderShipping']
    )->whereNumber('id');

    /*
    |--------------------------------------------------------------------------
    | Customers
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/customers',
        [AdminSimpleController::class, 'customers']
    );

    Route::patch(
        '/customers/{id}/status',
        [AdminSimpleController::class, 'updateCustomerStatus']
    )->whereNumber('id');

    /*
    |--------------------------------------------------------------------------
    | Banners
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/banners',
        [AdminSimpleController::class, 'banners']
    );

    Route::post(
        '/banners',
        [AdminSimpleController::class, 'storeBanner']
    );

    Route::post(
        '/banners/{id}',
        [AdminSimpleController::class, 'updateBanner']
    )->whereNumber('id');

    Route::delete(
        '/banners/{id}',
        [AdminSimpleController::class, 'deleteBanner']
    )->whereNumber('id');

    /*
    |--------------------------------------------------------------------------
    | Contact
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/contact-messages',
        [ContactController::class, 'index']
    );

    Route::patch(
        '/contact-messages/{id}',
        [ContactController::class, 'update']
    )->whereNumber('id');

    /*
    |--------------------------------------------------------------------------
    | Admin Chat
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/chat',
        [AdminChatController::class, 'index']
    );

    Route::get(
        '/chat/{id}',
        [AdminChatController::class, 'show']
    )->whereNumber('id');

    Route::post(
        '/chat/{id}/messages',
        [AdminChatController::class, 'send']
    )->whereNumber('id');

    Route::patch(
        '/chat/{id}/status',
        [AdminChatController::class, 'updateStatus']
    )->whereNumber('id');

    /*
    |--------------------------------------------------------------------------
    | Settings
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/settings',
        [AdminSettingsController::class, 'show']
    );

    Route::put(
        '/settings',
        [AdminSettingsController::class, 'update']
    );

    /*
    |--------------------------------------------------------------------------
    | Inventory
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/inventory',
        [AdminSimpleController::class, 'inventory']
    );

    /*
    |--------------------------------------------------------------------------
    | Promotions
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/promotions',
        [AdminSimpleController::class, 'promotions']
    );

    Route::post(
        '/promotions',
        [AdminSimpleController::class, 'storePromotion']
    );

    Route::put(
        '/promotions/{id}',
        [AdminSimpleController::class, 'updatePromotion']
    )->whereNumber('id');

    Route::delete(
        '/promotions/{id}',
        [AdminSimpleController::class, 'deletePromotion']
    )->whereNumber('id');

    /*
    |--------------------------------------------------------------------------
    | Ratings
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/ratings',
        [AdminSimpleController::class, 'ratings']
    );

    Route::patch(
        '/ratings/{id}/status',
        [AdminSimpleController::class, 'updateRatingStatus']
    )->whereNumber('id');

    Route::delete(
        '/ratings/{id}',
        [AdminSimpleController::class, 'deleteRating']
    )->whereNumber('id');
});