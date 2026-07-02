"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Copy,
  Eye,
  Filter,
  Loader2,
  PackageCheck,
  PackageX,
  RefreshCw,
  RotateCcw,
  Search,
  ShoppingBag,
  Truck,
  X,
} from "lucide-react";

import { formatCurrency } from "@/data/shop";
import {
  cancelOrder,
  getMyOrders,
  reorderOrder,
} from "@/services/order.service";

const CART_KEY = "dynova_cart";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&auto=format&fit=crop&q=80";

const orderSteps = [
  { key: "pending", label: "Đã tiếp nhận" },
  { key: "confirmed", label: "Đã xác nhận" },
  { key: "shipping", label: "Đang giao" },
  { key: "completed", label: "Hoàn thành" },
];

const filters = [
  { id: "all", label: "Tất cả" },
  { id: "pending", label: "Chờ xử lý" },
  { id: "waiting_bank_transfer", label: "Chờ chuyển khoản" },
  { id: "shipping", label: "Đang giao" },
  { id: "completed", label: "Hoàn thành" },
  { id: "cancelled", label: "Đã hủy" },
];

function normalizeStatus(status = "") {
  const clean = String(status).toLowerCase();

  if (["hoàn thành", "completed", "done", "success"].includes(clean)) {
    return "completed";
  }

  if (["đang giao", "shipping", "delivering"].includes(clean)) {
    return "shipping";
  }

  if (["đã xác nhận", "confirmed", "processing", "packing"].includes(clean)) {
    return "confirmed";
  }

  if (
    [
      "chờ chuyển khoản",
      "waiting_bank_transfer",
      "bank_pending",
      "waiting_payment",
    ].includes(clean)
  ) {
    return "waiting_bank_transfer";
  }

  if (["đã hủy", "cancelled", "canceled"].includes(clean)) {
    return "cancelled";
  }

  return "pending";
}

function getStatusMeta(status) {
  const normalized = normalizeStatus(status);

  const map = {
    pending: {
      label: "Chờ xử lý",
      icon: Clock3,
      className: "bg-orange-50 text-orange-600",
    },
    waiting_bank_transfer: {
      label: "Chờ chuyển khoản",
      icon: Clock3,
      className: "bg-amber-50 text-amber-600",
    },
    confirmed: {
      label: "Đã xác nhận",
      icon: CheckCircle2,
      className: "bg-sky-50 text-sky-600",
    },
    shipping: {
      label: "Đang giao",
      icon: Truck,
      className: "bg-indigo-50 text-indigo-600",
    },
    completed: {
      label: "Hoàn thành",
      icon: PackageCheck,
      className: "bg-emerald-50 text-emerald-600",
    },
    cancelled: {
      label: "Đã hủy",
      icon: PackageX,
      className: "bg-rose-50 text-rose-600",
    },
  };

  return map[normalized] || map.pending;
}

function getPaymentLabel(method = "") {
  const clean = String(method).toUpperCase();

  const normalized =
    clean === "COD" ? "COD" : clean === "BANK_TRANSFER" ? "BANK" : clean;

  const map = {
    COD: "Thanh toán khi nhận hàng",
    BANK: "Chuyển khoản ngân hàng",
    VNPAY: "VNPAY",
    MOMO: "MoMo",
  };

  return map[normalized] || method || "Chưa xác định";
}

function getOrderItems(order) {
  return order?.items || order?.order_items || [];
}

function getOrderTotal(order) {
  return Number(
    order?.grand_total ||
    order?.total ||
    order?.total_price ||
    order?.subtotal ||
    0
  );
}

function getOrderPhone(order) {
  return order?.customer_phone || order?.phone || "";
}

function getOrderAddress(order) {
  return (
    order?.shipping_address ||
    [order?.address, order?.ward, order?.district, order?.province]
      .filter(Boolean)
      .join(", ") ||
    "Chưa có địa chỉ"
  );
}

function getItemImage(item) {
  const image =
    item?.product_image ||
    item?.image ||
    item?.product?.image_url ||
    item?.product?.image ||
    "";

  if (!image || image.includes("product-placeholder")) {
    return FALLBACK_IMAGE;
  }

  return image;
}

