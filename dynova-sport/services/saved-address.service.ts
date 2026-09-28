import { apiFetch } from "./api";

export type SavedAddress = {
  id: number;
  user_id?: number;
  recipient_name: string;
  phone: string;
  province_code: number | string;
  province: string;
  district_code: number | string;
  district: string;
  ward_code: string;
  ward: string;
  address_line: string;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
};

export type SavedAddressPayload = Omit<
  SavedAddress,
  "id" | "user_id" | "created_at" | "updated_at"
>;

type AddressResponse = {
  success?: boolean;
  message?: string;
  data?: SavedAddress | SavedAddress[];
};

export async function getSavedAddresses(): Promise<SavedAddress[]> {
  const response = await apiFetch<AddressResponse>("/addresses");
  return Array.isArray(response?.data) ? response.data : [];
}

export async function createSavedAddress(payload: SavedAddressPayload) {
  return apiFetch<AddressResponse>("/addresses", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateSavedAddress(
  id: number | string,
  payload: SavedAddressPayload
) {
  return apiFetch<AddressResponse>(`/addresses/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteSavedAddress(id: number | string) {
  return apiFetch<AddressResponse>(`/addresses/${id}`, {
    method: "DELETE",
  });
}

export async function setDefaultSavedAddress(id: number | string) {
  return apiFetch<AddressResponse>(`/addresses/${id}/default`, {
    method: "PATCH",
  });
}
