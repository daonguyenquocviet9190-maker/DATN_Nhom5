<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Promotion extends Model
{
    // Ép Model trỏ chính xác vào bảng vouchers trong Database của bạn
    protected $table = 'vouchers'; 

    // Cho phép Laravel ghi dữ liệu hàng loạt vào các cột này
    protected $fillable = [
        'code',
        'title',
        'description',
        'discount_type',
        'discount_value',
        'min_order_value',
        'max_discount',
        'usage_limit',
        'used_count',
        'start_date',
        'end_date',
        'is_active'
    ];

    // Tự động ép kiểu dữ liệu khi trả về JSON cho Front-end dễ xử lý
    protected $casts = [
        'discount_value' => 'float',
        'min_order_value' => 'float',
        'max_discount' => 'float',
        'usage_limit' => 'integer',
        'used_count' => 'integer',
        'is_active' => 'integer',
    ];
}