function getItemName(item) {
  return item?.product_name || item?.name || item?.product?.name || "Sản phẩm";
}

function getItemQuantity(item) {
  return Number(item?.quantity || item?.qty || 1);
}

function getItemPrice(item) {
  return Number(item?.price || item?.unit_price || 0);
}

function getItemTotal(item) {
  return Number(
    item?.total ||
    item?.subtotal ||
    item?.line_total ||
    getItemPrice(item) * getItemQuantity(item)
  );
}

function getOrderCode(order) {
  return order?.order_code || `DNV-${order?.id}`;
}

function getCreatedDate(order) {
  const raw = order?.created_at || order?.createdAt;

  if (!raw) return "Chưa có thời gian";

  return new Date(raw).toLocaleString("vi-VN");
}

function canCancelOrder(order) {
  const status = normalizeStatus(order?.status);

  return ["pending", "waiting_bank_transfer", "confirmed"].includes(status);
}

function getStepDone(order, stepKey) {
  const status = normalizeStatus(order?.status);

  if (status === "cancelled") return false;

  const level = {
    pending: 1,
    waiting_bank_transfer: 1,
    confirmed: 2,
    shipping: 3,
    completed: 4,
  };

  const stepLevel = {
    pending: 1,
    confirmed: 2,
    shipping: 3,
    completed: 4,
  };

  return Number(level[status] || 1) >= Number(stepLevel[stepKey] || 1);
}

function addItemsToCart(items = []) {
  if (typeof window === "undefined") return;

  const currentCart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  const nextCart = [...currentCart];

  items.forEach((item) => {
    const productId = item.product_id || item.id || Date.now();
    const size = item.size || "Freesize";
    const color = item.color || "Mặc định";
    const key = `${productId}-${size}-${color}`;

    const exists = nextCart.find((cartItem) => cartItem.key === key);

    if (exists) {
      exists.quantity =
        Number(exists.quantity || 1) + Number(getItemQuantity(item));
    } else {
      nextCart.push({
        key,
        id: productId,
        product_id: productId,
        variantId: item.variant_id || item.product_variant_id || null,
        variant_id: item.variant_id || item.product_variant_id || null,
        name: getItemName(item),
        product_name: getItemName(item),
        image: getItemImage(item),
        size,
        color,
        quantity: getItemQuantity(item),
        price: getItemPrice(item),
      });
    }
  });

  localStorage.setItem(CART_KEY, JSON.stringify(nextCart));
  window.dispatchEvent(new Event("dynova:storage"));
}

