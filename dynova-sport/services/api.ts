<<<<<<< HEAD
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

type ApiOptions = RequestInit & {
  auth?: boolean;
  token?: string;
};

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data: any = null) {
    super(message);
    this.status = status;
    this.data = data;
  }
}
=======
import axios from 'axios';

// Lấy link từ file .env.local (http://127.0.0.1:8000/api)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});
>>>>>>> tuananhbach

function getStoredToken() {
  if (typeof window === "undefined") return null;

  return (
    localStorage.getItem("dynova_auth_token") ||
    localStorage.getItem("auth_token") ||
    localStorage.getItem("token")
  );
}

export async function apiFetch<T = unknown>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : "/" + endpoint;

  const {
    auth = true,
    token: optionToken,
    headers: optionHeaders,
    ...fetchOptions
  } = options;

  const token = optionToken || getStoredToken();
  const headers = new Headers(optionHeaders);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (!headers.has("Content-Type") && !(fetchOptions.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (auth && token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(API_URL + cleanEndpoint, {
    ...fetchOptions,
    headers,
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      data?.message ||
        data?.error ||
        "Không thể kết nối API. Vui lòng thử lại.",
      response.status,
      data
    );
  }

  return data as T;
}