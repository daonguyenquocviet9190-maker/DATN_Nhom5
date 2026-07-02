import { apiFetch } from "./api";
import type { ApiProduct } from "./home.service";

// --- TYPES ---

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

// --- PUBLIC PRODUCT SERVICE ---

export async function getProducts(params: ProductQuery = {}) {
  const searchParams = new URLSearchParams();
  if (params.q) searchParams.set("q", params.q);
  if (params.category) searchParams.set("category", String(params.category));
  if (params.brand) searchParams.set("brand", String(params.brand));
  if (params.page) searchParams.set("page", String(params.page));
  if (params.per_page) searchParams.set("per_page", String(params.per_page));

  const query = searchParams.toString();
  const response = await apiFetch<ProductListResponse>("/products" + (query ? `?${query}` : ""));

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

// --- ADMIN PRODUCT SERVICE (FIXED) ---

export const productService = {
  getAll: async () => {
    return await apiFetch<ProductListResponse>('/admin/products');
  },

  getById: async (id: string | number) => {
    return await apiFetch<ProductDetailResponse>(`/admin/products/${id}`);
  },

  create: async (data: any) => {
    return await apiFetch('/admin/products', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    });
  },

  update: async (id: string | number, data: any) => {
    return await apiFetch(`/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    });
  },

  delete: async (id: string | number) => {
    return await apiFetch(`/admin/products/${id}`, {
      method: 'DELETE'
    });
  }
};