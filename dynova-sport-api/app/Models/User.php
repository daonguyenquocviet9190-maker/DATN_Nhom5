<?php

namespace App\Models;

<<<<<<< HEAD
=======
use Illuminate\Database\Eloquent\Factories\HasFactory;
>>>>>>> tuananhbach
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
<<<<<<< HEAD
    use HasApiTokens, Notifiable;

    protected $fillable = [
        'name',
=======
    use HasFactory, Notifiable;

    // Chỉ định chính xác bảng users trong DB
    protected $table = 'users';

    // Cho phép lưu các trường dữ liệu tương ứng cấu hình MySQL
    protected $fillable = [
        'role_id',
>>>>>>> tuananhbach
        'full_name',
        'email',
        'phone',
        'role',
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
<<<<<<< HEAD
=======

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'role_id' => 'integer',
    ];
>>>>>>> tuananhbach
}