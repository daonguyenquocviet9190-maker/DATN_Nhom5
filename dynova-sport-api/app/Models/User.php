<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    // Cần khai báo đủ các Traits này để hệ thống hoạt động chính xác
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Tên bảng trong database (mặc định là 'users', bạn có thể giữ nguyên nếu không đổi)
     */
    protected $table = 'users';

    /**
     * Các trường có thể gán dữ liệu hàng loạt
     */
    protected $fillable = [
        'role_id',
        'full_name',
        'email',
        'phone',
        'role',
        'password',
        'address',
        'avatar',
        'status',
        'email_verified_at'
    ];

    /**
     * Các trường cần ẩn khi trả về JSON (để bảo mật)
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Ép kiểu dữ liệu (Casting)
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed', // Tự động hash password khi lưu
        'role_id' => 'integer',
    ];
}