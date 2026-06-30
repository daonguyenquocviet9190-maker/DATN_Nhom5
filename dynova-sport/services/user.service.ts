import api from "./api";

export const userService = {
  getAll: async () => {
    const response = await api.get("/admin/users");
    return response.data;
  },
  getById: async (id: any) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },
  update: async (id: any, data: any) => {
    const response = await api.put(`/admin/users/${id}`, data);
    return response.data;
  },
  delete: async (id: any) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  }
};