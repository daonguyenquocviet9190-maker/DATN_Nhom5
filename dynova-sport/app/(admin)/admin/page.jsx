"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Boxes,
  ClipboardList,
  Download,
  PackageCheck,
  ShoppingBag,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";

import { formatCurrency } from "@/data/shop";
import { getOrders, getProducts, getUsers } from "@/utils/shopStorage";

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function getOrderStatus(order) {
  return order?.status || order?.order_status || "Đang xử lý";
}

function getOrderCustomer(order) {
  return (
    order?.customerName ||
    order?.customer_name ||
    order?.user?.name ||
    order?.user?.fullName ||
    order?.name ||
    "Khách hàng"
  );
}

function getOrderTotal(order) {
  return Number(order?.total || order?.total_price || order?.grand_total || 0);
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    try {
      setOrders(safeArray(getOrders()));
      setProducts(safeArray(getProducts()));
      setUsers(safeArray(getUsers()));
    } catch (error) {
      console.log("Admin dashboard local data error:", error);
      setOrders([]);
      setProducts([]);
      setUsers([]);
    }
  }, []);

  const revenue = useMemo(() => {
    return orders.reduce((sum, order) => sum + getOrderTotal(order), 0);
  }, [orders]);

  const pendingOrders = useMemo(() => {
    return orders.filter((order) => {
      const status = String(getOrderStatus(order)).toLowerCase();

      return ![
        "hoàn thành",
        "completed",
        "đã hủy",
        "cancelled",
        "canceled",
      ].includes(status);
    });
  }, [orders]);

  const lowStockProducts = useMemo(() => {
    return products.filter((product) => Number(product?.stock || 0) <= 10);
  }, [products]);

  const bestSellerProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => Number(b?.sold || b?.sold_count || 0) - Number(a?.sold || a?.sold_count || 0))
      .slice(0, 5);
  }, [products]);

  const stats = [
    {
      label: "Doanh thu",
      value: formatCurrency(revenue),
      desc: "Tổng doanh thu đơn hàng",
      icon: TrendingUp,
      tone: "from-emerald-500/20 to-emerald-400/5 text-emerald-300",
      href: "/admin/orders",
    },
    {
      label: "Đơn cần xử lý",
      value: pendingOrders.length,
      desc: "Đơn đang chờ xử lý",
      icon: PackageCheck,
      tone: "from-orange-500/25 to-orange-400/5 text-orange-300",
      href: "/admin/orders",
    },
    {
      label: "Sản phẩm",
      value: products.length,
      desc: "Tổng sản phẩm đang có",
      icon: ShoppingBag,
      tone: "from-blue-500/20 to-blue-400/5 text-blue-300",
      href: "/admin/products",
    },
    {
      label: "Thành viên",
      value: users.length,
      desc: "Tài khoản khách hàng",
      icon: Users,
      tone: "from-violet-500/20 to-violet-400/5 text-violet-300",
      href: "/admin/customers",
    },
  ];

  const chart = useMemo(() => [34, 48, 42, 61, 72, 58, 76, 70, 88, 94, 86, 98], []);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[34px] border border-white/10 bg-white/[0.06] shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
        <div className="grid gap-6 lg:grid-cols-[1fr_390px]">
          <div className="p-6 md:p-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-500/15 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-orange-300">
              <Star size={15} />
              Dashboard
            </div>

            <h2 className="mt-5 max-w-2xl text-3xl font-black tracking-[-0.04em] text-white md:text-4xl">
              Tổng quan vận hành Dynova Sport
            </h2>

            <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-slate-400">
              Theo dõi nhanh doanh thu, đơn hàng, sản phẩm, khách hàng và tồn
              kho. Giao diện admin được tối ưu để quản lý website thương mại điện
              tử rõ ràng, hiện đại và dễ mở rộng với API Laravel.
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
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-white/[0.1]"
              >
                <Download size={16} />
                Xuất báo cáo
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
                {pendingOrders.length} đơn cần xử lý
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-400">
                Ưu tiên xác nhận và cập nhật trạng thái giao hàng.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Link
              key={stat.label}
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

              <p className="mt-5 text-sm font-bold text-slate-400">
                {stat.label}
              </p>

              <p className="mt-2 text-2xl font-black text-white">
                {stat.value}
              </p>

              <p className="mt-2 text-xs font-semibold text-slate-500">
                {stat.desc}
              </p>
            </Link>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="rounded-[30px] border border-white/10 bg-white/[0.06] p-6 shadow-xl shadow-slate-950/10 backdrop-blur-xl">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-lg font-black text-white">
                Doanh thu theo tháng
              </h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Dữ liệu demo theo tháng, có thể thay bằng API dashboard.
              </p>
            </div>

            <span className="rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-black text-emerald-300">
              +18.2% so với kỳ trước
            </span>
          </div>

          <div className="flex h-72 items-end gap-3">
            {chart.map((height, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end rounded-t-2xl bg-white/[0.04] p-1">
                  <div
                    className="w-full rounded-t-xl bg-gradient-to-t from-orange-600 to-orange-300 shadow-lg shadow-orange-500/10 transition hover:from-orange-500 hover:to-orange-200"
                    style={{ height: height + "%" }}
                  />
                </div>

                <span className="text-[11px] font-black text-slate-500">
                  T{index + 1}
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
                5 đơn gần nhất cần theo dõi.
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
                      #{order.id || "ORDER"}
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
                Dựa theo số lượng đã bán.
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
                      Đã bán {product.sold || product.sold_count || 0}
                    </p>
                  </div>

                  <p className="shrink-0 text-sm font-black text-orange-300">
                    {formatCurrency(product.price || 0)}
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
                Sản phẩm có tồn kho thấp.
              </p>
            </div>

            <Boxes className="text-orange-300" size={22} />
          </div>

          <div className="space-y-3">
            {lowStockProducts.length > 0 ? (
              lowStockProducts.slice(0, 5).map((product, index) => (
                <div
                  key={product.id || index}
                  className="flex items-center justify-between gap-4 rounded-[22px] border border-white/10 bg-white/[0.04] p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-white">
                      {product.name || "Sản phẩm"}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Cần kiểm tra lại tồn kho
                    </p>
                  </div>

                  <span className="rounded-full bg-rose-500/10 px-3 py-1.5 text-xs font-black text-rose-300">
                    Còn {Number(product.stock || 0)}
                  </span>
                </div>
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