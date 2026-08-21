declare const process: {
  env: {
    NEXT_PUBLIC_API_URL?: string;
  };
};

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"
).replace(/\/$/, "");

export type AdminApiError = Error & {
  status?: number;
  data?: any;
};

type QueryParams = Record<string, string | number | boolean | null | undefined>;

type JsonBody = Record<string, any> | any[];

type AdminRequestBody =
  | string
  | FormData
  | URLSearchParams
  | Blob
  | ArrayBuffer
  | JsonBody
  | null
  | undefined;

type AdminFetchOptions = Omit<RequestInit, "body"> & {
  auth?: boolean;
  query?: QueryParams;
  body?: AdminRequestBody;
};

function getToken(): string {
  if (typeof window === "undefined") return "";

  return (
    localStorage.getItem("dynova_auth_token") ||
    localStorage.getItem("auth_token") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("dynova_auth_token") ||
    sessionStorage.getItem("auth_token") ||
    sessionStorage.getItem("token") ||
    ""
  );
}

function buildUrl(endpoint: string, query?: QueryParams): string {
  const normalizedEndpoint = endpoint.startsWith("/")
    ? endpoint
    : "/" + endpoint;

  const url = new URL(API_URL + normalizedEndpoint);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      url.searchParams.set(key, String(value));
    });
  }

  return url.toString();
}

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== "undefined" && value instanceof FormData;
}

function isUrlSearchParams(value: unknown): value is URLSearchParams {
  return (
    typeof URLSearchParams !== "undefined" && value instanceof URLSearchParams
  );
}

function isBlob(value: unknown): value is Blob {
  return typeof Blob !== "undefined" && value instanceof Blob;
}

function isArrayBuffer(value: unknown): value is ArrayBuffer {
  return typeof ArrayBuffer !== "undefined" && value instanceof ArrayBuffer;
}

function isArrayBufferView(value: unknown): boolean {
  return typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView(value as any);
}

function isRawBody(value: unknown): boolean {
  return (
    typeof value === "string" ||
    isFormData(value) ||
    isUrlSearchParams(value) ||
    isBlob(value) ||
    isArrayBuffer(value) ||
    isArrayBufferView(value)
  );
}

function toFetchBody(body: AdminRequestBody): any {
  if (body === undefined || body === null) return undefined;
  if (isRawBody(body)) return body;

  return JSON.stringify(body);
}

function shouldUseJsonHeader(body: AdminRequestBody): boolean {
  if (body === undefined || body === null) return true;
  if (isRawBody(body)) return typeof body === "string";

  return true;
}

function createAdminError(response: Response, data: any): AdminApiError {
  const message =
    data?.message ||
    data?.error ||
    data?.errors?.name?.[0] ||
    data?.errors?.title?.[0] ||
    data?.errors?.email?.[0] ||
    data?.errors?.status?.[0] ||
    data?.errors?.is_active?.[0] ||
    data?.errors?.code?.[0] ||
    "Không thể xử lý yêu cầu quản trị.";

  const error: AdminApiError = new Error(message);
  error.status = response.status;
  error.data = data;

  return error;
}

export async function adminFetch<T = any>(
  endpoint: string,
  options: AdminFetchOptions = {}
): Promise<T> {
  const { auth = true, query, body, ...fetchOptions } = options;

  const headers = new Headers(fetchOptions.headers || {});
  const finalBody = toFetchBody(body);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (!headers.has("Content-Type") && shouldUseJsonHeader(body)) {
    headers.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = getToken();

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const requestOptions: RequestInit = {
    ...fetchOptions,
    headers,
    cache: "no-store",
  };

  if (finalBody !== undefined) {
    (requestOptions as any).body = finalBody;
  }

  const response = await fetch(buildUrl(endpoint, query), requestOptions);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw createAdminError(response, data);
  }

  return data as T;
}

export function extractItems(response: any, keys: string[] = []): any[] {
  const candidates = [
    ...keys.map((key) => response?.[key]),
    ...keys.map((key) => response?.data?.[key]),

    response?.data?.data,
    response?.data?.items,
    response?.data?.products,
    response?.data?.categories,
    response?.data?.brands,
    response?.data?.orders,
    response?.data?.customers,
    response?.data?.users,
    response?.data?.banners,
    response?.data?.inventory,
    response?.data?.promotions,
    response?.data?.ratings,
    response?.data?.reviews,

    response?.items,
    response?.products,
    response?.categories,
    response?.brands,
    response?.orders,
    response?.customers,
    response?.users,
    response?.banners,
    response?.inventory,
    response?.promotions,
    response?.ratings,
    response?.reviews,

    response?.data,
    response,
  ];

  const found = candidates.find((item) => Array.isArray(item));
  return found || [];
}

export function extractObject(response: any, keys: string[] = []): any {
  const candidates = [
    ...keys.map((key) => response?.[key]),
    ...keys.map((key) => response?.data?.[key]),
    response?.data,
    response,
  ];

  const found = candidates.find(
    (item) => item && typeof item === "object" && !Array.isArray(item)
  );

  return found || {};
}

