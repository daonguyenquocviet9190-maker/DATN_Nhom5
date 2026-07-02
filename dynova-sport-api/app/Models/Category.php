<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
<<<<<<< HEAD
    protected $fillable = [
        'name',
        'slug',
        'description',
        'image',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function products()
    {
        return $this->hasMany(Product::class);
    }
=======
    protected $table = 'categories'; 
    protected $primaryKey = 'id';
    protected $guarded = [];
    public $timestamps = false; 
>>>>>>> tuananhbach
}