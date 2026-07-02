import { apiFetch } from "./api";
import type { ApiCategory } from "./home.service";

// --- TYPES ---

type CategoryResponse = {
  success: boolean;
  message?: string;
  data: ApiCategory[];
};

// --- PUBLIC CATEGORY SERVICE ---

export async function getCategories() {
  const response = await apiFetch<CategoryResponse>("/categories");
  return response.data || [];
}

// --- ADMIN CATEGORY SERVICE (FIXED) ---

export const categoryService = {
  // Lấy danh sách danh mục
  getAll: async () => {
    const response = await apiFetch<CategoryResponse>('/admin/categories');
    return response.data || [];
  },

  // Thêm mới danh mục
  create: async (data: any) => {
    return await apiFetch('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    });
  },

  // Cập nhật danh mục
  update: async (id: string | number, data: any) => {
    return await apiFetch(`/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    });
  },

  // Xóa danh mục
  delete: async (id: string | number) => {
    return await apiFetch(`/admin/categories/${id}`, {
      method: 'DELETE'
    });
  }
};