const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000/api"
).replace(/\/$/, "");

const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

const SERVER_CART_KEY = "dynova_server_cart";
const GUEST_CART_KEY = "dynova_cart";

function isBrowser() {
  return typeof window !== "undefined";
}

export function getCartToken() {
  if (!isBrowser()) return "";

  return (
    localStorage.getItem("dynova_auth_token") ||
    localStorage.getItem("auth_token") ||
    localStorage.getItem("token") ||
    ""
  );
}

export function hasCartAuth() {
  return Boolean(getCartToken());
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function encodePath(value) {
  return String(value || "")
    .replace(/\\/g, "/")
    .split("/")
    .map((part) => encodeURIComponent(safeDecode(part)))
    .join("/");
}

function normalizeImage(value) {
  const raw = String(value || "").trim();

  if (!raw) {
    return "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&auto=format&fit=crop&q=80";
  }

  if (
    raw.startsWith("http://") ||
    raw.startsWith("https://") ||
    raw.startsWith("data:") ||
    raw.startsWith("blob:")
  ) {
    return raw;
  }

  const clean = raw.replace(/\\/g, "/");

  if (clean.startsWith("/storage/")) {
    return API_ORIGIN + encodePath(clean);
  }

  if (clean.startsWith("storage/")) {
    return API_ORIGIN + "/" + encodePath(clean);
  }

  if (clean.startsWith("products/")) {
    return API_ORIGIN + "/storage/" + encodePath(clean);
  }

  if (clean.startsWith("/")) {
    return clean;
  }

  return (
    API_ORIGIN +
    "/storage/products/" +
    encodePath(clean)
  );
}

function getOptionName(value, fallback) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return fallback;
  }

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return String(value);
  }

  return String(
    value?.name ??
      value?.label ??
      value?.value ??
      fallback
  );
}

function toNumber(value, fallback = 0) {
  const result = Number(value);

  return Number.isFinite(result)
    ? result
    : fallback;
}

function extractErrors(data) {
  const errors = data?.errors;

  if (!errors || typeof errors !== "object") {
    return "";
  }

  return Object.values(errors)
    .flat()
    .filter(Boolean)
    .join(" ");
}

async function cartRequest(
  endpoint,
  options = {}
) {
  const token = getCartToken();

  if (!token) {
    const error = new Error(
      "Bạn cần đăng nhập để sử dụng giỏ hàng."
    );

    error.status = 401;
    throw error;
  }

  const response = await fetch(
    API_URL + endpoint,
    {
      ...options,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.body
          ? {
              "Content-Type": "application/json",
            }
          : {}),
        ...(options.headers || {}),
      },
      cache: "no-store",
    }
  );

  const data = await response
    .json()
    .catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      extractErrors(data) ||
        data?.message ||
        "Không thể cập nhật giỏ hàng."
    );

    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data;
}

