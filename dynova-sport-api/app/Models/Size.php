<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Size extends Model
{
    use HasFactory;

    protected $table = 'sizes';

    protected $fillable = [
        'name',
        'type',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'sort_order' => 'integer',
        'is_active' => 'boolean',
    ];

    public function variants(): HasMany
    {
        return $this->hasMany(
            ProductVariant::class,
            'size_id',
            'id'
        );
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }
}
