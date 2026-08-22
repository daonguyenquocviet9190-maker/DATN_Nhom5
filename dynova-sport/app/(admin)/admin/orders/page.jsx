"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Eye,
  Loader2,
  PackageCheck,
  PackageX,
  RefreshCw,
  Search,
  Truck,
} from "lucide-react";

import { formatCurrency } from "@/data/shop";
import { extractItems, getAdminOrders } from "@/services/admin.service";

const FILTER_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "pending", label: "Chờ xử lý" },
  { value: "waiting_bank_transfer", label: "Chờ thanh toán" },
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "shipping", label: "Đang giao" },
  { value: "completed", label: "Hoàn thành" },
  { value: "cancelled", label: "Đã hủy" },
];

function normalizeStatus(status = "") {
  const clean = String(status || "").trim().toLowerCase();

  if (["pending", "waiting_bank_transfer", "bank_pending", "waiting_payment", "payment_pending", "chờ chuyển khoản", "chờ thanh toán"].includes(clean)) return "pending";
  if (["confirmed", "processing", "packing", "đã xác nhận", "đang xử lý"].includes(clean)) return "confirmed";
  if (["shipping", "delivering", "đang giao"].includes(clean)) return "shipping";
  if (["completed", "success", "done", "hoàn thành"].includes(clean)) return "completed";
  if (["cancelled", "canceled", "cancel", "đã hủy"].includes(clean)) return "cancelled";

  return "pending";
}

function getDisplayStatus(order) {
  const base = normalizeStatus(order?.status);
  const method = String(order?.payment_method || order?.paymentMethod || "").toLowerCase();
  const bankPayment = ["bank", "bank_transfer", "vietqr"].includes(method);
  const paid = String(order?.payment_status || order?.paymentStatus || "").toLowerCase() === "paid";

  if (bankPayment && !paid && base !== "cancelled") {
    return "waiting_bank_transfer";
  }

  return base;
}

function getPaymentStatusLabel(order) {
  const value = String(order?.payment_status || order?.paymentStatus || "unpaid").toLowerCase();
  if (value === "paid") return "Đã thanh toán";
  if (value === "refunded") return "Đã hoàn tiền";
  if (value === "failed") return "Thanh toán thất bại";

  const method = String(order?.payment_method || order?.paymentMethod || "").toLowerCase();
  return ["bank", "bank_transfer", "vietqr"].includes(method) ? "Chờ thanh toán" : "Chưa thanh toán";
}

function getStatusMeta(status = "") {
  const normalized = String(status || "pending").toLowerCase();

  const map = {
    pending: { label: "Chờ xử lý", icon: Clock3, className: "bg-amber-500/10 text-amber-300 ring-amber-400/20" },
    waiting_bank_transfer: { label: "Chờ thanh toán", icon: Clock3, className: "bg-yellow-500/10 text-yellow-300 ring-yellow-400/20" },
    confirmed: { label: "Đã xác nhận", icon: PackageCheck, className: "bg-sky-500/10 text-sky-300 ring-sky-400/20" },
    shipping: { label: "Đang giao", icon: Truck, className: "bg-indigo-500/10 text-indigo-300 ring-indigo-400/20" },
    completed: { label: "Hoàn thành", icon: CheckCircle2, className: "bg-emerald-500/10 text-emerald-300 ring-emerald-400/20" },
    cancelled: { label: "Đã hủy", icon: PackageX, className: "bg-rose-500/10 text-rose-300 ring-rose-400/20" },
  };

  return map[normalized] || map.pending;
}

function getCustomer(order) {
  return order?.customerName || order?.customer_name || order?.receiver_name || order?.shipping_name || order?.user?.name || order?.user?.fullName || order?.user?.full_name || order?.name || "Khách hàng";
}

function getCustomerSub(order) {
  return order?.email || order?.customer_email || order?.user?.email || order?.phone || order?.customer_phone || order?.shipping_phone || "Không có thông tin";
}

function getPhone(order) {
  return order?.phone || order?.customer_phone || order?.shipping_phone || order?.user?.phone || "";
}

function getOrderCode(order) {
  return order?.order_code || order?.code || order?.invoice_code || `DNV-${String(order?.id || "").padStart(6, "0")}`;
}

function getPaymentMethod(order) {
  const method = String(order?.payment_method || order?.paymentMethod || "COD").toUpperCase();
  const map = { COD: "COD", BANK: "Chuyển khoản", BANK_TRANSFER: "Chuyển khoản", VNPAY: "VNPAY", MOMO: "MoMo" };
  return map[method] || method;
}

function getTotal(order) {
  return Number(order?.grand_total || order?.final_total || order?.total || order?.total_price || order?.subtotal || 0);
}

function getCreatedAt(order) {
  const raw = order?.created_at || order?.createdAt || order?.date;
  if (!raw) return "--";

  try {
    return new Date(raw).toLocaleString("vi-VN");
  } catch {
    return String(raw);
  }
}

function getOrderItemsCount(order) {
  const items = order?.items || order?.order_items || order?.details || [];

  if (Array.isArray(items) && items.length > 0) {
    return items.reduce((sum, item) => {
      return sum + Number(item?.quantity || item?.qty || 1);
    }, 0);
  }

  return Number(
    order?.total_items ||
      order?.items_count ||
      order?.order_items_count ||
      order?.products_count ||
      order?.total_quantity ||
      0
  );
}

