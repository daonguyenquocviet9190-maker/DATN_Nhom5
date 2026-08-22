import { apiFetch } from "./api";

export type VietQrPaymentState = {
  order_id: number;
  order_code: string;
  order_status: string;
  payment_status: string;
  transaction_status: string;
  transaction_ref: string;
  provider_transaction_no?: string | null;
  amount: number;
  transfer_content: string;
  qr_url: string;
  payment_mode?: "demo_scan" | "bank" | string;
  simulated?: boolean;
  money_transfer_required?: boolean;
  demo_scan_local_only?: boolean;
  bank: {
    name: string;
    code: string;
    account_number: string;
    account_name: string;
    branch?: string | null;
  };
  paid_at?: string | null;
};

type VietQrResponse = {
  success: boolean;
  message?: string;
  data: VietQrPaymentState;
};

export async function getVietQrPayment(orderId: number | string) {
  const response = await apiFetch<VietQrResponse>(`/payments/vietqr/orders/${orderId}`);
  return response?.data;
}

export async function refreshVietQrPayment(orderId: number | string) {
  const response = await apiFetch<VietQrResponse>(`/payments/vietqr/orders/${orderId}/refresh`, {
    method: "POST",
  });
  return response?.data;
}