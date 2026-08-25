import { apiFetch } from "./api";

export const DEFAULT_PUBLIC_SETTINGS = {
  site_name: "Dynova Sport",
  hotline: "",
  email: "",
  address: "",
  logo: "/images/dynova-logo.jpg",
  free_shipping_threshold: 500000,
  default_shipping_fee: 30000,
  return_days: 30,
  facebook: "",
  instagram: "",
  tiktok: "",
  currency: "VND",
  locale: "vi-VN",
  bank_name: "",
  bank_code: "",
  bank_account_number: "",
  bank_account_name: "",
  bank_branch: "",
};

export type PublicSettings = typeof DEFAULT_PUBLIC_SETTINGS;

export async function getPublicSettings() {
  const response: any = await apiFetch("/settings", { auth: false });
  const raw = response?.data?.settings ?? response?.data ?? response ?? {};
  const settings = { ...DEFAULT_PUBLIC_SETTINGS, ...raw } as PublicSettings;
  return { success: true, ...settings, settings, data: { ...settings, settings } };
}

export function getDefaultPublicSettings(): PublicSettings {
  return { ...DEFAULT_PUBLIC_SETTINGS };
}
