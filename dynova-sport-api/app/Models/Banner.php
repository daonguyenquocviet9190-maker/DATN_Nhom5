<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Banner extends Model
{
    protected $table = 'banners'; // Xác định chính xác tên bảng
    protected $primaryKey = 'id'; // Khóa chính (đổi nếu bảng của bạn dùng tên khác)
    protected $guarded = [];
    public $timestamps = false;   // Tắt timestamps nếu bảng không có cột created_at/updated_at
}