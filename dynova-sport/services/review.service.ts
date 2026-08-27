import { apiFetch } from "./api";

export type ApiReviewUser = {
  id?: number | string | null;
  name?: string;
  email?: string | null;
  avatar_url?: string | null;
};

export type ApiReviewProduct = {
  id?: number | string | null;
  name?: string;
  slug?: string | null;
  image?: string | null;
  image_url?: string | null;
  price?: number;
};

export type ApiReview = {
  id?: number | string;
  user_id?: number | string | null;
  product_id?: number | string | null;
  order_id?: number | string | null;
  order_item_id?: number | string | null;
  rating: number;
  content: string;
  status?: string;
  created_at?: string | null;
  updated_at?: string | null;
  user?: ApiReviewUser;
  product?: ApiReviewProduct | null;
};

export type ApiReviewStats = {
  average: number;
  total: number;
  breakdown: Record<number, number>;
};

export type ProductReviewsResult = ApiReviewStats & {
  reviews: ApiReview[];
};

export type MyReviewsResult = {
  reviews: ApiReview[];
  total: number;
};

type ReviewListResponse = {
  success?: boolean;
  message?: string;
  data?: {
    reviews?: ApiReview[];
    total?: number;
    average?: number;
    breakdown?: Record<string | number, number>;
  };
};

type ReviewActionResponse = {
  success?: boolean;
  message?: string;
  data?: {
    review?: ApiReview;
    stats?: ApiReviewStats;
  };
};

function normalizeBreakdown(breakdown: any = {}) {
  return {
    5: Number(breakdown?.[5] || breakdown?.["5"] || 0),
    4: Number(breakdown?.[4] || breakdown?.["4"] || 0),
    3: Number(breakdown?.[3] || breakdown?.["3"] || 0),
    2: Number(breakdown?.[2] || breakdown?.["2"] || 0),
    1: Number(breakdown?.[1] || breakdown?.["1"] || 0),
  };
}

export async function getProductReviews(
  productId: number | string
): Promise<ProductReviewsResult> {
  const response = await apiFetch<ReviewListResponse>(
    `/reviews?product_id=${productId}`,
    {
      auth: false,
    }
  );

  const data = response?.data || {};

  return {
    reviews: Array.isArray(data.reviews) ? data.reviews : [],
    average: Number(data.average || 0),
    total: Number(data.total || data.reviews?.length || 0),
    breakdown: normalizeBreakdown(data.breakdown),
  };
}


export async function getReviewEligibility(productId: number | string) {
  const response = await apiFetch<any>(
    `/reviews/eligibility?product_id=${encodeURIComponent(String(productId))}`
  );

  return {
    can_review: Boolean(response?.data?.can_review),
    order_id: response?.data?.order_id ?? null,
    order_item_id: response?.data?.order_item_id ?? null,
    reason: response?.data?.reason || "",
  };
}

export async function createReview(payload: {
  product_id: number | string;
  order_id?: number | string | null;
  order_item_id?: number | string | null;
  rating: number;
  content: string;
}) {
  const response = await apiFetch<ReviewActionResponse>("/reviews", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return response?.data || {};
}

export async function getMyReviews(): Promise<MyReviewsResult> {
  const response = await apiFetch<ReviewListResponse>("/my-reviews");

  const data = response?.data || {};

  return {
    reviews: Array.isArray(data.reviews) ? data.reviews : [],
    total: Number(data.total || data.reviews?.length || 0),
  };
}

export async function updateReview(
  id: number | string,
  payload: {
    rating: number;
    content: string;
  }
) {
  const response = await apiFetch<ReviewActionResponse>(`/reviews/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  return response?.data || {};
}

export async function deleteReview(id: number | string) {
  return apiFetch(`/reviews/${id}`, {
    method: "DELETE",
  });
}