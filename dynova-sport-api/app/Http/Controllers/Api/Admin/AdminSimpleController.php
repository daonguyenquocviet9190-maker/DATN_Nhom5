<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\Voucher;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class AdminSimpleController extends Controller
{
    private function checkAdmin(Request $request)
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
                'message' => 'Bạn không có quyền truy cập quản trị.',
            ], 403);
        }

        return null;
    }

    private function hasTable($table)
    {
        return Schema::hasTable($table);
    }

    private function hasColumn($table, $column)
    {
        return Schema::hasTable($table) && Schema::hasColumn($table, $column);
    }

    private function columns($table)
    {
        if (!$this->hasTable($table)) return [];

        return Schema::getColumnListing($table);
    }

    private function filterData($table, array $data)
    {
        $columns = $this->columns($table);
        $payload = [];

        foreach ($data as $key => $value) {
            if ($key === 'id') continue;
            if (!in_array($key, $columns)) continue;

            $payload[$key] = $value;
        }

        if (in_array('updated_at', $columns)) {
            $payload['updated_at'] = now();
        }

        return $payload;
    }

    private function addCreateTime($table, array $payload)
    {
        $columns = $this->columns($table);

        if (in_array('created_at', $columns)) {
            $payload['created_at'] = now();
        }

        if (in_array('updated_at', $columns)) {
            $payload['updated_at'] = now();
        }

        return $payload;
    }

    private function uploadFile(Request $request, $field, $folder)
    {
        if (!$request->hasFile($field)) return null;

        $path = $request->file($field)->store($folder, 'public');

        return basename($path);
    }

    private function listResponse($key, $items, $total = null)
    {
        return response()->json([
            'success' => true,
            'data' => [
                $key => $items,
                'items' => $items,
                'total' => $total ?? count($items),
            ],
        ]);
    }

    private function emptyList($key)
    {
        return $this->listResponse($key, [], 0);
    }

    private function boolValue($value)
    {
        return in_array($value, [1, '1', true, 'true', 'on', 'yes'], true) ? 1 : 0;
    }

    private function productStockSubQuery()
    {
        if (!$this->hasTable('product_variants') || !$this->hasColumn('product_variants', 'product_id')) {
            return null;
        }

        $stockColumn = $this->hasColumn('product_variants', 'stock') ? 'stock' : null;

        if (!$stockColumn) return null;

        return DB::table('product_variants')
            ->select(
                'product_id',
                DB::raw('COUNT(*) as variant_count'),
                DB::raw('COALESCE(SUM(stock), 0) as variant_total_stock'),
                DB::raw('COALESCE(MIN(stock), 0) as variant_min_stock'),
                DB::raw('COALESCE(MAX(stock), 0) as variant_max_stock')
            )
            ->groupBy('product_id');
    }

    private function productSelectColumns()
    {
        $select = ['p.*'];

        if ($this->hasTable('categories') && $this->hasColumn('products', 'category_id')) {
            $select[] = DB::raw('c.name as category_name');
            $select[] = DB::raw('c.slug as category_slug');
        } else {
            $select[] = DB::raw('NULL as category_name');
            $select[] = DB::raw('NULL as category_slug');
        }

        if ($this->hasTable('brands') && $this->hasColumn('products', 'brand_id')) {
            $select[] = DB::raw('b.name as brand_name');
            $select[] = DB::raw('b.slug as brand_slug');
        } else {
            $select[] = DB::raw('NULL as brand_name');
            $select[] = DB::raw('NULL as brand_slug');
        }

        $select[] = DB::raw('COALESCE(vs.variant_count, 0) as variant_count');
        $select[] = DB::raw('COALESCE(vs.variant_total_stock, 0) as variant_total_stock');
        $select[] = DB::raw('COALESCE(vs.variant_min_stock, 0) as variant_min_stock');
        $select[] = DB::raw('COALESCE(vs.variant_max_stock, 0) as variant_max_stock');

        if ($this->hasColumn('products', 'stock')) {
            $select[] = DB::raw('COALESCE(p.stock, vs.variant_total_stock, 0) as total_stock');
            $select[] = DB::raw('COALESCE(p.stock, vs.variant_min_stock, 0) as min_stock');
            $select[] = DB::raw('COALESCE(p.stock, vs.variant_max_stock, 0) as max_stock');
        } else {
            $select[] = DB::raw('COALESCE(vs.variant_total_stock, 0) as total_stock');
            $select[] = DB::raw('COALESCE(vs.variant_min_stock, 0) as min_stock');
            $select[] = DB::raw('COALESCE(vs.variant_max_stock, 0) as max_stock');
        }

        return $select;
    }

    private function productQuery()
    {
        $query = DB::table('products as p');

        if ($this->hasTable('categories') && $this->hasColumn('products', 'category_id')) {
            $query->leftJoin('categories as c', 'c.id', '=', 'p.category_id');
        }

        if ($this->hasTable('brands') && $this->hasColumn('products', 'brand_id')) {
            $query->leftJoin('brands as b', 'b.id', '=', 'p.brand_id');
        }

        $stockSub = $this->productStockSubQuery();

        if ($stockSub) {
            $query->leftJoinSub($stockSub, 'vs', function ($join) {
                $join->on('vs.product_id', '=', 'p.id');
            });
        } else {
            $query->leftJoin(DB::raw('(select null as product_id, 0 as variant_count, 0 as variant_total_stock, 0 as variant_min_stock, 0 as variant_max_stock) as vs'), 'vs.product_id', '=', 'p.id');
        }

        return $query->select($this->productSelectColumns());
    }

    private function syncProductDefaultVariant($productId, Request $request)
    {
        if (!$this->hasTable('product_variants')) return;
        if (!$this->hasColumn('product_variants', 'product_id')) return;
        if (!$this->hasColumn('product_variants', 'stock')) return;

        $stock = $request->input('stock', null);

        if ($stock === null || $stock === '') return;

        $columns = $this->columns('product_variants');

        $existing = DB::table('product_variants')
            ->where('product_id', $productId)
            ->orderBy('id')
            ->first();

        $payload = [
            'stock' => max(0, (int) $stock),
        ];

        if (in_array('price', $columns) && $request->filled('price')) {
            $payload['price'] = $request->input('price');
        }

        if (in_array('updated_at', $columns)) {
            $payload['updated_at'] = now();
        }

        if ($existing) {
            DB::table('product_variants')->where('id', $existing->id)->update($payload);
            return;
        }

        $insert = [
            'product_id' => $productId,
            'stock' => max(0, (int) $stock),
        ];

        if (in_array('sku', $columns)) {
            $insert['sku'] = 'DNV-' . $productId . '-DEFAULT';
        }

        if (in_array('color', $columns)) {
            $insert['color'] = 'Mặc định';
        }

        if (in_array('size', $columns)) {
            $insert['size'] = 'Default';
        }

        if (in_array('price', $columns)) {
            $insert['price'] = $request->input('price', 0);
        }

        if (in_array('image', $columns)) {
            $insert['image'] = $request->input('image', '');
        }

        if (in_array('is_active', $columns)) {
            $insert['is_active'] = 1;
        }

        $insert = $this->addCreateTime('product_variants', $this->filterData('product_variants', $insert));

        DB::table('product_variants')->insert($insert);
    }

    public function dashboard(Request $request)
    {
        if ($deny = $this->checkAdmin($request)) return $deny;

        $productCount = $this->hasTable('products') ? DB::table('products')->count() : 0;
        $categoryCount = $this->hasTable('categories') ? DB::table('categories')->count() : 0;
        $brandCount = $this->hasTable('brands') ? DB::table('brands')->count() : 0;
        $orderCount = $this->hasTable('orders') ? DB::table('orders')->count() : 0;
        $userCount = $this->hasTable('users') ? DB::table('users')->count() : 0;

        $revenue = 0;

        if ($this->hasTable('orders')) {
            if ($this->hasColumn('orders', 'total')) {
                $revenue = DB::table('orders')->sum('total');
            } elseif ($this->hasColumn('orders', 'total_price')) {
                $revenue = DB::table('orders')->sum('total_price');
            } elseif ($this->hasColumn('orders', 'grand_total')) {
                $revenue = DB::table('orders')->sum('grand_total');
            }
        }

        $lowStock = 0;

        if ($this->hasTable('products')) {
            $lowStock = $this->productQuery()
                ->limit(500)
                ->get()
                ->filter(function ($item) {
                    return (int) ($item->total_stock ?? 0) <= 10;
                })
                ->count();
        }

        return response()->json([
            'success' => true,
            'data' => [
                'stats' => [
                    'products' => $productCount,
                    'categories' => $categoryCount,
                    'brands' => $brandCount,
                    'orders' => $orderCount,
                    'customers' => $userCount,
                    'revenue' => $revenue,
                    'low_stock' => $lowStock,
                ],
            ],
        ]);
    }

    public function products(Request $request)
    {
        if ($deny = $this->checkAdmin($request)) return $deny;
        if (!$this->hasTable('products')) return $this->emptyList('products');

        $perPage = (int) $request->input('per_page', 300);
        $search = trim((string) $request->input('search', ''));

        $query = $this->productQuery();

        if ($search && $this->hasColumn('products', 'name')) {
            $query->where('p.name', 'like', '%' . $search . '%');
        }

        if ($request->filled('category_id') && $this->hasColumn('products', 'category_id')) {
            $query->where('p.category_id', $request->input('category_id'));
        }

        if ($request->filled('brand_id') && $this->hasColumn('products', 'brand_id')) {
            $query->where('p.brand_id', $request->input('brand_id'));
        }

        if ($request->filled('status') && $this->hasColumn('products', 'status')) {
            $query->where('p.status', $request->input('status'));
        }

        $items = $query
            ->orderByDesc('p.id')
            ->limit($perPage)
            ->get();

        return $this->listResponse('products', $items, count($items));
    }

    public function storeProduct(Request $request)
    {
        if ($deny = $this->checkAdmin($request)) return $deny;
        if (!$this->hasTable('products')) return response()->json(['success' => false, 'message' => 'Bảng products chưa tồn tại.'], 404);

        $data = $request->all();

        if ($file = $this->uploadFile($request, 'image', 'products')) {
            $data['image'] = $file;
        }

        if (empty($data['slug']) && !empty($data['name']) && $this->hasColumn('products', 'slug')) {
            $data['slug'] = Str::slug($data['name']) . '-' . time();
        }

        if (isset($data['is_featured'])) {
            $data['is_featured'] = $this->boolValue($data['is_featured']);
        }

        if (isset($data['is_active'])) {
            $data['is_active'] = $this->boolValue($data['is_active']);
        }

        $payload = $this->addCreateTime('products', $this->filterData('products', $data));
        $id = DB::table('products')->insertGetId($payload);

        $this->syncProductDefaultVariant($id, $request);

        $product = $this->productQuery()->where('p.id', $id)->first();

        return response()->json([
            'success' => true,
            'message' => 'Thêm sản phẩm thành công.',
            'data' => $product,
        ]);
    }

    public function updateProduct(Request $request, $id)
    {
        if ($deny = $this->checkAdmin($request)) return $deny;
        if (!$this->hasTable('products')) return response()->json(['success' => false, 'message' => 'Bảng products chưa tồn tại.'], 404);

        $data = $request->all();

        if ($file = $this->uploadFile($request, 'image', 'products')) {
            $data['image'] = $file;
        }

        if (isset($data['is_featured'])) {
            $data['is_featured'] = $this->boolValue($data['is_featured']);
        }

        if (isset($data['is_active'])) {
            $data['is_active'] = $this->boolValue($data['is_active']);
        }

        $payload = $this->filterData('products', $data);

        if (!empty($payload)) {
            DB::table('products')->where('id', $id)->update($payload);
        }

        $this->syncProductDefaultVariant($id, $request);

        $product = $this->productQuery()->where('p.id', $id)->first();

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật sản phẩm thành công.',
            'data' => $product,
        ]);
    }

    public function deleteProduct(Request $request, $id)
    {
        if ($deny = $this->checkAdmin($request)) return $deny;

        if ($this->hasTable('order_items')) {
            DB::table('order_items')->where('product_id', $id)->delete();
        }

        if ($this->hasTable('cart_items')) {
            DB::table('cart_items')->where('product_id', $id)->delete();
        }

        if ($this->hasTable('wishlists')) {
            DB::table('wishlists')->where('product_id', $id)->delete();
        }

        if ($this->hasTable('reviews')) {
            DB::table('reviews')->where('product_id', $id)->delete();
        }

        if ($this->hasTable('product_variants')) {
            DB::table('product_variants')->where('product_id', $id)->delete();
        }

        if ($this->hasTable('products')) {
            DB::table('products')->where('id', $id)->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Xóa sản phẩm thành công.',
        ]);
    }

    public function categories(Request $request)
    {
        if ($deny = $this->checkAdmin($request)) return $deny;
        if (!$this->hasTable('categories')) return $this->emptyList('categories');

        $query = DB::table('categories as c')->select('c.*');

        if ($this->hasTable('products') && $this->hasColumn('products', 'category_id')) {
            $countSub = DB::table('products')
                ->select('category_id', DB::raw('COUNT(id) as product_count'))
                ->groupBy('category_id');

            $query->leftJoinSub($countSub, 'pc', function ($join) {
                $join->on('pc.category_id', '=', 'c.id');
            });

            $query->addSelect(DB::raw('COALESCE(pc.product_count, 0) as product_count'));
        } else {
            $query->addSelect(DB::raw('0 as product_count'));
        }

        $items = $query->orderByDesc('c.id')->get();

        return $this->listResponse('categories', $items, count($items));
    }

    public function storeCategory(Request $request)
    {
        if ($deny = $this->checkAdmin($request)) return $deny;
        if (!$this->hasTable('categories')) return response()->json(['success' => false, 'message' => 'Bảng categories chưa tồn tại.'], 404);

        $data = $request->all();

        if ($file = $this->uploadFile($request, 'image', 'categories')) {
            $data['image'] = $file;
        }

        if (empty($data['slug']) && !empty($data['name']) && $this->hasColumn('categories', 'slug')) {
            $data['slug'] = Str::slug($data['name']) . '-' . time();
        }

        if (isset($data['is_active'])) {
            $data['is_active'] = $this->boolValue($data['is_active']);
        }

        $payload = $this->addCreateTime('categories', $this->filterData('categories', $data));
        $id = DB::table('categories')->insertGetId($payload);

        return response()->json([
            'success' => true,
            'message' => 'Thêm danh mục thành công.',
            'data' => DB::table('categories')->where('id', $id)->first(),
        ]);
    }

    public function updateCategory(Request $request, $id)
    {
        if ($deny = $this->checkAdmin($request)) return $deny;
        if (!$this->hasTable('categories')) return response()->json(['success' => false, 'message' => 'Bảng categories chưa tồn tại.'], 404);

        $data = $request->all();

        if ($file = $this->uploadFile($request, 'image', 'categories')) {
            $data['image'] = $file;
        }

        if (isset($data['is_active'])) {
            $data['is_active'] = $this->boolValue($data['is_active']);
        }

        $payload = $this->filterData('categories', $data);

        if (!empty($payload)) {
            DB::table('categories')->where('id', $id)->update($payload);
        }

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật danh mục thành công.',
            'data' => DB::table('categories')->where('id', $id)->first(),
        ]);
    }

    public function deleteCategory(Request $request, $id)
    {
        if ($deny = $this->checkAdmin($request)) return $deny;

        if ($this->hasTable('products') && $this->hasColumn('products', 'category_id')) {
            DB::table('products')->where('category_id', $id)->update(['category_id' => null]);
        }

        DB::table('categories')->where('id', $id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Xóa danh mục thành công.',
        ]);
    }

    public function brands(Request $request)
    {
        if ($deny = $this->checkAdmin($request)) return $deny;
        if (!$this->hasTable('brands')) return $this->emptyList('brands');

        $query = DB::table('brands as b')->select('b.*');

        if ($this->hasTable('products') && $this->hasColumn('products', 'brand_id')) {
            $countSub = DB::table('products')
                ->select('brand_id', DB::raw('COUNT(id) as product_count'))
                ->groupBy('brand_id');

            $query->leftJoinSub($countSub, 'pc', function ($join) {
                $join->on('pc.brand_id', '=', 'b.id');
            });

            $query->addSelect(DB::raw('COALESCE(pc.product_count, 0) as product_count'));
        } else {
            $query->addSelect(DB::raw('0 as product_count'));
        }

        $items = $query->orderByDesc('b.id')->get();

        return $this->listResponse('brands', $items, count($items));
    }

    public function storeBrand(Request $request)
    {
        if ($deny = $this->checkAdmin($request)) return $deny;
        if (!$this->hasTable('brands')) return response()->json(['success' => false, 'message' => 'Bảng brands chưa tồn tại.'], 404);

        $data = $request->all();

        if ($file = $this->uploadFile($request, 'logo', 'brands')) {
            $data['logo'] = $file;
        }

        if ($file = $this->uploadFile($request, 'image', 'brands')) {
            $data['image'] = $file;
        }

        if (empty($data['slug']) && !empty($data['name']) && $this->hasColumn('brands', 'slug')) {
            $data['slug'] = Str::slug($data['name']) . '-' . time();
        }

        if (isset($data['is_active'])) {
            $data['is_active'] = $this->boolValue($data['is_active']);
        }

        $payload = $this->addCreateTime('brands', $this->filterData('brands', $data));
        $id = DB::table('brands')->insertGetId($payload);

        return response()->json([
            'success' => true,
            'message' => 'Thêm thương hiệu thành công.',
            'data' => DB::table('brands')->where('id', $id)->first(),
        ]);
    }

    public function updateBrand(Request $request, $id)
    {
        if ($deny = $this->checkAdmin($request)) return $deny;
        if (!$this->hasTable('brands')) return response()->json(['success' => false, 'message' => 'Bảng brands chưa tồn tại.'], 404);

        $data = $request->all();

        if ($file = $this->uploadFile($request, 'logo', 'brands')) {
            $data['logo'] = $file;
        }

        if ($file = $this->uploadFile($request, 'image', 'brands')) {
            $data['image'] = $file;
        }

        if (isset($data['is_active'])) {
            $data['is_active'] = $this->boolValue($data['is_active']);
        }

        $payload = $this->filterData('brands', $data);

        if (!empty($payload)) {
            DB::table('brands')->where('id', $id)->update($payload);
        }

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật thương hiệu thành công.',
            'data' => DB::table('brands')->where('id', $id)->first(),
        ]);
    }

    public function deleteBrand(Request $request, $id)
    {
        if ($deny = $this->checkAdmin($request)) return $deny;

        if ($this->hasTable('products') && $this->hasColumn('products', 'brand_id')) {
            DB::table('products')->where('brand_id', $id)->update(['brand_id' => null]);
        }

        DB::table('brands')->where('id', $id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Xóa thương hiệu thành công.',
        ]);
    }

    public function orders(Request $request)
{
    if ($deny = $this->checkAdmin($request)) return $deny;

    if (!$this->hasTable('orders')) {
        return $this->emptyList('orders');
    }

    $perPage = (int) $request->input('per_page', 200);

    $query = DB::table('orders as o')->select('o.*');

    if ($this->hasTable('users') && $this->hasColumn('orders', 'user_id')) {
        $query->leftJoin('users as u', 'u.id', '=', 'o.user_id');

        if ($this->hasColumn('users', 'name')) {
            $query->addSelect(DB::raw('u.name as customer_name'));
        } else {
            $query->addSelect(DB::raw('NULL as customer_name'));
        }

        if ($this->hasColumn('users', 'email')) {
            $query->addSelect(DB::raw('u.email as customer_email'));
        } else {
            $query->addSelect(DB::raw('NULL as customer_email'));
        }

        if ($this->hasColumn('users', 'phone')) {
            $query->addSelect(DB::raw('u.phone as customer_phone'));
        } else {
            $query->addSelect(DB::raw('NULL as customer_phone'));
        }
    } else {
        $query->addSelect(DB::raw('NULL as customer_name'));
        $query->addSelect(DB::raw('NULL as customer_email'));
        $query->addSelect(DB::raw('NULL as customer_phone'));
    }

    if ($this->hasTable('order_items') && $this->hasColumn('order_items', 'order_id')) {
        $quantityExpression = '1';

        if ($this->hasColumn('order_items', 'quantity')) {
            $quantityExpression = 'quantity';
        } elseif ($this->hasColumn('order_items', 'qty')) {
            $quantityExpression = 'qty';
        }

        $itemsSub = DB::table('order_items')
            ->select(
                'order_id',
                DB::raw('COUNT(*) as order_items_count'),
                DB::raw('COALESCE(SUM(' . $quantityExpression . '), 0) as total_items')
            )
            ->groupBy('order_id');

        $query->leftJoinSub($itemsSub, 'oi_count', function ($join) {
            $join->on('oi_count.order_id', '=', 'o.id');
        });

        $query->addSelect(DB::raw('COALESCE(oi_count.order_items_count, 0) as order_items_count'));
        $query->addSelect(DB::raw('COALESCE(oi_count.order_items_count, 0) as items_count'));
        $query->addSelect(DB::raw('COALESCE(oi_count.total_items, 0) as total_items'));
        $query->addSelect(DB::raw('COALESCE(oi_count.total_items, 0) as products_count'));
    } else {
        $query->addSelect(DB::raw('0 as order_items_count'));
        $query->addSelect(DB::raw('0 as items_count'));
        $query->addSelect(DB::raw('0 as total_items'));
        $query->addSelect(DB::raw('0 as products_count'));
    }

    $items = $query
        ->orderByDesc('o.id')
        ->limit($perPage)
        ->get();

    return $this->listResponse('orders', $items, count($items));
}

    public function showOrder(Request $request, $id)
    {
        if ($deny = $this->checkAdmin($request)) return $deny;

        try {
            if (!$this->hasTable('orders')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Bảng orders chưa tồn tại.',
                ], 404);
            }

            $order = DB::table('orders')->where('id', $id)->first();

            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy đơn hàng.',
                ], 404);
            }

            $items = collect([]);

            if ($this->hasTable('order_items') && $this->hasColumn('order_items', 'order_id')) {
                $items = DB::table('order_items')
                    ->where('order_id', $id)
                    ->orderBy('id')
                    ->get();

                $items = $items->map(function ($item) {
                    $product = null;
                    $variant = null;

                    $productId = $item->product_id ?? null;

                    if ($productId && $this->hasTable('products')) {
                        $product = DB::table('products')->where('id', $productId)->first();
                    }

                    $variantId = $item->variant_id ?? ($item->product_variant_id ?? null);

                    if ($variantId && $this->hasTable('product_variants')) {
                        $variant = DB::table('product_variants')->where('id', $variantId)->first();
                    }

                    $item->product_name = $item->product_name
                        ?? ($item->name ?? ($product->name ?? 'Sản phẩm'));

                    $item->name = $item->name ?? $item->product_name;

                    $item->product_image = $item->product_image
                        ?? ($product->image ?? ($product->thumbnail ?? ($product->image_url ?? null)));

                    $item->variant_image = $item->variant_image
                        ?? ($variant->image ?? ($variant->thumbnail ?? null));

                    $item->image = $item->image
                        ?? ($item->variant_image ?: ($item->product_image ?: null));

                    $item->size = $item->size ?? ($variant->size ?? null);
                    $item->color = $item->color ?? ($variant->color ?? null);
                    $item->sku = $item->sku ?? ($variant->sku ?? null);

                    $item->price = $item->price
                        ?? ($item->unit_price ?? ($variant->price ?? ($product->price ?? 0)));

                    $item->quantity = $item->quantity ?? ($item->qty ?? 1);

                    $item->total = $item->total
                        ?? ($item->subtotal ?? ((float) $item->price * (int) $item->quantity));

                    $item->product = $product;
                    $item->product_variant = $variant;

                    return $item;
                });
            }

            $order->items = $items;
            $order->order_items = $items;

            return response()->json([
                'success' => true,
                'message' => 'Lấy chi tiết đơn hàng thành công.',
                'data' => $order,
                'order' => $order,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi lấy chi tiết đơn hàng.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }


    private function getOrderItemsForStock($orderId)
    {
        if (!$this->hasTable('order_items')) {
            return collect([]);
        }

        if (!$this->hasColumn('order_items', 'order_id')) {
            return collect([]);
        }

        return DB::table('order_items')
            ->where('order_id', $orderId)
            ->get();
    }

    private function getOrderItemQuantity($item)
    {
        if (isset($item->quantity)) {
            return max(1, (int) $item->quantity);
        }

        if (isset($item->qty)) {
            return max(1, (int) $item->qty);
        }

        return 1;
    }

    private function getOrderItemProductId($item)
    {
        if (isset($item->product_id) && $item->product_id) {
            return $item->product_id;
        }

        return null;
    }

    private function getOrderItemVariantId($item)
    {
        if (isset($item->variant_id) && $item->variant_id) {
            return $item->variant_id;
        }

        if (isset($item->product_variant_id) && $item->product_variant_id) {
            return $item->product_variant_id;
        }

        return null;
    }

    private function getProductSoldColumn()
    {
        if (!$this->hasTable('products')) {
            return null;
        }

        if ($this->hasColumn('products', 'sold')) {
            return 'sold';
        }

        if ($this->hasColumn('products', 'sold_count')) {
            return 'sold_count';
        }

        if ($this->hasColumn('products', 'total_sold')) {
            return 'total_sold';
        }

        return null;
    }

    private function applyCompletedOrderInventory($orderId)
    {
        $items = $this->getOrderItemsForStock($orderId);

        if ($items->isEmpty()) {
            return [
                'deducted_items' => 0,
                'sold_items' => 0,
            ];
        }

        $deductedItems = 0;
        $soldItems = 0;

        foreach ($items as $item) {
            $quantity = $this->getOrderItemQuantity($item);
            $productId = $this->getOrderItemProductId($item);
            $variantId = $this->getOrderItemVariantId($item);

            $variant = null;

            if (
                $variantId &&
                $this->hasTable('product_variants')
            ) {
                $variant = DB::table('product_variants')
                    ->where('id', $variantId)
                    ->lockForUpdate()
                    ->first();

                if ($variant && !$productId && isset($variant->product_id)) {
                    $productId = $variant->product_id;
                }
            }

            if (
                $variant &&
                $this->hasColumn('product_variants', 'stock')
            ) {
                $currentStock = (int) ($variant->stock ?? 0);

                if ($currentStock < $quantity) {
                    throw new \RuntimeException(
                        'Tồn kho biến thể không đủ. SKU: ' .
                        ($variant->sku ?? ('#' . $variantId)) .
                        '. Còn ' . $currentStock .
                        ', cần ' . $quantity . '.'
                    );
                }

                $variantPayload = [
                    'stock' => DB::raw('GREATEST(COALESCE(stock, 0) - ' . $quantity . ', 0)'),
                ];

                if ($this->hasColumn('product_variants', 'updated_at')) {
                    $variantPayload['updated_at'] = now();
                }

                DB::table('product_variants')
                    ->where('id', $variantId)
                    ->update($variantPayload);

                $deductedItems += $quantity;
            } elseif (
                $productId &&
                $this->hasTable('products') &&
                $this->hasColumn('products', 'stock')
            ) {
                $product = DB::table('products')
                    ->where('id', $productId)
                    ->lockForUpdate()
                    ->first();

                $currentStock = (int) ($product->stock ?? 0);

                if ($currentStock < $quantity) {
                    throw new \RuntimeException(
                        'Tồn kho sản phẩm không đủ. Sản phẩm #' .
                        $productId .
                        '. Còn ' . $currentStock .
                        ', cần ' . $quantity . '.'
                    );
                }

                $productStockPayload = [
                    'stock' => DB::raw('GREATEST(COALESCE(stock, 0) - ' . $quantity . ', 0)'),
                ];

                if ($this->hasColumn('products', 'updated_at')) {
                    $productStockPayload['updated_at'] = now();
                }

                DB::table('products')
                    ->where('id', $productId)
                    ->update($productStockPayload);

                $deductedItems += $quantity;
            }

            if ($productId && $this->hasTable('products')) {
                $soldColumn = $this->getProductSoldColumn();

                if ($soldColumn) {
                    $soldPayload = [
                        $soldColumn => DB::raw('COALESCE(' . $soldColumn . ', 0) + ' . $quantity),
                    ];

                    if ($this->hasColumn('products', 'updated_at')) {
                        $soldPayload['updated_at'] = now();
                    }

                    DB::table('products')
                        ->where('id', $productId)
                        ->update($soldPayload);

                    $soldItems += $quantity;
                }
            }
        }

        return [
            'deducted_items' => $deductedItems,
            'sold_items' => $soldItems,
        ];
    }


    public function updateOrderStatus(Request $request, $id)
    {
        if ($deny = $this->checkAdmin($request)) return $deny;

        try {
            if (!$this->hasTable('orders')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Bảng orders chưa tồn tại.',
                ], 404);
            }

            if (!$this->hasColumn('orders', 'status')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy cột status trong bảng orders.',
                ], 422);
            }

            $semanticMap = [
                'pending' => ['pending', 'waiting_bank_transfer', 'bank_pending', 'waiting_payment', 'payment_pending'],
                'confirmed' => ['confirmed', 'processing', 'packing'],
                'shipping' => ['shipping', 'delivering'],
                'completed' => ['completed', 'success', 'done'],
                'cancelled' => ['cancelled', 'canceled', 'cancel'],
            ];

            $normalizeStatus = function ($value) use ($semanticMap) {
                $value = strtolower(trim((string) $value));

                foreach ($semanticMap as $key => $aliases) {
                    if (in_array($value, $aliases, true)) {
                        return $key;
                    }
                }

                return $value ?: 'pending';
            };

            DB::beginTransaction();

            $order = DB::table('orders')
                ->where('id', $id)
                ->lockForUpdate()
                ->first();

            if (!$order) {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy đơn hàng.',
                ], 404);
            }

            $currentStatus = $normalizeStatus($order->status ?? 'pending');
            $nextStatus = $normalizeStatus($request->input('status', 'pending'));

            $transitions = [
                'pending' => ['confirmed', 'cancelled'],
                'confirmed' => ['shipping', 'cancelled'],
                'shipping' => ['completed'],
                'completed' => [],
                'cancelled' => [],
            ];

            if ($currentStatus === $nextStatus) {
                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Trạng thái đơn hàng không thay đổi.',
                    'data' => $order,
                    'order' => $order,
                    'current_status' => $currentStatus,
                    'allowed_next_statuses' => $transitions[$currentStatus] ?? [],
                ]);
            }

            if (!array_key_exists($currentStatus, $transitions)) {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' => 'Trạng thái hiện tại của đơn hàng không hợp lệ.',
                    'current_status' => $currentStatus,
                ], 422);
            }

            if (!in_array($nextStatus, $transitions[$currentStatus], true)) {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' => 'Không thể chuyển trạng thái ngược hoặc sai luồng.',
                    'current_status' => $currentStatus,
                    'requested_status' => $nextStatus,
                    'allowed_next_statuses' => $transitions[$currentStatus],
                ], 422);
            }

            $statusForDb = $this->resolveOrderStatusForDb($nextStatus);
            $enumValues = $this->getOrderStatusEnumValues();

            if (!$statusForDb) {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' => 'Trạng thái muốn lưu không tồn tại trong enum database.',
                    'requested_status' => $nextStatus,
                    'allowed_db_statuses' => $enumValues,
                ], 422);
            }

            $inventoryResult = [
                'deducted_items' => 0,
                'sold_items' => 0,
            ];

            if ($nextStatus === 'completed') {
                $inventoryResult = $this->applyCompletedOrderInventory($id);
            }

            $payload = [
                'status' => $statusForDb,
            ];

            if ($nextStatus === 'completed' && $this->hasColumn('orders', 'completed_at')) {
                $payload['completed_at'] = now();
            }

            if ($nextStatus === 'cancelled' && $this->hasColumn('orders', 'cancelled_at')) {
                $payload['cancelled_at'] = now();
            }

            if ($this->hasColumn('orders', 'updated_at')) {
                $payload['updated_at'] = now();
            }

            DB::table('orders')
                ->where('id', $id)
                ->update($payload);

            $updatedOrder = DB::table('orders')
                ->where('id', $id)
                ->first();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => $nextStatus === 'completed'
                    ? 'Đơn hàng đã hoàn thành, đã trừ tồn kho và cập nhật số lượng đã bán.'
                    : 'Cập nhật trạng thái đơn hàng thành công.',
                'data' => $updatedOrder,
                'order' => $updatedOrder,
                'previous_status' => $currentStatus,
                'saved_status' => $statusForDb,
                'current_status' => $normalizeStatus($updatedOrder->status ?? $statusForDb),
                'allowed_next_statuses' => $transitions[$nextStatus] ?? [],
                'allowed_db_statuses' => $enumValues,
                'inventory' => $inventoryResult,
            ]);
        } catch (\RuntimeException $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Lỗi cập nhật trạng thái đơn hàng.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }


    public function customers(Request $request)
    {
        if ($deny = $this->checkAdmin($request)) return $deny;
        if (!$this->hasTable('users')) return $this->emptyList('customers');

        $items = DB::table('users')->orderByDesc('id')->limit((int) $request->input('per_page', 200))->get();

        return $this->listResponse('customers', $items, count($items));
    }

    public function updateCustomerStatus(Request $request, $id)
    {
        if ($deny = $this->checkAdmin($request)) return $deny;

        if (!$this->hasTable('users')) {
            return response()->json(['success' => false, 'message' => 'Bảng users chưa tồn tại.'], 404);
        }

        $payload = [];

        if ($this->hasColumn('users', 'is_active')) {
            $payload['is_active'] = $request->boolean('is_active') ? 1 : 0;
        }

        if ($this->hasColumn('users', 'updated_at')) {
            $payload['updated_at'] = now();
        }

        if (!empty($payload)) {
            DB::table('users')->where('id', $id)->update($payload);
        }

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật trạng thái khách hàng thành công.',
        ]);
    }

    public function banners(Request $request)
    {
        if ($deny = $this->checkAdmin($request)) return $deny;
        if (!$this->hasTable('banners')) return $this->emptyList('banners');

        $items = DB::table('banners')->orderByDesc('id')->get();

        return $this->listResponse('banners', $items, count($items));
    }

    public function storeBanner(Request $request)
    {
        if ($deny = $this->checkAdmin($request)) return $deny;
        if (!$this->hasTable('banners')) return response()->json(['success' => false, 'message' => 'Bảng banners chưa tồn tại.'], 404);

        $data = $request->all();

        if ($file = $this->uploadFile($request, 'image', 'banners')) {
            $data['image'] = $file;
        }

        if (isset($data['is_active'])) {
            $data['is_active'] = $this->boolValue($data['is_active']);
        }

        $payload = $this->addCreateTime('banners', $this->filterData('banners', $data));
        $id = DB::table('banners')->insertGetId($payload);

        return response()->json([
            'success' => true,
            'message' => 'Thêm banner thành công.',
            'data' => DB::table('banners')->where('id', $id)->first(),
        ]);
    }

    public function updateBanner(Request $request, $id)
    {
        if ($deny = $this->checkAdmin($request)) return $deny;
        if (!$this->hasTable('banners')) return response()->json(['success' => false, 'message' => 'Bảng banners chưa tồn tại.'], 404);

        $data = $request->all();

        if ($file = $this->uploadFile($request, 'image', 'banners')) {
            $data['image'] = $file;
        }

        if (isset($data['is_active'])) {
            $data['is_active'] = $this->boolValue($data['is_active']);
        }

        $payload = $this->filterData('banners', $data);

        if (!empty($payload)) {
            DB::table('banners')->where('id', $id)->update($payload);
        }

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật banner thành công.',
            'data' => DB::table('banners')->where('id', $id)->first(),
        ]);
    }

    public function deleteBanner(Request $request, $id)
    {
        if ($deny = $this->checkAdmin($request)) return $deny;

        DB::table('banners')->where('id', $id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Xóa banner thành công.',
        ]);
    }

    public function settings(Request $request)
    {
        if ($deny = $this->checkAdmin($request)) return $deny;

        if (!$this->hasTable('settings')) {
            return response()->json([
                'success' => true,
                'data' => [
                    'settings' => [
                        'site_name' => 'Dynova Sport',
                        'hotline' => '0866 347 730',
                        'email' => 'cskh@dynova.vn',
                        'address' => 'TP. Hồ Chí Minh',
                    ],
                ],
            ]);
        }

        $settings = DB::table('settings')->first();

        return response()->json([
            'success' => true,
            'data' => [
                'settings' => $settings,
            ],
        ]);
    }

    public function updateSettings(Request $request)
    {
        if ($deny = $this->checkAdmin($request)) return $deny;

        if (!$this->hasTable('settings')) {
            return response()->json([
                'success' => false,
                'message' => 'Bảng settings chưa tồn tại.',
            ], 404);
        }

        $payload = $this->filterData('settings', $request->all());
        $first = DB::table('settings')->first();

        if ($first) {
            DB::table('settings')->where('id', $first->id)->update($payload);
        } else {
            $payload = $this->addCreateTime('settings', $payload);
            DB::table('settings')->insert($payload);
        }

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật cấu hình thành công.',
        ]);
    }

   public function inventory(Request $request)
{
    if ($deny = $this->checkAdmin($request)) return $deny;

    try {
        if (!$this->hasTable('products')) {
            return $this->emptyList('inventory');
        }

        $perPage = (int) $request->input('per_page', 300);
        $search = trim((string) $request->input('search', ''));

        $query = DB::table('products as p');

        if (
            $this->hasTable('categories') &&
            $this->hasColumn('products', 'category_id') &&
            $this->hasColumn('categories', 'id')
        ) {
            $query->leftJoin('categories as c', 'c.id', '=', 'p.category_id');
        }

        if (
            $this->hasTable('brands') &&
            $this->hasColumn('products', 'brand_id') &&
            $this->hasColumn('brands', 'id')
        ) {
            $query->leftJoin('brands as b', 'b.id', '=', 'p.brand_id');
        }

        $variantSub = null;

        if (
            $this->hasTable('product_variants') &&
            $this->hasColumn('product_variants', 'product_id')
        ) {
            $stockExpr = $this->hasColumn('product_variants', 'stock')
                ? 'COALESCE(stock, 0)'
                : '0';

            $variantSub = DB::table('product_variants')
                ->select(
                    'product_id',
                    DB::raw('COUNT(id) as variant_count'),
                    DB::raw('COALESCE(SUM(' . $stockExpr . '), 0) as variant_total_stock'),
                    DB::raw('COALESCE(MIN(' . $stockExpr . '), 0) as variant_min_stock'),
                    DB::raw('COALESCE(MAX(' . $stockExpr . '), 0) as variant_max_stock')
                )
                ->groupBy('product_id');

            $query->leftJoinSub($variantSub, 'vs', function ($join) {
                $join->on('vs.product_id', '=', 'p.id');
            });
        }

        $select = [
            'p.id',
        ];

        if ($this->hasColumn('products', 'name')) {
            $select[] = DB::raw('p.name as name');
            $select[] = DB::raw('p.name as product_name');
        } else {
            $select[] = DB::raw("'Sản phẩm' as name");
            $select[] = DB::raw("'Sản phẩm' as product_name");
        }

        if ($this->hasColumn('products', 'sku')) {
            $select[] = DB::raw('p.sku as sku');
        } else {
            $select[] = DB::raw('NULL as sku');
        }

        if ($this->hasColumn('products', 'category_id')) {
            $select[] = DB::raw('p.category_id as category_id');
        } else {
            $select[] = DB::raw('NULL as category_id');
        }

        if ($this->hasColumn('products', 'brand_id')) {
            $select[] = DB::raw('p.brand_id as brand_id');
        } else {
            $select[] = DB::raw('NULL as brand_id');
        }

        if (
            $this->hasTable('categories') &&
            $this->hasColumn('products', 'category_id') &&
            $this->hasColumn('categories', 'name')
        ) {
            $select[] = DB::raw('MAX(c.name) as category_name');
        } else {
            $select[] = DB::raw('NULL as category_name');
        }

        if (
            $this->hasTable('brands') &&
            $this->hasColumn('products', 'brand_id') &&
            $this->hasColumn('brands', 'name')
        ) {
            $select[] = DB::raw('MAX(b.name) as brand_name');
        } else {
            $select[] = DB::raw('NULL as brand_name');
        }

        if ($variantSub) {
            $select[] = DB::raw('COALESCE(MAX(vs.variant_count), 0) as variant_count');
            $select[] = DB::raw('COALESCE(MAX(vs.variant_total_stock), 0) as variant_total_stock');
            $select[] = DB::raw('COALESCE(MAX(vs.variant_min_stock), 0) as variant_min_stock');
            $select[] = DB::raw('COALESCE(MAX(vs.variant_max_stock), 0) as variant_max_stock');
        } else {
            $select[] = DB::raw('0 as variant_count');
            $select[] = DB::raw('0 as variant_total_stock');
            $select[] = DB::raw('0 as variant_min_stock');
            $select[] = DB::raw('0 as variant_max_stock');
        }

        if ($this->hasColumn('products', 'stock')) {
            if ($variantSub) {
                $select[] = DB::raw('COALESCE(MAX(vs.variant_total_stock), MAX(p.stock), 0) as total_stock');
                $select[] = DB::raw('COALESCE(MAX(vs.variant_min_stock), MAX(p.stock), 0) as min_stock');
                $select[] = DB::raw('COALESCE(MAX(vs.variant_max_stock), MAX(p.stock), 0) as max_stock');
            } else {
                $select[] = DB::raw('COALESCE(MAX(p.stock), 0) as total_stock');
                $select[] = DB::raw('COALESCE(MAX(p.stock), 0) as min_stock');
                $select[] = DB::raw('COALESCE(MAX(p.stock), 0) as max_stock');
            }
        } else {
            if ($variantSub) {
                $select[] = DB::raw('COALESCE(MAX(vs.variant_total_stock), 0) as total_stock');
                $select[] = DB::raw('COALESCE(MAX(vs.variant_min_stock), 0) as min_stock');
                $select[] = DB::raw('COALESCE(MAX(vs.variant_max_stock), 0) as max_stock');
            } else {
                $select[] = DB::raw('0 as total_stock');
                $select[] = DB::raw('0 as min_stock');
                $select[] = DB::raw('0 as max_stock');
            }
        }

        $query->select($select);

        if ($search && $this->hasColumn('products', 'name')) {
            $query->where('p.name', 'like', '%' . $search . '%');
        }

        $groupBy = ['p.id'];

        if ($this->hasColumn('products', 'name')) {
            $groupBy[] = 'p.name';
        }

        if ($this->hasColumn('products', 'sku')) {
            $groupBy[] = 'p.sku';
        }

        if ($this->hasColumn('products', 'category_id')) {
            $groupBy[] = 'p.category_id';
        }

        if ($this->hasColumn('products', 'brand_id')) {
            $groupBy[] = 'p.brand_id';
        }

        $items = $query
            ->groupBy($groupBy)
            ->orderBy('total_stock', 'asc')
            ->limit($perPage)
            ->get()
            ->map(function ($item) {
                $item->variant_count = (int) ($item->variant_count ?? 0);
                $item->variant_total_stock = (int) ($item->variant_total_stock ?? 0);
                $item->variant_min_stock = (int) ($item->variant_min_stock ?? 0);
                $item->variant_max_stock = (int) ($item->variant_max_stock ?? 0);

                $item->total_stock = (int) ($item->total_stock ?? 0);
                $item->min_stock = (int) ($item->min_stock ?? 0);
                $item->max_stock = (int) ($item->max_stock ?? 0);

                if ($item->total_stock <= 0) {
                    $item->stock_status = 'out_of_stock';
                    $item->stock_status_label = 'Hết hàng';
                } elseif ($item->total_stock <= 5) {
                    $item->stock_status = 'low_stock';
                    $item->stock_status_label = 'Sắp hết';
                } else {
                    $item->stock_status = 'in_stock';
                    $item->stock_status_label = 'Còn hàng';
                }

                return $item;
            });

        return response()->json([
            'success' => true,
            'data' => [
                'inventory' => $items,
                'items' => $items,
                'products' => $items,
                'total' => count($items),
            ],
        ]);
    } catch (\Throwable $e) {
        return response()->json([
            'success' => false,
            'message' => 'Lỗi tải dữ liệu tồn kho.',
            'error' => $e->getMessage(),
        ], 500);
    }
}

    public function promotions()
{
    try {
        // Lấy tất cả danh sách mã giảm giá
        $promotions = Voucher::all(); // Nếu đặt tên Model là Promotion thì sửa thành Promotion::all()

        return response()->json([
            'success' => true,
            'data' => $promotions
        ], 200);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => $e->getMessage(),
            'data' => []
        ], 500);
    }
}

    public function ratings(Request $request)
    {
        if ($deny = $this->checkAdmin($request)) return $deny;

        if (!$this->hasTable('reviews')) {
            return $this->emptyList('ratings');
        }

        $query = DB::table('reviews as r')->select('r.*');

        if ($this->hasTable('products') && $this->hasColumn('reviews', 'product_id')) {
            $query->leftJoin('products as p', 'p.id', '=', 'r.product_id')
                ->addSelect(DB::raw('p.name as product_name'));
        }

        if ($this->hasTable('users') && $this->hasColumn('reviews', 'user_id')) {
            $query->leftJoin('users as u', 'u.id', '=', 'r.user_id')
                ->addSelect(DB::raw('u.name as customer_name'), DB::raw('u.email as customer_email'));
        }

        $items = $query->orderByDesc('r.id')->limit((int) $request->input('per_page', 200))->get();

        return $this->listResponse('ratings', $items, count($items));
    }
    private function getOrderStatusEnumValues()
{
    try {
        if (!$this->hasTable('orders') || !$this->hasColumn('orders', 'status')) {
            return ['pending', 'confirmed', 'shipping', 'completed', 'cancelled'];
        }

        $columns = DB::select("SHOW COLUMNS FROM orders LIKE 'status'");

        if (!$columns || !isset($columns[0]->Type)) {
            return ['pending', 'confirmed', 'shipping', 'completed', 'cancelled'];
        }

        $type = $columns[0]->Type;

        if (!preg_match("/^enum\((.*)\)$/", $type, $matches)) {
            return ['pending', 'confirmed', 'shipping', 'completed', 'cancelled'];
        }

        preg_match_all("/'((?:[^'\\\\]|\\\\.)*)'/", $matches[1], $values);

        return array_map(function ($value) {
            return stripslashes($value);
        }, $values[1] ?? []);
    } catch (\Throwable $e) {
        return ['pending', 'confirmed', 'shipping', 'completed', 'cancelled'];
    }
}

