import {
  clearAuthSession,
  getAuthToken,
} from "./auth.service";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"
).replace(/\/$/, "");

export type WishlistProduct = {
  id: number | string;
  name?: string;
  slug?: string;
  short_description?: string | null;
  description?: string | null;
  price?: number | string;
  image?: string | null;
  status?: string | null;
  category_id?: number | string | null;
  brand_id?: number | string | null;
  category?: {
    id?: number | string;
    name?: string;
    slug?: string;
  } | null;
  brand?: {
    id?: number | string;
    name?: string;
    slug?: string;
    logo?: string | null;
  } | null;
  brand_data?: {
    id?: number | string;
    name?: string;
    slug?: string;
    logo?: string | null;
  } | null;
  variants?: any[];
  created_at?: string | null;
};

export type WishlistItem = {
  wishlist_id?: number | string | null;
  product_id: number | string;
  wishlisted_at?: string | null;
  product?: WishlistProduct | null;
};

export type WishlistListData = {
  items: WishlistItem[];
  total: number;
};

export type WishlistActionData = {
  wishlist_id?: number | string | null;
  product_id: number | string;
  wishlisted: boolean;
};

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
};

export type WishlistApiError = Error & {
  status?: number;
  data?: any;
};

function createWishlistError(
  message: string,
  status?: number,
  data?: any
): WishlistApiError {
  const error = new Error(message) as WishlistApiError;
  error.status = status;
  error.data = data;

  return error;
}

function getErrorMessage(data: any, fallback: string): string {
  return (
    data?.message ||
    data?.error ||
    data?.errors?.product_id?.[0] ||
    fallback
  );
}

function getRequiredToken(): string {
  const token = getAuthToken();

  if (!token) {
    throw createWishlistError(
      "Bạn cần đăng nhập để sử dụng danh sách yêu thích.",
      401
    );
  }

  return token;
}

async function wishlistFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiEnvelope<T>> {
  const token = getRequiredToken();
  const hasBody = options.body !== undefined && options.body !== null;

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(hasBody
        ? { "Content-Type": "application/json" }
        : {}),
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthSession();
    }

    throw createWishlistError(
      getErrorMessage(
        data,
        response.status === 401
          ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
          : "Không thể xử lý danh sách yêu thích."
      ),
      response.status,
      data
    );
  }

  return data as ApiEnvelope<T>;
}

/**
 * Đây là request thụ động.
 * Khi khách chưa đăng nhập, không gọi API để tránh 401 trong Console.
 */
export async function getWishlist(): Promise<WishlistListData> {
  if (!getAuthToken()) {
    return {
      items: [],
      total: 0,
    };
  }

  const response = await wishlistFetch<WishlistListData>("/wishlist");

  return {
    items: Array.isArray(response?.data?.items)
      ? response.data.items
      : [],
    total: Number(response?.data?.total || 0),
  };
}

export async function addWishlistItem(
  productId: number | string
): Promise<WishlistActionData> {
  const response = await wishlistFetch<WishlistActionData>(
    "/wishlist",
    {
      method: "POST",
      body: JSON.stringify({
        product_id: productId,
      }),
    }
  );

  return (
    response.data || {
      product_id: productId,
      wishlisted: true,
    }
  );
}

export async function toggleWishlistApi(
  productId: number | string
): Promise<WishlistActionData> {
  const response = await wishlistFetch<WishlistActionData>(
    "/wishlist/toggle",
    {
      method: "POST",
      body: JSON.stringify({
        product_id: productId,
      }),
    }
  );

  return (
    response.data || {
      product_id: productId,
      wishlisted: false,
    }
  );
}

export async function removeWishlistItem(
  productId: number | string
): Promise<WishlistActionData> {
  const response = await wishlistFetch<WishlistActionData>(
    `/wishlist/${encodeURIComponent(String(productId))}`,
    {
      method: "DELETE",
    }
  );

  return (
    response.data || {
      product_id: productId,
      wishlisted: false,
    }
  );
}

/**
 * Đây cũng là request thụ động.
 * Khi chưa đăng nhập, trả false ngay và không gọi API.
 */
export async function checkWishlistItem(
  productId: number | string
): Promise<WishlistActionData> {
  if (!getAuthToken()) {
    return {
      product_id: productId,
      wishlisted: false,
    };
  }

  const response = await wishlistFetch<WishlistActionData>(
    `/wishlist/check/${encodeURIComponent(String(productId))}`
  );

  return (
    response.data || {
      product_id: productId,
      wishlisted: false,
    }
  );
}

export function hasWishlistAuthToken(): boolean {
  return Boolean(getAuthToken());
}