export function normalizeServerCartItem(raw) {
  const product = raw?.product || {};

  const variant =
    raw?.variant ||
    raw?.product_variant ||
    raw?.productVariant ||
    {};

  const cartItemId =
    raw?.cart_item_id ??
    raw?.cartItemId ??
    raw?.id ??
    null;

  const productId =
    raw?.product_id ??
    raw?.productId ??
    product?.id ??
    null;

  const variantId =
    raw?.product_variant_id ??
    raw?.variant_id ??
    raw?.variantId ??
    variant?.id ??
    null;

  const sizeName = getOptionName(
    raw?.size_name ??
      raw?.size ??
      variant?.size_name ??
      variant?.size,
    "Freesize"
  );

  const colorName = getOptionName(
    raw?.color_name ??
      raw?.color ??
      variant?.color_name ??
      variant?.color,
    "Mặc định"
  );

  const quantity = Math.max(
    1,
    toNumber(raw?.quantity, 1)
  );

  const price = toNumber(
    raw?.unit_price ??
      raw?.final_price ??
      raw?.price ??
      variant?.discount_price ??
      variant?.price ??
      product?.price,
    0
  );

  const productImage =
    raw?.product_image ||
    product?.image_url ||
    product?.image ||
    "";

  const variantImage =
    raw?.variant_image ||
    variant?.image_url ||
    variant?.image ||
    "";

  const image = normalizeImage(
    raw?.image ||
      raw?.image_url ||
      variantImage ||
      productImage
  );

  const stock = Math.max(
    0,
    toNumber(
      raw?.stock ??
        raw?.max_quantity ??
        variant?.stock,
      0
    )
  );

  const categoryName = getOptionName(
    raw?.category_name ??
      raw?.category ??
      product?.category,
    ""
  );

  const brandName = getOptionName(
    raw?.brand_name ??
      raw?.brand ??
      product?.brand,
    ""
  );

  return {
    ...raw,

    source: "server",

    cart_item_id: cartItemId,
    cartItemId,

    key:
      raw?.key ||
      `server-cart-${cartItemId}`,

    id: productId,
    productId,
    product_id: productId,

    variantId,
    variant_id: variantId,
    product_variant_id: variantId,

    name:
      raw?.product_name ||
      raw?.name ||
      product?.name ||
      "Sản phẩm",

    product_name:
      raw?.product_name ||
      raw?.name ||
      product?.name ||
      "Sản phẩm",

    slug:
      raw?.slug ||
      product?.slug ||
      "",

    image,
    image_url: image,
    product_image: normalizeImage(
      productImage || image
    ),
    variant_image: variantImage
      ? normalizeImage(variantImage)
      : "",

    quantity,
    stock,
    max_quantity: stock,

    price,
    unit_price: price,
    line_total: price * quantity,

    original_price: toNumber(
      raw?.original_price ??
        variant?.price ??
        product?.price,
      price
    ),

    discount_price:
      raw?.discount_price ??
      variant?.discount_price ??
      null,

    size:
      sizeName,
    size_name:
      sizeName,
    size_id:
      raw?.size_id ??
      variant?.size_id ??
      variant?.size?.id ??
      null,

    color:
      colorName,
    color_name:
      colorName,
    color_id:
      raw?.color_id ??
      variant?.color_id ??
      variant?.color?.id ??
      null,

    color_code:
      raw?.color_code ??
      variant?.color?.code ??
      "",

    color_hex:
      raw?.color_hex ??
      variant?.color?.hex ??
      "",

    sku:
      raw?.sku ||
      variant?.sku ||
      `DNV-${productId}`,

    category:
      categoryName,
    category_name:
      categoryName,
    category_id:
      raw?.category_id ??
      product?.category_id ??
      product?.category?.id ??
      null,

    brand:
      brandName,
    brand_name:
      brandName,
    brand_id:
      raw?.brand_id ??
      product?.brand_id ??
      product?.brand?.id ??
      null,

    is_available:
      raw?.is_available !== undefined
        ? Boolean(raw.is_available)
        : stock > 0,
  };
}

function extractCartItems(response) {
  const candidates = [
    response?.data?.items,
    response?.data?.cart?.items,
    response?.cart?.items,
    response?.items,
    response?.data,
  ];

  const items = candidates.find(
    Array.isArray
  );

  return (items || [])
    .map(normalizeServerCartItem)
    .filter((item) => item.product_id);
}

function extractSummary(response, items) {
  return (
    response?.data?.summary ||
    response?.summary || {
      item_count: items.length,
      total_quantity: items.reduce(
        (total, item) =>
          total + Number(item.quantity || 0),
        0
      ),
      subtotal: items.reduce(
        (total, item) =>
          total +
          Number(item.price || 0) *
            Number(item.quantity || 0),
        0
      ),
    }
  );
}

function dispatchCartEvents() {
  if (!isBrowser()) return;

  window.dispatchEvent(
    new Event("dynova:storage")
  );

  window.dispatchEvent(
    new Event("dynova:cart")
  );
}

