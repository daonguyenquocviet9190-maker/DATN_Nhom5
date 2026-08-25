<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Voucher extends Model
{
    use HasFactory;

    protected $table = 'vouchers';

    protected $fillable = [
        'code',
        'title',
        'description',
        'discount_type',
        'discount_value',
        'min_order_value',
        'max_discount',
        'usage_limit',
        'per_user_limit',
        'used_count',
        'start_date',
        'end_date',
        'is_active',
    ];

    protected $casts = [
        'discount_value' => 'float',
        'min_order_value' => 'float',
        'max_discount' => 'float',
        'is_active' => 'boolean',
    ];
}