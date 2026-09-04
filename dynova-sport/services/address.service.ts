import { apiFetch } from "./api";

export type Province = {
  id: string;
  name: string;
  raw?: any;
  source: "ghn";
};

export type Ward = {
  id: string;
  name: string;
  provinceId?: string;
  districtId?: string;
  districtName?: string;
  raw?: any;
  source: "ghn";
};

export async function getShippingStatus() {
  const response: any = await apiFetch("/shipping/status", { auth: false });
  return response?.data || {};
}

export async function getShippingProvinces(): Promise<Province[]> {
  const response: any = await apiFetch("/shipping/provinces", { auth: false });
  const rows = Array.isArray(response?.data) ? response.data : [];

  return rows
    .map((row: any) => ({
      id: String(row.ProvinceID ?? row.ProvinceCode ?? row.id ?? ""),
      name: String(row.ProvinceName ?? row.name ?? ""),
      raw: row,
      source: "ghn" as const,
    }))
    .filter((row: Province) => row.id && row.name);
}

/**
 * Địa chỉ hành chính 2 cấp trên UI:
 * Tỉnh/Thành phố -> Phường/Xã.
 *
 * GHN hiện vẫn sử dụng district_id nội bộ cho một số API phí/tạo vận đơn.
 * Backend /shipping/wards?province_id=... trả về ward kèm DistrictID để
 * frontend lưu districtCode ẩn, tuyệt đối không hiển thị Quận/Huyện cho khách.
 */
export async function getShippingWards(province: Province): Promise<Ward[]> {
  const response: any = await apiFetch(
    `/shipping/wards?province_id=${encodeURIComponent(province.id)}`,
    { auth: false }
  );

  const rows = Array.isArray(response?.data) ? response.data : [];

  return rows
    .map((row: any) => ({
      id: String(row.WardCode ?? row.WardID ?? row.Code ?? row.id ?? ""),
      name: String(row.WardName ?? row.name ?? ""),
      provinceId: province.id,
      districtId: row.DistrictID != null ? String(row.DistrictID) : undefined,
      districtName:
        row.DistrictName != null ? String(row.DistrictName) : undefined,
      raw: row,
      source: "ghn" as const,
    }))
    .filter((row: Ward) => row.id && row.name);
}
