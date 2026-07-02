import api from "./api";

// services/settings.service.ts

export const settingsService = {
  // Lấy dữ liệu cấu hình từ localStorage hoặc mặc định
  get: async () => {
    if (typeof window !== 'undefined') {
      const localData = localStorage.getItem('dynova_settings');
      if (localData) return JSON.parse(localData);
    }
    return {
      site_name: "Dynova Sport",
      site_title: "Dynova Sport - Cửa hàng đồ thể thao cao cấp",
      email: "contact@dynovasport.com",
      phone: "0901234567",
      address: "Ho Chi Minh City, Vietnam",
      maintenance_mode: false,
      allow_registration: true
    };
  },

  // Lưu cấu hình tạm thời vào localStorage
  update: async (data: any) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dynova_settings', JSON.stringify(data));
    }
    return { success: true, data };
  }
};