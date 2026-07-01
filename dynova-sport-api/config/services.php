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
    'ghtk' => [
    'base_url' => env('GHTK_BASE_URL', 'https://services.giaohangtietkiem.vn'),
    'token' => env('GHTK_TOKEN'),
    'partner_code' => env('GHTK_PARTNER_CODE'),
    'pick_province' => env('GHTK_PICK_PROVINCE', 'Hồ Chí Minh'),
    'pick_district' => env('GHTK_PICK_DISTRICT', 'Quận 12'),
    ],

    'payment' => [
        'online_enabled' => env('PAYMENT_ONLINE_ENABLED', false),
    ],

];
