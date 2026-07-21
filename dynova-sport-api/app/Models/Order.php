<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $table = 'orders';

    protected $fillable = [
        'user_id',
        'order_number',
        'full_name',
        'email',
        'phone',
        'address',
        'note',
        'subtotal',
        'discount_amount',
        'shipping_fee',
        'total_amount',
        'voucher_code',
        'payment_method',
        'status',
    ];

    protected $casts = [
        'subtotal' => 'float',
        'discount_amount' => 'float',
        'shipping_fee' => 'float',
        'total_amount' => 'float',
    ];

    // Mối quan hệ: Một đơn hàng có nhiều chi tiết sản phẩm (OrderItems)
    public function orderItems()
    {
        return $this->hasMany(OrderItem::class, 'order_id');
    }

    // Mối quan hệ: Đơn hàng thuộc về 1 người dùng (nếu có đăng nhập)
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}