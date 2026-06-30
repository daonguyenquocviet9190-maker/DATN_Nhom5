import { apiFetch } from "./api";
import type { ApiCategory } from "./home.service";

type CategoryResponse = {
  success: boolean;
  message?: string;
  data: ApiCategory[];
};

export async function getCategories() {
  const response = await apiFetch<CategoryResponse>("/categories");

  return response.data || [];
}