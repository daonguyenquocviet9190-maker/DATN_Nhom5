import { apiFetch } from "./api";

export type ApiBrand = {
  id: number;
  name: string;
  slug: string;
  logo?: string | null;
  description?: string;
  is_active?: boolean | number;
  sort_order?: number;
};

export type ApiBanner = {
  id: number;
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  image_url?: string;
  cta_text?: string;
  cta_link?: string;
  secondary_text?: string;
  secondary_link?: string;
  is_active?: boolean | number;
  sort_order?: number;
};

export type ApiCategory = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  image_url?: string;
  sort_order?: number;
};

export type ApiProduct = {
  id: number;
  category_id?: number;
  brand_id?: number;
  name: string;
  slug?: string;
  brand?: string | ApiBrand;
  brand_data?: ApiBrand;
  brandInfo?: ApiBrand;
  short_description?: string;
  description?: string;
  image?: string;
  image_url?: string;
  price: number;
  compare_price?: number;
  rating?: number;
  sold?: number;
  status?: string;
  is_featured?: boolean | number;
  category?: {
    id: number;
    name: string;
    slug: string;
  };
};

type HomeApiResponse = {
  success: boolean;
  message?: string;
  data: {
    banners: ApiBanner[];
    categories: ApiCategory[];
    brands: ApiBrand[];
    products: ApiProduct[];
  };
};

export async function getHomeData() {
  const response = await apiFetch<HomeApiResponse>("/home");

  return {
    banners: response.data?.banners || [],
    categories: response.data?.categories || [],
    brands: response.data?.brands || [],
    products: response.data?.products || [],
  };
}