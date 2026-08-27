<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    protected $table = 'products';

    protected $fillable = [
        'category_id',
        'brand_id',
        'name',
        'slug',
        'short_description',
        'description',
        'image',
        'price',
        'status',
        'is_featured',
    ];

    protected $casts = [
        'category_id' => 'integer',
        'brand_id' => 'integer',
        'price' => 'decimal:2',
        'is_featured' => 'boolean',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(
            Category::class,
            'category_id',
            'id'
        );
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(
            Brand::class,
            'brand_id',
            'id'
        );
    }

    public function variants(): HasMany
    {
        return $this->hasMany(
            ProductVariant::class,
            'product_id',
            'id'
        );
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(
            Review::class,
            'product_id',
            'id'
        );
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }
}
