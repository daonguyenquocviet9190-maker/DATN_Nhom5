import api from './api';

export const categoryService = {
    // Lấy danh sách danh mục
    getAll: async () => {
        const response = await api.get('/admin/categories');
        return response.data;
    },

    // Thêm mới danh mục
    create: async (data: any) => {
        const response = await api.post('/admin/categories', data);
        return response.data;
    },

    // Cập nhật danh mục
    update: async (id: any, data: any) => {
        const response = await api.put(`/admin/categories/${id}`, data);
        return response.data;
    },

    // Xóa danh mục
    delete: async (id: any) => {
        const response = await api.delete(`/admin/categories/${id}`);
        return response.data;
    }
};