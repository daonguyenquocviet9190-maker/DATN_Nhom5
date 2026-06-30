import { apiFetch } from "./api";

export type CartItemPayload = {
  id?: number | string;
  variantId?: number | string | null;
  key?: string;
  name?: string;
  image?: string;
  size?: string;
  color?: string;
  quantity?: number;
  price?: number;
  weight?: number;
  [key: string]: unknown;
};

export type ShippingFeePayload = {
  province: string;
  provinceCode?: string;
  district?: string;
  ward?: string;
  wardCode?: string;
  address: string;
  weight?: number;
  value?: number;
  items?: CartItemPayload[];
};

export type ShippingFeeResponse = {
  success: boolean;
  message?: string;
  data?: {
    fee: number;
    provider?: string;
    raw?: unknown;
  };
  fee?: number;
};

export type CheckoutOrderPayload = {
  customer: {
    fullName: string;
    email?: string;
    phone: string;
  };
  shippingAddress: {
    province: string;
    provinceCode?: string;
    district?: string;
    ward?: string;
    wardCode?: string;
    address: string;
    note?: string;
  };
  items: CartItemPayload[];
  coupon?: string;
  paymentMethod: string;
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  weight?: number;
};

export type CheckoutOrder = {
  id?: number | string;
  order_code?: string;
  total?: number;
  status?: string;
  payment_status?: string;
  payment_method?: string;
  [key: string]: unknown;
};

export type CheckoutOrderResponse = {
  success?: boolean;
  message?: string;
  data?: CheckoutOrder;
  order?: CheckoutOrder;
};

export type PaymentSessionPayload = {
  orderId: number | string;
  provider: "VNPAY" | "MOMO" | string;
  amount: number;
  returnUrl: string;
};

export type PaymentSessionResponse = {
  success?: boolean;
  message?: string;
  data?: {
    payment_url?: string | null;
    provider?: string;
    demo?: boolean;
  };
  payment_url?: string | null;
  payUrl?: string | null;
};

export async function calculateShippingFee(payload: ShippingFeePayload) {
  return apiFetch<ShippingFeeResponse>("/shipping/fee", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createCheckoutOrder(payload: CheckoutOrderPayload) {
  return apiFetch<CheckoutOrderResponse>("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createPaymentSession(payload: PaymentSessionPayload) {
  return apiFetch<PaymentSessionResponse>("/payments/create", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}