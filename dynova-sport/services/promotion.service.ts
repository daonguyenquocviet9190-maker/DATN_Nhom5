import api from "./api";

export const promotionService = {
  getAll: async () => {
    const response = await api.get("/admin/promotions");
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post("/admin/promotions", data);
    return response.data;
  },
  update: async (id: any, data: any) => {
    const response = await api.put(`/admin/promotions/${id}`, data);
    return response.data;
  },
  delete: async (id: any) => {
    const response = await api.delete(`/admin/promotions/${id}`);
    return response.data;
  }
};