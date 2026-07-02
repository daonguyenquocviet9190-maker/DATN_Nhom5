import { apiFetch } from "./api";
import type { ApiBrand } from "./home.service";

// --- TYPES ---

type BrandResponse = {
  success: boolean;
  message?: string;
  data: ApiBrand[];
};

// --- PUBLIC BRAND SERVICE ---

export async function getBrands() {
  const response = await apiFetch<BrandResponse>("/brands");
  return response.data || [];
}

// --- ADMIN BRAND SERVICE (FIXED) ---

export const brandService = {
  // Lấy danh sách thương hiệu
  getAll: async () => {
    const response = await apiFetch<BrandResponse>('/admin/brands');
    return response.data || [];
  },

  // Thêm mới thương hiệu
  create: async (data: any) => {
    return await apiFetch('/admin/brands', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    });
  },

  // Cập nhật thương hiệu
  update: async (id: string | number, data: any) => {
    return await apiFetch(`/admin/brands/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    });
  },

  // Xóa thương hiệu
  delete: async (id: string | number) => {
    return await apiFetch(`/admin/brands/${id}`, {
      method: 'DELETE'
    });
  }
};