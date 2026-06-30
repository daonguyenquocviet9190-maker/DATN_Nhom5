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