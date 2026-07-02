import { apiFetch } from "./api";

export type ReviewStatus = "pending" | "approved" | "rejected";

export type ApiReview = {
    id: number;
    user_id: number;
    product_id: number;
    rating: number;
    content: string;
    status: ReviewStatus;
    created_at: string;
    updated_at: string;
};

type ReviewListResponse = {
    success: boolean;
    message?: string;
    data:
    | {
        data: ApiReview[];
        current_page?: number;
        last_page?: number;
        total?: number;
    }
    | ApiReview[];
};

type ReviewDetailResponse = {
    success: boolean;
    message?: string;
    data: ApiReview;
};

type ReviewQuery = {
    per_page?: number;
    status?: ReviewStatus;
};

export type CreateReviewPayload = {
    rating: number;
    content: string;
};

// Lấy danh sách review theo product_id
// GET /reviews?product_id=xxx&status=approved&per_page=xxx
export async function getProductReviews(
    productId: string | number,
    params: ReviewQuery = {}
) {
    if (!productId) {
        return { data: [] as ApiReview[], current_page: 1, last_page: 1, total: 0 };
    }

    const searchParams = new URLSearchParams();

    searchParams.set("product_id", String(productId));
    searchParams.set("status", params.status || "approved");
    if (params.per_page) searchParams.set("per_page", String(params.per_page));

    const query = searchParams.toString();

    const response = await apiFetch<ReviewListResponse>(
        "/reviews" + (query ? `?${query}` : "")
    );

    if (Array.isArray(response.data)) {
        return {
            data: response.data,
            current_page: 1,
            last_page: 1,
            total: response.data.length,
        };
    }

    return response.data;
}

// (tuỳ chọn, dùng sau này nếu cho phép gửi đánh giá mới)
// POST /reviews
export async function createProductReview(
    productId: string | number,
    payload: CreateReviewPayload
) {
    const response = await apiFetch<ReviewDetailResponse>("/reviews", {
        method: "POST",
        body: JSON.stringify({
            product_id: productId,
            ...payload,
        }),
    });

    return response.data;
}