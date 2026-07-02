<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Brand extends Model
{
    /**
     * Tên bảng trong database
     */
    protected $table = 'brands';

    /**
     * Các trường cho phép gán dữ liệu hàng loạt (Mass Assignment)
     */
    protected $fillable = [
        'name',
        'slug',
        'logo',
        'description',
        'is_active',
        'sort_order',
    ];

    /**
     * Ép kiểu dữ liệu (Casts)
     */
    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    /**
     * Cấu hình Timestamps
     * Nếu bảng có cột created_at và updated_at, hãy để là true.
     * Nếu không có, hãy để là false.
     */
    public $timestamps = true; 

    /**
     * Quan hệ: Một thương hiệu có nhiều sản phẩm
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'brand_id');
    }
}