"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  ClipboardList,
  Download,
  Loader2,
  PackageCheck,
  RefreshCw,
  ShoppingBag,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";

import { formatCurrency } from "@/data/shop";
import {
  extractItems,
  getAdminCustomers,
  getAdminDashboard,
  getAdminInventory,
  getAdminOrders,
  getAdminProducts,
  getNormalizedStock,
  getNormalizedVariantCount,
} from "@/services/admin.service";

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function firstNumber(...values) {
  const found = values.find((value) => {
    const numberValue = Number(value);
    return Number.isFinite(numberValue);
  });

  return Number(found || 0);
}

function normalizeStatus(status = "") {
  const clean = String(status || "").trim().toLowerCase();

  if (["completed", "success", "done", "hoàn thành"].includes(clean)) {
    return "completed";
  }

  if (["shipping", "delivering", "đang giao"].includes(clean)) {
    return "shipping";
  }

  if (["confirmed", "processing", "packing", "đã xác nhận", "đang xử lý"].includes(clean)) {
    return "processing";
  }

  if (
    [
      "waiting_bank_transfer",
      "bank_pending",
      "waiting_payment",
      "payment_pending",
      "chờ chuyển khoản",
      "chờ thanh toán",
    ].includes(clean)
  ) {
    return "pending";
  }

  if (["cancelled", "canceled", "cancel", "đã hủy"].includes(clean)) {
    return "cancelled";
  }

  return "pending";
}

function getOrderStatus(order) {
  return order?.status || order?.order_status || order?.state || "pending";
}

function getOrderCustomer(order) {
  return (
    order?.customerName ||
    order?.customer_name ||
    order?.user?.name ||
    order?.user?.fullName ||
    order?.user?.full_name ||
    order?.name ||
    order?.receiver_name ||
    "Khách hàng"
  );
}

function getOrderCode(order) {
  return (
    order?.order_code ||
    order?.code ||
    order?.invoice_code ||
    `DNV-${String(order?.id || "").padStart(6, "0")}`
  );
}

function getOrderTotal(order) {
  return firstNumber(
    order?.grand_total,
    order?.final_total,
    order?.total,
    order?.total_price,
    order?.subtotal
  );
}

function getOrderDate(order) {
  const raw = order?.created_at || order?.createdAt || order?.date;

  if (!raw) return "Chưa có thời gian";

  try {
    return new Date(raw).toLocaleString("vi-VN");
  } catch {
    return String(raw);
  }
}

function getProductSold(product) {
  return firstNumber(product?.sold, product?.sold_count, product?.total_sold);
}

function getProductPrice(product) {
  return firstNumber(product?.price, product?.sale_price, product?.regular_price);
}

function getDashboardData(response) {
  const data = response?.data || response || {};
  const stats = data?.stats || {};

  return {
    revenue: firstNumber(stats?.revenue, data?.revenue, data?.total_revenue),
    totalProducts: firstNumber(
      stats?.products,
      stats?.total_products,
      data?.total_products,
      data?.products_count
    ),
    totalOrders: firstNumber(
      stats?.orders,
      stats?.total_orders,
      data?.total_orders,
      data?.orders_count
    ),
    totalCustomers: firstNumber(
      stats?.customers,
      stats?.users,
      stats?.total_customers,
      data?.total_customers,
      data?.customers_count
    ),
    totalCategories: firstNumber(
      stats?.categories,
      stats?.total_categories,
      data?.total_categories
    ),
    totalBrands: firstNumber(
      stats?.brands,
      stats?.total_brands,
      data?.total_brands
    ),
  };
}

