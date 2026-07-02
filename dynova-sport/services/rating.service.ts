import api from "./api";

export const ratingService = {
  getAll: async () => {
    const response = await api.get("/admin/ratings");
    return response.data;
  },
  delete: async (id: any) => {
    const response = await api.delete(`/admin/ratings/${id}`);
    return response.data;
  }
};