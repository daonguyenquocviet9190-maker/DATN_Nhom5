import { apiFetch } from "./api";

export type OrderItem = {
  id?: number | string;
  product_id?: number | string | null;
  product_variant_id?: number | string | null;
  variant_id?: number | string | null;

  product_name?: string;
  name?: string;

  image?: string | null;
  product_image?: string | null;

  size?: string | null;
  color?: string | null;

  quantity?: number;
  qty?: number;

  price?: number;
  unit_price?: number;

  total?: number;
  subtotal?: number;
  line_total?: number;
};

export type OrderStatusHistory = {
  id?: number | string;
  from_status?: string | null;
  to_status?: string | null;
  source?: string | null;
  note?: string | null;
  created_at?: string | null;
};

export type OrderTrackingLog = {
  status?: string | null;
  status_label?: string | null;
  updated_date?: string | null;
};

export type OrderTracking = {
  order_code?: string | null;
  status?: string | null;
  status_label?: string | null;
  leadtime?: string | null;
  expected_delivery_time?: string | null;
  finish_date?: string | null;
  updated_date?: string | null;
  current_warehouse_id?: number | string | null;
  next_warehouse_id?: number | string | null;
  logs?: OrderTrackingLog[];
  sync_error?: string | null;
};

export type Order = {
  id: number | string;
  order_code?: string;

  customer_name?: string;
  customerName?: string;
  customer_email?: string;
  email?: string;
  customer_phone?: string;
  phone?: string;

  shipping_address?: string;
  address?: string;
  province?: string;
  district?: string | null;
  ward?: string;
  note?: string | null;

  status?: string;

  payment_status?: string;
  paymentStatus?: string;
  payment_method?: string;
  paymentMethod?: string;

  subtotal?: number;
  total_price?: number;
  shipping_fee?: number;
  shipping?: number;
  discount?: number;
  discount_amount?: number;
  total?: number;
  grand_total?: number;

  created_at?: string;
  createdAt?: string;
  updated_at?: string;

  shipping_provider?: string | null;
  tracking_code?: string | null;
  tracking?: OrderTracking | null;
  ghn_status?: string | null;
  ghn_expected_delivery_at?: string | null;
  ghn_last_synced_at?: string | null;
  shipping_status_history?: any[];
  status_history?: OrderStatusHistory[];
  payment_transactions?: any[];

  items?: OrderItem[];
  order_items?: OrderItem[];
};

export type OrderStats = {
  total?: number;
  pending?: number;
  shipping?: number;
  completed?: number;
  cancelled?: number;
};

type OrdersApiResponse = {
  success?: boolean;
  message?: string;
  data?: {
    orders?: Order[];
    total?: number;
    stats?: OrderStats;
  };
};

type OrderApiResponse = {
  success?: boolean;
  message?: string;
  data?: Order;
};

function toNumber(value: any, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function normalizeItem(item: any): OrderItem {
  const quantity = toNumber(item?.quantity ?? item?.qty, 1);
  const price = toNumber(item?.price ?? item?.unit_price, 0);

  const total = toNumber(
    item?.total ?? item?.subtotal ?? item?.line_total,
    price * quantity
  );

  return {
    ...item,

    id: item?.id,
    product_id: item?.product_id ?? item?.productId ?? item?.id ?? null,
    product_variant_id:
      item?.product_variant_id ?? item?.variant_id ?? item?.variantId ?? null,
    variant_id:
      item?.variant_id ?? item?.product_variant_id ?? item?.variantId ?? null,

    product_name:
      item?.product_name ?? item?.name ?? item?.product?.name ?? "Sản phẩm",
    name: item?.name ?? item?.product_name ?? item?.product?.name ?? "Sản phẩm",

    image:
      item?.image ??
      item?.product_image ??
      item?.product?.image_url ??
      item?.product?.image ??
      null,

    product_image:
      item?.product_image ??
      item?.image ??
      item?.product?.image_url ??
      item?.product?.image ??
      null,

    size: item?.size ?? null,
    color: item?.color ?? null,

    quantity,
    qty: quantity,

    price,
    unit_price: toNumber(item?.unit_price ?? item?.price, price),

    total,
    subtotal: toNumber(item?.subtotal ?? item?.total, total),
    line_total: toNumber(item?.line_total ?? item?.total, total),
  };
}

function normalizeOrder(order: any): Order {
  const itemsSource = order?.items ?? order?.order_items ?? [];
  const items = Array.isArray(itemsSource)
    ? itemsSource.map(normalizeItem)
    : [];

  const subtotal = toNumber(order?.subtotal ?? order?.total_price, 0);
  const shippingFee = toNumber(order?.shipping_fee ?? order?.shipping, 0);
  const discount = toNumber(order?.discount ?? order?.discount_amount, 0);

  const total = toNumber(
    order?.grand_total ?? order?.total ?? order?.total_price,
    subtotal + shippingFee - discount
  );

  const fullAddress =
    order?.shipping_address ||
    [order?.address, order?.ward, order?.district, order?.province]
      .filter(Boolean)
      .join(", ");

  return {
    ...order,

    id: order?.id,

    order_code:
      order?.order_code ??
      (order?.id ? `DNV-${String(order.id).padStart(6, "0")}` : undefined),

    customer_name:
      order?.customer_name ?? order?.customerName ?? order?.name ?? "Khách hàng",
    customerName:
      order?.customerName ?? order?.customer_name ?? order?.name ?? "Khách hàng",

    customer_email: order?.customer_email ?? order?.email ?? "",
    email: order?.email ?? order?.customer_email ?? "",

    customer_phone:
      order?.customer_phone ?? order?.phone ?? order?.customerPhone ?? "",
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

function extractOrders(response: OrdersApiResponse | any) {
  const rawOrders =
    response?.data?.orders ??
    response?.orders ??
    response?.data ??
    [];

  const orders = Array.isArray(rawOrders)
    ? rawOrders.map(normalizeOrder)
    : [];

  return {
    orders,
    stats: response?.data?.stats ?? response?.stats ?? {},
    total: response?.data?.total ?? response?.total ?? orders.length,
  };
}

function extractOrder(response: OrderApiResponse | any) {
  const rawOrder =
    response?.data?.order ??
    response?.data ??
    response?.order ??
    response;

  if (!rawOrder) return null;

  return normalizeOrder(rawOrder);
}

export async function getMyOrders(
  params: {
    status?: string;
    search?: string;
  } = {}
) {
  const query = new URLSearchParams();

  if (params.status && params.status !== "all") {
    query.set("status", params.status);
  }

  if (params.search) {
    query.set("search", params.search);
  }

  const response = await apiFetch<OrdersApiResponse>(
    "/orders" + (query.toString() ? `?${query.toString()}` : "")
  );

  return extractOrders(response);
}

export async function getOrderDetail(id: number | string) {
  const response = await apiFetch<OrderApiResponse>("/orders/" + id);
  return extractOrder(response);
}

export async function cancelOrder(id: number | string) {
  const response = await apiFetch<OrderApiResponse>(
    "/orders/" + id + "/cancel",
    {
      method: "POST",
    }
  );

  return {
    ...response,
    data: extractOrder(response),
  };
}

export async function reorderOrder(id: number | string) {
  const response = await apiFetch<OrderApiResponse>(
    "/orders/" + id + "/reorder",
    {
      method: "POST",
    }
  );

  return {
    ...response,
    data: extractOrder(response),
  };
}

export async function getOrders(
  params: {
    status?: string;
    search?: string;
  } = {}
) {
  return getMyOrders(params);
}

export async function getOrderById(id: number | string) {
  return getOrderDetail(id);
}