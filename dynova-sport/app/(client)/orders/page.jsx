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
} from "lucide-react";

import { formatCurrency } from "@/data/shop";
import {
  cancelOrder,
  getMyOrders,
  reorderOrder,
} from "@/services/order.service";

const CART_KEY = "dynova_cart";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"
).replace(/\/$/, "");

const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

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
  { id: "confirmed", label: "Đã xác nhận" },
  { id: "shipping", label: "Đang giao" },
  { id: "completed", label: "Hoàn thành" },
  { id: "cancelled", label: "Đã hủy" },
];

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function encodePath(value) {
  return String(value || "")
    .replace(/\\/g, "/")
    .split("/")
    .map((part) => encodeURIComponent(safeDecode(part)))
    .join("/");
}

function toStorageProductImage(value) {
  const raw = String(value || "").trim();

  if (!raw || raw === "null" || raw === "undefined") {
    return FALLBACK_IMAGE;
  }

  if (raw.includes("product-placeholder")) {
    return FALLBACK_IMAGE;
  }

  if (
    /^(https?:)?\/\//i.test(raw) ||
    raw.startsWith("data:") ||
    raw.startsWith("blob:")
  ) {
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

  if (clean.startsWith("/products/")) {
    return `${API_ORIGIN}/storage${encodePath(clean)}`;
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

  return candidates.find((item) => Array.isArray(item)) || [];
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

function parseMaybeJson(value) {
  if (!value) return null;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return null;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function getProductIdFromItem(item) {
  return (
    item?.product_id ??
    item?.productId ??
    item?.product?.id ??
    item?.product?.product_id ??
    item?.product_variant?.product_id ??
    item?.productVariant?.product_id ??
    item?.variant?.product_id ??
    null
  );
}

function getVariantIdFromItem(item) {
  return (
    item?.variant_id ??
    item?.product_variant_id ??
    item?.variation_id ??
    item?.productVariantId ??
    item?.product_variant?.id ??
    item?.productVariant?.id ??
    item?.variant?.id ??
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
  if (!product) return "";

  return (
    product?.variant_image ||
    product?.product_image ||
    product?.image_url ||
    product?.image ||
    product?.thumbnail ||
    product?.thumb ||
    product?.photo ||
    ""
  );
}

function getVariantRawImage(variant) {
  if (!variant) return "";

  return (
    variant?.variant_image ||
    variant?.image_url ||
    variant?.image ||
    variant?.thumbnail ||
    variant?.thumb ||
    variant?.photo ||
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
      const productId =
        product?.id ??
        product?.product_id ??
        product?.productId;

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

function getCatalogVariant(item, catalogMaps = {}) {
  const variantMap = catalogMaps?.variantMap || {};
  const variantId = getVariantIdFromItem(item);

  if (variantId === undefined || variantId === null) return null;

  return variantMap[String(variantId)] || null;
}

function getCatalogProduct(item, catalogMaps = {}) {
  const productMap = catalogMaps?.productMap || {};
  const productId = getProductIdFromItem(item);
  const catalogVariant = getCatalogVariant(item, catalogMaps);

  if (productId !== undefined && productId !== null) {
    return productMap[String(productId)] || catalogVariant?.product || null;
  }

  return catalogVariant?.product || null;
}

function getCatalogRawImage(item, catalogMaps = {}) {
  const catalogVariant = getCatalogVariant(item, catalogMaps);
  const catalogProduct = getCatalogProduct(item, catalogMaps);

  return getVariantRawImage(catalogVariant) || getProductRawImage(catalogProduct) || "";
}

function getOptionValue(item, names = []) {
  const sources = [
    item?.attributes,
    item?.options,
    item?.variant_attributes,
    item?.selected_options,
    item?.meta,
    item?.metadata,
  ];

  for (const source of sources) {
    const data = parseMaybeJson(source) || source;

    if (!data) continue;

    if (Array.isArray(data)) {
      const found = data.find((entry) => {
        const key = String(
          entry?.name ||
            entry?.key ||
            entry?.label ||
            entry?.attribute ||
            entry?.title ||
            ""
        ).toLowerCase();

        return names.some((name) => key.includes(name));
      });

      if (found) {
        return found?.value || found?.option || found?.text || found?.name_value || "";
      }
    }

    if (typeof data === "object") {
      for (const name of names) {
        if (data[name]) return data[name];
      }

      const keys = Object.keys(data);

      const foundKey = keys.find((key) => {
        const clean = String(key).toLowerCase();
        return names.some((name) => clean.includes(name));
      });

      if (foundKey) return data[foundKey];
    }
  }

  return "";
}

function getItemSize(item, catalogMaps = {}) {
  const catalogVariant = getCatalogVariant(item, catalogMaps);

  return (
    item?.size ||
    item?.variant_size ||
    item?.size_name ||
    item?.option_size ||
    item?.attributes_size ||
    getOptionValue(item, ["size", "kich_thuoc", "kích thước"]) ||
    item?.product_variant?.size ||
    item?.productVariant?.size ||
    item?.variant?.size ||
    catalogVariant?.size ||
    "Freesize"
  );
}

function getItemColor(item, catalogMaps = {}) {
  const catalogVariant = getCatalogVariant(item, catalogMaps);

  return (
    item?.color ||
    item?.variant_color ||
    item?.color_name ||
    item?.option_color ||
    item?.attributes_color ||
    getOptionValue(item, ["color", "mau", "màu", "mau_sac", "màu sắc"]) ||
    item?.product_variant?.color ||
    item?.productVariant?.color ||
    item?.variant?.color ||
    catalogVariant?.color ||
    "Mặc định"
  );
}

function getItemSku(item, catalogMaps = {}) {
  const catalogVariant = getCatalogVariant(item, catalogMaps);
  const catalogProduct = getCatalogProduct(item, catalogMaps);

  return (
    item?.sku ||
    item?.variant_sku ||
    item?.product_variant?.sku ||
    item?.productVariant?.sku ||
    item?.variant?.sku ||
    catalogVariant?.sku ||
    catalogProduct?.sku ||
    ""
  );
}

function extractOrder(response, fallbackOrder = null) {
  return (
    response?.data?.order ||
    response?.data?.data?.order ||
    response?.data?.data ||
    response?.data ||
    response?.order ||
    response ||
    fallbackOrder
  );
}

function normalizeStatus(status = "") {
  const clean = String(status || "").trim().toLowerCase();

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
      "payment_pending",
    ].includes(clean)
  ) {
    return "waiting_bank_transfer";
  }

  if (["đã hủy", "cancelled", "canceled", "cancel"].includes(clean)) {
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
  const clean = String(method || "").toUpperCase();
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
  const items =
    order?.items ||
    order?.order_items ||
    order?.details ||
    order?.products ||
    [];

  return Array.isArray(items) ? items : [];
}

function getOrderTotal(order) {
  return Number(
    order?.grand_total ||
      order?.total ||
      order?.total_price ||
      order?.final_total ||
      order?.subtotal ||
      0
  );
}

function getOrderPhone(order) {
  return order?.customer_phone || order?.phone || order?.shipping_phone || "";
}

function getOrderAddress(order) {
  return (
    order?.shipping_address ||
    order?.full_address ||
    [order?.address, order?.ward, order?.district, order?.province]
      .filter(Boolean)
      .join(", ") ||
    "Chưa có địa chỉ"
  );
}

function getItemRawImage(item, catalogMaps = {}) {
  const catalogVariant = getCatalogVariant(item, catalogMaps);
  const catalogProduct = getCatalogProduct(item, catalogMaps);

  return (
    item?.variant_image ||
    item?.product_variant?.image_url ||
    item?.product_variant?.image ||
    item?.productVariant?.image_url ||
    item?.productVariant?.image ||
    item?.variant?.image_url ||
    item?.variant?.image ||
    getVariantRawImage(catalogVariant) ||
    item?.product_image ||
    item?.image_url ||
    item?.image ||
    item?.thumbnail ||
    item?.product?.image_url ||
    item?.product?.image ||
    item?.product?.thumbnail ||
    getProductRawImage(catalogProduct) ||
    getCatalogRawImage(item, catalogMaps) ||
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

function getItemName(item) {
  return (
    item?.product_name ||
    item?.name ||
    item?.product_title ||
    item?.product?.name ||
    "Sản phẩm"
  );
}

function getItemQuantity(item) {
  return Number(item?.quantity || item?.qty || 1);
}

function getItemPrice(item) {
  return Number(item?.price || item?.unit_price || item?.sale_price || 0);
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
  return (
    order?.order_code ||
    order?.code ||
    `DNV-${String(order?.id || "").padStart(6, "0")}`
  );
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

function addItemsToCart(items = [], catalogMaps = {}) {
  if (typeof window === "undefined") return;

  const currentCart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  const nextCart = [...currentCart];

  items.forEach((item) => {
    const productId =
      getProductIdFromItem(item) ||
      item?.id ||
      Date.now();

    const variantId = getVariantIdFromItem(item);
    const size = getItemSize(item, catalogMaps);
    const color = getItemColor(item, catalogMaps);
    const sku = getItemSku(item, catalogMaps);
    const image = getItemImage(item, catalogMaps);

    const key = `${productId}-${variantId || "no-variant"}-${size}-${color}`;
    const exists = nextCart.find((cartItem) => cartItem.key === key);

    if (exists) {
      exists.quantity =
        Number(exists.quantity || 1) + Number(getItemQuantity(item));
    } else {
      nextCart.push({
        key,

        id: productId,
        product_id: productId,

        variantId,
        variant_id: variantId,
        product_variant_id: variantId,

        name: getItemName(item),
        product_name: getItemName(item),

        image,
        product_image: image,
        variant_image: image,

        size,
        color,
        sku,

        quantity: getItemQuantity(item),
        price: getItemPrice(item),
        sale_price: getItemPrice(item),
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

function OrderCard({ order, onCancel, onReorder, loading, catalogMaps }) {
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
              aria-label="Sao chép mã đơn"
            >
              <Copy size={13} />
            </button>
          </div>

          <h2 className="mt-2 text-xl font-black text-slate-950">
            {order.customer_name ||
              order.customerName ||
              order.receiver_name ||
              "Khách hàng"}
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
            items.slice(0, 3).map((item, index) => {
              const size = getItemSize(item, catalogMaps);
              const color = getItemColor(item, catalogMaps);
              const sku = getItemSku(item, catalogMaps);

              return (
                <div
                  key={item.id || `${getProductIdFromItem(item)}-${index}`}
                  className="flex gap-3 rounded-2xl bg-slate-50 p-3"
                >
                  <img
                    src={getItemImage(item, catalogMaps)}
                    alt={getItemName(item)}
                    onError={handleImageError}
                    className="h-16 w-16 rounded-xl object-cover"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-black text-slate-950">
                      {getItemName(item)}
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs font-bold text-slate-500">
                      <span>SL: {getItemQuantity(item)}</span>
                      <span>•</span>
                      <span>Size: {size}</span>
                      <span>•</span>
                      <span>Màu: {color}</span>

                      {sku && (
                        <>
                          <span>•</span>
                          <span>SKU: {sku}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <p className="text-sm font-black text-slate-900">
                    {formatCurrency(getItemTotal(item))}
                  </p>
                </div>
              );
            })
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
              disabled={loading || items.length === 0}
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
          disabled={loading}
          className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-xs font-black uppercase tracking-wider text-rose-600 transition hover:bg-rose-500 hover:text-white disabled:opacity-60"
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
  const [catalogMaps, setCatalogMaps] = useState({
    productMap: {},
    variantMap: {},
  });

  const hasFilter = activeFilter !== "all" || search.trim();

  const computedStats = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        const status = normalizeStatus(order.status);

        acc.total += 1;
        acc[status] = Number(acc[status] || 0) + 1;

        return acc;
      },
      {
        total: 0,
        pending: 0,
        waiting_bank_transfer: 0,
        confirmed: 0,
        shipping: 0,
        completed: 0,
        cancelled: 0,
      }
    );
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const status = normalizeStatus(order.status);
      const code = getOrderCode(order).toLowerCase();
      const phone = String(getOrderPhone(order) || "").toLowerCase();
      const customer = String(
        order.customer_name ||
          order.customerName ||
          order.receiver_name ||
          ""
      ).toLowerCase();

      const matchStatus = activeFilter === "all" || status === activeFilter;
      const keyword = search.trim().toLowerCase();
      const matchSearch =
        !keyword ||
        code.includes(keyword) ||
        phone.includes(keyword) ||
        customer.includes(keyword);

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
      const [data, nextCatalogMaps] = await Promise.all([
        getMyOrders(),
        loadCatalogMaps(),
      ]);

      const nextOrders = extractItems(data, ["orders", "items"]);

      setCatalogMaps(nextCatalogMaps);
      setOrders(Array.isArray(nextOrders) ? nextOrders : []);
      setStats(data?.stats || data?.data?.stats || {});
    } catch (err) {
      setError(
        err?.message ||
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

      const updatedOrder = extractOrder(response, order) || {
        ...order,
        status: "cancelled",
      };

      setOrders((prev) =>
        prev.map((item) =>
          String(item.id) === String(order.id)
            ? {
                ...item,
                ...updatedOrder,
                status: updatedOrder.status || "cancelled",
              }
            : item
        )
      );

      showNotice("Đã hủy đơn hàng thành công.");
      loadOrders();
    } catch (err) {
      setError(err?.message || "Không thể hủy đơn hàng.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReorder = async (order) => {
    setActionLoading(true);
    setError("");

    try {
      const response = await reorderOrder(order.id);
      const reorderData = extractOrder(response, order);
      const items = getOrderItems(reorderData);

      addItemsToCart(items.length ? items : getOrderItems(order), catalogMaps);
      showNotice("Đã thêm sản phẩm của đơn hàng vào giỏ.");
    } catch {
      addItemsToCart(getOrderItems(order), catalogMaps);
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
              disabled={pageLoading}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw
                size={15}
                className={pageLoading ? "animate-spin" : ""}
              />
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
            value={stats.total || computedStats.total}
            icon={PackageCheck}
          />

          <StatCard
            title="Đang xử lý"
            value={
              stats.pending ||
              computedStats.pending +
                computedStats.waiting_bank_transfer +
                computedStats.confirmed
            }
            icon={Clock3}
            tone="orange"
          />

          <StatCard
            title="Đang giao"
            value={stats.shipping || computedStats.shipping}
            icon={Truck}
            tone="blue"
          />

          <StatCard
            title="Hoàn thành"
            value={stats.completed || computedStats.completed}
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
                placeholder="Tìm theo mã đơn, số điện thoại hoặc tên người nhận..."
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
                loading={actionLoading}
                catalogMaps={catalogMaps}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}