function notFoundFallback(error: any): boolean {
  return error?.status === 404 || error?.status === 405;
}

async function safeAdminList(
  endpoint: string,
  fallbackEndpoint = "",
  query: QueryParams = {}
) {
  try {
    return await adminFetch(endpoint, {
      query,
    });
  } catch (error: any) {
    if (fallbackEndpoint && notFoundFallback(error)) {
      return adminFetch(fallbackEndpoint, {
        query,
        auth: false,
      });
    }

    throw error;
  }
}

export async function getAdminDashboard() {
  try {
    return await adminFetch("/admin/dashboard");
  } catch (error: any) {
    if (!notFoundFallback(error)) throw error;

    const [products, categories, brands, orders, customers, banners] =
      await Promise.allSettled([
        adminFetch("/products", {
          auth: false,
          query: {
            per_page: 200,
          },
        }),
        adminFetch("/categories", {
          auth: false,
          query: {
            per_page: 200,
          },
        }),
        adminFetch("/brands", {
          auth: false,
          query: {
            per_page: 200,
          },
        }),
        adminFetch("/admin/orders", {
          query: {
            per_page: 200,
          },
        }),
        adminFetch("/admin/customers", {
          query: {
            per_page: 200,
          },
        }),
        adminFetch("/banners", {
          auth: false,
          query: {
            per_page: 200,
          },
        }),
      ]);

    const productsData =
      products.status === "fulfilled"
        ? extractItems(products.value, ["products"])
        : [];

    const categoriesData =
      categories.status === "fulfilled"
        ? extractItems(categories.value, ["categories"])
        : [];

    const brandsData =
      brands.status === "fulfilled" ? extractItems(brands.value, ["brands"]) : [];

    const ordersData =
      orders.status === "fulfilled" ? extractItems(orders.value, ["orders"]) : [];

    const customersData =
      customers.status === "fulfilled"
        ? extractItems(customers.value, ["customers", "users"])
        : [];

    const bannersData =
      banners.status === "fulfilled"
        ? extractItems(banners.value, ["banners"])
        : [];

    const revenue = ordersData.reduce((sum: number, order: any) => {
      return (
        sum +
        Number(
          order?.grand_total ||
            order?.total ||
            order?.total_price ||
            order?.final_total ||
            0
        )
      );
    }, 0);

    return {
      success: true,
      data: {
        revenue,
        total_products: productsData.length,
        total_categories: categoriesData.length,
        total_brands: brandsData.length,
        total_orders: ordersData.length,
        total_customers: customersData.length,
        total_banners: bannersData.length,
        products: productsData,
        categories: categoriesData,
        brands: brandsData,
        orders: ordersData,
        customers: customersData,
        banners: bannersData,
      },
    };
  }
}

/* =========================
   Products
========================= */

export function getAdminProducts(query: QueryParams = {}) {
  return safeAdminList("/admin/products", "/products", query);
}

export function createAdminProduct(payload: any) {
  return adminFetch("/admin/products", {
    method: "POST",
    body: payload,
  });
}

export function updateAdminProduct(id: string | number, payload: any) {
  if (isFormData(payload)) {
    payload.set("_method", "PUT");

    return adminFetch(`/admin/products/${id}`, {
      method: "POST",
      body: payload,
    });
  }

  return adminFetch(`/admin/products/${id}`, {
    method: "PUT",
    body: payload,
  });
}

export function deleteAdminProduct(id: string | number) {
  return adminFetch(`/admin/products/${id}`, {
    method: "DELETE",
  });
}

/* =========================
   Categories
========================= */

export function getAdminCategories(query: QueryParams = {}) {
  return safeAdminList("/admin/categories", "/categories", query);
}

export function createAdminCategory(payload: any) {
  return adminFetch("/admin/categories", {
    method: "POST",
    body: payload,
  });
}

export function updateAdminCategory(id: string | number, payload: any) {
  if (isFormData(payload)) {
    payload.set("_method", "PUT");

    return adminFetch(`/admin/categories/${id}`, {
      method: "POST",
      body: payload,
    });
  }

  return adminFetch(`/admin/categories/${id}`, {
    method: "PUT",
    body: payload,
  });
}

export function deleteAdminCategory(id: string | number) {
  return adminFetch(`/admin/categories/${id}`, {
    method: "DELETE",
  });
}

/* =========================
   Brands
========================= */

export function getAdminBrands(query: QueryParams = {}) {
  return safeAdminList("/admin/brands", "/brands", query);
}

export function createAdminBrand(payload: any) {
  return adminFetch("/admin/brands", {
    method: "POST",
    body: payload,
  });
}

export function updateAdminBrand(id: string | number, payload: any) {
  if (isFormData(payload)) {
    payload.set("_method", "PUT");

    return adminFetch(`/admin/brands/${id}`, {
      method: "POST",
      body: payload,
    });
  }

  return adminFetch(`/admin/brands/${id}`, {
    method: "PUT",
    body: payload,
  });
}

export function deleteAdminBrand(id: string | number) {
  return adminFetch(`/admin/brands/${id}`, {
    method: "DELETE",
  });
}