export function getServerCartCache() {
  if (!isBrowser()) return [];

  try {
    const raw = localStorage.getItem(
      SERVER_CART_KEY
    );

    const items = raw
      ? JSON.parse(raw)
      : [];

    return Array.isArray(items)
      ? items.map(normalizeServerCartItem)
      : [];
  } catch {
    return [];
  }
}

export function replaceServerCartCache(
  items = []
) {
  if (!isBrowser()) return items;

  const normalized = Array.isArray(items)
    ? items.map(normalizeServerCartItem)
    : [];

  localStorage.setItem(
    SERVER_CART_KEY,
    JSON.stringify(normalized)
  );

  dispatchCartEvents();

  return normalized;
}

export function clearServerCartCache() {
  if (!isBrowser()) return;

  localStorage.removeItem(
    SERVER_CART_KEY
  );

  dispatchCartEvents();
}

function commitResponse(response) {
  const items = extractCartItems(response);
  const summary = extractSummary(
    response,
    items
  );

  replaceServerCartCache(items);

  return {
    response,
    items,
    summary,
    message: response?.message || "",
    warnings: response?.warnings || [],
  };
}

export async function getCartApi() {
  const response = await cartRequest(
    "/cart"
  );

  return commitResponse(response);
}

export async function addCartItemApi({
  product_id,
  product_variant_id = null,
  variant_id = null,
  quantity = 1,
}) {
  const response = await cartRequest(
    "/cart/items",
    {
      method: "POST",
      body: JSON.stringify({
        product_id: Number(product_id),
        product_variant_id:
          product_variant_id ??
          variant_id ??
          null,
        quantity: Math.max(
          1,
          Number(quantity || 1)
        ),
      }),
    }
  );

  return commitResponse(response);
}

export async function updateCartItemApi(
  cartItemId,
  quantity
) {
  const response = await cartRequest(
    `/cart/items/${cartItemId}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        quantity: Math.max(
          1,
          Number(quantity || 1)
        ),
      }),
    }
  );

  return commitResponse(response);
}

export async function removeCartItemApi(
  cartItemId
) {
  const response = await cartRequest(
    `/cart/items/${cartItemId}`,
    {
      method: "DELETE",
    }
  );

  return commitResponse(response);
}

export async function clearCartApi() {
  const response = await cartRequest(
    "/cart",
    {
      method: "DELETE",
    }
  );

  return commitResponse(response);
}

function serializeGuestItem(item) {
  const productId =
    item?.product_id ??
    item?.productId ??
    item?.id;

  const variantId =
    item?.product_variant_id ??
    item?.variant_id ??
    item?.variantId ??
    null;

  if (!productId) return null;

  return {
    product_id: Number(productId),
    product_variant_id:
      variantId !== null &&
      variantId !== undefined &&
      variantId !== ""
        ? Number(variantId)
        : null,
    quantity: Math.max(
      1,
      Number(item?.quantity || 1)
    ),
  };
}

export async function mergeGuestCartApi(
  guestItems = []
) {
  const items = guestItems
    .map(serializeGuestItem)
    .filter(Boolean);

  if (items.length === 0) {
    return getCartApi();
  }

  const response = await cartRequest(
    "/cart/merge",
    {
      method: "POST",
      body: JSON.stringify({
        items,
      }),
    }
  );

  if (isBrowser()) {
    localStorage.removeItem(
      GUEST_CART_KEY
    );
  }

  return commitResponse(response);
}

export async function hydrateAuthenticatedCart(
  guestItems = []
) {
  if (!hasCartAuth()) {
    return {
      items: [],
      summary: {
        item_count: 0,
        total_quantity: 0,
        subtotal: 0,
      },
    };
  }

  const validGuestItems = guestItems.filter(
    (item) =>
      item &&
      item.source !== "server" &&
      !item.cart_item_id
  );

  if (validGuestItems.length > 0) {
    return mergeGuestCartApi(
      validGuestItems
    );
  }

  return getCartApi();
}