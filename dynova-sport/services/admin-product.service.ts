import {
  adminFetch,
  extractItems,
  extractObject,
} from "@/services/admin.service";

export type AdminProductQuery = Record<
  string,
  string | number | boolean | null | undefined
>;

export type AdminProductVariantPayload = {
  id?: number | string | null;
  size_id?: number | string | null;
  color_id?: number | string | null;
  sku: string;
  price: number | string;
  discount_price?: number | string | null;
  stock: number | string;
  image?: string | null;
  existing_image?: string | null;
  is_active: boolean | number | string;
  upload_key?: string;
};

export function getAdminProducts(
  query: AdminProductQuery = {}
) {
  return adminFetch("/admin/products", {
    query,
  });
}

export function getAdminProduct(
  id: string | number
) {
  return adminFetch(
    `/admin/products/${id}`
  );
}

export function getAdminProductOptions() {
  return adminFetch(
    "/admin/product-options"
  );
}

export function createAdminProduct(
  payload: FormData
) {
  return adminFetch("/admin/products", {
    method: "POST",
    body: payload,
  });
}

export function updateAdminProduct(
  id: string | number,
  payload: FormData
) {
  payload.set("_method", "PUT");

  return adminFetch(
    `/admin/products/${id}`,
    {
      method: "POST",
      body: payload,
    }
  );
}

export function deleteAdminProduct(
  id: string | number
) {
  return adminFetch(
    `/admin/products/${id}`,
    {
      method: "DELETE",
    }
  );
}

export function extractAdminProducts(
  response: any
) {
  return extractItems(response, [
    "products",
    "items",
  ]);
}

export function extractAdminProduct(
  response: any
) {
  const product =
    response?.product ||
    response?.data?.product ||
    response?.data ||
    extractObject(response, [
      "product",
    ]);

  return product &&
    typeof product === "object" &&
    !Array.isArray(product)
    ? product
    : {};
}

export function extractAdminProductOptions(
  response: any
) {
  const data =
    response?.data &&
    typeof response.data === "object"
      ? response.data
      : response || {};

  const sizes = Array.isArray(data?.sizes)
    ? data.sizes
    : Array.isArray(response?.sizes)
      ? response.sizes
      : [];

  const colors = Array.isArray(data?.colors)
    ? data.colors
    : Array.isArray(response?.colors)
      ? response.colors
      : [];

  return {
    sizes,
    colors,
  };
}

export function extractAdminErrorMessage(
  error: any,
  fallback = "Không thể lưu sản phẩm."
) {
  const errors = error?.data?.errors;

  if (
    errors &&
    typeof errors === "object"
  ) {
    const message = Object.values(errors)
      .flat()
      .find(Boolean);

    if (message) {
      return String(message);
    }
  }

  return (
    error?.message ||
    error?.data?.message ||
    fallback
  );
}

export function extractAdminProductPagination(
  response: any,
  fallback: Partial<{
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  }> = {}
) {
  const meta =
    response?.data?.pagination ||
    response?.pagination ||
    response?.data?.meta ||
    response?.meta ||
    {};

  const items = extractAdminProducts(response);
  const currentPage = Math.max(
    1,
    Number(meta?.current_page ?? fallback.current_page ?? 1)
  );
  const perPage = Math.max(
    1,
    Number(meta?.per_page ?? fallback.per_page ?? (items.length || 12))
  );
  const total = Math.max(
    0,
    Number(meta?.total ?? response?.data?.total ?? response?.total ?? items.length)
  );
  const lastPage = Math.max(
    1,
    Number(meta?.last_page ?? (Math.ceil(total / perPage) || 1))
  );
  const from = total === 0
    ? 0
    : Number(meta?.from ?? (currentPage - 1) * perPage + 1);
  const to = total === 0
    ? 0
    : Number(meta?.to ?? Math.min(currentPage * perPage, total));

  return {
    current_page: currentPage,
    last_page: lastPage,
    per_page: perPage,
    total,
    from,
    to,
  };
}

export function extractAdminProductStats(response: any) {
  const stats =
    response?.data?.stats ||
    response?.stats ||
    {};

  return {
    total: Number(stats?.total_products ?? stats?.total ?? 0),
    active: Number(stats?.active_products ?? stats?.active ?? 0),
    totalVariants: Number(stats?.total_variants ?? stats?.variants ?? 0),
    lowStock: Number(stats?.low_stock_products ?? stats?.low_stock ?? 0),
  };
}