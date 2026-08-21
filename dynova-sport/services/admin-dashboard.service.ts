import { getAuthToken } from "@/services/auth.service";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000/api"
).replace(/\/$/, "");

export type DashboardPeriod = "all" | "7d" | "30d" | "90d" | "12m";

function createDashboardError(message: string, status = 500, data: any = null) {
  const error: any = new Error(message);
  error.status = status;
  error.data = data;
  return error;
}

function hasCurrentDashboardShape(payload: any) {
  return Boolean(
    payload &&
      typeof payload === "object" &&
      payload.summary &&
      typeof payload.summary === "object" &&
      payload.lifetime &&
      typeof payload.lifetime === "object" &&
      payload.analytics &&
      typeof payload.analytics === "object" &&
      Array.isArray(payload.analytics.series) &&
      Array.isArray(payload.analytics.order_statuses)
  );
}

export async function getAdminDashboardReport(
  period: DashboardPeriod = "all",
  signal?: AbortSignal
) {
  const token = getAuthToken();

  if (!token) {
    throw createDashboardError("Phiên đăng nhập đã hết hạn.", 401);
  }

  const url = new URL(`${API_URL}/admin/dashboard`);
  url.searchParams.set("period", period);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
    signal,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw createDashboardError(
      data?.message || "Không thể tải dữ liệu quản trị.",
      response.status,
      data
    );
  }

  const payload = data?.data;

  // Không cho response cũ/không đúng schema âm thầm biến thành toàn số 0.
  if (!hasCurrentDashboardShape(payload)) {
    throw createDashboardError(
      "Dữ liệu Dashboard chưa đồng bộ với phiên bản hiện tại. Hãy kiểm tra route quản trị và tải lại.",
      409,
      data
    );
  }

  return data;
}