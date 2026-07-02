<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Brand extends Model
{
<<<<<<< HEAD
    protected $fillable = [
        'name',
        'slug',
        'logo',
        'description',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function products()
    {
        return $this->hasMany(Product::class);
=======
    // Xác định tên bảng trong database
    protected $table = 'brands'; 

    // Xác định khóa chính
    protected $primaryKey = 'id';

    // Cho phép gán hàng loạt các trường
    protected $guarded = [];

    // Tắt timestamps nếu bảng của bạn không có cột created_at/updated_at
    // Nếu bảng có sử dụng timestamps, hãy chuyển thành true
    public $timestamps = false; 

    // Định nghĩa kiểu dữ liệu cho các cột (Casts)
    // Giúp Laravel tự động chuyển đổi status từ số (database) sang integer (php)
    protected $casts = [
        'status' => 'integer', 
    ];

    /**
     * Khai báo quan hệ: Một thương hiệu có nhiều sản phẩm
     * (Dùng để lấy tổng số sản phẩm trong bảng quản lý)
     */
    public function products()
    {
        return $this->hasMany(Product::class, 'brand_id');
>>>>>>> tuananhbach
    }
}