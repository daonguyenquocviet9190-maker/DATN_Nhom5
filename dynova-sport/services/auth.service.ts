const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"
).replace(/\/$/, "");

export type AuthRole = "admin" | "customer";

export type AuthUser = {
  id: number | string | null;
  fullName: string;
  name?: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: AuthRole;
  role_id?: number | string | null;
  [key: string]: any;
};

export type LoginPayload = {
  email: string;
  password: string;
  remember?: boolean;
};

export type RegisterPayload = {
  name?: string;
  fullName?: string;
  full_name?: string;
  email: string;
  password: string;
  password_confirmation?: string;
  phone?: string;
  address?: string;
  remember?: boolean;
};

export type LoginResult = {
  token: string;
  user: AuthUser;
  raw: any;
};

export type ApiActionResult = {
  success: boolean;
  message: string;
  data?: any;
};

type ApiError = Error & {
  status?: number;
  data?: any;
};

function safeJsonParse<T = any>(
  value: string | null,
  fallback: T | null = null
): T | null {
  try {
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function createApiError(
  message: string,
  status?: number,
  data?: any
): ApiError {
  const apiError: ApiError = new Error(message);
  apiError.status = status;
  apiError.data = data;

  return apiError;
}

function getFirstErrorMessage(data: any, fallback: string): string {
  return (
    data?.message ||
    data?.error ||
    data?.errors?.name?.[0] ||
    data?.errors?.fullName?.[0] ||
    data?.errors?.full_name?.[0] ||
    data?.errors?.email?.[0] ||
    data?.errors?.password?.[0] ||
    data?.errors?.password_confirmation?.[0] ||
    data?.errors?.phone?.[0] ||
    fallback
  );
}

function extractToken(data: any): string {
  return (
    data?.token ||
    data?.access_token ||
    data?.data?.token ||
    data?.data?.access_token ||
    data?.authorization?.token ||
    data?.data?.authorization?.token ||
    ""
  );
}

function extractUser(data: any): any {
  return (
    data?.user ||
    data?.data?.user ||
    data?.data?.account ||
    data?.account ||
    data?.profile ||
    data?.data?.profile ||
    null
  );
}

export function normalizeAuthRole(userOrRole: any): AuthRole {
  if (!userOrRole) return "customer";

  if (typeof userOrRole === "string") {
    const value = userOrRole.trim().toLowerCase();

    if (
      value === "admin" ||
      value === "administrator" ||
      value === "quan_tri" ||
      value === "quản trị"
    ) {
      return "admin";
    }

    return "customer";
  }

  if (userOrRole?.is_admin === true || userOrRole?.isAdmin === true) {
    return "admin";
  }

  const rawRole =
    userOrRole?.role?.name ||
    userOrRole?.role_name ||
    userOrRole?.roleName ||
    userOrRole?.role ||
    userOrRole?.type ||
    "";

  const value = String(rawRole).trim().toLowerCase();

  if (
    value === "admin" ||
    value === "administrator" ||
    value === "quan_tri" ||
    value === "quản trị"
  ) {
    return "admin";
  }

  return "customer";
}

export function normalizeAuthUser(rawUser: any): AuthUser {
  const user = rawUser || {};
  const role = normalizeAuthRole(user);

  const fullName =
    user.fullName ||
    user.full_name ||
    user.name ||
    user.username ||
    user.email ||
    "Người dùng";

  return {
    ...user,
    id: user.id || user.user_id || user.userId || null,
    fullName,
    name: user.name || fullName,
    email: user.email || "",
    phone: user.phone || "",
    avatar: user.avatar || user.avatar_url || "",
    role,
    role_id: user.role_id || user.roleId || user.role?.id || null,
  };
}

export function saveAuthSession({
  token,
  user,
  remember = true,
}: {
  token: string;
  user: any;
  remember?: boolean;
}) {
  if (typeof window === "undefined") return;

  const cleanUser = normalizeAuthUser(user);

  localStorage.setItem("dynova_auth_token", token || "");
  localStorage.setItem("auth_token", token || "");
  localStorage.setItem("token", token || "");

  localStorage.setItem("dynova_current_user", JSON.stringify(cleanUser));
  localStorage.setItem("currentUser", JSON.stringify(cleanUser));
  localStorage.setItem("dynova_user", JSON.stringify(cleanUser));
  localStorage.setItem("userDisplayName", cleanUser.fullName || "");

  localStorage.setItem("dynova_remember_login", remember ? "1" : "0");

  window.dispatchEvent(new Event("dynova:auth"));
  window.dispatchEvent(new Event("dynova:storage"));
}

export function getAuthToken(): string {
  if (typeof window === "undefined") return "";

  return (
    localStorage.getItem("dynova_auth_token") ||
    localStorage.getItem("auth_token") ||
    localStorage.getItem("token") ||
    ""
  );
}

export function getStoredAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;

  return (
    safeJsonParse<AuthUser>(localStorage.getItem("dynova_current_user")) ||
    safeJsonParse<AuthUser>(localStorage.getItem("currentUser")) ||
    safeJsonParse<AuthUser>(localStorage.getItem("dynova_user")) ||
    null
  );
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;

  [
    "dynova_auth_token",
    "auth_token",
    "token",
    "dynova_current_user",
    "currentUser",
    "dynova_user",
    "userDisplayName",
    "dynova_remember_login",
  ].forEach((key) => localStorage.removeItem(key));

  window.dispatchEvent(new Event("dynova:auth"));
  window.dispatchEvent(new Event("dynova:storage"));
  window.dispatchEvent(new Event("dynova:wishlist"));
}

export async function loginWithApi(payload: LoginPayload): Promise<LoginResult> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: payload.email,
      password: payload.password,
      remember: payload.remember !== false,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw createApiError(
      getFirstErrorMessage(data, "Email hoặc mật khẩu không đúng."),
      response.status,
      data
    );
  }

  const token = extractToken(data);
  const rawUser = extractUser(data);

  if (!token) {
    throw createApiError("API đăng nhập chưa trả token.", response.status, data);
  }

  if (!rawUser) {
    throw createApiError(
      "API đăng nhập chưa trả thông tin user.",
      response.status,
      data
    );
  }

  const user = normalizeAuthUser(rawUser);

  saveAuthSession({
    token,
    user,
    remember: payload.remember !== false,
  });

  return {
    token,
    user,
    raw: data,
  };
}

