import { apiFetch } from "./api";
import type { ApiBanner } from "./home.service";

// --- TYPES ---

type BannerResponse = {
  success: boolean;
  message?: string;
  data: ApiBanner[];
};

// --- PUBLIC BANNER SERVICE ---

export async function getBanners() {
  const response = await apiFetch<BannerResponse>("/banners");
  return response.data || [];
}

// --- ADMIN BANNER SERVICE (FIXED) ---

export const bannerService = {
  // Lấy danh sách banner
  getAll: async () => {
    const response = await apiFetch<BannerResponse>('/admin/banners');
    return response.data || [];
  },

  // Thêm mới banner
  // Lưu ý: Nếu có upload file, bạn cần thay đổi headers. 
  // Đối với JSON thông thường:
  create: async (data: any) => {
    return await apiFetch('/admin/banners', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    });
  },

  // Cập nhật banner
  update: async (id: string | number, data: any) => {
    return await apiFetch(`/admin/banners/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    });
  },

  // Xóa banner
  delete: async (id: string | number) => {
    return await apiFetch(`/admin/banners/${id}`, {
      method: 'DELETE'
    });
  }
};