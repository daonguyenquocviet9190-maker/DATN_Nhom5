"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Loader2,
  MapPin,
  PackageCheck,
  PackageX,
  Phone,
  RefreshCw,
  ShieldCheck,
  Store,
  Truck,
  User,
} from "lucide-react";

import { formatCurrency } from "@/data/shop";
import {
  getAdminOrderById,
  syncAdminOrderShipping,
  updateAdminOrderStatus,
} from "@/services/admin.service";
import { getShippingStatus } from "@/services/address.service";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"
).replace(/\/$/, "");

const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&auto=format&fit=crop&q=80";

const TIMELINE_STEPS = [
  { key: "pending", label: "Chờ xử lý", icon: Clock3 },
  { key: "confirmed", label: "Đang chuẩn bị", icon: PackageCheck },
  { key: "shipping", label: "Đang giao", icon: Truck },
  { key: "completed", label: "Hoàn thành", icon: CheckCircle2 },
];

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function encodePath(value) {
  return String(value)
    .replace(/\\/g, "/")
    .split("/")
    .map((part) => encodeURIComponent(safeDecode(part)))
    .join("/");
}

function toStorageProductImage(value) {
  const raw = String(value || "").trim();

  if (!raw || raw.includes("product-placeholder")) return FALLBACK_IMAGE;

  if (/^(https?:)?\/\//i.test(raw) || raw.startsWith("data:") || raw.startsWith("blob:")) {
    return raw;
  }

  const clean = raw.replace(/\\/g, "/");

  if (clean.startsWith("/storage/")) return `${API_ORIGIN}${encodePath(clean)}`;
  if (clean.startsWith("storage/")) return `${API_ORIGIN}/${encodePath(clean)}`;
  if (clean.startsWith("products/")) return `${API_ORIGIN}/storage/${encodePath(clean)}`;
  if (clean.startsWith("/")) return clean;

  return `${API_ORIGIN}/storage/products/${encodePath(clean)}`;
}

function normalizeStatus(status = "") {
  const clean = String(status || "").trim().toLowerCase();

  if (["pending", "waiting_bank_transfer", "bank_pending", "waiting_payment", "payment_pending", "chờ chuyển khoản", "chờ thanh toán"].includes(clean)) return "pending";
  if (["confirmed", "processing", "packing", "đã xác nhận", "đang xử lý"].includes(clean)) return "confirmed";
  if (["shipping", "delivering", "đang giao"].includes(clean)) return "shipping";
  if (["completed", "success", "done", "hoàn thành"].includes(clean)) return "completed";
  if (["cancelled", "canceled", "cancel", "đã hủy"].includes(clean)) return "cancelled";

  return "pending";
}

function getStatusMeta(status = "") {
  const raw = String(status || "").trim().toLowerCase();
  const normalized = raw === "waiting_bank_transfer" ? "waiting_bank_transfer" : normalizeStatus(status);

  const map = {
    pending: { label: "Chờ xử lý", icon: Clock3, className: "bg-amber-500/10 text-amber-300 ring-amber-400/20" },
    waiting_bank_transfer: { label: "Chờ thanh toán", icon: Clock3, className: "bg-yellow-500/10 text-yellow-300 ring-yellow-400/20" },
    confirmed: { label: "Đang chuẩn bị", icon: PackageCheck, className: "bg-sky-500/10 text-sky-300 ring-sky-400/20" },
    shipping: { label: "Đang giao", icon: Truck, className: "bg-indigo-500/10 text-indigo-300 ring-indigo-400/20" },
    completed: { label: "Hoàn thành", icon: CheckCircle2, className: "bg-emerald-500/10 text-emerald-300 ring-emerald-400/20" },
    cancelled: { label: "Đã hủy", icon: PackageX, className: "bg-rose-500/10 text-rose-300 ring-rose-400/20" },
  };

  return map[normalized] || map.pending;
}

function extractOrder(response) {
  return response?.data?.order || response?.data?.data?.order || response?.data?.data || response?.data || response?.order || response || null;
}

function getOrderItems(order) {
  return order?.items || order?.order_items || order?.details || [];
}