export async function registerWithApi(
  payload: RegisterPayload
): Promise<LoginResult> {
  const fullName =
    payload.fullName || payload.full_name || payload.name || "";

  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: payload.name || fullName,
      fullName,
      full_name: fullName,
      email: payload.email,
      password: payload.password,
      password_confirmation:
        payload.password_confirmation || payload.password,
      phone: payload.phone || "",
      address: payload.address || "",
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw createApiError(
      getFirstErrorMessage(data, "Không thể đăng ký tài khoản."),
      response.status,
      data
    );
  }

  const token = extractToken(data);
  const rawUser = extractUser(data);

  if (!rawUser) {
    throw createApiError(
      "API đăng ký chưa trả thông tin user.",
      response.status,
      data
    );
  }

  const user = normalizeAuthUser(rawUser);

  if (token) {
    saveAuthSession({
      token,
      user,
      remember: payload.remember !== false,
    });
  }

  return {
    token,
    user,
    raw: data,
  };
}

export async function logoutWithApi(): Promise<ApiActionResult> {
  const token = getAuthToken();

  try {
    if (token) {
      const response = await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok && response.status !== 401) {
        throw createApiError(
          getFirstErrorMessage(data, "Không thể đăng xuất khỏi hệ thống."),
          response.status,
          data
        );
      }
    }

    return {
      success: true,
      message: "Đăng xuất thành công.",
    };
  } finally {
    clearAuthSession();
  }
}

export async function fetchMeWithApi(): Promise<AuthUser | null> {
  const token = getAuthToken();

  if (!token) return null;

  const response = await fetch(`${API_URL}/auth/me`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthSession();
      return null;
    }

    throw createApiError(
      getFirstErrorMessage(data, "Không thể lấy thông tin tài khoản."),
      response.status,
      data
    );
  }

  const rawUser = extractUser(data) || data?.data || data;
  const user = normalizeAuthUser(rawUser);

  saveAuthSession({
    token,
    user,
    remember: true,
  });

  return user;
}