import { apiFetch } from "./api";

export type ProfileUser = {
  id: number | string;
  name?: string;
  fullName?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  role?: string;
  address?: string;
  province?: string;
  ward?: string;
  avatar_url?: string;
  created_at?: string;
};

type ProfileResponse = {
  success?: boolean;
  message?: string;
  data?: {
    user?: ProfileUser;
    stats?: any;
    recent_orders?: any[];
  };
};

export async function getProfile() {
  const response = await apiFetch<ProfileResponse>("/profile");
  return response.data || {
    user: null,
    stats: {},
    recent_orders: [],
  };
}

export async function updateProfile(payload: {
  fullName: string;
  email: string;
  phone: string;
  address?: string;
  province?: string;
  ward?: string;
  avatar_url?: string;
}) {
  const response = await apiFetch<ProfileResponse>("/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  return response.data;
}

export async function updateProfilePassword(payload: {
  current_password: string;
  password: string;
  password_confirmation: string;
}) {
  return apiFetch<ProfileResponse>("/profile/password", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function uploadProfileAvatar(file: File) {
  const formData = new FormData();
  formData.append("avatar", file);

  const response = await apiFetch<ProfileResponse>("/profile/avatar", {
    method: "POST",
    body: formData,
  });

  return response.data;
}