function StatCard({ title, value, icon: Icon, tone = "orange" }) {
  const toneClass =
    tone === "green"
      ? "bg-emerald-50 text-emerald-600"
      : tone === "blue"
        ? "bg-sky-50 text-sky-600"
        : tone === "rose"
          ? "bg-rose-50 text-rose-600"
          : "bg-orange-50 text-orange-600";

  return (
    <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/70">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            {title}
          </p>

          <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950">
            {value || 0}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${toneClass}`}
        >
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ hasFilter }) {
  return (
    <div className="rounded-[34px] border border-slate-200 bg-white p-10 text-center shadow-sm">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-50 text-orange-500">
        <PackageCheck size={42} />
      </div>

      <h2 className="mt-5 text-2xl font-black text-slate-950">
        {hasFilter ? "Không tìm thấy đơn hàng" : "Chưa có đơn hàng"}
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-500">
        {hasFilter
          ? "Bạn thử đổi bộ lọc hoặc tìm bằng mã đơn khác nha."
          : "Bạn có thể quay lại cửa hàng để chọn sản phẩm và trải nghiệm luồng đặt hàng đầy đủ."}
      </p>

      <Link
        href="/shop"
        className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-6 py-4 text-xs font-black uppercase tracking-wider text-white transition hover:-translate-y-0.5 hover:bg-orange-600"
      >
        Mua sắm ngay
        <ArrowRight size={15} />
      </Link>
    </div>
  );
}

function OrderDetailModal({ order, loading, onClose, onCancel, onReorder }) {
  if (!order) return null;

  const items = getOrderItems(order);
  const statusMeta = getStatusMeta(order.status);
  const StatusIcon = statusMeta.icon;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-[34px] bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 md:p-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-500">
              Chi tiết đơn hàng
            </p>

            <h2 className="mt-2 text-2xl font-black text-slate-950">
              #{getOrderCode(order)}
            </h2>

            <p className="mt-1 text-sm font-bold text-slate-500">
              {getCreatedDate(order)}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-2xl bg-slate-100 p-3 text-slate-500 transition hover:bg-rose-50 hover:text-rose-500"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[calc(92vh-96px)] overflow-y-auto p-5 md:p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl bg-slate-50 p-5">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                Trạng thái
              </p>

              <div
                className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black ${statusMeta.className}`}
              >
                <StatusIcon size={15} />
                {statusMeta.label}
              </div>
            </div>

            <div className="rounded-3xl bg-slate-50 p-5">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                Thanh toán
              </p>

              <p className="mt-3 text-sm font-black text-slate-950">
                {getPaymentLabel(order.payment_method || order.paymentMethod)}
              </p>

              <p className="mt-1 text-xs font-bold text-slate-500">
                {order.payment_status || order.paymentStatus || "Chưa xác định"}
              </p>
            </div>

            <div className="rounded-3xl bg-slate-950 p-5 text-white">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                Tổng tiền
              </p>

              <p className="mt-3 text-2xl font-black text-orange-300">
                {formatCurrency(getOrderTotal(order))}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-3xl bg-slate-50 p-5">
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">
              Thông tin nhận hàng
            </p>

            <div className="mt-3 grid gap-2 text-sm font-bold text-slate-600 md:grid-cols-2">
              <p>
                Người nhận:{" "}
                <span className="text-slate-950">
                  {order.customer_name || order.customerName || "Khách hàng"}
                </span>
              </p>

              <p>
                Số điện thoại:{" "}
                <span className="text-slate-950">
                  {getOrderPhone(order) || "Chưa có"}
                </span>
              </p>

              <p className="md:col-span-2">
                Địa chỉ:{" "}
                <span className="text-slate-950">
                  {getOrderAddress(order)}
                </span>
              </p>

              {order.note && (
                <p className="md:col-span-2">
                  Ghi chú: <span className="text-slate-950">{order.note}</span>
                </p>
              )}
            </div>
          </div>

          <div className="mt-5">
            <h3 className="text-lg font-black text-slate-950">
              Sản phẩm trong đơn
            </h3>

            <div className="mt-4 space-y-3">
              {items.length === 0 ? (
                <div className="rounded-3xl bg-slate-50 p-5 text-sm font-bold text-slate-500">
                  Đơn hàng này chưa có sản phẩm.
                </div>
              ) : (
                items.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="flex gap-3 rounded-3xl border border-slate-200 bg-white p-3"
                  >
                    <img
                      src={getItemImage(item)}
                      alt={getItemName(item)}
                      onError={(event) => {
                        event.currentTarget.src = FALLBACK_IMAGE;
                      }}
                      className="h-20 w-20 rounded-2xl object-cover"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-black text-slate-950">
                        {getItemName(item)}
                      </p>

                      <p className="mt-1 text-xs font-bold text-slate-500">
                        {getItemQuantity(item)} x {item.size || "Freesize"} /{" "}
                        {item.color || "Mặc định"}
                      </p>

                      <p className="mt-2 text-sm font-black text-orange-600">
                        {formatCurrency(getItemPrice(item))}
                      </p>
                    </div>

                    <p className="text-sm font-black text-slate-950">
                      {formatCurrency(getItemTotal(item))}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-4">
            {orderSteps.map((step, index) => {
              const done = getStepDone(order, step.key);

              return (
                <div
                  key={step.key}
                  className={
                    "rounded-2xl p-3 text-xs font-black transition " +
                    (done
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-400")
                  }
                >
                  {index + 1}. {step.label}
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              onClick={() => window.print()}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50"
            >
              In đơn hàng
            </button>

            <button
              onClick={() => onReorder(order)}
              disabled={loading || items.length === 0}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-orange-500 disabled:opacity-70"
            >
              <RotateCcw size={15} />
              Mua lại
            </button>

            {canCancelOrder(order) && (
              <button
                onClick={() => onCancel(order)}
                disabled={loading}
                className="rounded-2xl bg-rose-500 px-5 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-rose-600 disabled:opacity-70"
              >
                Hủy đơn
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderCard({ order, onCancel, onReorder }) {
  const statusMeta = getStatusMeta(order.status);
  const StatusIcon = statusMeta.icon;
  const items = getOrderItems(order);

  return (
    <article className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/80 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-black uppercase tracking-wider text-orange-500">
              #{getOrderCode(order)}
            </p>

            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(getOrderCode(order))}
              className="rounded-full bg-slate-100 p-1.5 text-slate-400 transition hover:bg-orange-50 hover:text-orange-500"
            >
              <Copy size={13} />
            </button>
          </div>

          <h2 className="mt-2 text-xl font-black text-slate-950">
            {order.customer_name || order.customerName || "Khách hàng"}
          </h2>

          <p className="mt-1 text-sm font-bold text-slate-500">
            {getCreatedDate(order)} •{" "}
            {getPaymentLabel(order.payment_method || order.paymentMethod)}
          </p>
        </div>

        <span
          className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-xs font-black ${statusMeta.className}`}
        >
          <StatusIcon size={15} />
          {statusMeta.label}
        </span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-[1fr_300px]">
        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">
              Chưa có sản phẩm trong đơn hàng.
            </div>
          ) : (
            items.slice(0, 3).map((item, index) => (
              <div
                key={item.id || index}
                className="flex gap-3 rounded-2xl bg-slate-50 p-3"
              >
                <img
                  src={getItemImage(item)}
                  alt={getItemName(item)}
                  onError={(event) => {
                    event.currentTarget.src = FALLBACK_IMAGE;
                  }}
                  className="h-16 w-16 rounded-xl object-cover"
                />

                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-black text-slate-950">
                    {getItemName(item)}
                  </p>

                  <p className="mt-1 text-xs font-bold text-slate-500">
                    {getItemQuantity(item)} x {item.size || "Freesize"} /{" "}
                    {item.color || "Mặc định"}
                  </p>
                </div>

                <p className="text-sm font-black text-slate-900">
                  {formatCurrency(getItemTotal(item))}
                </p>
              </div>
            ))
          )}

          {items.length > 3 && (
            <p className="rounded-2xl bg-slate-50 p-3 text-center text-xs font-black text-slate-500">
              +{items.length - 3} sản phẩm khác
            </p>
          )}
        </div>

        <div className="rounded-3xl bg-slate-950 p-5 text-white">
          <p className="text-sm font-bold text-slate-300">Tổng thanh toán</p>

          <p className="mt-1 text-2xl font-black text-orange-300">
            {formatCurrency(getOrderTotal(order))}
          </p>

          <p className="mt-3 text-xs font-bold leading-6 text-slate-300">
            Giao tới: {getOrderAddress(order)}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href={`/orders/${order.id}`}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-950 transition hover:bg-orange-50 hover:text-orange-600"
            >
              <Eye size={15} />
              Chi tiết
            </Link>

            <button
              onClick={() => onReorder(order)}
              disabled={items.length === 0}
              className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-white/20 disabled:opacity-60"
            >
              <RotateCcw size={15} />
              Mua lại
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-4">
        {orderSteps.map((step, index) => {
          const done = getStepDone(order, step.key);

          return (
            <div
              key={step.key}
              className={
                "rounded-2xl p-3 text-xs font-black transition " +
                (done
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-slate-400")
              }
            >
              {index + 1}. {step.label}
            </div>
          );
        })}
      </div>

      {canCancelOrder(order) && (
        <button
          onClick={() => onCancel(order)}
          className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-xs font-black uppercase tracking-wider text-rose-600 transition hover:bg-rose-500 hover:text-white"
        >
          Hủy đơn hàng
        </button>
      )}
    </article>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const hasFilter = activeFilter !== "all" || search.trim();

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const status = normalizeStatus(order.status);
      const code = getOrderCode(order).toLowerCase();
      const phone = String(getOrderPhone(order) || "").toLowerCase();

      const matchStatus = activeFilter === "all" || status === activeFilter;

      const keyword = search.trim().toLowerCase();

      const matchSearch =
        !keyword ||
        code.includes(keyword) ||
        phone.includes(keyword);

      return matchStatus && matchSearch;
    });
  }, [orders, activeFilter, search]);

  const showNotice = (text) => {
    setNotice(text);
    setTimeout(() => setNotice(""), 2200);
  };

  const loadOrders = async () => {
    setPageLoading(true);
    setError("");

    try {
      const data = await getMyOrders();

      setOrders(data.orders || []);
      setStats(data.stats || {});
    } catch (err) {
      setError(
        err.message ||
        "Không thể tải lịch sử đơn hàng. Vui lòng đăng nhập lại."
      );
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);


  const handleCancel = async (order) => {
    const ok = window.confirm(
      `Bạn có chắc muốn hủy đơn ${getOrderCode(order)} không?`
    );

    if (!ok) return;

    setActionLoading(true);
    setError("");

    try {
      const response = await cancelOrder(order.id);
      const updatedOrder = response.data || order;

      setOrders((prev) =>
        prev.map((item) =>
          String(item.id) === String(order.id) ? updatedOrder : item
        )
      );

      setSelectedOrder((prev) =>
        prev && String(prev.id) === String(order.id) ? updatedOrder : prev
      );

      showNotice("Đã hủy đơn hàng thành công.");
      loadOrders();
    } catch (err) {
      setError(err.message || "Không thể hủy đơn hàng.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReorder = async (order) => {
    setActionLoading(true);
    setError("");

    try {
      const response = await reorderOrder(order.id);
      const reorderData = response.data || order;
      const items = getOrderItems(reorderData);

      addItemsToCart(items);
      showNotice("Đã thêm sản phẩm của đơn hàng vào giỏ.");
    } catch {
      const items = getOrderItems(order);

      addItemsToCart(items);
      showNotice("Đã thêm sản phẩm của đơn hàng vào giỏ.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8fb] py-10">
      {notice && (
        <div className="fixed right-5 top-24 z-[95] rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-2xl">
          {notice}
        </div>
      )}

      <div className="container-page">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-500">
              Order tracking
            </p>

            <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] text-slate-950">
              Lịch sử mua hàng
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
              Theo dõi trạng thái đơn hàng, phương thức thanh toán, sản phẩm đã
              mua và thao tác hủy đơn hoặc mua lại nhanh chóng.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={loadOrders}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCw size={15} />
              Làm mới
            </button>

            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-orange-600"
            >
              <ShoppingBag size={15} />
              Mua thêm
            </Link>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <StatCard
            title="Tổng đơn"
            value={stats.total || orders.length}
            icon={PackageCheck}
          />

          <StatCard
            title="Đang xử lý"
            value={stats.pending}
            icon={Clock3}
            tone="orange"
          />

          <StatCard
            title="Đang giao"
            value={stats.shipping}
            icon={Truck}
            tone="blue"
          />

          <StatCard
            title="Hoàn thành"
            value={stats.completed}
            icon={CheckCircle2}
            tone="green"
          />
        </div>

        <div className="mb-6 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm theo mã đơn hoặc số điện thoại..."
                className="h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-bold text-slate-950 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-500">
                <Filter size={15} />
                Lọc
              </span>

              {filters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={
                    "rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-wider transition " +
                    (activeFilter === filter.id
                      ? "bg-slate-950 text-white"
                      : "bg-slate-50 text-slate-500 hover:bg-orange-50 hover:text-orange-600")
                  }
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-3xl border border-rose-100 bg-rose-50 p-4 text-sm font-bold text-rose-600">
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="mt-0.5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {pageLoading ? (
          <div className="grid place-items-center rounded-[34px] border border-slate-200 bg-white p-16 shadow-sm">
            <Loader2 size={36} className="animate-spin text-orange-500" />
            <p className="mt-4 text-sm font-black text-slate-500">
              Đang tải lịch sử đơn hàng...
            </p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <EmptyState hasFilter={hasFilter} />
        ) : (
          <div className="space-y-5">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onCancel={handleCancel}
                onReorder={handleReorder}
              />
            ))}
          </div>
        )}
      </div>

      {/* {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          loading={actionLoading}
          onClose={() => setSelectedOrder(null)}
          onCancel={handleCancel}
          onReorder={handleReorder}
        />
      )} */}
    </div>
  );
}