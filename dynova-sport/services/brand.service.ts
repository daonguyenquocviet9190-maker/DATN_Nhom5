import { apiFetch } from "./api";
import type { ApiBrand } from "./home.service";

type BrandResponse = {
  success: boolean;
  message?: string;
  data: ApiBrand[];
};

export async function getBrands() {
  const response = await apiFetch<BrandResponse>("/brands");

  return response.data || [];
}