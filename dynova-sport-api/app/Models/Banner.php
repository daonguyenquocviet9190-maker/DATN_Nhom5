<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Banner extends Model
{

    protected $fillable = [
        'title',
        'subtitle',
        'description',
        'image_url',
        'cta_text',
        'cta_link',
        'secondary_text',
        'secondary_link',
        'position',
        'is_active',
        'sort_order',
        'start_at',
        'end_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'start_at' => 'datetime',
        'end_at' => 'datetime',
    ];

    protected $table = 'banners'; // Xác định chính xác tên bảng
    protected $primaryKey = 'id'; // Khóa chính (đổi nếu bảng của bạn dùng tên khác)
    protected $guarded = [];
    public $timestamps = false;   // Tắt timestamps nếu bảng không có cột created_at/updated_at

}