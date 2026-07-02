<<<<<<< HEAD
import { apiFetch } from "./api";
import type { ApiBrand } from "./home.service";

type BrandResponse = {
  success: boolean;
  message?: string;
  data: ApiBrand[];
};

export async function getBrands() {
  const response = await apiFetch<BrandResponse>("/brands");

  return response.data || [];
}
=======
import api from './api';

export const brandService = {
    // Lấy danh sách thương hiệu
    getAll: async () => {
        const response = await api.get('/admin/brands');
        return response.data;
    },

    // Thêm mới thương hiệu
    create: async (data: any) => {
        const response = await api.post('/admin/brands', data);
        return response.data;
    },

    // Cập nhật thương hiệu
    update: async (id: any, data: any) => {
        const response = await api.put(`/admin/brands/${id}`, data);
        return response.data;
    },

    // Xóa thương hiệu
    delete: async (id: any) => {
        const response = await api.delete(`/admin/brands/${id}`);
        return response.data;
    }
};
>>>>>>> tuananhbach
