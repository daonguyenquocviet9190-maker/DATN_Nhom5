<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    // Chỉ định chính xác bảng users trong DB
    protected $table = 'users';

    // Cho phép lưu các trường dữ liệu tương ứng cấu hình MySQL
    protected $fillable = [
        'role_id',
        'full_name',
        'email',
        'password',
        'phone',
        'address',
        'avatar',
        'status',
        'email_verified_at'
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'role_id' => 'integer',
    ];
}