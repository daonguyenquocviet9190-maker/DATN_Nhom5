import api from "./api";

export const inventoryService = {
  getAll: async () => {
    const response = await api.get("/admin/inventory");
    return response.data;
  },
  updateStock: async (id: any, stock: number) => {
    const response = await api.put(`/admin/inventory/${id}`, { stock });
    return response.data;
  }
};