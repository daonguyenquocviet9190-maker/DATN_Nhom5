<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryLog extends Model
{
    protected $table = 'inventory_logs';
    protected $fillable = ['product_id', 'change_quantity', 'type', 'note'];
    public $timestamps = true; // Đảm bảo Laravel tự động lưu created_at
}