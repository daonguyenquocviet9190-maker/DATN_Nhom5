import { apiFetch } from "./api";

export type Ward = {
  code: string;
  name: string;
  districtCode: string;
  districtName: string;
  source: "ghn";
  [key: string]: unknown;
};

export type District = {
  code: string;
  name: string;
  provinceName?: string;
  source: "ghn";
  [key: string]: unknown;
};

export type Province = {
  code: string;
  name: string;
  source: "ghn";
  [key: string]: unknown;
};

type AddressResponse = {
  success?: boolean;
  message?: string;
  data?: Record<string, unknown>[];
};

export async function getShippingStatus() {
  const response: any = await apiFetch("/shipping/status", { auth: false });
  return response?.data || {};
}

export async function getShippingProvinces(): Promise<Province[]> {
  const response = await apiFetch<AddressResponse>("/shipping/provinces", {
    auth: false,
  });

  const provinces = (response?.data || [])
    .map((row) => ({
      code: String(row.ProvinceID ?? row.ProvinceCode ?? ""),
      name: String(row.ProvinceName ?? row.name ?? ""),
      source: "ghn" as const,
    }))
    .filter((row) => row.code && row.name);

  if (!provinces.length) {
    throw new Error("GHN chưa trả về danh sách tỉnh/thành phố.");
  }

  return provinces;
}

export const getMergedProvinces = getShippingProvinces;

export async function getShippingDistricts(
  province: Province
): Promise<District[]> {
  const response = await apiFetch<AddressResponse>(
    `/shipping/districts?province_id=${encodeURIComponent(province.code)}`,
    { auth: false }
  );

  const districts = (response?.data || [])
    .map((row) => ({
      code: String(row.DistrictID ?? row.DistrictId ?? ""),
      name: String(row.DistrictName ?? row.name ?? ""),
      provinceName: province.name,
      source: "ghn" as const,
    }))
    .filter((row) => row.code && row.name);

  if (!districts.length) {
    throw new Error("GHN chưa trả về quận/huyện cho tỉnh đã chọn.");
  }

  return districts;
}

export async function getShippingWards(
  district: District
): Promise<Ward[]> {
  const response = await apiFetch<AddressResponse>(
    `/shipping/wards?district_id=${encodeURIComponent(district.code)}`,
    { auth: false }
  );

  const wards = (response?.data || [])
    .map((row) => ({
      code: String(row.WardCode ?? row.WardID ?? ""),
      name: String(row.WardName ?? row.name ?? ""),
      districtCode: district.code,
      districtName: district.name,
      source: "ghn" as const,
    }))
    .filter((row) => row.code && row.name);

  if (!wards.length) {
    throw new Error("GHN chưa trả về phường/xã cho quận/huyện đã chọn.");
  }

  return wards;
}
