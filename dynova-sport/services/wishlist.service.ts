import { apiFetch } from "./api";

export type WishlistProduct = {
  id: number | string;
  name?: string;
  slug?: string;
  description?: string;
  price?: number;
  old_price?: number | null;
  image?: string | null;
  image_url?: string | null;
  stock?: number | null;
  status?: string | null;
  category_id?: number | string | null;
  brand_id?: number | string | null;
  created_at?: string | null;
};

export type WishlistItem = {
  wishlist_id?: number | string;
  product_id: number | string;
  wishlisted_at?: string;
  product?: WishlistProduct | null;
};

type WishlistListResponse = {
  success?: boolean;
  message?: string;
  data?: {
    items?: WishlistItem[];
    total?: number;
  };
};

type WishlistActionResponse = {
  success?: boolean;
  message?: string;
  data?: {
    product_id?: number | string;
    wishlisted?: boolean;
  };
};

export async function getWishlist() {
  const response = await apiFetch<WishlistListResponse>("/wishlist");

  return response.data || {
    items: [],
    total: 0,
  };
}

export async function addWishlistItem(productId: number | string) {
  const response = await apiFetch<WishlistActionResponse>("/wishlist", {
    method: "POST",
    body: JSON.stringify({
      product_id: productId,
    }),
  });

  return response.data || {
    product_id: productId,
    wishlisted: true,
  };
}

export async function toggleWishlistApi(productId: number | string) {
  const response = await apiFetch<WishlistActionResponse>("/wishlist/toggle", {
    method: "POST",
    body: JSON.stringify({
      product_id: productId,
    }),
  });

  return response.data || {
    product_id: productId,
    wishlisted: false,
  };
}

export async function removeWishlistItem(productId: number | string) {
  const response = await apiFetch<WishlistActionResponse>(
    `/wishlist/${productId}`,
    {
      method: "DELETE",
    }
  );

  return response.data || {
    product_id: productId,
    wishlisted: false,
  };
}

export async function checkWishlistItem(productId: number | string) {
  const response = await apiFetch<WishlistActionResponse>(
    `/wishlist/check/${productId}`
  );

  return response.data || {
    product_id: productId,
    wishlisted: false,
  };
}