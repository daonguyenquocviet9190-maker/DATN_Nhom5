const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

type ApiOptions = RequestInit & {
  auth?: boolean;
  token?: string;
};

function getStoredToken() {
  if (typeof window === "undefined") return null;

  return localStorage.getItem("dynova_auth_token");
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
    throw new Error(
      data?.message ||
        data?.error ||
        "Không thể kết nối API. Vui lòng thử lại."
    );
  }

  return data as T;
}

export function getImageUrl(path?: string | null) {
  if (!path) return "";
  if (path.startsWith("http")) return path;

  return path;
}