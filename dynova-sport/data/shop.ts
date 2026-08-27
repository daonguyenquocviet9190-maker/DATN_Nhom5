export function formatCurrency(value: number | string = 0) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

// Compatibility exports for legacy helpers. Commerce/catalog data must come from API.
export const categories = [];
export const products = [];
export const seedOrders = [];
export const coupons = [];

export const defaultSettings = {
  storeName: "Dynova Sport",
  storeEmail: "",
  storePhone: "",
  storeAddress: "",
  currency: "VND",
  freeShippingFrom: 500000,
  shippingFee: 30000,
  taxRate: 0,
  allowCOD: true,
  allowBankTransfer: true,
  allowOnlinePayment: true,
};