function getApiErrorMessage(error) {
  const data = error?.data || {};
  return data?.message || data?.error || data?.errors?.status?.[0] || error?.message || "Không thể xử lý yêu cầu.";
}

function StatCard({ title, value, icon: Icon, tone = "orange" }) {
  const toneClass =
    tone === "green"
      ? "bg-emerald-500/10 text-emerald-300"
      : tone === "blue"
        ? "bg-sky-500/10 text-sky-300"
        : tone === "rose"
          ? "bg-rose-500/10 text-rose-300"
          : "bg-orange-500/10 text-orange-300";

  return (
    <div className="rounded-[26px] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-black text-white">{value || 0}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${toneClass}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getAdminOrders({ per_page: 300 });
      const items = extractItems(response, ["orders", "items"]);

      setOrders(Array.isArray(items) ? items : []);
    } catch (err) {
      setError(getApiErrorMessage(err) || "Không thể tải danh sách đơn hàng. Vui lòng thử lại.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        const orderStatus = getDisplayStatus(order);
        acc.total += 1;
        acc.revenue += getTotal(order);
        acc[orderStatus] = Number(acc[orderStatus] || 0) + 1;
        return acc;
      },
      { total: 0, revenue: 0, pending: 0, waiting_bank_transfer: 0, confirmed: 0, shipping: 0, completed: 0, cancelled: 0 }
    );
  }, [orders]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return orders.filter((order) => {
      const orderStatus = getDisplayStatus(order);
      const text = [order?.id, getOrderCode(order), getCustomer(order), getCustomerSub(order), getPhone(order), order?.email, order?.payment_method, orderStatus]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchStatus = status === "all" || orderStatus === status;
      const matchKeyword = !keyword || text.includes(keyword);

      return matchStatus && matchKeyword;
    });
  }, [orders, query, status]);

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-300">Orders</p>
            <h2 className="mt-2 text-2xl font-black text-white">Quản lý đơn hàng</h2>
</div>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="inline-flex w-fit items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-white/[0.1] disabled:opacity-60"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Làm mới
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-5">
          <StatCard title="Tổng đơn" value={stats.total} icon={ClipboardList} />
          <StatCard title="Chờ xử lý" value={stats.pending} icon={Clock3} />
          <StatCard title="Đã xác nhận" value={stats.confirmed} icon={PackageCheck} tone="blue" />
          <StatCard title="Đang giao" value={stats.shipping} icon={Truck} tone="blue" />
          <StatCard title="Hoàn thành" value={stats.completed} icon={CheckCircle2} tone="green" />
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_240px]">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-slate-400">
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-500"
              placeholder="Tìm mã đơn, khách hàng, số điện thoại..."
            />
          </div>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm font-black text-white outline-none"
          >
            {FILTER_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {error && (
        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm font-bold text-rose-200">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p>{error}</p>
              <button
                type="button"
                onClick={loadData}
                className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-rose-500 px-4 py-2 text-xs font-black uppercase tracking-wider text-white transition hover:bg-rose-600"
              >
                <RefreshCw size={14} />
                Tải lại
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.06] backdrop-blur-xl">
        {loading ? (
          <div className="grid h-72 place-items-center">
            <div className="text-center">
              <Loader2 className="mx-auto animate-spin text-orange-300" size={34} />
              <p className="mt-4 text-sm font-black text-slate-400">Đang tải đơn hàng...</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="grid h-72 place-items-center text-center">
            <div>
              <ClipboardList className="mx-auto text-orange-300" size={42} />
              <p className="mt-4 font-black text-white">Chưa có đơn hàng</p>
              <p className="mt-1 text-sm font-semibold text-slate-500">Chưa có dữ liệu phù hợp với bộ lọc hiện tại.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left">
              <thead className="border-b border-white/10 bg-white/[0.04] text-xs font-black uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-4">Mã đơn</th>
                  <th className="px-5 py-4">Khách hàng</th>
                  <th className="px-5 py-4">Thanh toán</th>
                  <th className="px-5 py-4">Sản phẩm</th>
                  <th className="px-5 py-4">Tổng tiền</th>
                  <th className="px-5 py-4">Trạng thái</th>
                  <th className="px-5 py-4">Ngày tạo</th>
                  <th className="px-5 py-4 text-right">Thao tác</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10">
                {filtered.map((order) => {
                  const orderStatus = getDisplayStatus(order);
                  const meta = getStatusMeta(orderStatus);
                  const StatusIcon = meta.icon;

                  return (
                    <tr key={order.id} className="hover:bg-white/[0.04]">
                      <td className="px-5 py-4">
                        <p className="font-black text-orange-300">#{getOrderCode(order)}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">ID: {order.id}</p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-black text-white">{getCustomer(order)}</p>
                        <p className="mt-1 text-xs text-slate-500">{getCustomerSub(order)}</p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-bold text-slate-300">{getPaymentMethod(order)}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">{getPaymentStatusLabel(order)}</p>
                      </td>

                      <td className="px-5 py-4 text-sm font-bold text-slate-300">{getOrderItemsCount(order)} sản phẩm</td>
                      <td className="px-5 py-4 font-black text-white">{formatCurrency(getTotal(order))}</td>

                      <td className="px-5 py-4">
                        <span className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-black uppercase ring-1 ${meta.className}`}>
                          <StatusIcon size={13} />
                          {meta.label}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-500">{getCreatedAt(order)}</td>

                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white transition hover:bg-orange-600"
                        >
                          <Eye size={14} />
                          Chi tiết
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
