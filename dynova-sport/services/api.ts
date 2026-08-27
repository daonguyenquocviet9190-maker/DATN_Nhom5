import { clearAuthSession, getAuthToken } from "./auth.service";

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

function getStoredToken() {
  return getAuthToken();
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
    const validationMessage =
      data?.errors && typeof data.errors === "object"
        ? Object.values(data.errors).flat().filter(Boolean).join(" ")
        : "";

    if (response.status === 401 && auth && token) {
      clearAuthSession();
    }

    throw new ApiError(
      validationMessage ||
        data?.message ||
        data?.error ||
        "Không thể kết nối hệ thống. Vui lòng thử lại.",
      response.status,
      data
    );
  }

  return data as T;
}