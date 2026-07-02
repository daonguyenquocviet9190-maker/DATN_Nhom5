<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{

    protected $fillable = [
        'category_id',
        'brand_id',
        'name',
        'slug',
        'brand',
        'short_description',
        'description',
        'image',
        'price',
        'compare_price',
        'rating',
        'sold',
        'status',
        'is_featured',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'compare_price' => 'decimal:2',
        'rating' => 'decimal:1',
        'is_featured' => 'boolean',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function brandInfo()
    {
        return $this->belongsTo(Brand::class, 'brand_id');
    }

    public function variants()
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    protected $table = 'products'; 
    protected $primaryKey = 'id';
    protected $guarded = [];
    public $timestamps = false; 

}