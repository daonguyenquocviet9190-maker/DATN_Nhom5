<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class CartController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return $this->cartResponse(
            (int) $request->user()->id
        );
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => [
                'required',
                'integer',
            ],
            'product_variant_id' => [
                'nullable',
                'integer',
            ],
            'variant_id' => [
                'nullable',
                'integer',
            ],
            'quantity' => [
                'required',
                'integer',
                'min:1',
                'max:99',
            ],
        ], [
            'product_id.required' => 'Không xác định được sản phẩm.',
            'product_id.integer' => 'Mã sản phẩm không hợp lệ.',
            'product_variant_id.integer' => 'Mã biến thể không hợp lệ.',
            'variant_id.integer' => 'Mã biến thể không hợp lệ.',
            'quantity.required' => 'Vui lòng nhập số lượng.',
            'quantity.integer' => 'Số lượng không hợp lệ.',
            'quantity.min' => 'Số lượng tối thiểu là 1.',
            'quantity.max' => 'Số lượng tối đa mỗi lần là 99.',
        ]);

        $userId = (int) $request->user()->id;
        $productId = (int) $validated['product_id'];

        $variantId = $validated['product_variant_id']
            ?? $validated['variant_id']
            ?? null;

        $variantId = $variantId !== null
            ? (int) $variantId
            : null;

        $quantity = (int) $validated['quantity'];

        DB::transaction(function () use (
            $userId,
            $productId,
            $variantId,
            $quantity
        ) {
            $selection = $this->resolveSelection(
                $productId,
                $variantId,
                true
            );

            $existing = $this->cartItemQuery(
                $userId,
                $productId,
                $variantId
            )
                ->lockForUpdate()
                ->first();

            $currentQuantity = $existing
                ? (int) $existing->quantity
                : 0;

            $nextQuantity = $currentQuantity + $quantity;

            $this->assertStock(
                $nextQuantity,
                $selection['stock']
            );

            if ($existing) {
                DB::table('cart_items')
                    ->where('id', $existing->id)
                    ->update([
                        'quantity' => $nextQuantity,
                        'updated_at' => now(),
                    ]);

                return;
            }

            DB::table('cart_items')->insert([
                'user_id' => $userId,
                'product_id' => $productId,
                'product_variant_id' => $variantId,
                'quantity' => $nextQuantity,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });

        return $this->cartResponse(
            $userId,
            'Đã thêm sản phẩm vào giỏ hàng.'
        );
    }

    public function update(
        Request $request,
        int $cartItem
    ): JsonResponse {
        $validated = $request->validate([
            'quantity' => [
                'required',
                'integer',
                'min:1',
                'max:99',
            ],
        ], [
            'quantity.required' => 'Vui lòng nhập số lượng.',
            'quantity.integer' => 'Số lượng không hợp lệ.',
            'quantity.min' => 'Số lượng tối thiểu là 1.',
            'quantity.max' => 'Số lượng tối đa là 99.',
        ]);

        $userId = (int) $request->user()->id;
        $quantity = (int) $validated['quantity'];

        DB::transaction(function () use (
            $cartItem,
            $userId,
            $quantity
        ) {
            $item = DB::table('cart_items')
                ->where('id', $cartItem)
                ->where('user_id', $userId)
                ->lockForUpdate()
                ->first();

            if (!$item) {
                throw ValidationException::withMessages([
                    'cart_item' => [
                        'Sản phẩm không còn trong giỏ hàng.',
                    ],
                ]);
            }

            $selection = $this->resolveSelection(
                (int) $item->product_id,
                $item->product_variant_id !== null
                    ? (int) $item->product_variant_id
                    : null,
                true
            );

            $this->assertStock(
                $quantity,
                $selection['stock']
            );

            DB::table('cart_items')
                ->where('id', $item->id)
                ->where('user_id', $userId)
                ->update([
                    'quantity' => $quantity,
                    'updated_at' => now(),
                ]);
        });

        return $this->cartResponse(
            $userId,
            'Đã cập nhật số lượng.'
        );
    }

    public function destroy(
        Request $request,
        int $cartItem
    ): JsonResponse {
        $userId = (int) $request->user()->id;

        $deleted = DB::table('cart_items')
            ->where('id', $cartItem)
            ->where('user_id', $userId)
            ->delete();

        if (!$deleted) {
            throw ValidationException::withMessages([
                'cart_item' => [
                    'Sản phẩm không còn trong giỏ hàng.',
                ],
            ]);
        }

        return $this->cartResponse(
            $userId,
            'Đã xóa sản phẩm khỏi giỏ hàng.'
        );
    }

    public function clear(Request $request): JsonResponse
    {
        $userId = (int) $request->user()->id;

        DB::table('cart_items')
            ->where('user_id', $userId)
            ->delete();

        return $this->cartResponse(
            $userId,
            'Đã xóa toàn bộ giỏ hàng.'
        );
    }

    public function merge(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items' => [
                'required',
                'array',
                'max:100',
            ],
            'items.*.product_id' => [
                'required',
                'integer',
            ],
            'items.*.product_variant_id' => [
                'nullable',
                'integer',
            ],
            'items.*.variant_id' => [
                'nullable',
                'integer',
            ],
            'items.*.quantity' => [
                'required',
                'integer',
                'min:1',
                'max:99',
            ],
        ], [
            'items.required' => 'Giỏ hàng cần được gửi lên hệ thống.',
            'items.array' => 'Dữ liệu giỏ hàng không hợp lệ.',
            'items.*.product_id.required' => 'Có sản phẩm không hợp lệ.',
            'items.*.quantity.required' => 'Có sản phẩm thiếu số lượng.',
        ]);

        $userId = (int) $request->user()->id;
        $warnings = [];

        DB::transaction(function () use (
            $validated,
            $userId,
            &$warnings
        ) {
            foreach ($validated['items'] as $index => $item) {
                $productId = (int) $item['product_id'];

                $variantId = $item['product_variant_id']
                    ?? $item['variant_id']
                    ?? null;

                $variantId = $variantId !== null
                    ? (int) $variantId
                    : null;

                $quantity = max(
                    1,
                    (int) $item['quantity']
                );

                try {
                    $selection = $this->resolveSelection(
                        $productId,
                        $variantId,
                        true
                    );

                    $existing = $this->cartItemQuery(
                        $userId,
                        $productId,
                        $variantId
                    )
                        ->lockForUpdate()
                        ->first();

                    $currentQuantity = $existing
                        ? (int) $existing->quantity
                        : 0;

                    $desiredQuantity =
                        $currentQuantity + $quantity;

                    $nextQuantity = min(
                        $desiredQuantity,
                        (int) $selection['stock']
                    );

                    if ($nextQuantity <= 0) {
                        $warnings[] = [
                            'index' => $index,
                            'product_id' => $productId,
                            'message' => 'Sản phẩm đã hết hàng.',
                        ];

                        continue;
                    }

                    if ($nextQuantity < $desiredQuantity) {
                        $warnings[] = [
                            'index' => $index,
                            'product_id' => $productId,
                            'message' => 'Số lượng đã được điều chỉnh theo tồn kho.',
                        ];
                    }

                    if ($existing) {
                        DB::table('cart_items')
                            ->where('id', $existing->id)
                            ->update([
                                'quantity' => $nextQuantity,
                                'updated_at' => now(),
                            ]);

                        continue;
                    }

                    DB::table('cart_items')->insert([
                        'user_id' => $userId,
                        'product_id' => $productId,
                        'product_variant_id' => $variantId,
                        'quantity' => $nextQuantity,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                } catch (ValidationException $exception) {
                    $message = collect(
                        $exception->errors()
                    )
                        ->flatten()
                        ->first();

                    $warnings[] = [
                        'index' => $index,
                        'product_id' => $productId,
                        'message' => $message
                            ?: 'Không thể đồng bộ sản phẩm.',
                    ];
                }
            }
        });

        return $this->cartResponse(
            $userId,
            'Đã đồng bộ giỏ hàng.',
            [
                'warnings' => $warnings,
            ]
        );
    }

    private function resolveSelection(
        int $productId,
        ?int $variantId,
        bool $lock = false
    ): array {
        $productQuery = DB::table('products')
            ->where('id', $productId);

        if ($lock) {
            $productQuery->lockForUpdate();
        }

        $product = $productQuery->first();

        if (!$product) {
            throw ValidationException::withMessages([
                'product_id' => [
                    'Sản phẩm không tồn tại.',
                ],
            ]);
        }

        if (!$this->productIsActive($product)) {
            throw ValidationException::withMessages([
                'product_id' => [
                    'Sản phẩm hiện đã ngừng bán.',
                ],
            ]);
        }

        $variantQuery = DB::table('product_variants')
            ->where('product_id', $productId);

        if (
            Schema::hasColumn(
                'product_variants',
                'is_active'
            )
        ) {
            $variantQuery->where('is_active', 1);
        }

        $activeVariantCount = $variantQuery->count();

        if ($variantId !== null) {
            $selectedVariantQuery =
                DB::table('product_variants')
                    ->where('id', $variantId)
                    ->where('product_id', $productId);

            if ($lock) {
                $selectedVariantQuery->lockForUpdate();
            }

            $variant = $selectedVariantQuery->first();

            if (!$variant) {
                throw ValidationException::withMessages([
                    'product_variant_id' => [
                        'Biến thể không thuộc sản phẩm này.',
                    ],
                ]);
            }

            if (!$this->variantIsActive($variant)) {
                throw ValidationException::withMessages([
                    'product_variant_id' => [
                        'Biến thể này hiện đã ngừng bán.',
                    ],
                ]);
            }

            return [
                'product' => $product,
                'variant' => $variant,
                'stock' => max(
                    0,
                    (int) ($variant->stock ?? 0)
                ),
            ];
        }

        if ($activeVariantCount > 0) {
            throw ValidationException::withMessages([
                'product_variant_id' => [
                    'Vui lòng chọn đầy đủ màu sắc và kích thước.',
                ],
            ]);
        }

        if (
            !Schema::hasColumn(
                'products',
                'stock'
            )
        ) {
            throw ValidationException::withMessages([
                'product_variant_id' => [
                    'Sản phẩm chưa được cấu hình biến thể và tồn kho.',
                ],
            ]);
        }

        return [
            'product' => $product,
            'variant' => null,
            'stock' => max(
                0,
                (int) ($product->stock ?? 0)
            ),
        ];
    }

    private function cartItemQuery(
        int $userId,
        int $productId,
        ?int $variantId
    ) {
        $query = DB::table('cart_items')
            ->where('user_id', $userId)
            ->where('product_id', $productId);

        if ($variantId === null) {
            $query->whereNull('product_variant_id');
        } else {
            $query->where(
                'product_variant_id',
                $variantId
            );
        }

        return $query;
    }

    private function assertStock(
        int $quantity,
        int $stock
    ): void {
        if ($stock <= 0) {
            throw ValidationException::withMessages([
                'quantity' => [
                    'Biến thể này hiện đã hết hàng.',
                ],
            ]);
        }

        if ($quantity > $stock) {
            throw ValidationException::withMessages([
                'quantity' => [
                    "Sản phẩm chỉ còn {$stock} sản phẩm trong kho.",
                ],
            ]);
        }
    }

    private function productIsActive(object $product): bool
    {
        if (
            property_exists($product, 'status') &&
            !in_array(
                strtolower((string) $product->status),
                ['active', 'published'],
                true
            )
        ) {
            return false;
        }

        if (
            property_exists($product, 'is_active') &&
            !(bool) $product->is_active
        ) {
            return false;
        }

        return true;
    }

    private function variantIsActive(object $variant): bool
    {
        if (
            property_exists($variant, 'is_active') &&
            !(bool) $variant->is_active
        ) {
            return false;
        }

        return true;
    }

    private function cartData(int $userId): array
    {
        $productStockColumn = Schema::hasColumn(
            'products',
            'stock'
        )
            ? DB::raw('p.stock as product_stock')
            : DB::raw('NULL as product_stock');

        $rows = DB::table('cart_items as ci')
            ->join(
                'products as p',
                'p.id',
                '=',
                'ci.product_id'
            )
            ->leftJoin(
                'product_variants as pv',
                'pv.id',
                '=',
                'ci.product_variant_id'
            )
            ->leftJoin(
                'categories as category',
                'category.id',
                '=',
                'p.category_id'
            )
            ->leftJoin(
                'brands as brand',
                'brand.id',
                '=',
                'p.brand_id'
            )
            ->leftJoin(
                'sizes as size',
                'size.id',
                '=',
                'pv.size_id'
            )
            ->leftJoin(
                'colors as color',
                'color.id',
                '=',
                'pv.color_id'
            )
            ->where('ci.user_id', $userId)
            ->select([
                'ci.id as cart_item_id',
                'ci.user_id',
                'ci.product_id',
                'ci.product_variant_id',
                'ci.quantity',
                'ci.created_at',
                'ci.updated_at',

                'p.name as product_name',
                'p.slug as product_slug',
                'p.image as product_image',
                'p.price as product_price',
                'p.status as product_status',

                $productStockColumn,

                'category.id as category_id',
                'category.name as category_name',

                'brand.id as brand_id',
                'brand.name as brand_name',

                'pv.sku as variant_sku',
                'pv.price as variant_price',
                'pv.discount_price as variant_discount_price',
                'pv.stock as variant_stock',
                'pv.image as variant_image',
                'pv.is_active as variant_active',
                'pv.size_id',
                'pv.color_id',

                'size.name as size_name',
                'size.type as size_type',

                'color.name as color_name',
                'color.code as color_code',
                'color.hex as color_hex',
            ])
            ->orderByDesc('ci.updated_at')
            ->orderByDesc('ci.id')
            ->get();

        $items = $rows->map(function ($row) {
            $variantId =
                $row->product_variant_id !== null
                    ? (int) $row->product_variant_id
                    : null;

            $productPrice = (float) (
                $row->product_price ?? 0
            );

            $variantPrice = (float) (
                $row->variant_price ?? 0
            );

            $basePrice = $variantId !== null
                ? $variantPrice
                : $productPrice;

            if ($basePrice <= 0) {
                $basePrice = $productPrice;
            }

            $discountPrice = (float) (
                $row->variant_discount_price ?? 0
            );

            $unitPrice =
                $discountPrice > 0 &&
                $discountPrice < $basePrice
                    ? $discountPrice
                    : $basePrice;

            $stock = $variantId !== null
                ? (int) ($row->variant_stock ?? 0)
                : (int) ($row->product_stock ?? 0);

            $quantity = max(
                1,
                (int) $row->quantity
            );

            $productActive = in_array(
                strtolower(
                    (string) (
                        $row->product_status ?? 'active'
                    )
                ),
                ['active', 'published'],
                true
            );

            $variantActive =
                $variantId === null ||
                (bool) $row->variant_active;

            $image = $row->variant_image
                ?: $row->product_image;

            return [
                'id' => (int) $row->cart_item_id,
                'cart_item_id' => (int) $row->cart_item_id,
                'key' => 'server-cart-' . $row->cart_item_id,

                'user_id' => (int) $row->user_id,

                'product_id' => (int) $row->product_id,
                'productId' => (int) $row->product_id,

                'product_variant_id' => $variantId,
                'variant_id' => $variantId,
                'variantId' => $variantId,

                'name' => $row->product_name,
                'product_name' => $row->product_name,
                'slug' => $row->product_slug,

                'image' => $image,
                'image_url' => $image,
                'product_image' => $row->product_image,
                'variant_image' => $row->variant_image,

                'quantity' => $quantity,
                'stock' => $stock,
                'max_quantity' => $stock,

                'price' => round($unitPrice, 2),
                'unit_price' => round($unitPrice, 2),
                'original_price' => round($basePrice, 2),
                'discount_price' => $discountPrice > 0
                    ? round($discountPrice, 2)
                    : null,
                'line_total' => round(
                    $unitPrice * $quantity,
                    2
                ),

                'sku' => $row->variant_sku
                    ?: 'DNV-' . $row->product_id,

                'size_id' => $row->size_id !== null
                    ? (int) $row->size_id
                    : null,
                'size' => $row->size_name ?: 'Freesize',
                'size_name' => $row->size_name ?: 'Freesize',
                'size_type' => $row->size_type,

                'color_id' => $row->color_id !== null
                    ? (int) $row->color_id
                    : null,
                'color' => $row->color_name ?: 'Mặc định',
                'color_name' => $row->color_name ?: 'Mặc định',
                'color_code' => $row->color_code,
                'color_hex' => $row->color_hex,

                'category_id' => $row->category_id !== null
                    ? (int) $row->category_id
                    : null,
                'category' => $row->category_name,
                'category_name' => $row->category_name,

                'brand_id' => $row->brand_id !== null
                    ? (int) $row->brand_id
                    : null,
                'brand' => $row->brand_name,
                'brand_name' => $row->brand_name,

                'is_available' =>
                    $productActive &&
                    $variantActive &&
                    $stock > 0,

                'source' => 'server',

                'product' => [
                    'id' => (int) $row->product_id,
                    'name' => $row->product_name,
                    'slug' => $row->product_slug,
                    'image' => $row->product_image,
                    'price' => $productPrice,
                    'status' => $row->product_status,
                ],

                'variant' => $variantId !== null
                    ? [
                        'id' => $variantId,
                        'product_id' => (int) $row->product_id,
                        'sku' => $row->variant_sku,
                        'price' => $variantPrice,
                        'discount_price' => $discountPrice > 0
                            ? $discountPrice
                            : null,
                        'stock' => $stock,
                        'image' => $row->variant_image,
                        'is_active' => (bool) $row->variant_active,
                        'size_id' => $row->size_id,
                        'color_id' => $row->color_id,
                        'size' => [
                            'id' => $row->size_id,
                            'name' => $row->size_name,
                            'type' => $row->size_type,
                        ],
                        'color' => [
                            'id' => $row->color_id,
                            'name' => $row->color_name,
                            'code' => $row->color_code,
                            'hex' => $row->color_hex,
                        ],
                    ]
                    : null,
            ];
        })->values();

        $subtotal = $items->sum(function ($item) {
            return (float) $item['line_total'];
        });

        $totalQuantity = $items->sum(function ($item) {
            return (int) $item['quantity'];
        });

        return [
            'items' => $items,
            'summary' => [
                'item_count' => $items->count(),
                'total_quantity' => $totalQuantity,
                'subtotal' => round($subtotal, 2),
            ],
        ];
    }

    private function cartResponse(
        int $userId,
        ?string $message = null,
        array $extra = []
    ): JsonResponse {
        $data = $this->cartData($userId);

        $payload = [
            'success' => true,
            'data' => $data,
            'items' => $data['items'],
            'summary' => $data['summary'],
        ];

        if ($message) {
            $payload['message'] = $message;
        }

        foreach ($extra as $key => $value) {
            $payload[$key] = $value;
        }

        return response()->json($payload);
    }
}