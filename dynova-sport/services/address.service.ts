import { apiFetch } from "./api";

export type Province = { id: string; name: string; raw?: any; source: "ghn" };
export type District = { id: string; name: string; provinceId?: string; raw?: any; source: "ghn" };
export type Ward = { id: string; name: string; districtId?: string; raw?: any; source: "ghn" };

export async function getShippingStatus() {
  const response: any = await apiFetch("/shipping/status", { auth: false });
  return response?.data || {};
}

export async function getShippingProvinces(): Promise<Province[]> {
  const response: any = await apiFetch("/shipping/provinces", { auth: false });
  const rows = Array.isArray(response?.data) ? response.data : [];

  return rows.map((row: any) => ({
    id: String(row.ProvinceID),
    name: String(row.ProvinceName || ""),
    raw: row,
    source: "ghn" as const,
  }));
}

export async function getShippingDistricts(province: Province): Promise<District[]> {
  const response: any = await apiFetch(
    `/shipping/districts?province_id=${encodeURIComponent(province.id)}`,
    { auth: false }
  );

  return (Array.isArray(response?.data) ? response.data : []).map((row: any) => ({
    id: String(row.DistrictID),
    name: String(row.DistrictName || ""),
    provinceId: province.id,
    raw: row,
    source: "ghn" as const,
  }));
}

export async function getShippingWards(district: District): Promise<Ward[]> {
  const response: any = await apiFetch(
    `/shipping/wards?district_id=${encodeURIComponent(district.id)}`,
    { auth: false }
  );

  return (Array.isArray(response?.data) ? response.data : []).map((row: any) => ({
    id: String(row.WardCode),
    name: String(row.WardName || ""),
    districtId: district.id,
    raw: row,
    source: "ghn" as const,
  }));
}
