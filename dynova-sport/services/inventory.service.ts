import api from "./api"; // Đảm bảo bạn import đúng file cấu hình axios

export const inventoryService = {
  /**
   * Lấy danh sách tồn kho
   * Trả về: danh sách sản phẩm và số lượng
   */
  getAll: async () => {
    try {
      const response = await api.get("/admin/inventory");
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách kho:", error);
      throw error;
    }
  },

  /**
   * Cập nhật số lượng tồn kho
   * @param id: ID của bản ghi kho
   * @param data: { quantity_on_hand: number }
   */
  // Sửa thành 'inventory' (đúng chính tả), không được là 'a_ventory'
updateStock: async (id: number, data: { quantity_on_hand: number }) => {
    const response = await api.put(`/admin/inventory/${id}`, data); 
    return response.data;
},

  /**
   * Lấy lịch sử xuất nhập kho
   * @param productId: ID sản phẩm
   */
  getHistory: async (productId: number) => {
    try {
      // ĐÃ SỬA: Đảm bảo viết đúng là 'inventory', không phải 'a_ventory'
      const response = await api.get(`/admin/inventory/${productId}/history`);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy lịch sử kho:", error);
      throw error;
    }
  },
};