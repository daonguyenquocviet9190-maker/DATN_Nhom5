import { apiFetch } from "./api";
import type { ApiBanner } from "./home.service";

type BannerResponse = {
  success: boolean;
  message?: string;
  data: ApiBanner[];
};

export async function getBanners() {
  const response = await apiFetch<BannerResponse>("/banners");

  return response.data || [];
}