<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Inventory extends Model
{
    protected $table = 'inventory';
    protected $fillable = ['product_id', 'quantity_on_hand', 'min_stock_level'];

    // Kết nối với bảng Product để lấy tên sản phẩm
    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}