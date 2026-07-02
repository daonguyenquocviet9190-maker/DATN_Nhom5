import axios, { AxiosError, AxiosRequestConfig } from 'axios';

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

// Interceptor để tự động đính kèm Token vào Header
apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Xử lý response và lỗi tập trung
apiClient.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError<any>) => {
    const message = error.response?.data?.message || error.response?.data?.error || "Đã có lỗi xảy ra.";
    
    // Ném ra lỗi để các component bắt (catch) được
    return Promise.reject({
      status: error.response?.status,
      message,
      data: error.response?.data
    });
  }
);

export default apiClient;