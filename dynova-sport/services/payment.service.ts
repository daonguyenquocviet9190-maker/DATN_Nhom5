import { apiFetch } from "./api";

export type SePayPaymentState = {
  order_id: number;
  order_code: string;
  payment_code: string;
  order_status: string;
  payment_status: string;
  transaction_status: string;
  transaction_ref: string;
  provider_transaction_no?: string | null;
  amount: number;
  transfer_content: string;
  qr_url: string;
  payment_mode?: string;
  paid_at?: string | null;
  bank?: {
    name?: string;
    code?: string;
    account_number?: string;
    account_name?: string;
    branch?: string | null;
  } | null;
};

type SePayResponse = {
  success: boolean;
  message?: string;
  data: SePayPaymentState;
};

export async function getSePayPayment(orderId: number | string) {
  const response = await apiFetch<SePayResponse>(
    `/payments/sepay/orders/${encodeURIComponent(String(orderId))}`
  );
  return response?.data;
}

export async function refreshSePayPayment(orderId: number | string) {
  const response = await apiFetch<SePayResponse>(
    `/payments/sepay/orders/${encodeURIComponent(String(orderId))}/refresh`,
    { method: "POST" }
  );
  return response?.data;
}