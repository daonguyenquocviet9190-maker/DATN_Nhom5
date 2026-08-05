<?php

use App\Http\Controllers\Api\CartController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')
    ->prefix('cart')
    ->group(function () {
        Route::get('/', [
            CartController::class,
            'index',
        ]);

        Route::post('/items', [
            CartController::class,
            'store',
        ]);

        Route::post('/merge', [
            CartController::class,
            'merge',
        ]);

        Route::patch('/items/{cartItem}', [
            CartController::class,
            'update',
        ]);

        Route::delete('/items/{cartItem}', [
            CartController::class,
            'destroy',
        ]);

        Route::delete('/', [
            CartController::class,
            'clear',
        ]);
    });