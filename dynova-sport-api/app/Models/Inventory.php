<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Inventory extends Model
{
    protected $table = 'inventory';

    // Các cột cho phép gán dữ liệu hàng loạt
    protected $fillable = [
        'product_id', 
        'quantity_on_hand', 
        'min_stock_level'
    ];

    // Ép kiểu dữ liệu để đảm bảo luôn là số nguyên khi truyền ra API
    protected $casts = [
        'quantity_on_hand' => 'integer',
        'min_stock_level'  => 'integer',
        'product_id'       => 'integer',
    ];

    // Tắt timestamps nếu DB của bạn tự xử lý updated_at qua trigger của MySQL
    public $timestamps = false; 

    // Liên kết với Model Product
    public function product() 
    {
        // Đảm bảo Product class tồn tại và đúng namespace
        return $this->belongsTo(\App\Models\Product::class, 'product_id', 'id');
    }
}