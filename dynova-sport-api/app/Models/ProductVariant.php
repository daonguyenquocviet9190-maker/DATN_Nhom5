<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductVariant extends Model
{
    use HasFactory;

    protected $table = 'product_variants';

    protected $fillable = [
        'product_id',
        'size_id',
        'color_id',
        'sku',
        'price',
        'discount_price',
        'stock',
        'image',
        'is_active',
    ];

    protected $casts = [
        'product_id' => 'integer',
        'size_id' => 'integer',
        'color_id' => 'integer',
        'price' => 'decimal:2',
        'discount_price' => 'decimal:2',
        'stock' => 'integer',
        'is_active' => 'boolean',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(
            Product::class,
            'product_id',
            'id'
        );
    }

    public function size(): BelongsTo
    {
        return $this->belongsTo(
            Size::class,
            'size_id',
            'id'
        );
    }

    public function color(): BelongsTo
    {
        return $this->belongsTo(
            Color::class,
            'color_id',
            'id'
        );
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }
}
