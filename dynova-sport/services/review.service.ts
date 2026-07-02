import { apiFetch } from "./api";

export type Review = {
  id?: number | string;
  user_id?: number | string;
  product_id?: number | string;
  order_id?: number | string | null;
  rating: number;
  content: string;
  status?: string;
  created_at?: string;
  user?: {
    id?: number | string;
    name?: string;
    email?: string;
  };
};

export async function getProductReviews(productId: number | string) {
  const response = await apiFetch(
    `/reviews?product_id=${productId}`,
    {
      auth: false,
    }
  );

  return response?.data || {
    reviews: [],
    total: 0,
    average: 0,
  };
}

export async function createReview(payload: {
  product_id: number | string;
  order_id?: number | string | null;
  rating: number;
  content: string;
}) {
  return apiFetch("/reviews", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getMyReviews() {
  const response = await apiFetch("/my-reviews");

  return response?.data || {
    reviews: [],
    total: 0,
  };
}

export async function updateReview(
  id: number | string,
  payload: {
    rating: number;
    content: string;
  }
) {
  return apiFetch(`/reviews/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteReview(id: number | string) {
  return apiFetch(`/reviews/${id}`, {
    method: "DELETE",
  });
}