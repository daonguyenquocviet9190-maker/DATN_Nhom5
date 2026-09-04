<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
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
        'region' => env(
            'AWS_DEFAULT_REGION',
            'us-east-1'
        ),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env(
                'SLACK_BOT_USER_OAUTH_TOKEN'
            ),
            'channel' => env(
                'SLACK_BOT_USER_DEFAULT_CHANNEL'
            ),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | GHN
    |--------------------------------------------------------------------------
    */

    'ghn' => [
        'environment' => strtolower(
            (string) env(
                'GHN_ENV',
                'staging'
            )
        ),

        'base_url' => env(
            'GHN_BASE_URL'
        ),

        'staging_base_url' =>
            'https://dev-online-gateway.ghn.vn',

        'production_base_url' =>
            'https://online-gateway.ghn.vn',

        'production_enabled' => filter_var(
            env(
                'GHN_PRODUCTION_ENABLED',
                false
            ),
            FILTER_VALIDATE_BOOL
        ),

        'token' => env(
            'GHN_TOKEN'
        ),

        'shop_id' => env(
            'GHN_SHOP_ID'
        ),

        'client_id' => env(
            'GHN_CLIENT_ID'
        ),

        'from_district_id' => env(
            'GHN_FROM_DISTRICT_ID'
        ),

        'from_ward_code' => env(
            'GHN_FROM_WARD_CODE'
        ),

        'service_type_id' => env(
            'GHN_SERVICE_TYPE_ID',
            2
        ),

        'payment_type_id' => env(
            'GHN_PAYMENT_TYPE_ID',
            1
        ),

        'required_note' => env(
            'GHN_REQUIRED_NOTE',
            'CHOXEMHANGKHONGTHU'
        ),

        'default_item_weight' => env(
            'GHN_DEFAULT_ITEM_WEIGHT',
            300
        ),

        'default_length' => env(
            'GHN_DEFAULT_LENGTH',
            20
        ),

        'default_width' => env(
            'GHN_DEFAULT_WIDTH',
            15
        ),

        'default_height' => env(
            'GHN_DEFAULT_HEIGHT',
            10
        ),

        'max_insurance_value' => env(
            'GHN_MAX_INSURANCE_VALUE',
            500000
        ),

        'timeout' => env(
            'GHN_TIMEOUT',
            30
        ),

        'connect_timeout' => env(
            'GHN_CONNECT_TIMEOUT',
            10
        ),

        'verify_ssl' => filter_var(
            env(
                'GHN_VERIFY_SSL',
                true
            ),
            FILTER_VALIDATE_BOOL
        ),

        'webhook_secret' => env(
            'GHN_WEBHOOK_SECRET'
        ),

        'simulation_auto_start' => filter_var(
            env(
                'GHN_SIMULATION_AUTO_START',
                true
            ),
            FILTER_VALIDATE_BOOL
        ),

        'simulation_duration_seconds' => env(
            'GHN_SIMULATION_DURATION_SECONDS',
            240
        ),

        'simulation_speed' => env(
            'GHN_SIMULATION_SPEED',
            1
        ),
    ],

    /*
    |--------------------------------------------------------------------------
    | VietQR
    |--------------------------------------------------------------------------
    */

    'vietqr' => [
        'environment' => strtolower(
            (string) env(
                'VIETQR_ENV',
                'development'
            )
        ),

        'image_base_url' => env(
            'VIETQR_IMAGE_BASE_URL',
            'https://img.vietqr.io/image'
        ),

        'demo_confirmation_enabled' => filter_var(
            env(
                'VIETQR_DEMO_CONFIRMATION_ENABLED',
                false
            ),
            FILTER_VALIDATE_BOOL
        ),

        'dev_auto_confirm' => filter_var(
            env(
                'VIETQR_DEV_AUTO_CONFIRM',
                false
            ),
            FILTER_VALIDATE_BOOL
        ),

        'dev_auto_confirm_seconds' => max(
            3,
            (int) env(
                'VIETQR_DEV_AUTO_CONFIRM_SECONDS',
                8
            )
        ),

        'webhook_secret' => env(
            'VIETQR_WEBHOOK_SECRET'
        ),
    ],

    /*
    |--------------------------------------------------------------------------
    | VNPAY
    |--------------------------------------------------------------------------
    | Giữ phần này để không làm vỡ route/backend cũ.
    | Checkout frontend hiện không cần sử dụng.
    */

    'vnpay' => [
        'tmn_code' => env(
            'VNPAY_TMN_CODE'
        ),

        'hash_secret' => env(
            'VNPAY_HASH_SECRET'
        ),

        'url' => env(
            'VNPAY_URL',
            'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'
        ),

        'return_url' => env(
            'VNPAY_RETURN_URL'
        ),

        'frontend_url' => env(
            'FRONTEND_URL',
            'http://localhost:3000'
        ),
    ],

    /*
    |--------------------------------------------------------------------------
    | SePay
    |--------------------------------------------------------------------------
    */

    'sepay' => [
        'enabled' => filter_var(
            env(
                'SEPAY_ENABLED',
                true
            ),
            FILTER_VALIDATE_BOOL
        ),

        'environment' => strtolower(
            (string) env(
                'SEPAY_ENV',
                'test'
            )
        ),

        // URL public để điện thoại quét QR truy cập được.
        'public_url' => env(
            'SEPAY_PUBLIC_URL',
            env('APP_URL')
        ),

        'qr_base_url' => env(
            'SEPAY_QR_BASE_URL',
            'https://vietqr.app/img'
        ),

        'bank_name' => env(
            'SEPAY_TEST_BANK_NAME',
            ''
        ),

        'bank_code' => env(
            'SEPAY_TEST_BANK_CODE',
            ''
        ),

        'account_number' => env(
            'SEPAY_TEST_ACCOUNT',
            ''
        ),

        'account_name' => env(
            'SEPAY_TEST_ACCOUNT_NAME',
            ''
        ),

        'branch' => env(
            'SEPAY_TEST_BRANCH',
            ''
        ),

        'payment_code_prefix' => env(
            'SEPAY_PAYMENT_CODE_PREFIX',
            'DNV'
        ),

        'payment_code_digits' => max(
            1,
            (int) env(
                'SEPAY_PAYMENT_CODE_DIGITS',
                7
            )
        ),

        'webhook_api_key' => env(
            'SEPAY_WEBHOOK_API_KEY',
            ''
        ),

        'webhook_secret' => env(
            'SEPAY_WEBHOOK_SECRET',
            ''
        ),

        'webhook_allow_no_auth' => filter_var(
            env(
                'SEPAY_WEBHOOK_ALLOW_NO_AUTH',
                true
            ),
            FILTER_VALIDATE_BOOL
        ),
    ],

    /*
    |--------------------------------------------------------------------------
    | Payment Sandbox / QR Demo
    |--------------------------------------------------------------------------
    */

    'payment_sandbox' => [
        'enabled' => filter_var(
            env(
                'PAYMENT_SANDBOX_ENABLED',
                false
            ),
            FILTER_VALIDATE_BOOL
        ),

        'secret' => env(
            'PAYMENT_SANDBOX_SECRET',
            ''
        ),

        'base_url' => env(
            'PAYMENT_SANDBOX_BASE_URL',
            env('APP_URL')
        ),

        'qr_image_url' => env(
            'PAYMENT_SANDBOX_QR_IMAGE_URL',
            'https://quickchart.io/qr'
        ),
    ],

    /*
    |--------------------------------------------------------------------------
    | Payment
    |--------------------------------------------------------------------------
    */

    'payment' => [
        'online_enabled' => filter_var(
            env(
                'PAYMENT_ONLINE_ENABLED',
                false
            ),
            FILTER_VALIDATE_BOOL
        ),
    ],

];