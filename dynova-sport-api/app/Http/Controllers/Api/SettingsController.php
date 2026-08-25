<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SettingsController extends Controller
{
    public function show(): JsonResponse
    {
        $defaults = [
            'site_name' => 'Dynova Sport',
            'hotline' => null,
            'email' => null,
            'address' => null,
            'logo' => '/images/dynova-logo.jpg',
            'facebook' => null,
            'instagram' => null,
            'tiktok' => null,
            'shipping_note' => null,
            'return_policy' => null,
            'free_shipping_threshold' => 500000,
            'default_shipping_fee' => 30000,
            'return_days' => 30,
            'currency' => 'VND',
            'locale' => 'vi-VN',
            'bank_name' => null,
            'bank_code' => null,
            'bank_account_number' => null,
            'bank_account_name' => null,
            'bank_branch' => null,
        ];

        $settings = $defaults;

        if (Schema::hasTable('settings')) {
            $row = DB::table('settings')->orderBy('id')->first();
            if ($row) {
                foreach ($defaults as $key => $fallback) {
                    if (property_exists($row, $key) && $row->{$key} !== null) {
                        $settings[$key] = $row->{$key};
                    }
                }
            }
        }

        $settings['free_shipping_threshold'] = (float) $settings['free_shipping_threshold'];
        $settings['default_shipping_fee'] = (float) $settings['default_shipping_fee'];
        $settings['return_days'] = (int) $settings['return_days'];

        return response()->json([
            'success' => true,
            'data' => [
                'settings' => $settings,
            ],
        ]);
    }
}