/* =========================
   Orders
========================= */

export function getAdminOrders(query: QueryParams = {}) {
  return safeAdminList("/admin/orders", "", query);
}

export function updateAdminOrderStatus(
  id: number | string,
  status: string,
  options: { tracking_code?: string; shipping_provider?: string } = {}
) {
  return adminFetch(`/admin/orders/${id}/status`, {
    method: "PATCH",
    body: {
      status,
      ...options,
    },
  });
}

/* =========================
   Customers
========================= */

export function getAdminCustomers(query: QueryParams = {}) {
  return safeAdminList("/admin/customers", "", query);
}

export function updateAdminCustomerStatus(
  id: number | string,
  is_active: boolean
) {
  return adminFetch(`/admin/customers/${id}/status`, {
    method: "PATCH",
    body: {
      is_active,
    },
  });
}

/* =========================
   Banners
========================= */

export function getAdminBanners(query: QueryParams = {}) {
  return safeAdminList("/admin/banners", "/banners", query);
}

export function createAdminBanner(payload: any) {
  return adminFetch("/admin/banners", {
    method: "POST",
    body: payload,
  });
}

export function updateAdminBanner(id: string | number, payload: any) {
  if (isFormData(payload)) {
    payload.set("_method", "PUT");

    return adminFetch(`/admin/banners/${id}`, {
      method: "POST",
      body: payload,
    });
  }

  return adminFetch(`/admin/banners/${id}`, {
    method: "PUT",
    body: payload,
  });
}

export function deleteAdminBanner(id: string | number) {
  return adminFetch(`/admin/banners/${id}`, {
    method: "DELETE",
  });
}

/* =========================
   Settings
========================= */

export function getAdminSettings() {
  return adminFetch("/admin/settings");
}

export function updateAdminSettings(payload: any) {
  return adminFetch("/admin/settings", {
    method: "PUT",
    body: payload,
  });
}

/* =========================
   Promotions
========================= */

export function getAdminPromotions(query: QueryParams = {}) {
  return safeAdminList("/admin/promotions", "", query);
}

export function createAdminPromotion(payload: any) {
  return adminFetch("/admin/promotions", {
    method: "POST",
    body: payload,
  });
}

export function updateAdminPromotion(id: string | number, payload: any) {
  return adminFetch(`/admin/promotions/${id}`, {
    method: "PUT",
    body: payload,
  });
}

export function deleteAdminPromotion(id: string | number) {
  return adminFetch(`/admin/promotions/${id}`, {
    method: "DELETE",
  });
}

/* =========================
   Ratings / Reviews
========================= */

export function getAdminRatings(query: QueryParams = {}) {
  return safeAdminList("/admin/ratings", "", query);
}

export function updateAdminRatingStatus(
  id: string | number,
  status: string
) {
  return adminFetch(`/admin/ratings/${id}/status`, {
    method: "PATCH",
    body: {
      status,
    },
  });
}

export function deleteAdminRating(id: string | number) {
  return adminFetch(`/admin/ratings/${id}`, {
    method: "DELETE",
  });
}

/* =========================
   Inventory
========================= */

export function getAdminInventory(query: QueryParams = {}) {
  return safeAdminList("/admin/inventory", "", query);
}

/* =========================
   Normalize helpers
========================= */

export function getNormalizedStock(item: any): number {
  const value =
    item?.total_stock ??
    item?.variant_total_stock ??
    item?.stock_total ??
    item?.stock ??
    item?.quantity ??
    item?.qty ??
    0;

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

export function getNormalizedVariantCount(item: any): number {
  const value =
    item?.variant_count ??
    item?.variants_count ??
    item?.variantCount ??
    item?.total_variants ??
    0;

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

export function getNormalizedMinStock(item: any): number {
  const value = item?.min_stock ?? item?.minimum_stock ?? 0;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

export function getNormalizedMaxStock(item: any): number {
  const value = item?.max_stock ?? item?.maximum_stock ?? 0;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

export function getNormalizedCategoryName(
  item: any,
  categories: any[] = []
): string {
  if (typeof item?.category === "string" && item.category.trim()) {
    return item.category;
  }

  if (item?.category?.name) return item.category.name;
  if (item?.category_name) return item.category_name;
  if (item?.categoryName) return item.categoryName;

  const categoryId = item?.category_id ?? item?.categoryId;
  const found = categories.find((category) => {
    return String(category?.id) === String(categoryId);
  });

  return found?.name || "Chưa phân loại";
}

export function getNormalizedBrandName(
  item: any,
  brands: any[] = []
): string {
  if (typeof item?.brand === "string" && item.brand.trim()) {
    return item.brand;
  }

  if (item?.brand?.name) return item.brand.name;
  if (item?.brand_name) return item.brand_name;
  if (item?.brandName) return item.brandName;

  const brandId = item?.brand_id ?? item?.brandId;
  const found = brands.find((brand) => {
    return String(brand?.id) === String(brandId);
  });

  return found?.name || "Chưa có thương hiệu";
}

export function getAdminOrderById(id: string | number) {
  return adminFetch(`/admin/orders/${id}`);
}
