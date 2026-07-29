<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AdminProductController extends Controller
{
    private function checkAdmin(Request $request): ?JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn cần đăng nhập.',
            ], 401);
        }

        $roleName = null;

        if (isset($user->role) && is_string($user->role)) {
            $roleName = $user->role;
        }

        if (!$roleName && isset($user->role_id) && Schema::hasTable('roles')) {
            $roleName = DB::table('roles')
                ->where('id', $user->role_id)
                ->value('name');
        }

        if (strtolower((string) $roleName) !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không có quyền quản lý sản phẩm.',
            ], 403);
        }

        return null;
    }

    private function ensureSchema(): ?JsonResponse
    {
        $requiredTables = [
            'products',
            'product_variants',
            'categories',
            'brands',
            'sizes',
            'colors',
        ];

        $missing = array_values(array_filter(
            $requiredTables,
            fn (string $table) => !Schema::hasTable($table)
        ));

        if ($missing) {
            return response()->json([
                'success' => false,
                'message' => 'Cơ sở dữ liệu chưa đủ bảng để quản lý biến thể.',
                'missing_tables' => $missing,
            ], 422);
        }

        return null;
    }

    private function columns(string $table): array
    {
        return Schema::hasTable($table)
            ? Schema::getColumnListing($table)
            : [];
    }

    private function filterColumns(string $table, array $data): array
    {
        $columns = $this->columns($table);
        $payload = [];

        foreach ($data as $key => $value) {
            if ($key === 'id' || !in_array($key, $columns, true)) {
                continue;
            }

            $payload[$key] = $value;
        }

        if (in_array('updated_at', $columns, true)) {
            $payload['updated_at'] = now();
        }

        return $payload;
    }

    private function addCreatedAt(string $table, array $payload): array
    {
        $columns = $this->columns($table);

        if (in_array('created_at', $columns, true)) {
            $payload['created_at'] = now();
        }

        if (in_array('updated_at', $columns, true)) {
            $payload['updated_at'] = now();
        }

        return $payload;
    }

    private function boolValue(mixed $value): int
    {
        return in_array(
            $value,
            [1, '1', true, 'true', 'on', 'yes'],
            true
        ) ? 1 : 0;
    }

    private function nullableId(mixed $value): ?int
    {
        if ($value === null || $value === '' || $value === 0 || $value === '0') {
            return null;
        }

        return (int) $value;
    }

    private function nullableMoney(mixed $value): ?float
    {
        if ($value === null || $value === '') {
            return null;
        }

        return (float) $value;
    }

    private function storeImage(Request $request, string $field): ?string
    {
        if (!$request->hasFile($field)) {
            return null;
        }

        $path = $request->file($field)->store('products', 'public');

        return basename($path);
    }

    private function storeVariantFile(mixed $file): ?string
    {
        if (!$file || !method_exists($file, 'store')) {
            return null;
        }

        $path = $file->store('products', 'public');

        return basename($path);
    }

    private function decodeVariants(Request $request): array
    {
        $raw = $request->input('variants', []);

        if (is_string($raw)) {
            $decoded = json_decode($raw, true);

            if (!is_array($decoded)) {
                throw ValidationException::withMessages([
                    'variants' => ['Dữ liệu biến thể không đúng định dạng JSON.'],
                ]);
            }

            $raw = $decoded;
        }

        if (!is_array($raw)) {
            throw ValidationException::withMessages([
                'variants' => ['Danh sách biến thể không hợp lệ.'],
            ]);
        }

        return array_values(array_map(function ($variant) {
            $variant = is_array($variant) ? $variant : [];

            return [
                'id' => $this->nullableId($variant['id'] ?? null),
                'size_id' => $this->nullableId($variant['size_id'] ?? null),
                'color_id' => $this->nullableId($variant['color_id'] ?? null),
                'sku' => trim((string) ($variant['sku'] ?? '')),
                'price' => $variant['price'] ?? null,
                'discount_price' => $this->nullableMoney(
                    $variant['discount_price'] ?? null
                ),
                'stock' => $variant['stock'] ?? 0,
                'image' => trim((string) (
                    $variant['existing_image']
                    ?? $variant['image']
                    ?? ''
                )),
                'is_active' => $this->boolValue(
                    $variant['is_active'] ?? true
                ),
                'upload_key' => (string) (
                    $variant['upload_key']
                    ?? $variant['client_key']
                    ?? ''
                ),
            ];
        }, $raw));
    }

    private function validatePayload(
        Request $request,
        array $variants,
        ?int $productId = null
    ): array {
        $input = array_merge($request->all(), [
            'variants' => $variants,
        ]);

        $slugRule = Rule::unique('products', 'slug');

        if ($productId) {
            $slugRule->ignore($productId);
        }

        $status = strtolower(trim((string) ($input['status'] ?? 'draft')));

        $variantRules = ['array', 'max:300'];

        if ($status !== 'draft') {
            $variantRules[] = 'min:1';
        }

        $validator = Validator::make($input, [
            'name' => ['required', 'string', 'max:220'],
            'slug' => ['nullable', 'string', 'max:240', $slugRule],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'brand_id' => ['nullable', 'integer', 'exists:brands,id'],
            'short_description' => ['nullable', 'string', 'max:1000'],
            'description' => ['nullable', 'string'],
            'status' => ['required', Rule::in(['active', 'inactive', 'draft'])],
            'is_featured' => ['nullable'],
            'image' => ['nullable', 'image', 'max:6144'],

            'variants' => $variantRules,
            'variants.*.id' => ['nullable', 'integer'],
            'variants.*.size_id' => ['nullable', 'integer', 'exists:sizes,id'],
            'variants.*.color_id' => ['nullable', 'integer', 'exists:colors,id'],
            'variants.*.sku' => ['required', 'string', 'max:180'],
            'variants.*.price' => ['required', 'numeric', 'min:1'],
            'variants.*.discount_price' => ['nullable', 'numeric', 'min:0'],
            'variants.*.stock' => ['required', 'integer', 'min:0', 'max:1000000'],
            'variants.*.is_active' => ['required'],
            'variants.*.image' => ['nullable', 'string', 'max:600'],
            'variants.*.upload_key' => ['nullable', 'string', 'max:100'],
        ], [
            'name.required' => 'Vui lòng nhập tên sản phẩm.',
            'category_id.required' => 'Vui lòng chọn danh mục.',
            'category_id.exists' => 'Danh mục không tồn tại.',
            'brand_id.exists' => 'Thương hiệu không tồn tại.',
            'status.in' => 'Trạng thái sản phẩm không hợp lệ.',
            'image.image' => 'Ảnh sản phẩm phải là tệp hình ảnh.',
            'image.max' => 'Ảnh sản phẩm tối đa 6 MB.',
            'variants.required' => 'Sản phẩm phải có ít nhất một biến thể.',
            'variants.min' => 'Sản phẩm phải có ít nhất một biến thể.',
            'variants.max' => 'Một sản phẩm chỉ được tối đa 300 biến thể.',
            'variants.*.sku.required' => 'Mỗi biến thể phải có SKU.',
            'variants.*.price.required' => 'Mỗi biến thể phải có giá.',
            'variants.*.price.min' => 'Giá biến thể phải lớn hơn 0.',
            'variants.*.stock.required' => 'Mỗi biến thể phải có tồn kho.',
            'variants.*.stock.min' => 'Tồn kho không được âm.',
        ]);

        $validator->after(function ($validator) use ($variants, $productId, $status) {
            $combinationKeys = [];
            $skuKeys = [];
            $activeCount = 0;

            foreach ($variants as $index => $variant) {
                $price = (float) ($variant['price'] ?? 0);
                $discount = $variant['discount_price'];

                if (
                    $discount !== null
                    && (float) $discount > 0
                    && (float) $discount >= $price
                ) {
                    $validator->errors()->add(
                        "variants.$index.discount_price",
                        'Giá giảm phải nhỏ hơn giá gốc.'
                    );
                }

                $combinationKey = sprintf(
                    '%s-%s',
                    $variant['color_id'] ?? 'none',
                    $variant['size_id'] ?? 'none'
                );

                if (isset($combinationKeys[$combinationKey])) {
                    $validator->errors()->add(
                        "variants.$index.size_id",
                        'Bị trùng tổ hợp màu sắc và kích thước.'
                    );
                }

                $combinationKeys[$combinationKey] = true;

                $skuKey = mb_strtolower(trim((string) $variant['sku']));

                if (isset($skuKeys[$skuKey])) {
                    $validator->errors()->add(
                        "variants.$index.sku",
                        'SKU bị trùng trong danh sách biến thể.'
                    );
                }

                $skuKeys[$skuKey] = true;

                if ((int) ($variant['is_active'] ?? 0) === 1) {
                    $activeCount++;
                }

                $skuQuery = DB::table('product_variants')
                    ->where('sku', $variant['sku']);

                if (!empty($variant['id'])) {
                    $skuQuery->where('id', '<>', $variant['id']);
                }

                if ($skuQuery->exists()) {
                    $validator->errors()->add(
                        "variants.$index.sku",
                        'SKU này đã được sử dụng bởi biến thể khác.'
                    );
                }

                if (!empty($variant['id'])) {
                    if (!$productId) {
                        $validator->errors()->add(
                            "variants.$index.id",
                            'Không được gắn ID biến thể cũ khi tạo sản phẩm mới.'
                        );
                    } else {
                        $belongsQuery = DB::table('product_variants')
                            ->where('id', $variant['id'])
                            ->where('product_id', $productId);

                        if (!$belongsQuery->exists()) {
                            $validator->errors()->add(
                                "variants.$index.id",
                                'Biến thể không thuộc sản phẩm đang cập nhật.'
                            );
                        }
                    }
                }
            }

            if ($status === 'active' && $activeCount === 0) {
                $validator->errors()->add(
                    'variants',
                    'Sản phẩm đang bán phải có ít nhất một biến thể hoạt động.'
                );
            }
        });

        return $validator->validate();
    }

    private function productStatsSubQuery()
    {
        return DB::table('product_variants')
            ->select([
                'product_id',
                DB::raw('COUNT(id) as variant_count'),
                DB::raw('SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_variant_count'),
                DB::raw('COALESCE(SUM(CASE WHEN is_active = 1 THEN stock ELSE 0 END), 0) as total_stock'),
                DB::raw(
                    'MIN(CASE WHEN is_active = 1 THEN '
                    . 'CASE WHEN discount_price IS NOT NULL AND discount_price > 0 AND discount_price < price '
                    . 'THEN discount_price ELSE price END END) as price_min'
                ),
                DB::raw(
                    'MAX(CASE WHEN is_active = 1 THEN price END) as price_max'
                ),
            ])
            ->groupBy('product_id');
    }

    private function productQuery()
    {
        return DB::table('products as p')
            ->leftJoin('categories as c', 'c.id', '=', 'p.category_id')
            ->leftJoin('brands as b', 'b.id', '=', 'p.brand_id')
            ->leftJoinSub(
                $this->productStatsSubQuery(),
                'vs',
                fn ($join) => $join->on('vs.product_id', '=', 'p.id')
            )
            ->select([
                'p.*',
                'c.name as category_name',
                'c.slug as category_slug',
                'b.name as brand_name',
                'b.slug as brand_slug',
                DB::raw('COALESCE(vs.variant_count, 0) as variant_count'),
                DB::raw('COALESCE(vs.active_variant_count, 0) as active_variant_count'),
                DB::raw('COALESCE(vs.total_stock, 0) as total_stock'),
                DB::raw('COALESCE(vs.price_min, p.price, 0) as price_min'),
                DB::raw('COALESCE(vs.price_max, p.price, 0) as price_max'),
            ]);
    }

    private function variantQuery(int $productId)
    {
        return DB::table('product_variants as pv')
            ->leftJoin('sizes as s', 's.id', '=', 'pv.size_id')
            ->leftJoin('colors as c', 'c.id', '=', 'pv.color_id')
            ->where('pv.product_id', $productId)
            ->select([
                'pv.*',
                's.name as size_name',
                's.type as size_type',
                'c.name as color_name',
                'c.code as color_code',
                'c.hex as color_hex',
            ])
            ->orderByRaw('COALESCE(c.sort_order, 999999)')
            ->orderByRaw('COALESCE(s.sort_order, 999999)')
            ->orderBy('pv.id');
    }

    private function detailData(int $productId): ?object
    {
        $product = $this->productQuery()
            ->where('p.id', $productId)
            ->first();

        if (!$product) {
            return null;
        }

        $variants = $this->variantQuery($productId)
            ->get()
            ->map(function ($variant) {
                $variant->id = (int) $variant->id;
                $variant->product_id = (int) $variant->product_id;
                $variant->size_id = $variant->size_id !== null
                    ? (int) $variant->size_id
                    : null;
                $variant->color_id = $variant->color_id !== null
                    ? (int) $variant->color_id
                    : null;
                $variant->price = (float) $variant->price;
                $variant->discount_price = $variant->discount_price !== null
                    ? (float) $variant->discount_price
                    : null;
                $variant->stock = (int) $variant->stock;
                $variant->is_active = (bool) $variant->is_active;

                $variant->size = $variant->size_id
                    ? [
                        'id' => $variant->size_id,
                        'name' => $variant->size_name,
                        'type' => $variant->size_type,
                    ]
                    : null;

                $variant->color = $variant->color_id
                    ? [
                        'id' => $variant->color_id,
                        'name' => $variant->color_name,
                        'code' => $variant->color_code,
                        'hex' => $variant->color_hex,
                    ]
                    : null;

                return $variant;
            });

        $product->id = (int) $product->id;
        $product->variant_count = (int) $product->variant_count;
        $product->active_variant_count = (int) $product->active_variant_count;
        $product->total_stock = (int) $product->total_stock;
        $product->price_min = (float) $product->price_min;
        $product->price_max = (float) $product->price_max;
        $product->variants = $variants;
        $product->product_variants = $variants;

        return $product;
    }

    private function effectivePrice(array $variant): float
    {
        $price = (float) ($variant['price'] ?? 0);
        $discount = (float) ($variant['discount_price'] ?? 0);

        if ($discount > 0 && $discount < $price) {
            return $discount;
        }

        return $price;
    }

    private function syncProductBaseFromVariants(int $productId): void
    {
        $activeVariants = DB::table('product_variants')
            ->where('product_id', $productId)
            ->where('is_active', 1)
            ->get();

        if ($activeVariants->isEmpty()) {
            return;
        }

        $prices = $activeVariants
            ->map(function ($variant) {
                $price = (float) ($variant->price ?? 0);
                $discount = (float) ($variant->discount_price ?? 0);

                return $discount > 0 && $discount < $price
                    ? $discount
                    : $price;
            })
            ->filter(fn ($price) => $price > 0);

        $payload = [];

        if (
            Schema::hasColumn('products', 'price')
            && $prices->isNotEmpty()
        ) {
            $payload['price'] = $prices->min();
        }

        if (
            Schema::hasColumn('products', 'image')
            && !DB::table('products')->where('id', $productId)->value('image')
        ) {
            $firstImage = $activeVariants
                ->pluck('image')
                ->filter()
                ->first();

            if ($firstImage) {
                $payload['image'] = $firstImage;
            }
        }

        if ($payload) {
            if (Schema::hasColumn('products', 'updated_at')) {
                $payload['updated_at'] = now();
            }

            DB::table('products')
                ->where('id', $productId)
                ->update($payload);
        }
    }

    private function variantUsedInOrders(int $variantId): bool
    {
        if (!Schema::hasTable('order_items')) {
            return false;
        }

        foreach (['product_variant_id', 'variant_id'] as $column) {
            if (
                Schema::hasColumn('order_items', $column)
                && DB::table('order_items')->where($column, $variantId)->exists()
            ) {
                return true;
            }
        }

        return false;
    }

    private function removeVariantFromCarts(int $variantId): void
    {
        if (!Schema::hasTable('cart_items')) {
            return;
        }

        foreach (['product_variant_id', 'variant_id'] as $column) {
            if (Schema::hasColumn('cart_items', $column)) {
                DB::table('cart_items')
                    ->where($column, $variantId)
                    ->delete();
            }
        }
    }

    private function syncVariants(
        int $productId,
        array $variants,
        Request $request
    ): void {
        $existingIds = DB::table('product_variants')
            ->where('product_id', $productId)
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();

        $keptIds = [];
        $variantFiles = $request->file('variant_images', []);

        if (!is_array($variantFiles)) {
            $variantFiles = [];
        }

        foreach ($variants as $variant) {
            $uploadKey = (string) ($variant['upload_key'] ?? '');
            $image = $variant['image'] ?: null;

            if (
                $uploadKey !== ''
                && array_key_exists($uploadKey, $variantFiles)
            ) {
                $image = $this->storeVariantFile($variantFiles[$uploadKey]);
            }

            $payload = [
                'product_id' => $productId,
                'size_id' => $variant['size_id'],
                'color_id' => $variant['color_id'],
                'sku' => $variant['sku'],
                'price' => (float) $variant['price'],
                'discount_price' => $variant['discount_price'],
                'stock' => max(0, (int) $variant['stock']),
                'image' => $image,
                'is_active' => (int) $variant['is_active'],
            ];

            if (!empty($variant['id'])) {
                $variantId = (int) $variant['id'];

                DB::table('product_variants')
                    ->where('id', $variantId)
                    ->where('product_id', $productId)
                    ->update(
                        $this->filterColumns('product_variants', $payload)
                    );

                $keptIds[] = $variantId;
                continue;
            }

            $insert = $this->addCreatedAt(
                'product_variants',
                $this->filterColumns('product_variants', $payload)
            );

            $keptIds[] = (int) DB::table('product_variants')
                ->insertGetId($insert);
        }

        $removedIds = array_values(array_diff($existingIds, $keptIds));

        foreach ($removedIds as $variantId) {
            $this->removeVariantFromCarts($variantId);

            if ($this->variantUsedInOrders($variantId)) {
                $payload = [
                    'stock' => 0,
                    'is_active' => 0,
                ];

                if (Schema::hasColumn('product_variants', 'updated_at')) {
                    $payload['updated_at'] = now();
                }

                DB::table('product_variants')
                    ->where('id', $variantId)
                    ->update($payload);

                continue;
            }

            DB::table('product_variants')
                ->where('id', $variantId)
                ->delete();
        }

        $this->syncProductBaseFromVariants($productId);
    }

    private function productReferencedByOrders(int $productId): bool
    {
        return Schema::hasTable('order_items')
            && Schema::hasColumn('order_items', 'product_id')
            && DB::table('order_items')
                ->where('product_id', $productId)
                ->exists();
    }

    public function index(Request $request): JsonResponse
    {
        if ($deny = $this->checkAdmin($request)) {
            return $deny;
        }

        if ($schemaError = $this->ensureSchema()) {
            return $schemaError;
        }

        $perPage = min(
            100,
            max(5, (int) $request->input('per_page', 12))
        );

        $page = max(1, (int) $request->input('page', 1));
        $query = $this->productQuery();

        if ($request->filled('search')) {
            $keyword = trim((string) $request->input('search'));

            $query->where(function ($builder) use ($keyword) {
                $builder
                    ->where('p.name', 'like', "%{$keyword}%")
                    ->orWhere('p.slug', 'like', "%{$keyword}%")
                    ->orWhere('b.name', 'like', "%{$keyword}%")
                    ->orWhere('c.name', 'like', "%{$keyword}%");

                if (ctype_digit($keyword)) {
                    $builder->orWhere('p.id', (int) $keyword);
                }
            });
        }

        if ($request->filled('category_id')) {
            $query->where('p.category_id', $request->input('category_id'));
        }

        if ($request->filled('brand_id')) {
            $query->where('p.brand_id', $request->input('brand_id'));
        }

        if ($request->filled('status')) {
            $query->where('p.status', $request->input('status'));
        }

        $paginator = $query
            ->orderByDesc('p.id')
            ->paginate($perPage, ['*'], 'page', $page);

        $items = collect($paginator->items())
            ->map(function ($product) {
                $product->id = (int) $product->id;
                $product->variant_count = (int) $product->variant_count;
                $product->active_variant_count = (int) $product->active_variant_count;
                $product->total_stock = (int) $product->total_stock;
                $product->price_min = (float) $product->price_min;
                $product->price_max = (float) $product->price_max;

                return $product;
            })
            ->values();

        $variantStats = $this->productStatsSubQuery();

        $lowStockProducts = DB::query()
            ->fromSub($variantStats, 'variant_stats')
            ->where('variant_stats.total_stock', '>', 0)
            ->where('variant_stats.total_stock', '<=', 10)
            ->count();

        $stats = [
            'total_products' => DB::table('products')->count(),
            'active_products' => DB::table('products')
                ->where('status', 'active')
                ->count(),
            'total_variants' => DB::table('product_variants')->count(),
            'low_stock_products' => $lowStockProducts,
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'products' => $items,
                'items' => $items,
                'stats' => $stats,
                'pagination' => [
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                    'from' => $paginator->firstItem() ?? 0,
                    'to' => $paginator->lastItem() ?? 0,
                ],
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        if ($deny = $this->checkAdmin($request)) {
            return $deny;
        }

        if ($schemaError = $this->ensureSchema()) {
            return $schemaError;
        }

        $product = $this->detailData($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy sản phẩm.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $product,
            'product' => $product,
        ]);
    }

    public function options(Request $request): JsonResponse
    {
        if ($deny = $this->checkAdmin($request)) {
            return $deny;
        }

        if ($schemaError = $this->ensureSchema()) {
            return $schemaError;
        }

        $sizes = DB::table('sizes')
            ->orderBy('type')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(function ($size) {
                $size->id = (int) $size->id;
                $size->is_active = (bool) $size->is_active;

                return $size;
            });

        $colors = DB::table('colors')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(function ($color) {
                $color->id = (int) $color->id;
                $color->is_active = (bool) $color->is_active;

                return $color;
            });

        return response()->json([
            'success' => true,
            'data' => [
                'sizes' => $sizes,
                'colors' => $colors,
            ],
            'sizes' => $sizes,
            'colors' => $colors,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        if ($deny = $this->checkAdmin($request)) {
            return $deny;
        }

        if ($schemaError = $this->ensureSchema()) {
            return $schemaError;
        }

        $variants = $this->decodeVariants($request);
        $validated = $this->validatePayload($request, $variants);

        $productId = DB::transaction(function () use (
            $request,
            $validated,
            $variants
        ) {
            $image = $this->storeImage($request, 'image');

            $slug = trim((string) ($validated['slug'] ?? ''));

            if ($slug === '') {
                $slug = Str::slug($validated['name']);
            }

            $baseSlug = $slug ?: 'san-pham';
            $candidateSlug = $baseSlug;
            $suffix = 1;

            while (DB::table('products')->where('slug', $candidateSlug)->exists()) {
                $candidateSlug = $baseSlug . '-' . $suffix;
                $suffix++;
            }

            $basePrice = collect($variants)
                ->filter(fn ($variant) => (int) $variant['is_active'] === 1)
                ->map(fn ($variant) => $this->effectivePrice($variant))
                ->filter(fn ($price) => $price > 0)
                ->min() ?? 0;

            $payload = [
                'name' => trim($validated['name']),
                'slug' => $candidateSlug,
                'category_id' => (int) $validated['category_id'],
                'brand_id' => $this->nullableId($validated['brand_id'] ?? null),
                'short_description' => $validated['short_description'] ?? null,
                'description' => $validated['description'] ?? null,
                'image' => $image,
                'price' => $basePrice,
                'status' => $validated['status'],
                'is_featured' => $this->boolValue(
                    $validated['is_featured'] ?? false
                ),
            ];

            $productId = (int) DB::table('products')->insertGetId(
                $this->addCreatedAt(
                    'products',
                    $this->filterColumns('products', $payload)
                )
            );

            $this->syncVariants($productId, $variants, $request);

            return $productId;
        });

        $product = $this->detailData($productId);

        return response()->json([
            'success' => true,
            'message' => 'Đã tạo sản phẩm và toàn bộ biến thể.',
            'data' => $product,
            'product' => $product,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        if ($deny = $this->checkAdmin($request)) {
            return $deny;
        }

        if ($schemaError = $this->ensureSchema()) {
            return $schemaError;
        }

        $existingProduct = DB::table('products')->where('id', $id)->first();

        if (!$existingProduct) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy sản phẩm.',
            ], 404);
        }

        $variants = $this->decodeVariants($request);
        $validated = $this->validatePayload($request, $variants, $id);

        DB::transaction(function () use (
            $request,
            $validated,
            $variants,
            $existingProduct,
            $id
        ) {
            $image = $this->storeImage($request, 'image');

            $slug = trim((string) ($validated['slug'] ?? ''));

            if ($slug === '') {
                $slug = Str::slug($validated['name']) ?: 'san-pham-' . $id;
            }

            $payload = [
                'name' => trim($validated['name']),
                'slug' => $slug,
                'category_id' => (int) $validated['category_id'],
                'brand_id' => $this->nullableId($validated['brand_id'] ?? null),
                'short_description' => $validated['short_description'] ?? null,
                'description' => $validated['description'] ?? null,
                'status' => $validated['status'],
                'is_featured' => $this->boolValue(
                    $validated['is_featured'] ?? false
                ),
            ];

            if ($image) {
                $payload['image'] = $image;
            }

            DB::table('products')
                ->where('id', $id)
                ->update(
                    $this->filterColumns('products', $payload)
                );

            $this->syncVariants($id, $variants, $request);
        });

        $product = $this->detailData($id);

        return response()->json([
            'success' => true,
            'message' => 'Đã cập nhật sản phẩm và đồng bộ biến thể.',
            'data' => $product,
            'product' => $product,
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        if ($deny = $this->checkAdmin($request)) {
            return $deny;
        }

        if ($schemaError = $this->ensureSchema()) {
            return $schemaError;
        }

        $product = DB::table('products')->where('id', $id)->first();

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy sản phẩm.',
            ], 404);
        }

        if ($this->productReferencedByOrders($id)) {
            DB::transaction(function () use ($id) {
                $productPayload = ['status' => 'inactive'];

                if (Schema::hasColumn('products', 'updated_at')) {
                    $productPayload['updated_at'] = now();
                }

                DB::table('products')
                    ->where('id', $id)
                    ->update($productPayload);

                $variantPayload = [
                    'stock' => 0,
                    'is_active' => 0,
                ];

                if (Schema::hasColumn('product_variants', 'updated_at')) {
                    $variantPayload['updated_at'] = now();
                }

                DB::table('product_variants')
                    ->where('product_id', $id)
                    ->update($variantPayload);

                if (
                    Schema::hasTable('cart_items')
                    && Schema::hasColumn('cart_items', 'product_id')
                ) {
                    DB::table('cart_items')
                        ->where('product_id', $id)
                        ->delete();
                }

                if (
                    Schema::hasTable('wishlists')
                    && Schema::hasColumn('wishlists', 'product_id')
                ) {
                    DB::table('wishlists')
                        ->where('product_id', $id)
                        ->delete();
                }
            });

            return response()->json([
                'success' => true,
                'archived' => true,
                'message' => 'Sản phẩm đã có trong đơn hàng nên hệ thống chuyển sang trạng thái tạm ngừng.',
            ]);
        }

        DB::transaction(function () use ($id) {
            foreach (['cart_items', 'wishlists', 'reviews'] as $table) {
                if (
                    Schema::hasTable($table)
                    && Schema::hasColumn($table, 'product_id')
                ) {
                    DB::table($table)
                        ->where('product_id', $id)
                        ->delete();
                }
            }

            DB::table('product_variants')
                ->where('product_id', $id)
                ->delete();

            DB::table('products')
                ->where('id', $id)
                ->delete();
        });

        return response()->json([
            'success' => true,
            'archived' => false,
            'message' => 'Đã xóa sản phẩm.',
        ]);
    }
}