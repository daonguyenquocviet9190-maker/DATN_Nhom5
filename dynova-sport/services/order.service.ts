import api from "./api";

export const orderService = {
  getAll: async () => {
    const response = await api.get("/admin/orders");
    return response.data;
  },
  getById: async (id: any) => {
    const response = await api.get(`/admin/orders/${id}`);
    return response.data;
  },
  update: async (id: any, data: any) => {
    const response = await api.put(`/admin/orders/${id}`, data);
    return response.data;
  }
};