function getCustomer(order) {
  return order?.customerName || order?.customer_name || order?.receiver_name || order?.shipping_name || order?.user?.name || order?.user?.fullName || order?.user?.full_name || order?.name || "Khách hàng";
}

function getEmail(order) {
  return order?.email || order?.customer_email || order?.user?.email || "";
}

function getPhone(order) {
  return order?.phone || order?.customer_phone || order?.shipping_phone || order?.user?.phone || "";
}

function getAddress(order) {
  return order?.shipping_address || order?.full_address || [order?.address, order?.ward, order?.district, order?.province].filter(Boolean).join(", ") || "Chưa cập nhật địa chỉ";
}

function getOrderCode(order) {
  return order?.order_code || order?.code || order?.invoice_code || `DNV-${String(order?.id || "").padStart(6, "0")}`;
}

function getPaymentMethod(order) {
  const method = String(order?.payment_method || order?.paymentMethod || "COD").toUpperCase();

  const map = {
    COD: "Thanh toán khi nhận hàng",
    BANK: "Chuyển khoản ngân hàng",
    BANK_TRANSFER: "Chuyển khoản ngân hàng",
    VNPAY: "VNPAY",
  };

  return map[method] || method;
}

function getTotal(order) {
  return Number(order?.grand_total || order?.final_total || order?.total || order?.total_price || order?.subtotal || 0);
}

function getSubtotal(order) {
  return Number(order?.subtotal || order?.total_price || 0);
}

function getShippingFee(order) {
  return Number(order?.shipping_fee || order?.shipping || 0);
}

