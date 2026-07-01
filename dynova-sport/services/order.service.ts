import { apiFetch } from "./api";

export type OrderItem = {
  id?: number | string;
  product_id?: number | string;
  variant_id?: number | string | null;
  product_name?: string;
  name?: string;
  image?: string;
  size?: string;
  color?: string;
  quantity?: number;
  price?: number;
  total?: number;
};

export type Order = {
  id: number | string;
  order_code?: string;
  customer_name?: string;
  customerName?: string;
  email?: string;
  phone?: string;
  address?: string;
  province?: string;
  district?: string | null;
  ward?: string;
  note?: string;
  status?: string;
  payment_status?: string;
  paymentStatus?: string;
  payment_method?: string;
  paymentMethod?: string;
  subtotal?: number;
  shipping_fee?: number;
  shipping?: number;
  discount?: number;
  total?: number;
  created_at?: string;
  createdAt?: string;
  items?: OrderItem[];
  order_items?: OrderItem[];
  timeline?: string[];
};

type OrdersResponse = {
  success?: boolean;
  message?: string;
  data?: {
    orders?: Order[];
    stats?: {
      total?: number;
      pending?: number;
      shipping?: number;
      completed?: number;
      cancelled?: number;
    };
  };
};

type OrderDetailResponse = {
  success?: boolean;
  message?: string;
  data?: Order;
};

export async function getMyOrders(params: {
  status?: string;
  search?: string;
} = {}) {
  const query = new URLSearchParams();

  if (params.status && params.status !== "all") {
    query.set("status", params.status);
  }

  if (params.search) {
    query.set("search", params.search);
  }

  const response = await apiFetch<OrdersResponse>(
    "/orders" + (query.toString() ? `?${query.toString()}` : "")
  );

  return response.data || {
    orders: [],
    stats: {},
  };
}

export async function getOrderDetail(id: number | string) {
  const response = await apiFetch<OrderDetailResponse>("/orders/" + id);

  return response.data;
}

export async function cancelOrder(id: number | string) {
  return apiFetch<OrderDetailResponse>("/orders/" + id + "/cancel", {
    method: "POST",
  });
}

export async function reorderOrder(id: number | string) {
  return apiFetch<OrderDetailResponse>("/orders/" + id + "/reorder", {
    method: "POST",
  });
}