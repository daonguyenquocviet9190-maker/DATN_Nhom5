<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    use HasFactory;

    protected $table = 'order_items';

    protected $fillable = [
        'order_id',
        'product_id',
        'product_name',
        'price',
        'quantity',
        'color',
        'size',
    ];

    protected $casts = [
        'price' => 'float',
        'quantity' => 'integer',
    ];

    // Mối quan hệ quay lại Đơn hàng
    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    // Mối quan hệ lấy thông tin Sản phẩm
    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}