function StatCard({ stat }) {
  const Icon = stat.icon;

  return (
    <Link
      href={stat.href}
      className="group rounded-[28px] border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-slate-950/10 backdrop-blur-xl transition hover:-translate-y-1 hover:border-orange-400/40 hover:bg-white/[0.08]"
    >
      <div className="flex items-start justify-between gap-4">
        <div
          className={
            "flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br " +
            stat.tone
          }
        >
          <Icon size={22} />
        </div>

        <ArrowUpRight
          size={18}
          className="text-slate-500 transition group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-orange-300"
        />
      </div>

      <p className="mt-5 text-sm font-bold text-slate-400">{stat.label}</p>
      <p className="mt-2 text-2xl font-black text-white">{stat.value}</p>
      <p className="mt-2 text-xs font-semibold text-slate-500">{stat.desc}</p>
    </Link>
  );
}

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState({});
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    setLoading(true);
    setError("");

    try {
      const [
        dashboardResult,
        ordersResult,
        productsResult,
        customersResult,
        inventoryResult,
      ] = await Promise.allSettled([
        getAdminDashboard(),
        getAdminOrders({ per_page: 200 }),
        getAdminProducts({ per_page: 300 }),
        getAdminCustomers({ per_page: 200 }),
        getAdminInventory({ per_page: 300 }),
      ]);

      if (dashboardResult.status === "fulfilled") {
        setDashboard(getDashboardData(dashboardResult.value));

        const chartData =
          dashboardResult.value?.data?.monthly_revenue ||
          dashboardResult.value?.data?.chart ||
          dashboardResult.value?.data?.revenue_by_month ||
          dashboardResult.value?.monthly_revenue ||
          [];

        setMonthlyRevenue(Array.isArray(chartData) ? chartData : []);
      } else {
        setDashboard({});
      }

      const nextOrders =
        ordersResult.status === "fulfilled"
          ? extractItems(ordersResult.value, ["orders", "items"])
          : [];

      const nextProducts =
        productsResult.status === "fulfilled"
          ? extractItems(productsResult.value, ["products", "items"])
          : [];

      const nextCustomers =
        customersResult.status === "fulfilled"
          ? extractItems(customersResult.value, ["customers", "users", "items"])
          : [];

      const nextInventory =
        inventoryResult.status === "fulfilled"
          ? extractItems(inventoryResult.value, ["inventory", "products", "items"])
          : [];

      setOrders(safeArray(nextOrders));
      setProducts(safeArray(nextProducts));
      setCustomers(safeArray(nextCustomers));
      setInventory(safeArray(nextInventory));

      const failed = [
        dashboardResult,
        ordersResult,
        productsResult,
        customersResult,
        inventoryResult,
      ].find((item) => item.status === "rejected");

      if (failed) {
        console.warn("Admin dashboard partial API error:", failed.reason);
      }
    } catch (err) {
      setError(err?.message || "Không thể tải dữ liệu dashboard từ API.");
      setDashboard({});
      setOrders([]);
      setProducts([]);
      setCustomers([]);
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const revenueFromOrders = useMemo(() => {
    return orders.reduce((sum, order) => sum + getOrderTotal(order), 0);
  }, [orders]);

  const pendingOrders = useMemo(() => {
    return orders.filter((order) => {
      const status = normalizeStatus(getOrderStatus(order));
      return ["pending", "processing", "shipping"].includes(status);
    });
  }, [orders]);

  const completedOrders = useMemo(() => {
    return orders.filter(
      (order) => normalizeStatus(getOrderStatus(order)) === "completed"
    );
  }, [orders]);

  const lowStockProducts = useMemo(() => {
    const source = inventory.length ? inventory : products;

    return safeArray(source)
      .map((item) => ({
        ...item,
        stockValue: getNormalizedStock(item),
        variantCount: getNormalizedVariantCount(item),
      }))
      .filter((item) => Number(item.stockValue) <= 10)
      .sort((a, b) => Number(a.stockValue) - Number(b.stockValue));
  }, [inventory, products]);

  const bestSellerProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => getProductSold(b) - getProductSold(a))
      .slice(0, 5);
  }, [products]);

  const chart = useMemo(() => {
    if (monthlyRevenue.length) {
      const values = monthlyRevenue.map((item) =>
        firstNumber(item?.revenue, item?.total, item?.value, item)
      );

      const max = Math.max(...values, 1);

      return values.map((value, index) => ({
        label:
          monthlyRevenue[index]?.label ||
          monthlyRevenue[index]?.month ||
          `T${index + 1}`,
        height: Math.max(8, Math.round((value / max) * 100)),
        value,
      }));
    }

    const monthTotals = Array.from({ length: 12 }, (_, index) => ({
      label: `T${index + 1}`,
      value: 0,
      height: 8,
    }));

    orders.forEach((order) => {
      const rawDate = order?.created_at || order?.createdAt;
      const date = rawDate ? new Date(rawDate) : null;

      if (date && !Number.isNaN(date.getTime())) {
        const monthIndex = date.getMonth();
        monthTotals[monthIndex].value += getOrderTotal(order);
      }
    });

    const max = Math.max(...monthTotals.map((item) => item.value), 1);

    return monthTotals.map((item) => ({
      ...item,
      height: item.value > 0 ? Math.max(8, Math.round((item.value / max) * 100)) : 8,
    }));
  }, [monthlyRevenue, orders]);

  const realRevenue = dashboard.revenue || revenueFromOrders;
  const realProducts = dashboard.totalProducts || products.length;
  const realOrders = dashboard.totalOrders || orders.length;
  const realCustomers = dashboard.totalCustomers || customers.length;
  const realPendingOrders = pendingOrders.length;

  const stats = [
    {
      label: "Doanh thu",
      value: formatCurrency(realRevenue),
      desc: `${completedOrders.length} đơn hoàn thành`,
      icon: TrendingUp,
      tone: "from-emerald-500/20 to-emerald-400/5 text-emerald-300",
      href: "/admin/orders",
    },
    {
      label: "Đơn cần xử lý",
      value: realPendingOrders,
      desc: "Đơn chờ xử lý hoặc đang giao",
      icon: PackageCheck,
      tone: "from-orange-500/25 to-orange-400/5 text-orange-300",
      href: "/admin/orders",
    },
    {
      label: "Sản phẩm",
      value: realProducts,
      desc: `${dashboard.totalCategories || 0} danh mục · ${
        dashboard.totalBrands || 0
      } thương hiệu`,
      icon: ShoppingBag,
      tone: "from-blue-500/20 to-blue-400/5 text-blue-300",
      href: "/admin/products",
    },
    {
      label: "Thành viên",
      value: realCustomers,
      desc: "Tài khoản khách hàng từ database",
      icon: Users,
      tone: "from-violet-500/20 to-violet-400/5 text-violet-300",
      href: "/admin/customers",
    },
  ];

  const handleExportReport = () => {
    setExporting(true);

    const rows = [
      ["Chỉ số", "Giá trị"],
      ["Doanh thu", realRevenue],
      ["Tổng đơn", realOrders],
      ["Đơn cần xử lý", realPendingOrders],
      ["Sản phẩm", realProducts],
      ["Khách hàng", realCustomers],
      ["Tồn kho thấp", lowStockProducts.length],
    ];

    const csv = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "dynova-admin-dashboard.csv";
    link.click();

    URL.revokeObjectURL(url);

    window.setTimeout(() => setExporting(false), 400);
  };

  if (loading) {
    return (
      <div className="grid min-h-[65vh] place-items-center rounded-[34px] border border-white/10 bg-white/[0.04] text-center">
        <div>
          <Loader2 className="mx-auto animate-spin text-orange-300" size={42} />
          <p className="mt-4 text-lg font-black text-white">
            Đang tải dashboard từ API...
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-400">
            Kết nối Laravel và tổng hợp dữ liệu quản trị.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-[24px] border border-rose-400/20 bg-rose-500/10 p-4 text-sm font-bold text-rose-200">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p>{error}</p>
              <button
                onClick={loadDashboard}
                className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-rose-500 px-4 py-2 text-xs font-black uppercase tracking-wider text-white transition hover:bg-rose-600"
              >
                <RefreshCw size={14} />
                Tải lại
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="overflow-hidden rounded-[34px] border border-white/10 bg-white/[0.06] shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
        <div className="grid gap-6 lg:grid-cols-[1fr_390px]">
          <div className="p-6 md:p-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-500/15 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-orange-300">
              <Star size={15} />
              API Dashboard
            </div>

            <h2 className="mt-5 max-w-2xl text-3xl font-black tracking-[-0.04em] text-white md:text-4xl">
              Tổng quan vận hành Dynova Sport
            </h2>

            <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-slate-400">
              Dashboard đang lấy dữ liệu trực tiếp từ Laravel API: doanh thu,
              đơn hàng, sản phẩm, khách hàng và tồn kho. Không còn dùng dữ liệu
              demo trong localStorage.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/admin/products"
                className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition hover:-translate-y-0.5 hover:bg-orange-600"
              >
                Quản lý sản phẩm
                <ArrowRight size={16} />
              </Link>

              <button
                type="button"
                onClick={handleExportReport}
                disabled={exporting}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-white/[0.1] disabled:opacity-60"
              >
                {exporting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Download size={16} />
                )}
                Xuất báo cáo
              </button>

              <button
                type="button"
                onClick={loadDashboard}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-white/[0.1]"
              >
                <RefreshCw size={16} />
                Làm mới
              </button>
            </div>
          </div>

          <div className="relative min-h-[260px] overflow-hidden lg:min-h-full">
            <img
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&auto=format&fit=crop&q=80"
              alt="Dashboard"
              className="absolute inset-0 h-full w-full object-cover opacity-70"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/55 to-transparent lg:bg-gradient-to-l" />

            <div className="absolute bottom-5 left-5 right-5 rounded-[26px] border border-white/10 bg-slate-950/70 p-5 backdrop-blur-xl">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">
                Hiệu suất hôm nay
              </p>

              <p className="mt-2 text-2xl font-black text-white">
                {realPendingOrders} đơn cần xử lý
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-400">
                Tổng {realOrders} đơn · {formatCurrency(realRevenue)} doanh thu.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="rounded-[30px] border border-white/10 bg-white/[0.06] p-6 shadow-xl shadow-slate-950/10 backdrop-blur-xl">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-lg font-black text-white">
                Doanh thu theo tháng
              </h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Tính từ đơn hàng API theo ngày tạo đơn.
              </p>
            </div>

            <span className="rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-black text-emerald-300">
              API realtime
            </span>
          </div>

          <div className="flex h-72 items-end gap-3">
            {chart.map((item, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end rounded-t-2xl bg-white/[0.04] p-1">
                  <div
                    title={formatCurrency(item.value)}
                    className="w-full rounded-t-xl bg-gradient-to-t from-orange-600 to-orange-300 shadow-lg shadow-orange-500/10 transition hover:from-orange-500 hover:to-orange-200"
                    style={{ height: item.height + "%" }}
                  />
                </div>

                <span className="text-[11px] font-black text-slate-500">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[30px] border border-white/10 bg-white/[0.06] p-6 shadow-xl shadow-slate-950/10 backdrop-blur-xl">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-white">
                Đơn mới tiếp nhận
              </h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                5 đơn gần nhất từ API.
              </p>
            </div>

            <Link
              href="/admin/orders"
              className="rounded-2xl bg-orange-500 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white transition hover:bg-orange-600"
            >
              Xem
            </Link>
          </div>

          <div className="space-y-3">
            {orders.length > 0 ? (
              orders.slice(0, 5).map((order) => (
                <Link
                  key={order.id}
                  href="/admin/orders"
                  className="block rounded-[22px] border border-white/10 bg-white/[0.05] p-4 transition hover:border-orange-400/40 hover:bg-white/[0.08]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black text-orange-300">
                      #{getOrderCode(order)}
                    </p>

                    <span className="rounded-full bg-white/[0.07] px-3 py-1 text-[11px] font-black text-slate-300">
                      {getOrderStatus(order)}
                    </span>
                  </div>

                  <p className="mt-2 truncate text-sm font-black text-white">
                    {getOrderCustomer(order)}
                  </p>

                  <p className="mt-2 text-sm font-semibold text-slate-400">
                    {formatCurrency(getOrderTotal(order))} ·{" "}
                    {order?.paymentMethod || order?.payment_method || "COD"}
                  </p>

                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {getOrderDate(order)}
                  </p>
                </Link>
              ))
            ) : (
              <div className="grid min-h-[260px] place-items-center rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] p-6 text-center">
                <div>
                  <ClipboardList className="mx-auto text-orange-300" size={34} />
                  <p className="mt-4 text-sm font-black text-white">
                    Chưa có đơn hàng
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Khi khách đặt hàng, đơn mới sẽ hiển thị tại đây.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[30px] border border-white/10 bg-white/[0.06] p-6 shadow-xl shadow-slate-950/10 backdrop-blur-xl">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-white">
                Sản phẩm bán chạy
              </h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Dựa theo số lượng đã bán từ bảng products.
              </p>
            </div>

            <ShoppingBag className="text-orange-300" size={22} />
          </div>

          <div className="space-y-3">
            {bestSellerProducts.length > 0 ? (
              bestSellerProducts.map((product, index) => (
                <div
                  key={product.id || index}
                  className="flex items-center gap-4 rounded-[22px] border border-white/10 bg-white/[0.04] p-4"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-sm font-black text-white">
                    {index + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-white">
                      {product.name || "Sản phẩm"}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Đã bán {getProductSold(product)}
                    </p>
                  </div>

                  <p className="shrink-0 text-sm font-black text-orange-300">
                    {formatCurrency(getProductPrice(product))}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-[22px] border border-dashed border-white/10 bg-white/[0.03] p-6 text-center text-sm font-semibold text-slate-500">
                Chưa có dữ liệu sản phẩm bán chạy.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[30px] border border-white/10 bg-white/[0.06] p-6 shadow-xl shadow-slate-950/10 backdrop-blur-xl">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-white">
                Cảnh báo tồn kho
              </h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Tính từ product_variants.stock.
              </p>
            </div>

            <Boxes className="text-orange-300" size={22} />
          </div>

          <div className="space-y-3">
            {lowStockProducts.length > 0 ? (
              lowStockProducts.slice(0, 5).map((product, index) => (
                <Link
                  href="/admin/inventory"
                  key={product.id || index}
                  className="flex items-center justify-between gap-4 rounded-[22px] border border-white/10 bg-white/[0.04] p-4 transition hover:border-orange-400/40 hover:bg-white/[0.07]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-white">
                      {product.name || "Sản phẩm"}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {product.variantCount || 0} biến thể · Cần kiểm tra tồn kho
                    </p>
                  </div>

                  <span className="rounded-full bg-rose-500/10 px-3 py-1.5 text-xs font-black text-rose-300">
                    Còn {Number(product.stockValue || 0)}
                  </span>
                </Link>
              ))
            ) : (
              <div className="rounded-[22px] border border-dashed border-white/10 bg-white/[0.03] p-6 text-center">
                <PackageCheck className="mx-auto text-emerald-300" size={34} />
                <p className="mt-3 text-sm font-black text-white">
                  Tồn kho đang ổn
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Chưa có sản phẩm nào dưới ngưỡng cảnh báo.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}