function getDiscount(order) {
  return Number(order?.discount || order?.discount_amount || 0);
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

function formatDateTime(value) {
  if (!value) return "--";

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString("vi-VN");
}

function getItemName(item) {
  return item?.product_name || item?.name || item?.product?.name || "Sản phẩm";
}

function getItemRawImage(item) {
  return item?.variant_image || item?.product_variant?.image || item?.productVariant?.image || item?.product_image || item?.image_url || item?.image || item?.thumbnail || item?.product?.image_url || item?.product?.image || item?.product?.thumbnail || "";
}

function getItemImage(item) {
  return toStorageProductImage(getItemRawImage(item));
}

function handleImageError(event) {
  if (event.currentTarget.src !== FALLBACK_IMAGE) {
    event.currentTarget.src = FALLBACK_IMAGE;
  }
}

function getItemQuantity(item) {
  return Number(item?.quantity || item?.qty || 1);
}

function getItemPrice(item) {
  return Number(item?.price || item?.unit_price || item?.sale_price || 0);
}

function getItemTotal(item) {
  return Number(item?.total || item?.subtotal || item?.line_total || getItemPrice(item) * getItemQuantity(item));
}

function getItemSize(item) {
  return item?.size || item?.product_variant?.size || item?.productVariant?.size;
}

function getItemColor(item) {
  return item?.color || item?.product_variant?.color || item?.productVariant?.color;
}

function getApiErrorMessage(error) {
  const data = error?.data || {};

  return data?.message || data?.error || data?.errors?.status?.[0] || error?.message || "Không thể xử lý yêu cầu.";
}

export default function AdminOrderDetailPage() {
  const params = useParams();
  const orderId = params?.id;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingAction, setSavingAction] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [shippingConfig, setShippingConfig] = useState(null);
  const [shippingAction, setShippingAction] = useState("");
  const [deliveryProvider, setDeliveryProvider] = useState("shop_staff");
  const [deliveryConfirmationOpen, setDeliveryConfirmationOpen] = useState(false);
  const [collectionForm, setCollectionForm] = useState({
    customerReceived: false,
    amount: "",
    method: "cash",
    note: "",
  });

  const items = useMemo(() => getOrderItems(order), [order]);
  const status = normalizeStatus(order?.status || "pending");
  const paymentMethod = String(order?.payment_method || order?.paymentMethod || "").toLowerCase();
  const bankPayment = ["bank", "bank_transfer", "vietqr"].includes(paymentMethod);
  const paymentPaid = String(order?.payment_status || order?.paymentStatus || "").toLowerCase() === "paid";
  const codCollectionRequired = paymentMethod === "cod" && !paymentPaid;
  const bankUnpaid = bankPayment && !paymentPaid && status !== "cancelled";
  const displayStatus = bankUnpaid ? "waiting_bank_transfer" : status;
  const statusMeta = getStatusMeta(displayStatus);
  const StatusIcon = statusMeta.icon;
  const paymentLocked = bankUnpaid;
  const shippingProvider = String(order?.shipping_provider || "").toLowerCase();
  const hasGhnShipment = shippingProvider === "ghn" && Boolean(order?.tracking_code);
  const shopDelivery = shippingProvider === "shop_staff";
  const ghnAvailable = Boolean(shippingConfig?.configured);

  const loadOrder = async ({ silent = false } = {}) => {
    if (!orderId) return;

    try {
      if (!silent) setLoading(true);
      if (!silent) setError("");

      const response = await getAdminOrderById(orderId);
      const data = extractOrder(response);

      setOrder(data);
    } catch (err) {
      setError(getApiErrorMessage(err) || "Không thể tải chi tiết đơn hàng.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  useEffect(() => {
    getShippingStatus().then((data) => setShippingConfig(data || null)).catch(() => setShippingConfig(null));
  }, []);

  useEffect(() => {
    if (status !== "confirmed" || order?.tracking_code) return;
    setDeliveryProvider(ghnAvailable ? "ghn" : "shop_staff");
  }, [ghnAvailable, order?.id, order?.tracking_code, status]);

  useEffect(() => {
    if (!bankUnpaid || !order?.id) return undefined;
    const timer = window.setInterval(() => loadOrder({ silent: true }), 2500);
    return () => window.clearInterval(timer);
  }, [bankUnpaid, order?.id]);

  // Chỉ ở GHN staging/demo: refresh trang để tick mô phỏng LOCAL.
  // Backend staging không gọi GHN tracking thật ở mỗi lần refresh nên có thể
  // cập nhật nhanh mà không gặp rate-limit của GHN. Production vẫn dùng GHN thật.
  useEffect(() => {
    const isGhnDemo =
      shippingConfig?.environment === "staging" &&
      hasGhnShipment &&
      ["confirmed", "shipping"].includes(status);

    if (!isGhnDemo || !order?.id) return undefined;

    const timer = window.setInterval(() => {
      loadOrder({ silent: true });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [shippingConfig?.environment, hasGhnShipment, status, order?.id]);

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 1800);
  };

  const handleUpdateStatus = async (nextStatus, options = {}) => {
    if (!order?.id) return;

    try {
      setSaving(true);
      setSavingAction(nextStatus === "shipping" ? options.shipping_provider || nextStatus : nextStatus);
      setError("");

      const response = await updateAdminOrderStatus(order.id, nextStatus, options);
      const updatedOrder = extractOrder(response) || { ...order, status: nextStatus };
      const savedStatus = normalizeStatus(updatedOrder?.status || response?.current_status || response?.data?.status || nextStatus);

      setOrder({ ...order, ...updatedOrder, status: savedStatus });
      showNotice(response?.message || "Đã cập nhật trạng thái đơn hàng.");
      await loadOrder();
      return true;
    } catch (err) {
      setError(getApiErrorMessage(err) || "Không thể cập nhật trạng thái đơn hàng.");
      return false;
    } finally {
      setSaving(false);
      setSavingAction("");
    }
  };

  const handleCancelOrder = () => {
    if (window.confirm("Bạn chắc chắn muốn hủy đơn? Tồn kho sẽ được hoàn lại và thao tác này không thể đảo ngược.")) {
      handleUpdateStatus("cancelled");
    }
  };

  const handleCompleteShopDelivery = () => {
    setError("");
    setCollectionForm({
      customerReceived: false,
      amount: String(Math.round(getTotal(order))),
      method: "cash",
      note: "",
    });
    setDeliveryConfirmationOpen(true);
  };

  const submitShopDeliveryConfirmation = async (event) => {
    event.preventDefault();

    const collectedAmount = Number(collectionForm.amount);
    const expectedAmount = getTotal(order);

    if (!collectionForm.customerReceived) {
      setError("Vui lòng xác nhận khách hàng đã nhận hàng trước khi hoàn tất đơn.");
      return;
    }

    if (
      codCollectionRequired &&
      (!Number.isFinite(collectedAmount) || Math.abs(collectedAmount - expectedAmount) > 0.01)
    ) {
      setError(`Số tiền thực thu phải bằng ${formatCurrency(expectedAmount)}.`);
      return;
    }

    const success = await handleUpdateStatus("completed", {
      customer_received: true,
      payment_collected: codCollectionRequired ? true : undefined,
      collected_amount: codCollectionRequired ? collectedAmount : undefined,
      collection_method: codCollectionRequired ? collectionForm.method : undefined,
      collection_note: collectionForm.note.trim() || undefined,
      note: collectionForm.note.trim() || undefined,
    });

    if (success) {
      setDeliveryConfirmationOpen(false);
    }
  };

  const handleShippingSync = async () => {
    if (!order?.id) return;
    try { setShippingAction("sync"); setError(""); const response = await syncAdminOrderShipping(order.id); showNotice(response?.message || "Đã đồng bộ trạng thái vận chuyển."); await loadOrder(); }
    catch (err) { setError(getApiErrorMessage(err)); } finally { setShippingAction(""); }
  };


  if (loading) {
    return (
      <div className="grid min-h-[65vh] place-items-center rounded-[34px] border border-white/10 bg-white/[0.04] text-center">
        <div>
          <Loader2 className="mx-auto animate-spin text-orange-300" size={42} />
          <p className="mt-4 text-lg font-black text-white">Đang tải chi tiết đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="rounded-[32px] border border-rose-500/20 bg-rose-500/10 p-8 text-center">
        <AlertCircle className="mx-auto text-rose-300" size={42} />
        <h2 className="mt-4 text-xl font-black text-white">Không thể tải đơn hàng</h2>
        <p className="mt-2 text-sm font-semibold text-rose-200">{error}</p>

        <Link href="/admin/orders" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black text-white transition hover:bg-orange-600">
          <ArrowLeft size={16} />
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {notice && (
        <div className="fixed right-5 top-24 z-[120] rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black text-white shadow-2xl shadow-orange-950/40">
          {notice}
        </div>
      )}

      {deliveryConfirmationOpen && (
        <div className="fixed inset-0 z-[150] grid place-items-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <form
            onSubmit={submitShopDeliveryConfirmation}
            className="w-full max-w-lg rounded-[32px] border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-black/50"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
                <CheckCircle2 size={23} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">
                  {codCollectionRequired
                    ? "Xác nhận giao hàng và thu COD"
                    : "Xác nhận giao hàng thành công"}
                </h3>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">
                  {codCollectionRequired
                    ? "Chỉ xác nhận sau khi khách đã nhận hàng và nhân viên đã thu đủ tiền."
                    : "Đơn đã thanh toán trước, thao tác này chỉ xác nhận khách đã nhận hàng."}
                </p>
              </div>
            </div>

            <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-4">
              <input
                type="checkbox"
                checked={collectionForm.customerReceived}
                onChange={(event) =>
                  setCollectionForm((current) => ({ ...current, customerReceived: event.target.checked }))
                }
                className="mt-1 h-5 w-5 shrink-0 accent-emerald-500"
              />
              <span>
                <span className="block text-sm font-black text-white">Khách hàng đã nhận hàng</span>
                <span className="mt-1 block text-xs font-semibold leading-5 text-slate-400">
                  Chỉ tích sau khi shop xác nhận hàng đã được giao đến khách thành công.
                </span>
              </span>
            </label>

            {codCollectionRequired && (
              <div className="mt-4 space-y-4">
                <div className="rounded-3xl border border-orange-400/20 bg-orange-500/10 p-4">
                  <p className="text-xs font-black uppercase tracking-wider text-orange-300">Số tiền phải thu</p>
                  <p className="mt-1 text-2xl font-black text-white">{formatCurrency(getTotal(order))}</p>
                </div>

                <label className="block">
                  <span className="text-sm font-black text-slate-200">Số tiền thực thu</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={collectionForm.amount}
                    onChange={(event) =>
                      setCollectionForm((current) => ({ ...current, amount: event.target.value }))
                    }
                    className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 font-black text-white outline-none transition focus:border-orange-400"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-black text-slate-200">Hình thức đã nhận tiền</span>
                  <select
                    value={collectionForm.method}
                    onChange={(event) =>
                      setCollectionForm((current) => ({ ...current, method: event.target.value }))
                    }
                    className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-slate-800 px-4 font-bold text-white outline-none transition focus:border-orange-400"
                  >
                    <option value="cash">Tiền mặt</option>
                    <option value="bank_transfer">Chuyển khoản khi giao hàng</option>
                  </select>
                </label>
              </div>
            )}

            <label className="mt-4 block">
              <span className="text-sm font-black text-slate-200">Ghi chú giao hàng</span>
              <textarea
                rows={3}
                maxLength={1000}
                value={collectionForm.note}
                onChange={(event) =>
                  setCollectionForm((current) => ({ ...current, note: event.target.value }))
                }
                placeholder="Ví dụ: khách đã kiểm tra hàng và thanh toán đủ..."
                className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-orange-400"
              />
            </label>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeliveryConfirmationOpen(false)}
                disabled={saving}
                className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-black text-slate-300 transition hover:bg-white/[0.06] disabled:opacity-50"
              >
                Quay lại
              </button>
              <button
                type="submit"
                disabled={saving || !collectionForm.customerReceived}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingAction === "completed" ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={17} />
                )}
                {codCollectionRequired ? "Xác nhận đã giao và thu đủ" : "Xác nhận đã giao"}
              </button>
            </div>
          </form>
        </div>
      )}

      <section className="rounded-[32px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
        <Link href="/admin/orders" className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm font-black text-slate-200 transition hover:bg-white/[0.1] hover:text-white">
          <ArrowLeft size={16} />
          Quay lại đơn hàng
        </Link>

        <div className="mt-6 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-300">Order detail</p>
            <h2 className="mt-2 text-3xl font-black text-white">#{getOrderCode(order)}</h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">Ngày tạo: {getCreatedAt(order)}</p>
          </div>

          <div className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase ring-1 ${statusMeta.className}`}>
            <StatusIcon size={15} />
            {statusMeta.label}
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm font-bold text-rose-200">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="rounded-[32px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-white">Tiến trình đơn hàng</h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">GHN tự cập nhật sau khi lấy hàng; đơn nội bộ do nhân viên shop xác nhận theo từng bước.</p>
              </div>
              <ShieldCheck className="text-orange-300" size={24} />
            </div>

            {status === "cancelled" ? (
              <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-5 text-sm font-bold text-rose-200">Đơn hàng đã hủy và không thể kích hoạt lại.</div>
            ) : (
              <div className="grid gap-3 md:grid-cols-4">
                {TIMELINE_STEPS.map((step) => {
                  const Icon = step.icon;
                  const orderLevel = { pending: 1, confirmed: 2, shipping: 3, completed: 4 };
                  const active = Number(orderLevel[status] || 1) >= Number(orderLevel[step.key] || 1);

                  return (
                    <div key={step.key} className={"rounded-3xl border p-4 " + (active ? "border-orange-400/30 bg-orange-500/10" : "border-white/10 bg-white/[0.04]")}> 
                      <div className={"flex h-11 w-11 items-center justify-center rounded-2xl " + (active ? "bg-orange-500 text-white" : "bg-white/[0.06] text-slate-500")}>
                        <Icon size={20} />
                      </div>
                      <p className={"mt-3 text-sm font-black " + (active ? "text-orange-200" : "text-slate-500")}>{step.label}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-[32px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-white">Sản phẩm trong đơn</h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">Tổng cộng {items.length} dòng sản phẩm.</p>
              </div>
              <ClipboardList className="text-orange-300" size={24} />
            </div>

            <div className="space-y-3">
              {items.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-8 text-center">
                  <PackageX className="mx-auto text-orange-300" size={38} />
                  <p className="mt-3 text-sm font-black text-white">Đơn hàng chưa có sản phẩm</p>
                </div>
              ) : (
                items.map((item, index) => {
                  const quantity = getItemQuantity(item);
                  const price = getItemPrice(item);
                  const size = getItemSize(item);
                  const color = getItemColor(item);

                  return (
                    <div key={item.id || index} className="flex gap-4 rounded-[26px] border border-white/10 bg-white/[0.04] p-4">
                      <img src={getItemImage(item)} alt={getItemName(item)} onError={handleImageError} className="h-20 w-20 rounded-2xl object-cover" />

                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-black text-white">{getItemName(item)}</p>

                        <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold text-slate-400">
                          {size && <span className="rounded-full bg-white/[0.06] px-3 py-1">Size: {size}</span>}
                          {color && <span className="rounded-full bg-white/[0.06] px-3 py-1">Màu: {color}</span>}
                          <span className="rounded-full bg-white/[0.06] px-3 py-1">SL: {quantity}</span>
                        </div>

                        <p className="mt-3 text-sm font-black text-orange-300">{formatCurrency(price)}</p>
                      </div>

                      <p className="shrink-0 text-sm font-black text-white">{formatCurrency(getItemTotal(item))}</p>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-[32px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
            <h3 className="text-lg font-black text-white">Xử lý đơn hàng</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">Chỉ hiển thị thao tác hợp lệ ở bước hiện tại.</p>

            <div className="mt-5 space-y-4">
              {paymentLocked ? (
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-sm font-black text-white">Đang chờ thanh toán VietQR.</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">Hệ thống sẽ mở bước xác nhận sau khi nhận được thanh toán.</p>
                </div>
              ) : status === "pending" ? (
                <>
                  <div className="rounded-3xl border border-sky-400/20 bg-sky-500/10 p-4">
                    <p className="text-sm font-black text-sky-100">Kiểm tra thanh toán, địa chỉ và tồn kho trước khi xác nhận.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus("confirmed")}
                    disabled={saving}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingAction === "confirmed" ? <Loader2 size={17} className="animate-spin" /> : <PackageCheck size={17} />}
                    Xác nhận và chuẩn bị hàng
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelOrder}
                    disabled={saving}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-5 py-3 text-sm font-black text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingAction === "cancelled" ? <Loader2 size={17} className="animate-spin" /> : <PackageX size={17} />}
                    Hủy đơn hàng
                  </button>
                </>
              ) : status === "confirmed" && hasGhnShipment ? (
                <>
                  <div className="rounded-3xl border border-indigo-400/20 bg-indigo-500/10 p-4">
                    <div className="flex items-start gap-3">
                      <Truck className="mt-0.5 shrink-0 text-indigo-300" size={20} />
                      <div>
                        <p className="text-sm font-black text-white">Đã tạo vận đơn GHN</p>
                        <p className="mt-1 text-xs font-semibold leading-5 text-slate-400">Đang chờ GHN lấy hàng. Trạng thái sẽ tự chuyển sang “Đang giao” sau khi GHN nhận kiện.</p>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleShippingSync}
                    disabled={Boolean(shippingAction) || saving}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-indigo-400/20 bg-indigo-500/10 px-5 py-3 text-sm font-black text-indigo-100 transition hover:bg-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {shippingAction === "sync" ? <Loader2 size={17} className="animate-spin" /> : <RefreshCw size={17} />}
                    Đồng bộ trạng thái GHN
                  </button>
                  <button type="button" onClick={handleCancelOrder} disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-5 py-3 text-sm font-black text-rose-200 transition hover:bg-rose-500/20 disabled:opacity-60">
                    {savingAction === "cancelled" ? <Loader2 size={17} className="animate-spin" /> : <PackageX size={17} />}
                    Hủy đơn hàng
                  </button>
                </>
              ) : status === "confirmed" ? (
                <>
                  <div>
                    <p className="text-sm font-black text-white">Chọn đơn vị giao hàng</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">Lựa chọn được lưu khi bạn bắt đầu bàn giao đơn.</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => ghnAvailable && setDeliveryProvider("ghn")}
                    disabled={!ghnAvailable || saving}
                    className={`w-full rounded-3xl border p-4 text-left transition ${deliveryProvider === "ghn" && ghnAvailable ? "border-indigo-400/40 bg-indigo-500/15" : "border-white/10 bg-white/[0.04]"} disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    <span className="flex items-start gap-3">
                      <Truck className="mt-0.5 shrink-0 text-indigo-300" size={20} />
                      <span>
                        <span className="block text-sm font-black text-white">Giao Hàng Nhanh (GHN)</span>
                        <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">{ghnAvailable ? "Tạo vận đơn và tự đồng bộ hành trình giao hàng." : "GHN chưa được cấu hình hoặc hiện không khả dụng."}</span>
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryProvider("shop_staff")}
                    disabled={saving}
                    className={`w-full rounded-3xl border p-4 text-left transition ${deliveryProvider === "shop_staff" ? "border-orange-400/40 bg-orange-500/15" : "border-white/10 bg-white/[0.04]"} disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    <span className="flex items-start gap-3">
                      <Store className="mt-0.5 shrink-0 text-orange-300" size={20} />
                      <span>
                        <span className="block text-sm font-black text-white">Nhân viên shop giao</span>
                        <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">Không cần mã vận đơn; shop tự giao và xác nhận khi khách đã nhận hàng.</span>
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdateStatus("shipping", { shipping_provider: deliveryProvider })}
                    disabled={saving || (deliveryProvider === "ghn" && !ghnAvailable)}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingAction === deliveryProvider ? <Loader2 size={17} className="animate-spin" /> : deliveryProvider === "ghn" ? <Truck size={17} /> : <Store size={17} />}
                    {deliveryProvider === "ghn" ? "Tạo vận đơn GHN" : "Bắt đầu giao bằng nhân viên shop"}
                  </button>

                  <button type="button" onClick={handleCancelOrder} disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-5 py-3 text-sm font-black text-rose-200 transition hover:bg-rose-500/20 disabled:opacity-60">
                    {savingAction === "cancelled" ? <Loader2 size={17} className="animate-spin" /> : <PackageX size={17} />}
                    Hủy đơn hàng
                  </button>
                </>
              ) : status === "shipping" && shopDelivery ? (
                <>
                  <div className="rounded-3xl border border-orange-400/20 bg-orange-500/10 p-4">
                    <div className="flex items-start gap-3">
                      <Store className="mt-0.5 shrink-0 text-orange-300" size={20} />
                      <div>
                        <p className="text-sm font-black text-white">Nhân viên shop đang giao</p>
                        <p className="mt-1 text-xs font-semibold leading-5 text-slate-400">Chỉ hoàn tất sau khi nhân viên xác nhận khách đã nhận hàng.</p>
                      </div>
                    </div>
                  </div>
                  <button type="button" onClick={handleCompleteShopDelivery} disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-600 disabled:opacity-60">
                    {savingAction === "completed" ? <Loader2 size={17} className="animate-spin" /> : <CheckCircle2 size={17} />}
                    Xác nhận giao thành công
                  </button>
                </>
              ) : status === "shipping" ? (
                <div className="rounded-3xl border border-indigo-400/20 bg-indigo-500/10 p-4">
                  <p className="text-sm font-black text-white">GHN đang vận chuyển đơn hàng.</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-400">Trạng thái hoàn thành sẽ được cập nhật tự động từ GHN.</p>
                </div>
              ) : (
                <div className={`rounded-3xl border p-4 ${status === "completed" ? "border-emerald-400/20 bg-emerald-500/10" : "border-rose-400/20 bg-rose-500/10"}`}>
                  <p className="text-sm font-black text-white">{status === "completed" ? "Đơn hàng đã hoàn thành." : "Đơn hàng đã hủy và không thể kích hoạt lại."}</p>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[32px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
            <h3 className="text-lg font-black text-white">Thông tin khách hàng</h3>
            <div className="mt-5 space-y-4 text-sm">
              <div className="flex gap-3">
                <User className="mt-0.5 text-orange-300" size={18} />
                <div>
                  <p className="font-black text-white">{getCustomer(order)}</p>
                  <p className="text-slate-500">Người nhận</p>
                </div>
              </div>

              {getEmail(order) && (
                <div className="flex gap-3">
                  <ShieldCheck className="mt-0.5 text-orange-300" size={18} />
                  <div>
                    <p className="font-black text-white">{getEmail(order)}</p>
                    <p className="text-slate-500">Email</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Phone className="mt-0.5 text-orange-300" size={18} />
                <div>
                  <p className="font-black text-white">{getPhone(order) || "Chưa cập nhật"}</p>
                  <p className="text-slate-500">Số điện thoại</p>
                </div>
              </div>

              <div className="flex gap-3">
                <MapPin className="mt-0.5 text-orange-300" size={18} />
                <div>
                  <p className="font-black leading-6 text-white">{getAddress(order)}</p>
                  <p className="text-slate-500">Địa chỉ giao hàng</p>
                </div>
              </div>
            </div>
          </section>

          {shopDelivery && (
            <section className="rounded-[32px] border border-orange-400/20 bg-orange-500/10 p-6 backdrop-blur-xl">
              <div className="flex items-start gap-3">
                <Store className="mt-0.5 shrink-0 text-orange-300" size={21} />
                <div>
                  <h3 className="text-lg font-black text-white">Nhân viên shop giao</h3>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Đơn không dùng mã vận đơn GHN. Shop chịu trách nhiệm giao và xác nhận kết quả với khách.</p>
                </div>
              </div>
            </section>
          )}

          {hasGhnShipment && (order?.tracking_code || order?.tracking) && (
            <section className="rounded-[32px] border border-indigo-400/20 bg-indigo-500/10 p-6 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <Truck className="text-indigo-300" size={21} />
                <h3 className="text-lg font-black text-white">Vận chuyển GHN</h3>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                {order?.tracking_code && <p className="font-bold text-slate-300">Mã vận đơn: <b className="text-white">{order.tracking_code}</b></p>}
                {order?.tracking?.status_label && <p className="font-bold text-slate-300">Trạng thái: <b className="text-indigo-200">{order.tracking.status_label}</b></p>}
                {order?.tracking?.leadtime && <p className="font-bold text-slate-300">Dự kiến giao: <b className="text-white">{new Date(order.tracking.leadtime).toLocaleString("vi-VN")}</b></p>}
              </div>
            </section>
          )}

          <section className="rounded-[32px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
            <h3 className="text-lg font-black text-white">Thanh toán</h3>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">Phương thức</span>
                <span className="font-black text-white">{getPaymentMethod(order)}</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">Trạng thái</span>
                <span className="font-black text-orange-300">{paymentPaid ? "Đã thanh toán" : bankPayment ? "Chờ thanh toán" : "Chưa thanh toán"}</span>
              </div>

              {order?.cod_collected_at && (
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                  <p className="text-xs font-black uppercase tracking-wider text-emerald-300">Xác nhận thu COD</p>
                  <div className="mt-3 space-y-2 text-xs font-semibold text-slate-300">
                    <p>Số tiền: <b className="text-white">{formatCurrency(Number(order?.cod_collected_amount || 0))}</b></p>
                    <p>Hình thức: <b className="text-white">{order?.cod_collection_method === "bank_transfer" ? "Chuyển khoản khi giao" : "Tiền mặt"}</b></p>
                    <p>Thời gian: <b className="text-white">{formatDateTime(order?.cod_collected_at)}</b></p>
                    {order?.cod_collected_by && <p>Người xác nhận: <b className="text-white">Tài khoản #{order.cod_collected_by}</b></p>}
                    {order?.cod_collection_note && <p className="leading-5">Ghi chú: <b className="text-white">{order.cod_collection_note}</b></p>}
                  </div>
                </div>
              )}

              <div className="my-4 border-t border-white/10" />

              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">Tạm tính</span>
                <span className="font-bold text-slate-300">{formatCurrency(getSubtotal(order))}</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">Phí vận chuyển</span>
                <span className="font-bold text-slate-300">{formatCurrency(getShippingFee(order))}</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">Giảm giá</span>
                <span className="font-bold text-emerald-300">-{formatCurrency(getDiscount(order))}</span>
              </div>

              <div className="rounded-3xl bg-slate-950 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold text-slate-300">Tổng tiền</span>
                  <span className="text-xl font-black text-orange-300">{formatCurrency(getTotal(order))}</span>
                </div>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
