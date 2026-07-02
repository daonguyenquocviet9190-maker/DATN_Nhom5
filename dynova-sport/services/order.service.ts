import { apiFetch } from "./api";

// --- TYPES (Giữ nguyên của bạn) ---
export type OrderItem = { /* ... như cũ ... */ };
export type Order = { /* ... như cũ ... */ };
export type OrderStats = { /* ... như cũ ... */ };
type OrdersApiResponse = { success?: boolean; message?: string; data?: { orders?: Order[]; total?: number; stats?: OrderStats; } };
type OrderApiResponse = { success?: boolean; message?: string; data?: Order };

// --- NORMALIZE FUNCTIONS (Giữ nguyên) ---
function toNumber(value: any, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function normalizeItem(item: any): OrderItem {
  const quantity = toNumber(item?.quantity ?? item?.qty, 1);
  const price = toNumber(item?.price ?? item?.unit_price, 0);
  const total = toNumber(item?.total ?? item?.subtotal ?? item?.line_total, price * quantity);
  return {
    ...item,
    id: item?.id,
    product_id: item?.product_id ?? item?.productId ?? item?.id ?? null,
    product_variant_id: item?.product_variant_id ?? item?.variant_id ?? item?.variantId ?? null,
    variant_id: item?.variant_id ?? item?.product_variant_id ?? item?.variantId ?? null,
    product_name: item?.product_name ?? item?.name ?? item?.product?.name ?? "Sản phẩm",
    name: item?.name ?? item?.product_name ?? item?.product?.name ?? "Sản phẩm",
    image: item?.image ?? item?.product_image ?? item?.product?.image_url ?? item?.product?.image ?? null,
    product_image: item?.product_image ?? item?.image ?? item?.product?.image_url ?? item?.product?.image ?? null,
    size: item?.size ?? null,
    color: item?.color ?? null,
    quantity, qty: quantity,
    price, unit_price: toNumber(item?.unit_price ?? item?.price, price),
    total, subtotal: toNumber(item?.subtotal ?? item?.total, total),
    line_total: toNumber(item?.line_total ?? item?.total, total),
  };
}

function normalizeOrder(order: any): Order {
  const itemsSource = order?.items ?? order?.order_items ?? [];
  const items = Array.isArray(itemsSource) ? itemsSource.map(normalizeItem) : [];
  const subtotal = toNumber(order?.subtotal ?? order?.total_price, 0);
  const shippingFee = toNumber(order?.shipping_fee ?? order?.shipping, 0);
  const discount = toNumber(order?.discount ?? order?.discount_amount, 0);
  const total = toNumber(order?.grand_total ?? order?.total ?? order?.total_price, subtotal + shippingFee - discount);
  const fullAddress = order?.shipping_address || [order?.address, order?.ward, order?.district, order?.province].filter(Boolean).join(", ");

  return {
    ...order,
    id: order?.id,
    order_code: order?.order_code ?? (order?.id ? `DNV-${String(order.id).padStart(6, "0")}` : undefined),
    customer_name: order?.customer_name ?? order?.customerName ?? order?.name ?? "Khách hàng",
    customerName: order?.customerName ?? order?.customer_name ?? order?.name ?? "Khách hàng",
    customer_email: order?.customer_email ?? order?.email ?? "",
    email: order?.email ?? order?.customer_email ?? "",
    customer_phone: order?.customer_phone ?? order?.phone ?? order?.customerPhone ?? "",
    phone: order?.phone ?? order?.customer_phone ?? order?.customerPhone ?? "",
    shipping_address: fullAddress || "",
    address: order?.address ?? order?.shipping_address ?? "",
    province: order?.province ?? "",
    district: order?.district ?? null,
    ward: order?.ward ?? "",
    note: order?.note ?? null,
    status: order?.status ?? "pending",
    payment_method: order?.payment_method ?? order?.paymentMethod ?? "cod",
    paymentMethod: order?.paymentMethod ?? order?.payment_method ?? "cod",
    payment_status: order?.payment_status ?? order?.paymentStatus ?? "unpaid",
    paymentStatus: order?.paymentStatus ?? order?.payment_status ?? "unpaid",
    subtotal,
    total_price: toNumber(order?.total_price ?? order?.subtotal, subtotal),
    shipping_fee: shippingFee,
    shipping: shippingFee,
    discount,
    discount_amount: toNumber(order?.discount_amount ?? order?.discount, discount),
    total,
    grand_total: total,
    created_at: order?.created_at ?? order?.createdAt ?? null,
    createdAt: order?.createdAt ?? order?.created_at ?? null,
    updated_at: order?.updated_at ?? null,
    items,
    order_items: items,
  };
}

// --- API SERVICES (Thống nhất dùng apiFetch) ---

export async function getMyOrders(params: { status?: string; search?: string; } = {}) {
  const query = new URLSearchParams();
  if (params.status && params.status !== "all") query.set("status", params.status);
  if (params.search) query.set("search", params.search);
  const response = await apiFetch<OrdersApiResponse>("/orders" + (query.toString() ? `?${query.toString()}` : ""));
  
  const rawOrders = response?.data?.orders ?? response?.data ?? [];
  return {
    orders: Array.isArray(rawOrders) ? rawOrders.map(normalizeOrder) : [],
    stats: response?.data?.stats ?? {},
    total: response?.data?.total ?? 0,
  };
}

export async function getOrderDetail(id: number | string) {
  const response = await apiFetch<OrderApiResponse>("/orders/" + id);
  return response?.data ? normalizeOrder(response.data) : null;
}

// --- ADMIN ORDER SERVICE (Fixed) ---
export const orderService = {
  getAll: async () => {
    const res = await apiFetch<OrdersApiResponse>("/admin/orders");
    const raw = res?.data?.orders ?? [];
    return raw.map(normalizeOrder);
  },
  getById: async (id: number | string) => {
    const res = await apiFetch<OrderApiResponse>(`/admin/orders/${id}`);
    return res?.data ? normalizeOrder(res.data) : null;
  },
  update: async (id: number | string, data: any) => {
    return await apiFetch(`/admin/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    });
  }
};