<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    // Cho phép mass assignment các trường này (thay đổi tên cột trùng với database của bạn)
    protected $fillable = [
        'user_id',
        'total_price',
        'status',
        'note',
        'phone',
        'address',
        'payment_method'
    ];

    /**
     * Mối quan hệ: Một Đơn hàng thì thuộc về Một Người dùng (Khách hàng)
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Mối quan hệ: Một Đơn hàng có Nhiều Sản phẩm chi tiết (Order Items)
     */
    public function items()
    {
        return $this->hasMany(OrderItem::class, 'order_id');
    }
}