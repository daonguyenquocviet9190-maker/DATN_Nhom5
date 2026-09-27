<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Address extends Model
{
    protected $fillable = [
        'user_id',
        'recipient_name',
        'phone',
        'province_code',
        'province',
        'district_code',
        'district',
        'ward_code',
        'ward',
        'address_line',
        'is_default',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'province_code' => 'integer',
        'district_code' => 'integer',
        'is_default' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
