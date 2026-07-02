<?php

namespace App\Http\Controllers\Api\Admin;

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
        if (!$this->hasTable('orders')) return $this->emptyList('orders');

        $perPage = (int) $request->input('per_page', 200);
        $query = DB::table('orders as o')->select('o.*');

        if ($this->hasTable('users') && $this->hasColumn('orders', 'user_id')) {
            $query->leftJoin('users as u', 'u.id', '=', 'o.user_id')
                ->addSelect(DB::raw('u.name as customer_name'), DB::raw('u.email as customer_email'));
        }

        $items = $query->orderByDesc('o.id')->limit($perPage)->get();

        return $this->listResponse('orders', $items, count($items));
    }

    public function updateOrderStatus(Request $request, $id)
    {
        if ($deny = $this->checkAdmin($request)) return $deny;

        if (!$this->hasTable('orders')) {
            return response()->json(['success' => false, 'message' => 'Bảng orders chưa tồn tại.'], 404);
        }

        $payload = [];

        if ($this->hasColumn('orders', 'status')) {
            $payload['status'] = $request->input('status', 'processing');
        }

        if ($this->hasColumn('orders', 'updated_at')) {
            $payload['updated_at'] = now();
        }

        if (empty($payload)) {
            return response()->json(['success' => false, 'message' => 'Không có cột để cập nhật trạng thái.'], 422);
        }

        DB::table('orders')->where('id', $id)->update($payload);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật trạng thái đơn hàng thành công.',
        ]);
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

    if (!$this->hasTable('products')) {
        return $this->emptyList('inventory');
    }

    $perPage = (int) $request->input('per_page', 300);

    $query = DB::table('products as p');

    if ($this->hasTable('categories') && $this->hasColumn('products', 'category_id')) {
        $query->leftJoin('categories as c', 'c.id', '=', 'p.category_id');
    }

    if ($this->hasTable('brands') && $this->hasColumn('products', 'brand_id')) {
        $query->leftJoin('brands as b', 'b.id', '=', 'p.brand_id');
    }

    if ($this->hasTable('product_variants') && $this->hasColumn('product_variants', 'stock')) {
        $query->leftJoin('product_variants as pv', 'pv.product_id', '=', 'p.id');
    }

    $query->select(
        'p.id',
        'p.name',
        'p.category_id',
        'p.brand_id',
        DB::raw($this->hasTable('categories') ? 'MAX(c.name) as category_name' : 'NULL as category_name'),
        DB::raw($this->hasTable('brands') ? 'MAX(b.name) as brand_name' : 'NULL as brand_name'),
        DB::raw($this->hasTable('product_variants') ? 'COUNT(pv.id) as variant_count' : '0 as variant_count'),
        DB::raw($this->hasTable('product_variants') ? 'COALESCE(SUM(pv.stock), 0) as total_stock' : '0 as total_stock'),
        DB::raw($this->hasTable('product_variants') ? 'COALESCE(MIN(pv.stock), 0) as min_stock' : '0 as min_stock'),
        DB::raw($this->hasTable('product_variants') ? 'COALESCE(MAX(pv.stock), 0) as max_stock' : '0 as max_stock')
    );

    $items = $query
        ->groupBy('p.id', 'p.name', 'p.category_id', 'p.brand_id')
        ->orderBy('total_stock', 'asc')
        ->limit($perPage)
        ->get();

    return response()->json([
        'success' => true,
        'data' => [
            'inventory' => $items,
            'items' => $items,
            'total' => count($items),
        ],
    ]);
}

    public function promotions(Request $request)
    {
        if ($deny = $this->checkAdmin($request)) return $deny;

        if (!$this->hasTable('promotions')) {
            return $this->emptyList('promotions');
        }

        $items = DB::table('promotions')->orderByDesc('id')->get();

        return $this->listResponse('promotions', $items, count($items));
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
}
