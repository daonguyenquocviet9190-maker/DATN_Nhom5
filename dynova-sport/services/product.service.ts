<<<<<<< HEAD
import { apiFetch } from "./api";
import type { ApiProduct } from "./home.service";

type ProductListResponse = {
  success: boolean;
  message?: string;
  data:
    | {
        data: ApiProduct[];
        current_page?: number;
        last_page?: number;
        total?: number;
      }
    | ApiProduct[];
};

type ProductDetailResponse = {
  success: boolean;
  message?: string;
  data: ApiProduct;
};

type ProductQuery = {
  q?: string;
  category?: string | number;
  brand?: string | number;
  page?: number;
  per_page?: number;
};

export async function getProducts(params: ProductQuery = {}) {
  const searchParams = new URLSearchParams();

  if (params.q) searchParams.set("q", params.q);
  if (params.category) searchParams.set("category", String(params.category));
  if (params.brand) searchParams.set("brand", String(params.brand));
  if (params.page) searchParams.set("page", String(params.page));
  if (params.per_page) searchParams.set("per_page", String(params.per_page));

  const query = searchParams.toString();

  const response = await apiFetch<ProductListResponse>(
    "/products" + (query ? `?${query}` : "")
  );

  if (Array.isArray(response.data)) {
    return {
      data: response.data,
      current_page: 1,
      last_page: 1,
      total: response.data.length,
    };
  }

  return response.data;
}

export async function getProductById(id: string | number) {
  const response = await apiFetch<ProductDetailResponse>("/products/" + id);

  return response.data;
}
=======
import api from './api';

export const productService = {
    // Lấy danh sách sản phẩm
    getAll: async () => {
        const response = await api.get('/admin/products');
        return response.data;
    },

    // Xem chi tiết 1 sản phẩm
    getById: async (id: any) => {
        const response = await api.get(`/admin/products/${id}`);
        return response.data;
    },

    // Thêm mới sản phẩm
    create: async (data: any) => {
        const response = await api.post('/admin/products', data);
        return response.data;
    },

    // Cập nhật sản phẩm
    update: async (id: any, data: any) => {
        const response = await api.put(`/admin/products/${id}`, data);
        return response.data;
    },

    // Xóa sản phẩm
    delete: async (id: any) => {
        const response = await api.delete(`/admin/products/${id}`);
        return response.data;
    }
};
>>>>>>> tuananhbach
