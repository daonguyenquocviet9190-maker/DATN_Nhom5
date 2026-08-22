<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],
    'ghn' => [
        'environment' => strtolower((string) env('GHN_ENV', 'staging')),
        'base_url' => env('GHN_BASE_URL'),
        'staging_base_url' => 'https://dev-online-gateway.ghn.vn',
        'production_base_url' => 'https://online-gateway.ghn.vn',

        'production_enabled' => filter_var(env('GHN_PRODUCTION_ENABLED', false), FILTER_VALIDATE_BOOL),

        'token' => env('GHN_TOKEN'),
        'shop_id' => env('GHN_SHOP_ID'),
        'client_id' => env('GHN_CLIENT_ID'),
        'from_district_id' => env('GHN_FROM_DISTRICT_ID'),
        'from_ward_code' => env('GHN_FROM_WARD_CODE'),
        'service_type_id' => env('GHN_SERVICE_TYPE_ID', 2),
        'payment_type_id' => env('GHN_PAYMENT_TYPE_ID', 1),
        'required_note' => env('GHN_REQUIRED_NOTE', 'CHOXEMHANGKHONGTHU'),
        'default_item_weight' => env('GHN_DEFAULT_ITEM_WEIGHT', 300),
        'default_length' => env('GHN_DEFAULT_LENGTH', 20),
        'default_width' => env('GHN_DEFAULT_WIDTH', 15),
        'default_height' => env('GHN_DEFAULT_HEIGHT', 10),
        'max_insurance_value' => env('GHN_MAX_INSURANCE_VALUE', 500000),
        'timeout' => env('GHN_TIMEOUT', 30),
        'connect_timeout' => env('GHN_CONNECT_TIMEOUT', 10),
        'verify_ssl' => filter_var(env('GHN_VERIFY_SSL', true), FILTER_VALIDATE_BOOL),
        'webhook_secret' => env('GHN_WEBHOOK_SECRET'),
        'simulation_auto_start' => filter_var(env('GHN_SIMULATION_AUTO_START', true), FILTER_VALIDATE_BOOL),
        'simulation_duration_seconds' => env('GHN_SIMULATION_DURATION_SECONDS', 240),
        'simulation_speed' => env('GHN_SIMULATION_SPEED', 1),
    ],


    'vietqr' => [
        'environment' => strtolower((string) env('VIETQR_ENV', 'demo')),
        'image_base_url' => env('VIETQR_IMAGE_BASE_URL', 'https://img.vietqr.io/image'),

        // DATN/local demo: QR encodes a signed URL. Scanning that URL simulates
        // a provider callback and never creates a real bank transfer.
        'demo_scan_enabled' => filter_var(
            env('VIETQR_DEMO_SCAN_ENABLED', env('APP_ENV', 'local') !== 'production'),
            FILTER_VALIDATE_BOOL
        ),
        'demo_scan_base_url' => env('VIETQR_DEMO_SCAN_BASE_URL'),
        'demo_qr_image_url' => env('VIETQR_DEMO_QR_IMAGE_URL', 'https://quickchart.io/qr'),
        'demo_scan_secret' => env('VIETQR_DEMO_SCAN_SECRET'),

        // Keep webhook config for a future real payment-provider integration.
        'webhook_secret' => env('VIETQR_WEBHOOK_SECRET'),
    ],

    'vnpay' => [
        'tmn_code' => env('VNPAY_TMN_CODE'),
        'hash_secret' => env('VNPAY_HASH_SECRET'),
        'url' => env('VNPAY_URL', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'),
        'return_url' => env('VNPAY_RETURN_URL'),
        'frontend_url' => env('FRONTEND_URL', 'http://localhost:3000'),
    ],

    'payment' => [
        'online_enabled' => env('PAYMENT_ONLINE_ENABLED', false),
    ],

];