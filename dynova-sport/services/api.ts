const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

type ApiOptions = RequestInit & {
  token?: string;
};

function buildHeaders(options: ApiOptions): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  return headers;
}

export async function apiFetch<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const cleanEndpoint = endpoint.startsWith("/")
    ? endpoint
    : "/" + endpoint;

  const response = await fetch(API_URL + cleanEndpoint, {
    ...options,
    headers: buildHeaders(options),
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Không thể kết nối API.");
  }

  return data as T;
}

export function getImageUrl(path?: string | null) {
  if (!path) return "";

  if (path.startsWith("http")) return path;

  return path;
}