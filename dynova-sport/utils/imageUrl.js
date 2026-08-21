const API_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"
)
  .replace(/\/api\/?$/, "")
  .replace(/\/$/, "");

export const PRODUCT_FALLBACK = "/images/product-placeholder.svg";

export const CATEGORY_FALLBACK = "/images/category-placeholder.svg";

export const BRAND_FALLBACK =
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80";

function encodePath(path) {
  return String(path)
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

export function getStorageImage(
  value,
  folder = "products",
  fallback = PRODUCT_FALLBACK
) {
  if (!value) return fallback;

  const raw = String(value).trim();

  if (!raw || raw.includes("placeholder")) {
    return fallback;
  }

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }

  if (raw.startsWith("/storage/")) {
    return API_ORIGIN + encodePath(raw);
  }

  if (raw.startsWith("storage/")) {
    return API_ORIGIN + "/" + encodePath(raw);
  }

  if (raw.startsWith("/images/")) {
    return raw;
  }

  const cleanFileName = raw.replace(/^\/+/, "");

  return `${API_ORIGIN}/storage/${folder}/${encodePath(cleanFileName)}`;
}

export function getProductImage(product) {
  return getStorageImage(
    product?.image_url ||
      product?.image ||
      product?.thumbnail ||
      product?.imageUrl ||
      product?.thumbnail_url,
    "products",
    PRODUCT_FALLBACK
  );
}

export function getCategoryImage(category) {
  return getStorageImage(
    category?.image_url || category?.image || category?.thumbnail,
    "categories",
    CATEGORY_FALLBACK
  );
}

export function getBrandImage(brand) {
  return getStorageImage(
    brand?.logo_url || brand?.logo || brand?.image_url || brand?.image,
    "brands",
    BRAND_FALLBACK
  );
}