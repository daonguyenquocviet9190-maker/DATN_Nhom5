export type BankAccount = {
  bank: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  branch?: string;
};

export const bankAccount: BankAccount = {
  bank: "MB Bank",
  bankCode: "MB",
  accountNumber: "0937781823",
  accountName: "NGUYEN TRONG HOAI",
  branch: "Chi nhánh TP. Hồ Chí Minh",
};

export function formatCurrency(value: number | string = 0) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

/* =====================================================
   FALLBACK DATA
   Dùng để các file localStorage cũ không bị lỗi import.
   Trang Home/Product vẫn có thể lấy dữ liệu từ API bình thường.
===================================================== */

export const categories = [];

export const products = [];

export const seedOrders = [];

export const defaultSettings = {
  storeName: "Dynova Sport",
  storeEmail: "support@dynova.vn",
  storePhone: "0866347730",
  storeAddress: "TP. Hồ Chí Minh",
  currency: "VND",
  freeShippingFrom: 799000,
  shippingFee: 30000,
  taxRate: 0,
  allowCOD: true,
  allowBankTransfer: true,
  allowOnlinePayment: true,
};

export const coupons = [
  {
    code: "DYNOVANEW",
    type: "percent",
    value: 10,
    minOrder: 300000,
    message: "Giảm 10% cho đơn từ 300.000đ.",
  },
  {
    code: "FREESHIP",
    type: "shipping",
    value: 30000,
    minOrder: 500000,
    message: "Hỗ trợ phí vận chuyển cho đơn từ 500.000đ.",
  },
];