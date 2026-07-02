import axios, { AxiosError } from 'axios';

// Cấu hình Base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

// Tạo instance của Axios
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Helper lấy token
const getStoredToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("dynova_auth_token") || 
         localStorage.getItem("auth_token") || 
         localStorage.getItem("token");
};

// Interceptor để tự động đính kèm Token
apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Xử lý response tập trung
apiClient.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError<any>) => {
    const message = error.response?.data?.message || error.response?.data?.error || "Đã có lỗi xảy ra.";
    return Promise.reject({
      status: error.response?.status,
      message,
      data: error.response?.data
    });
  }
);

// --- PHẦN FIX CHO BẠN ---
// 1. Giữ nguyên default export để không làm hỏng các file cũ
export default apiClient;

// 2. Xuất thêm apiFetch để các service bạn vừa sửa hoạt động được
// Chúng ta map các method của axios vào apiFetch
export const apiFetch = async <T>(url: string, options?: any): Promise<T> => {
  const method = options?.method?.toLowerCase() || 'get';
  const config = {
    ...options,
    data: options?.body ? JSON.parse(options.body) : undefined,
  };
  
  // @ts-ignore
  console.log("Đang gọi API:", url, "với config:", config);
  return apiClient[method](url, config);
};