private function resolveOrderStatusForDb($rawStatus)
{
    $rawStatus = strtolower(trim((string) $rawStatus));

    $semanticMap = [
        'pending' => [
            'pending',
            'waiting_bank_transfer',
            'bank_pending',
            'waiting_payment',
            'payment_pending',
        ],
        'confirmed' => [
            'confirmed',
            'processing',
            'packing',
        ],
        'shipping' => [
            'shipping',
            'delivering',
        ],
        'completed' => [
            'completed',
            'success',
            'done',
        ],
        'cancelled' => [
            'cancelled',
            'canceled',
            'cancel',
        ],
    ];

    $canonical = null;

    foreach ($semanticMap as $key => $aliases) {
        if (in_array($rawStatus, $aliases)) {
            $canonical = $key;
            break;
        }
    }

    if (!$canonical) {
        $canonical = $rawStatus ?: 'pending';
    }

    $allowed = $this->getOrderStatusEnumValues();

    $preferred = [
        'pending' => ['pending', 'waiting_bank_transfer'],
        'confirmed' => ['confirmed', 'processing', 'packing'],
        'shipping' => ['shipping', 'delivering'],
        'completed' => ['completed', 'success', 'done'],
        'cancelled' => ['cancelled', 'canceled', 'cancel'],
    ];

    foreach (($preferred[$canonical] ?? [$canonical]) as $candidate) {
        if (in_array($candidate, $allowed)) {
            return $candidate;
        }
    }

    if (in_array($rawStatus, $allowed)) {
        return $rawStatus;
    }

    return null;
}

// 1. Hàm tạo mã giảm giá mới
public function storePromotion(\Illuminate\Http\Request $request)
{
    $validated = $request->validate([
        'code'            => 'required|string|unique:vouchers,code',
        'name'            => 'nullable|string',
        'type'            => 'required|string',
        'value'           => 'required|numeric',
        'min_order_value' => 'nullable|numeric',
        'is_active'       => 'nullable|boolean',
    ]);

    // Nếu DB của bạn dùng bảng 'vouchers' hoặc 'promotions' (thay Model tương ứng)
    $promotion = \App\Models\Voucher::create($validated);

    return response()->json([
        'success' => true,
        'message' => 'Thêm mã giảm giá thành công!',
        'data'    => $promotion
    ], 201);
}

// 2. Hàm xóa mã giảm giá
public function deletePromotion($id)
{
    $promotion = \App\Models\Voucher::find($id);
    if (!$promotion) {
        return response()->json(['success' => false, 'message' => 'Không tìm thấy mã!'], 404);
    }

    $promotion->delete();

    return response()->json([
        'success' => true,
        'message' => 'Đã xóa mã giảm giá thành công!'
    ]);
}
}
