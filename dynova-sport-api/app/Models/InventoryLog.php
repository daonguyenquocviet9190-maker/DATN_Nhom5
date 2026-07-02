<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryLog extends Model
{
    protected $table = 'inventory_logs';

    protected $fillable = ['product_id', 'user_id', 'change_quantity', 'type', 'note'];

    // Chỉ dùng created_at và updated_at nếu bảng của bạn có cả 2 cột này
    public $timestamps = true; 

    // Ép kiểu dữ liệu cho log
    protected $casts = [
        'change_quantity' => 'integer',
        'product_id'      => 'integer',
    ];

    // Liên kết ngược lại với sản phẩm (nếu cần lấy thông tin sản phẩm từ log)
    public function product() 
    {
        return $this->belongsTo(\App\Models\Product::class, 'product_id', 'id');
    }
}