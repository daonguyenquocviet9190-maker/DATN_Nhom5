<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AdminDashboardController extends Controller
{
    private const COMPLETED = ['completed', 'success', 'done'];
    private const CONFIRMED = ['confirmed', 'processing', 'packing'];
    private const SHIPPING = ['shipping', 'delivering'];
    private const CANCELLED = ['cancelled', 'canceled', 'cancel'];

    public function index(Request $request)
    {
        if ($denied = $this->checkAdmin($request)) {
            return $denied;
        }

        $period = $this->normalizePeriod((string) $request->query('period', 'all'));
        [$start, $end, $previousStart, $previousEnd, $granularity] = $this->periodRange($period);

        $current = $this->buildOrderMetrics($start, $end);
        $currentCustomers = $this->countNewCustomers($start, $end);

        $previous = $this->emptyOrderMetrics();
        $previousCustomers = 0;

        if ($period !== 'all') {
            $previous = $this->buildOrderMetrics($previousStart, $previousEnd);
            $previousCustomers = $this->countNewCustomers($previousStart, $previousEnd);
        }

        $summary = [
            'revenue' => $current['revenue'],
            'orders' => $current['orders'],
            'completed_orders' => $current['completed'],
            'cancelled_orders' => $current['cancelled'],
            'pending_orders' => $current['pending'] + $current['confirmed'],
            'shipping_orders' => $current['shipping'],
            'new_customers' => $currentCustomers,
            'aov' => $current['completed'] > 0
                ? round($current['revenue'] / $current['completed'], 2)
                : 0,
            'completion_rate' => $current['orders'] > 0
                ? round(($current['completed'] / $current['orders']) * 100, 1)
                : 0,
            'cancel_rate' => $current['orders'] > 0
                ? round(($current['cancelled'] / $current['orders']) * 100, 1)
                : 0,
        ];

        $previousAov = $previous['completed'] > 0
            ? $previous['revenue'] / $previous['completed']
            : 0;

        $comparison = $period === 'all'
            ? [
                'revenue' => null,
                'orders' => null,
                'aov' => null,
                'new_customers' => null,
            ]
            : [
                'revenue' => $this->percentChange($summary['revenue'], $previous['revenue']),
                'orders' => $this->percentChange($summary['orders'], $previous['orders']),
                'aov' => $this->percentChange($summary['aov'], $previousAov),
                'new_customers' => $this->percentChange($currentCustomers, $previousCustomers),
            ];

        $statusCounts = [
            ['status' => 'pending', 'count' => $current['pending']],
            ['status' => 'confirmed', 'count' => $current['confirmed']],
            ['status' => 'shipping', 'count' => $current['shipping']],
            ['status' => 'completed', 'count' => $current['completed']],
            ['status' => 'cancelled', 'count' => $current['cancelled']],
        ];

        $lifetimeStart = $this->firstBusinessDate();
        $lifetimeEnd = now()->endOfDay();
        $lifetimeMetrics = $this->buildOrderMetrics($lifetimeStart, $lifetimeEnd);

        $lifetime = [
            'revenue' => $lifetimeMetrics['revenue'],
            'orders' => $lifetimeMetrics['orders'],
            'completed_orders' => $lifetimeMetrics['completed'],
            'customers' => $this->countAllCustomers(),
            'products' => Schema::hasTable('products') ? DB::table('products')->count() : 0,
            'stock_units' => $this->totalStockUnits(),
        ];

        $firstOrderAt = $this->firstOrderDate();
        $latestOrderAt = $this->latestOrderDate();

        return response()->json([
            'success' => true,
            'data' => [
                'dashboard_version' => 2,
                'period' => $period,
                'range' => [
                    'from' => $start->toDateString(),
                    'to' => $end->toDateString(),
                    'label' => $period === 'all'
                        ? 'Toàn bộ dữ liệu'
                        : $this->rangeLabel($start, $end),
                ],
                'summary' => $summary,
                'lifetime' => $lifetime,
                'comparison' => $comparison,
                'analytics' => [
                    'series' => $this->buildSeries($start, $end, $granularity),
                    'order_statuses' => $statusCounts,
                ],
                'recent_orders' => $this->recentOrders(),
                'top_products' => $this->topProducts($start, $end),
                'low_stock_products' => $this->lowStockProducts(),
                'inventory' => [
                    'low_stock_count' => $this->lowStockCount(),
                ],
                'meta' => [
                    'empty_period' => $current['orders'] === 0,
                    'first_order_at' => $firstOrderAt?->toIso8601String(),
                    'latest_order_at' => $latestOrderAt?->toIso8601String(),
                    'suggested_period' => $current['orders'] === 0 && $period !== 'all' ? 'all' : null,
                ],
                'updated_at' => now()->toIso8601String(),
            ],
        ]);
    }

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

    private function normalizePeriod(string $period): string
    {
        return in_array($period, ['all', '7d', '30d', '90d', '12m'], true)
            ? $period
            : 'all';
    }

    private function periodRange(string $period): array
    {
        $end = now()->endOfDay();

        if ($period === 'all') {
            $start = $this->firstBusinessDate();
            $days = max(1, (int) ceil($start->diffInDays($end, true)));
            $granularity = $days <= 31 ? 'day' : ($days <= 180 ? 'week' : 'month');

            return [
                $start,
                $end,
                $start->copy(),
                $start->copy()->subSecond(),
                $granularity,
            ];
        }

        if ($period === '7d') {
            $start = now()->subDays(6)->startOfDay();
            $previousEnd = $start->copy()->subSecond();
            $previousStart = $previousEnd->copy()->subDays(6)->startOfDay();
            return [$start, $end, $previousStart, $previousEnd, 'day'];
        }

        if ($period === '90d') {
            $start = now()->subDays(89)->startOfDay();
            $previousEnd = $start->copy()->subSecond();
            $previousStart = $previousEnd->copy()->subDays(89)->startOfDay();
            return [$start, $end, $previousStart, $previousEnd, 'week'];
        }

        if ($period === '12m') {
            $start = now()->startOfMonth()->subMonths(11);
            $previousEnd = $start->copy()->subSecond();
            $previousStart = $start->copy()->subMonths(12);
            return [$start, $end, $previousStart, $previousEnd, 'month'];
        }

        $start = now()->subDays(29)->startOfDay();
        $previousEnd = $start->copy()->subSecond();
        $previousStart = $previousEnd->copy()->subDays(29)->startOfDay();

        return [$start, $end, $previousStart, $previousEnd, 'day'];
    }

    private function emptyOrderMetrics(): array
    {
        return [
            'revenue' => 0,
            'orders' => 0,
            'pending' => 0,
            'confirmed' => 0,
            'shipping' => 0,
            'completed' => 0,
            'cancelled' => 0,
        ];
    }

    private function firstBusinessDate(): Carbon
    {
        $dates = [];

        if (Schema::hasTable('orders') && Schema::hasColumn('orders', 'created_at')) {
            $value = DB::table('orders')->whereNotNull('created_at')->min('created_at');
            if ($value) $dates[] = Carbon::parse($value);
        }

        if (Schema::hasTable('users') && Schema::hasColumn('users', 'created_at')) {
            $value = DB::table('users')->whereNotNull('created_at')->min('created_at');
            if ($value) $dates[] = Carbon::parse($value);
        }

        if (Schema::hasTable('products') && Schema::hasColumn('products', 'created_at')) {
            $value = DB::table('products')->whereNotNull('created_at')->min('created_at');
            if ($value) $dates[] = Carbon::parse($value);
        }

        if (empty($dates)) {
            return now()->startOfDay();
        }

        usort($dates, fn (Carbon $a, Carbon $b) => $a->getTimestamp() <=> $b->getTimestamp());
        return $dates[0]->copy()->startOfDay();
    }

    private function firstOrderDate(): ?Carbon
    {
        if (!Schema::hasTable('orders') || !Schema::hasColumn('orders', 'created_at')) {
            return null;
        }

        $value = DB::table('orders')->whereNotNull('created_at')->min('created_at');
        return $value ? Carbon::parse($value) : null;
    }

    private function latestOrderDate(): ?Carbon
    {
        if (!Schema::hasTable('orders') || !Schema::hasColumn('orders', 'created_at')) {
            return null;
        }

        $value = DB::table('orders')->whereNotNull('created_at')->max('created_at');
        return $value ? Carbon::parse($value) : null;
    }

    private function countAllCustomers(): int
    {
        if (!Schema::hasTable('users')) {
            return 0;
        }

        $query = DB::table('users');

        if (Schema::hasColumn('users', 'role_id') && Schema::hasTable('roles')) {
            $customerRoleId = DB::table('roles')
                ->whereRaw('LOWER(name) = ?', ['customer'])
                ->value('id');

            if ($customerRoleId) {
                $query->where('role_id', $customerRoleId);
            }
        }

        return $query->count();
    }

    private function totalStockUnits(): int
    {
        if (!Schema::hasTable('product_variants') || !Schema::hasColumn('product_variants', 'stock')) {
            return 0;
        }

        return (int) DB::table('product_variants')->sum('stock');
    }

    private function rangeLabel(Carbon $start, Carbon $end): string
    {
        return $start->format('d/m/Y') . ' - ' . $end->format('d/m/Y');
    }

    private function buildOrderMetrics(Carbon $start, Carbon $end): array
    {
        $metrics = $this->emptyOrderMetrics();

        if (!Schema::hasTable('orders')) {
            return $metrics;
        }

        $createdColumn = $this->firstExistingColumn('orders', ['created_at']);
        $statusColumn = $this->firstExistingColumn('orders', ['status']);
        $totalColumn = $this->firstExistingColumn('orders', [
            'grand_total',
            'final_total',
            'total',
            'total_price',
            'subtotal',
        ]);

        if (!$createdColumn) {
            return $metrics;
        }

        $query = DB::table('orders')
            ->whereBetween($createdColumn, [$start, $end]);

        $metrics['orders'] = (clone $query)->count();

        if ($statusColumn) {
            $rows = (clone $query)
                ->select($statusColumn, DB::raw('COUNT(*) as aggregate'))
                ->groupBy($statusColumn)
                ->get();

            foreach ($rows as $row) {
                $key = $this->normalizeStatus($row->{$statusColumn} ?? 'pending');
                $metrics[$key] = ($metrics[$key] ?? 0) + (int) $row->aggregate;
            }
        } else {
            $metrics['pending'] = $metrics['orders'];
        }

        if ($statusColumn && $totalColumn) {
            $metrics['revenue'] = (float) (clone $query)
                ->whereIn($statusColumn, self::COMPLETED)
                ->sum($totalColumn);
        }

        return $metrics;
    }

    private function buildSeries(Carbon $start, Carbon $end, string $granularity): array
    {
        $buckets = $this->emptyBuckets($start, $end, $granularity);

        if (!Schema::hasTable('orders')) {
            return array_values($buckets);
        }

        $createdColumn = $this->firstExistingColumn('orders', ['created_at']);
        $statusColumn = $this->firstExistingColumn('orders', ['status']);
        $totalColumn = $this->firstExistingColumn('orders', [
            'grand_total',
            'final_total',
            'total',
            'total_price',
            'subtotal',
        ]);

        if (!$createdColumn) {
            return array_values($buckets);
        }

        $columns = ['id', $createdColumn];
        if ($statusColumn) $columns[] = $statusColumn;
        if ($totalColumn) $columns[] = $totalColumn;

        $rows = DB::table('orders')
            ->whereBetween($createdColumn, [$start, $end])
            ->get($columns);

        foreach ($rows as $row) {
            $date = Carbon::parse($row->{$createdColumn});
            $key = $this->bucketKey($date, $granularity, $start);

            if (!isset($buckets[$key])) {
                continue;
            }

            $buckets[$key]['orders']++;

            if (
                $statusColumn &&
                $totalColumn &&
                $this->normalizeStatus($row->{$statusColumn} ?? '') === 'completed'
            ) {
                $buckets[$key]['revenue'] += (float) ($row->{$totalColumn} ?? 0);
            }
        }

        return array_values($buckets);
    }

    private function emptyBuckets(Carbon $start, Carbon $end, string $granularity): array
    {
        $buckets = [];
        $cursor = $start->copy();

        if ($granularity === 'month') {
            $cursor->startOfMonth();
            while ($cursor <= $end) {
                $key = $cursor->format('Y-m');
                $buckets[$key] = [
                    'key' => $key,
                    'label' => 'T' . $cursor->month,
                    'revenue' => 0,
                    'orders' => 0,
                ];
                $cursor->addMonth();
            }
            return $buckets;
        }

        if ($granularity === 'week') {
            $index = 1;
            while ($cursor <= $end) {
                $bucketStart = $cursor->copy();
                $bucketEnd = $cursor->copy()->addDays(6)->endOfDay();
                if ($bucketEnd > $end) $bucketEnd = $end->copy();

                $key = 'W' . $index;
                $buckets[$key] = [
                    'key' => $key,
                    'label' => $bucketStart->format('d/m'),
                    'from' => $bucketStart->toDateString(),
                    'to' => $bucketEnd->toDateString(),
                    'revenue' => 0,
                    'orders' => 0,
                ];

                $cursor->addDays(7);
                $index++;
            }
            return $buckets;
        }

        while ($cursor <= $end) {
            $key = $cursor->format('Y-m-d');
            $buckets[$key] = [
                'key' => $key,
                'label' => $cursor->format('d/m'),
                'revenue' => 0,
                'orders' => 0,
            ];
            $cursor->addDay();
        }

        return $buckets;
    }

    private function bucketKey(Carbon $date, string $granularity, Carbon $start): string
    {
        if ($granularity === 'month') {
            return $date->format('Y-m');
        }

        if ($granularity === 'week') {
            return 'W' . ((int) floor(max(0, $start->diffInDays($date, false)) / 7) + 1);
        }

        return $date->format('Y-m-d');
    }

    private function countNewCustomers(Carbon $start, Carbon $end): int
    {
        if (!Schema::hasTable('users') || !Schema::hasColumn('users', 'created_at')) {
            return 0;
        }

        $query = DB::table('users')->whereBetween('created_at', [$start, $end]);

        if (Schema::hasColumn('users', 'role_id') && Schema::hasTable('roles')) {
            $customerRoleId = DB::table('roles')
                ->whereRaw('LOWER(name) = ?', ['customer'])
                ->value('id');

            if ($customerRoleId) {
                $query->where('role_id', $customerRoleId);
            }
        }

        return $query->count();
    }

    private function percentChange(float|int $current, float|int $previous): float
    {
        $current = (float) $current;
        $previous = (float) $previous;

        if ($previous == 0.0) {
            return $current == 0.0 ? 0 : 100;
        }

        return round((($current - $previous) / abs($previous)) * 100, 1);
    }

    private function normalizeStatus($status): string
    {
        $clean = strtolower(trim((string) $status));

        if (in_array($clean, self::COMPLETED, true)) return 'completed';
        if (in_array($clean, self::SHIPPING, true)) return 'shipping';
        if (in_array($clean, self::CONFIRMED, true)) return 'confirmed';
        if (in_array($clean, self::CANCELLED, true)) return 'cancelled';

        return 'pending';
    }

    private function recentOrders(): Collection
    {
        if (!Schema::hasTable('orders')) {
            return collect([]);
        }

        $query = DB::table('orders as o')->select('o.*');

        if (Schema::hasTable('users') && Schema::hasColumn('orders', 'user_id')) {
            $query->leftJoin('users as u', 'u.id', '=', 'o.user_id');

            if (Schema::hasColumn('users', 'name')) {
                $query->addSelect(DB::raw('u.name as account_name'));
            }

            if (Schema::hasColumn('users', 'email')) {
                $query->addSelect(DB::raw('u.email as account_email'));
            }
        }

        $query->orderByDesc(Schema::hasColumn('orders', 'created_at') ? 'o.created_at' : 'o.id');

        return $query->limit(6)->get()->map(function ($order) {
            if (empty($order->customer_name ?? null)) {
                $order->customer_name = $order->receiver_name
                    ?? $order->recipient_name
                    ?? $order->account_name
                    ?? 'Khách hàng';
            }
            return $order;
        });
    }

    private function topProducts(Carbon $start, Carbon $end): Collection
    {
        if (
            !Schema::hasTable('order_items') ||
            !Schema::hasTable('orders') ||
            !Schema::hasColumn('order_items', 'order_id') ||
            !Schema::hasColumn('order_items', 'product_id')
        ) {
            return collect([]);
        }

        $quantityColumn = $this->firstExistingColumn('order_items', ['quantity', 'qty']);
        $itemTotalColumn = $this->firstExistingColumn('order_items', ['total', 'subtotal']);
        $statusColumn = $this->firstExistingColumn('orders', ['status']);
        $createdColumn = $this->firstExistingColumn('orders', ['created_at']);

        if (!$quantityColumn || !$statusColumn || !$createdColumn) {
            return collect([]);
        }

        $query = DB::table('order_items as oi')
            ->join('orders as o', 'o.id', '=', 'oi.order_id')
            ->whereBetween('o.' . $createdColumn, [$start, $end])
            ->whereIn('o.' . $statusColumn, self::COMPLETED)
            ->select(
                'oi.product_id',
                DB::raw('SUM(oi.' . $quantityColumn . ') as sold')
            );

        if (Schema::hasColumn('order_items', 'product_name')) {
            $query->addSelect(DB::raw('MAX(oi.product_name) as product_name'));
        }

        if ($itemTotalColumn) {
            $query->addSelect(DB::raw('COALESCE(SUM(oi.' . $itemTotalColumn . '), 0) as revenue'));
        } else {
            $query->addSelect(DB::raw('0 as revenue'));
        }

        if (Schema::hasTable('products')) {
            $query->leftJoin('products as p', 'p.id', '=', 'oi.product_id');

            if (Schema::hasColumn('products', 'name')) {
                $query->addSelect(DB::raw('MAX(p.name) as name'));
            }
            if (Schema::hasColumn('products', 'image')) {
                $query->addSelect(DB::raw('MAX(p.image) as image'));
            }
        }

        return $query
            ->groupBy('oi.product_id')
            ->orderByDesc('sold')
            ->limit(5)
            ->get()
            ->map(function ($item) {
                $item->name = $item->name ?? $item->product_name ?? 'Sản phẩm';
                $item->sold = (int) ($item->sold ?? 0);
                $item->revenue = (float) ($item->revenue ?? 0);
                return $item;
            });
    }

    private function lowStockProducts(): Collection
    {
        if (
            !Schema::hasTable('products') ||
            !Schema::hasTable('product_variants') ||
            !Schema::hasColumn('product_variants', 'product_id') ||
            !Schema::hasColumn('product_variants', 'stock')
        ) {
            return collect([]);
        }

        $variantSub = DB::table('product_variants')
            ->select(
                'product_id',
                DB::raw('COUNT(*) as variant_count'),
                DB::raw('COALESCE(SUM(stock), 0) as total_stock')
            )
            ->groupBy('product_id');

        $query = DB::table('products as p')
            ->joinSub($variantSub, 'vs', function ($join) {
                $join->on('vs.product_id', '=', 'p.id');
            })
            ->select(
                'p.id',
                DB::raw('vs.variant_count as variant_count'),
                DB::raw('vs.total_stock as total_stock')
            )
            ->where('vs.total_stock', '<=', 10)
            ->orderBy('vs.total_stock')
            ->limit(5);

        if (Schema::hasColumn('products', 'name')) {
            $query->addSelect('p.name');
        }

        if (Schema::hasColumn('products', 'status')) {
            $query->where('p.status', 'active');
        }

        return $query->get()->map(function ($item) {
            $item->variant_count = (int) ($item->variant_count ?? 0);
            $item->total_stock = (int) ($item->total_stock ?? 0);
            return $item;
        });
    }

    private function lowStockCount(): int
    {
        if (
            !Schema::hasTable('products') ||
            !Schema::hasTable('product_variants') ||
            !Schema::hasColumn('product_variants', 'product_id') ||
            !Schema::hasColumn('product_variants', 'stock')
        ) {
            return 0;
        }

        $variantSub = DB::table('product_variants')
            ->select('product_id', DB::raw('COALESCE(SUM(stock), 0) as total_stock'))
            ->groupBy('product_id');

        $query = DB::table('products as p')
            ->joinSub($variantSub, 'vs', function ($join) {
                $join->on('vs.product_id', '=', 'p.id');
            })
            ->where('vs.total_stock', '<=', 10);

        if (Schema::hasColumn('products', 'status')) {
            $query->where('p.status', 'active');
        }

        return $query->count();
    }

    private function firstExistingColumn(string $table, array $columns): ?string
    {
        if (!Schema::hasTable($table)) return null;

        foreach ($columns as $column) {
            if (Schema::hasColumn($table, $column)) return $column;
        }

        return null;
    }
}