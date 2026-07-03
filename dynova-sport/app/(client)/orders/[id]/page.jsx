"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Home,
  Loader2,
  MapPin,
  PackageCheck,
  Phone,
  RefreshCcw,
  ShieldCheck,
  ShoppingBag,
  Truck,
  User,
  XCircle,
} from "lucide-react";

import { formatCurrency } from "@/data/shop";
import { addToCart } from "@/utils/shopStorage";
import {
  cancelOrder,
  getOrderById,
  reorderOrder,
} from "@/services/order.service";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"
).replace(/\/$/, "");

const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&auto=format&fit=crop&q=80";

const statusMap = {
  pending: {
    label: "Chờ xác nhận",
    text: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
  },
  waiting_bank_transfer: {
    label: "Chờ chuyển khoản",
    text: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
  },
  confirmed: {
    label: "Đã xác nhận",
    text: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
  processing: {
    label: "Đang xử lý",
    text: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
  shipping: {
    label: "Đang giao hàng",
    text: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-100",
  },
  delivering: {
    label: "Đang giao hàng",
    text: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-100",
  },
  completed: {
    label: "Hoàn thành",
    text: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
  },
  success: {
    label: "Hoàn thành",
    text: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
  },
  cancelled: {
    label: "Đã hủy",
    text: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-100",
  },
  canceled: {
    label: "Đã hủy",
    text: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-100",
  },
};

const timelineSteps = [
  {
    key: "pending",
    title: "Đặt hàng",
    desc: "Đơn hàng đã được tạo thành công.",
    icon: ClipboardList,
  },
  {
    key: "confirmed",
    title: "Xác nhận",
    desc: "Dynova đang kiểm tra và xác nhận đơn hàng.",
    icon: ShieldCheck,
  },
  {
    key: "shipping",
    title: "Đang giao",
    desc: "Đơn hàng đang được vận chuyển đến bạn.",
    icon: Truck,
  },
  {
    key: "completed",
    title: "Hoàn thành",
    desc: "Đơn hàng đã giao thành công.",
    icon: PackageCheck,
  },
];

const statusIndex = {
  pending: 0,
  waiting_bank_transfer: 0,
  confirmed: 1,
  processing: 1,
  shipping: 2,
  delivering: 2,
  completed: 3,
  success: 3,
};

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

  if (!raw || raw.includes("product-placeholder")) {
    return FALLBACK_IMAGE;
  }

  if (/^(https?:)?\/\//i.test(raw) || raw.startsWith("data:") || raw.startsWith("blob:")) {
    return raw;
  }

  const clean = raw.replace(/\\/g, "/");

  if (clean.startsWith("/storage/")) {
    return `${API_ORIGIN}${encodePath(clean)}`;
  }

  if (clean.startsWith("storage/")) {
    return `${API_ORIGIN}/${encodePath(clean)}`;
  }

  if (clean.startsWith("products/")) {
    return `${API_ORIGIN}/storage/${encodePath(clean)}`;
  }

  if (clean.startsWith("/")) {
    return clean;
  }

  return `${API_ORIGIN}/storage/products/${encodePath(clean)}`;
}

function extractItems(response, keys = []) {
  const candidates = [
    ...keys.map((key) => response?.[key]),
    ...keys.map((key) => response?.[key]?.data),

    ...keys.map((key) => response?.data?.[key]),
    ...keys.map((key) => response?.data?.[key]?.data),

    response?.data?.data?.data,
    response?.data?.data,
    response?.data?.items,
    response?.data?.items?.data,

    response?.data?.products,
    response?.data?.products?.data,

    response?.products,
    response?.products?.data,
    response?.items,
    response?.items?.data,

    response?.data,
    response,
  ];

  const found = candidates.find((item) => Array.isArray(item));

  return found || [];
}

function getAuthHeaders() {
  if (typeof window === "undefined") {
    return {
      Accept: "application/json",
    };
  }

  const token =
    localStorage.getItem("dynova_auth_token") ||
    localStorage.getItem("auth_token") ||
    localStorage.getItem("token") ||
    "";

  return {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function getProductIdFromItem(item) {
  return (
    item?.product_id ??
    item?.productId ??
    item?.product?.id ??
    item?.product?.product_id ??
    null
  );
}

function getVariantIdFromItem(item) {
  return (
    item?.variant_id ??
    item?.product_variant_id ??
    item?.productVariantId ??
    item?.product_variant?.id ??
    item?.productVariant?.id ??
    null
  );
}

function getProductVariants(product) {
  const variants =
    product?.variants ||
    product?.product_variants ||
    product?.productVariants ||
    product?.variant_list ||
    product?.children ||
    [];

  return Array.isArray(variants) ? variants : [];
}

function getProductRawImage(product) {
  return (
    product?.variant_image ||
    product?.product_image ||
    product?.image_url ||
    product?.image ||
    product?.thumbnail ||
    product?.thumb ||
    ""
  );
}

function getVariantRawImage(variant) {
  return (
    variant?.variant_image ||
    variant?.image_url ||
    variant?.image ||
    variant?.thumbnail ||
    variant?.thumb ||
    ""
  );
}

async function loadCatalogMaps() {
  try {
    const response = await fetch(`${API_URL}/products?per_page=1000`, {
      headers: getAuthHeaders(),
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));
    const products = extractItems(data, ["products", "items"]);

    const productMap = {};
    const variantMap = {};

    products.forEach((product) => {
      const productId = product?.id ?? product?.product_id ?? product?.productId;

      if (productId !== undefined && productId !== null) {
        productMap[String(productId)] = product;
      }

      getProductVariants(product).forEach((variant) => {
        const variantId =
          variant?.id ??
          variant?.variant_id ??
          variant?.product_variant_id ??
          variant?.productVariantId;

        if (variantId !== undefined && variantId !== null) {
          variantMap[String(variantId)] = {
            ...variant,
            product,
          };
        }
      });
    });

    return {
      productMap,
      variantMap,
    };
  } catch {
    return {
      productMap: {},
      variantMap: {},
    };
  }
}

function getCatalogRawImage(item, catalogMaps = {}) {
  const productMap = catalogMaps?.productMap || {};
  const variantMap = catalogMaps?.variantMap || {};

  const variantId = getVariantIdFromItem(item);
  const productId = getProductIdFromItem(item);

  const variant =
    variantId !== undefined && variantId !== null
      ? variantMap[String(variantId)]
      : null;

  const product =
    (productId !== undefined && productId !== null
      ? productMap[String(productId)]
      : null) ||
    variant?.product ||
    null;

  return getVariantRawImage(variant) || getProductRawImage(product) || "";
}

function normalizeStatus(status = "") {
  const clean = String(status || "").trim().toLowerCase();

  if (["waiting_bank_transfer", "bank_pending", "waiting_payment", "payment_pending", "chờ chuyển khoản"].includes(clean)) {
    return "waiting_bank_transfer";
  }

  if (["processing", "packing", "đang xử lý"].includes(clean)) {
    return "processing";
  }

  if (["confirmed", "đã xác nhận"].includes(clean)) {
    return "confirmed";
  }

  if (["shipping", "delivering", "đang giao"].includes(clean)) {
    return "shipping";
  }

  if (["completed", "success", "done", "hoàn thành"].includes(clean)) {
    return "completed";
  }

  if (["cancelled", "canceled", "cancel", "đã hủy"].includes(clean)) {
    return "cancelled";
  }

  return "pending";
}

function extractOrder(response) {
  return (
    response?.data?.order ||
    response?.data?.data?.order ||
    response?.data?.data ||
    response?.data ||
    response?.order ||
    response ||
    null
  );
}

function getOrderItems(order) {
  return order?.items || order?.order_items || order?.details || [];
}

function getItemName(item) {
  return item?.product_name || item?.name || item?.product?.name || "Sản phẩm";
}

function getItemRawImage(item, catalogMaps = {}) {
  const catalogImage = getCatalogRawImage(item, catalogMaps);

  return (
    catalogImage ||
    item?.variant_image ||
    item?.product_variant?.image ||
    item?.productVariant?.image ||
    item?.product_image ||
    item?.image_url ||
    item?.image ||
    item?.thumbnail ||
    item?.product?.image_url ||
    item?.product?.image ||
    item?.product?.thumbnail ||
    ""
  );
}

function getItemImage(item, catalogMaps = {}) {
  return toStorageProductImage(getItemRawImage(item, catalogMaps));
}

function handleImageError(event) {
  if (event.currentTarget.src !== FALLBACK_IMAGE) {
    event.currentTarget.src = FALLBACK_IMAGE;
  }
}

function getItemPrice(item) {
  return Number(item?.unit_price || item?.price || item?.sale_price || 0);
}

function getItemQuantity(item) {
  return Number(item?.quantity || item?.qty || 1);
}

function getItemSize(item) {
  return item?.size || item?.product_variant?.size || item?.productVariant?.size || null;
}

function getItemColor(item) {
  return item?.color || item?.product_variant?.color || item?.productVariant?.color || null;
}

function normalizeCartItem(item, catalogMaps = {}) {
  return {
    id: item.product_id || item.product?.id || item.id,
    product_id: item.product_id || item.product?.id || item.id,
    variant_id: item.variant_id || item.product_variant_id || item.productVariant?.id || null,
    name: getItemName(item),
    image: getItemImage(item, catalogMaps),
    price: getItemPrice(item),
    size: getItemSize(item),
    color: getItemColor(item),
  };
}

function getOrderCode(order) {
  return order?.order_code || order?.code || "DH" + String(order?.id || "").padStart(6, "0");
}

function getPaymentLabel(method = "") {
  const clean = String(method || "COD").toUpperCase();

  const map = {
    COD: "Thanh toán khi nhận hàng",
    BANK_TRANSFER: "Chuyển khoản ngân hàng",
    BANK: "Chuyển khoản ngân hàng",
    VNPAY: "VNPAY",
    MOMO: "MoMo",
  };

  return map[clean] || method || "COD";
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [catalogMaps, setCatalogMaps] = useState({
    productMap: {},
    variantMap: {},
  });

  const items = useMemo(() => getOrderItems(order), [order]);
  const status = normalizeStatus(order?.status || "pending");
  const statusInfo = statusMap[status] || statusMap.pending;
  const currentStepIndex = status === "cancelled" ? -1 : statusIndex[status] ?? 0;

  const total = Number(
    order?.grand_total ||
      order?.total ||
      order?.total_price ||
      order?.final_total ||
      order?.subtotal ||
      0
  );

  const subtotal = Number(order?.subtotal || order?.total_price || 0);
  const shippingFee = Number(order?.shipping_fee || 0);
  const discount = Number(order?.discount || order?.discount_amount || 0);

  const showNotice = (message) => {
    setNotice(message);
    setTimeout(() => setNotice(""), 1800);
  };

  const loadOrder = async () => {
    if (!orderId) return;

    try {
      setLoading(true);
      setError("");

      const [response, nextCatalogMaps] = await Promise.all([
        getOrderById(orderId),
        loadCatalogMaps(),
      ]);

      const data = extractOrder(response);

      setCatalogMaps(nextCatalogMaps);
      setOrder(data);
    } catch (err) {
      if (err?.status === 401) {
        router.push("/login?redirect=/orders/" + orderId);
        return;
      }

      setError(err?.message || "Không thể tải chi tiết đơn hàng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const handleCancel = async () => {
    if (!order?.id) return;

    const confirmCancel = window.confirm("Bạn chắc chắn muốn hủy đơn hàng này?");

    if (!confirmCancel) return;

    try {
      setActionLoading("cancel");

      const response = await cancelOrder(order.id);
      const data = extractOrder(response) || {
        ...order,
        status: "cancelled",
      };

      setOrder({ ...order, ...data, status: data.status || "cancelled" });
      showNotice("Hủy đơn hàng thành công.");
    } catch (err) {
      showNotice(err?.message || "Không thể hủy đơn hàng.");
    } finally {
      setActionLoading("");
    }
  };

  const handleReorder = async () => {
    if (!order?.id) return;

    try {
      setActionLoading("reorder");

      let reorderItems = items;

      try {
        const response = await reorderOrder(order.id);
        const data = extractOrder(response);
        reorderItems = getOrderItems(data);
      } catch {
        reorderItems = items;
      }

      reorderItems.forEach((item) => {
        addToCart(normalizeCartItem(item, catalogMaps), {
          quantity: getItemQuantity(item),
        });
      });

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("dynova:storage"));
      }

      showNotice("Đã thêm sản phẩm vào giỏ hàng.");
      setTimeout(() => router.push("/cart"), 700);
    } catch (err) {
      showNotice(err?.message || "Không thể mua lại đơn hàng.");
    } finally {
      setActionLoading("");
    }
  };

  const canCancel = ["pending", "waiting_bank_transfer", "confirmed", "processing"].includes(status);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f8fb] py-12">
        <div className="container-page">
          <div className="rounded-[32px] border border-slate-200 bg-white p-10 text-center shadow-sm">
            <Loader2 className="mx-auto animate-spin text-orange-500" size={34} />
            <p className="mt-4 text-sm font-bold text-slate-500">Đang tải chi tiết đơn hàng...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#f7f8fb] py-12">
        <div className="container-page">
          <div className="rounded-[32px] border border-slate-200 bg-white p-10 text-center shadow-sm">
            <XCircle className="mx-auto text-rose-500" size={42} />
            <h1 className="mt-4 text-xl font-black text-slate-950">Không thể tải đơn hàng</h1>
            <p className="mt-2 text-sm text-slate-500">{error || "Đơn hàng không tồn tại hoặc bạn không có quyền xem."}</p>

            <Link href="/orders" className="btn-primary mt-6 inline-flex rounded-2xl px-5 py-3 text-sm font-black">
              Quay lại lịch sử mua hàng
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fb] pb-16">
      {notice && (
        <div className="float-in fixed right-5 top-24 z-[90] rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-2xl">
          {notice}
        </div>
      )}

      <section className="bg-slate-950 text-white">
        <div className="container-page py-12">
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-slate-200 transition hover:bg-white hover:text-slate-950"
          >
            <ArrowLeft size={17} />
            Lịch sử mua hàng
          </Link>

          <div className="mt-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-orange-300">Chi tiết đơn hàng</p>

              <h1 className="mt-2 text-3xl font-black uppercase tracking-[-0.04em] md:text-5xl">
                {getOrderCode(order)}
              </h1>

              <p className="mt-3 text-sm text-slate-300">
                Ngày đặt: {order.created_at ? new Date(order.created_at).toLocaleString("vi-VN") : "Chưa cập nhật"}
              </p>
            </div>

            <div className={`inline-flex w-fit items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-black ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}>
              {status === "cancelled" ? <Ban size={18} /> : <CheckCircle2 size={18} />}
              {statusInfo.label}
            </div>
          </div>
        </div>
      </section>

      <div className="container-page -mt-8 grid gap-7 lg:grid-cols-[1fr_360px]">
        <div className="space-y-7">
          <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-950">Tiến trình đơn hàng</h2>
                <p className="mt-1 text-sm text-slate-500">Theo dõi trạng thái xử lý và giao hàng.</p>
              </div>

              <Truck className="text-orange-500" size={26} />
            </div>

            {status === "cancelled" ? (
              <div className="rounded-3xl border border-rose-100 bg-rose-50 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500 text-white">
                    <Ban size={22} />
                  </div>

                  <div>
                    <p className="font-black text-rose-700">Đơn hàng đã được hủy</p>
                    <p className="mt-1 text-sm text-rose-500">Đơn hàng này không còn được tiếp tục xử lý.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-4">
                {timelineSteps.map((step, index) => {
                  const Icon = step.icon;
                  const active = index <= currentStepIndex;

                  return (
                    <div
                      key={step.key}
                      className={
                        "relative rounded-3xl border p-4 transition " +
                        (active ? "border-orange-200 bg-orange-50" : "border-slate-200 bg-slate-50")
                      }
                    >
                      <div className={"flex h-11 w-11 items-center justify-center rounded-2xl " + (active ? "bg-orange-500 text-white" : "bg-white text-slate-400")}>
                        <Icon size={20} />
                      </div>

                      <p className={"mt-4 text-sm font-black " + (active ? "text-orange-700" : "text-slate-500")}>{step.title}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{step.desc}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-950">Sản phẩm trong đơn</h2>
                <p className="mt-1 text-sm text-slate-500">Tổng cộng {items.length} sản phẩm.</p>
              </div>

              <ShoppingBag className="text-orange-500" size={25} />
            </div>

            <div className="space-y-3">
              {items.length === 0 ? (
                <div className="rounded-3xl bg-slate-50 p-5 text-sm font-semibold text-slate-500">Chưa có sản phẩm trong đơn hàng.</div>
              ) : (
                items.map((item, index) => {
                  const price = getItemPrice(item);
                  const quantity = getItemQuantity(item);
                  const size = getItemSize(item);
                  const color = getItemColor(item);

                  return (
                    <div key={item.id || index} className="flex gap-4 rounded-3xl border border-slate-100 bg-white p-3 transition hover:border-orange-100 hover:bg-orange-50/30">
                      <img
                        src={getItemImage(item, catalogMaps)}
                        alt={getItemName(item)}
                        onError={handleImageError}
                        className="h-24 w-24 rounded-2xl object-cover"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 font-black text-slate-950">{getItemName(item)}</p>

                        <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                          {size && <span className="rounded-full bg-slate-100 px-3 py-1">Size: {size}</span>}
                          {color && <span className="rounded-full bg-slate-100 px-3 py-1">Màu: {color}</span>}
                          <span className="rounded-full bg-slate-100 px-3 py-1">SL: {quantity}</span>
                        </div>

                        <div className="mt-3 flex items-end justify-between gap-3">
                          <p className="text-sm font-black text-orange-600">{formatCurrency(price)}</p>
                          <p className="text-base font-black text-slate-950">{formatCurrency(price * quantity)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-7">
          <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">Thông tin nhận hàng</h2>

            <div className="mt-5 space-y-4 text-sm">
              <div className="flex gap-3">
                <User className="mt-0.5 text-orange-500" size={18} />
                <div>
                  <p className="font-black text-slate-950">{order.customer_name || order.name || "Khách hàng"}</p>
                  <p className="text-slate-500">Người nhận</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Phone className="mt-0.5 text-orange-500" size={18} />
                <div>
                  <p className="font-black text-slate-950">{order.customer_phone || order.phone || "Chưa cập nhật"}</p>
                  <p className="text-slate-500">Số điện thoại</p>
                </div>
              </div>

              <div className="flex gap-3">
                <MapPin className="mt-0.5 text-orange-500" size={18} />
                <div>
                  <p className="font-black leading-6 text-slate-950">{order.shipping_address || order.full_address || order.address || "Chưa cập nhật địa chỉ"}</p>
                  <p className="text-slate-500">Địa chỉ giao hàng</p>
                </div>
              </div>

              {order.note && (
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-400">Ghi chú</p>
                  <p className="mt-1 font-semibold text-slate-700">{order.note}</p>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">Thanh toán</h2>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">Phương thức</span>
                <span className="font-black uppercase text-slate-950">{getPaymentLabel(order.payment_method)}</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">Trạng thái</span>
                <span className="font-black text-orange-600">{order.payment_status === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}</span>
              </div>

              <div className="my-4 border-t border-slate-100" />

              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">Tạm tính</span>
                <span className="font-bold text-slate-700">{formatCurrency(subtotal)}</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">Phí vận chuyển</span>
                <span className="font-bold text-slate-700">{formatCurrency(shippingFee)}</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">Giảm giá</span>
                <span className="font-bold text-emerald-600">-{formatCurrency(discount)}</span>
              </div>

              <div className="rounded-3xl bg-slate-950 p-4 text-white">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold text-slate-300">Tổng tiền</span>
                  <span className="text-xl font-black text-orange-300">{formatCurrency(total)}</span>
                </div>
              </div>

              <div className="grid gap-2 pt-2">
                {canCancel && (
                  <button
                    onClick={handleCancel}
                    disabled={actionLoading === "cancel"}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-black text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {actionLoading === "cancel" ? <Loader2 size={17} className="animate-spin" /> : <Ban size={17} />}
                    Hủy đơn hàng
                  </button>
                )}

                <button
                  onClick={handleReorder}
                  disabled={actionLoading === "reorder" || items.length === 0}
                  className="btn-primary flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {actionLoading === "reorder" ? <Loader2 size={17} className="animate-spin" /> : <RefreshCcw size={17} />}
                  Mua lại đơn hàng
                </button>

                <Link href="/" className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600">
                  <Home size={17} />
                  Về trang chủ
                </Link>
              </div>
            </div>
          </section>

          <section className="rounded-[30px] border border-orange-100 bg-orange-50 p-5">
            <div className="flex gap-3">
              <CreditCard className="mt-0.5 text-orange-600" size={20} />
              <div>
                <p className="font-black text-orange-700">Cần hỗ trợ đơn hàng?</p>
                <p className="mt-1 text-sm leading-6 text-orange-600/80">
                  Liên hệ hotline hoặc chat Dynova để được hỗ trợ đổi trả, giao hàng và thanh toán.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
