import { apiFetch } from "./api";

const TOKEN_KEY = "dynova_auth_token";
const USER_KEY = "dynova_current_user";

export type AuthUser = {
  id: number | string;
  name?: string;
  fullName?: string;
  email: string;
  phone?: string;
  role?: "admin" | "customer" | string;
};

type AuthResponse = {
  success?: boolean;
  message?: string;
  data?: {
    token?: string;
    user?: AuthUser;
    dev_otp?: string;
  };
};

export function saveAuthSession(token?: string, user?: AuthUser) {
  if (typeof window === "undefined") return;

  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    // giữ tương thích với header/profile/cart cũ
    localStorage.setItem("currentUser", JSON.stringify(user));
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userDisplayName", user.name || user.fullName || "");
  }

  window.dispatchEvent(new Event("dynova:storage"));
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem("currentUser");
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("userDisplayName");

  window.dispatchEvent(new Event("dynova:storage"));
}

export async function loginWithApi(payload: {
  email: string;
  password: string;
  remember?: boolean;
}) {
  const response = await apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
    auth: false,
  });

  const token = response.data?.token;
  const user = response.data?.user;

  saveAuthSession(token, user);

  return {
    token,
    user,
    message: response.message,
  };
}

export async function registerWithApi(payload: {
  fullName: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
}) {
  const response = await apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
    auth: false,
  });

  const token = response.data?.token;
  const user = response.data?.user;

  saveAuthSession(token, user);

  return {
    token,
    user,
    message: response.message,
  };
}

export async function forgotPasswordWithApi(payload: { email: string }) {
  const response = await apiFetch<AuthResponse>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload),
    auth: false,
  });

  return response;
}

export async function resetPasswordWithApi(payload: {
  email: string;
  otp: string;
  password: string;
  password_confirmation: string;
}) {
  const response = await apiFetch<AuthResponse>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
    auth: false,
  });

  return response;
}

export async function logoutWithApi() {
  try {
    await apiFetch("/auth/logout", {
      method: "POST",
    });
  } finally {
    clearAuthSession();
  }
}