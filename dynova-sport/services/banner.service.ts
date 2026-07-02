<<<<<<< HEAD
import { apiFetch } from "./api";
import type { ApiBanner } from "./home.service";

type BannerResponse = {
  success: boolean;
  message?: string;
  data: ApiBanner[];
};

export async function getBanners() {
  const response = await apiFetch<BannerResponse>("/banners");

  return response.data || [];
}
=======
import api from './api';

export const bannerService = {
    // Lấy danh sách banner
    getAll: async () => {
        const response = await api.get('/admin/banners');
        return response.data;
    },

    // Thêm mới banner
    create: async (data: any) => {
        const response = await api.post('/admin/banners', data);
        return response.data;
    },

    // Cập nhật banner
    update: async (id: any, data: any) => {
        const response = await api.put(`/admin/banners/${id}`, data);
        return response.data;
    },

    // Xóa banner
    delete: async (id: any) => {
        const response = await api.delete(`/admin/banners/${id}`);
        return response.data;
    }
};
>>>>>>> tuananhbach
