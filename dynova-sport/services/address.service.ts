const ADDRESS_API_V2 = "https://provinces.open-api.vn/api/v2";
const ADDRESS_API_V1 = "https://provinces.open-api.vn/api";

export type Ward = {
  code: number | string;
  name: string;
  districtCode?: number | string;
  districtName?: string;
  [key: string]: unknown;
};

export type District = {
  code: number | string;
  name: string;
  wards?: Ward[];
  [key: string]: unknown;
};

export type Province = {
  code: number | string;
  name: string;
  wards?: Ward[];
  districts?: District[];
  [key: string]: unknown;
};

export async function getMergedProvinces(): Promise<Province[]> {
  try {
    const response = await fetch(ADDRESS_API_V2 + "/?depth=2", {
      cache: "force-cache",
    });

    if (!response.ok) {
      throw new Error("V2 address API failed.");
    }

    const data = await response.json();

    return Array.isArray(data) ? (data as Province[]) : [];
  } catch {
    const response = await fetch(ADDRESS_API_V1 + "/?depth=3", {
      cache: "force-cache",
    });

    if (!response.ok) {
      throw new Error("Không thể tải danh sách địa chỉ.");
    }

    const data = await response.json();

    return Array.isArray(data) ? (data as Province[]) : [];
  }
}

export function getProvinceWards(province?: Province | null): Ward[] {
  if (!province) return [];

  if (Array.isArray(province.wards)) {
    return province.wards;
  }

  if (Array.isArray(province.districts)) {
    return province.districts.flatMap((district) => {
      if (!Array.isArray(district.wards)) return [];

      return district.wards.map((ward) => ({
        ...ward,
        districtCode: district.code,
        districtName: district.name,
      }));
    });
  }

  return [];
}