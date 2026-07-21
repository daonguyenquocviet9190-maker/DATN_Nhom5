import {
  categories,
  coupons,
  defaultSettings,
  products,
  seedOrders,
} from "@/data/shop";

const KEYS = {
  cart: "dynova_cart",
  serverCart: "dynova_server_cart",
  wishlist: "dynova_wishlist",
  users: "dynova_users",
  currentUser: "dynova_current_user",
  orders: "dynova_orders",
  products: "dynova_admin_products",
  categories: "dynova_admin_categories",
  coupons: "dynova_admin_coupons",
  settings: "dynova_settings",
};

const pendingCartRequests = new Map();

let hydratedToken = "";
let hydrationPromise = null;

const isBrowser = () =>
  typeof window !== "undefined";

function dispatchStorageEvent() {
  if (!isBrowser()) return;

  window.dispatchEvent(
    new Event("dynova:storage")
  );
}

function dispatchCartEvent() {
  if (!isBrowser()) return;

  window.dispatchEvent(
    new Event("dynova:cart")
  );
}

function dispatchCartSyncError(error) {
  if (!isBrowser()) return;

  window.dispatchEvent(
    new CustomEvent(
      "dynova:cart-sync-error",
      {
        detail: {
          message:
            error?.message ||
            "Không thể đồng bộ giỏ hàng.",
          status:
            error?.status || null,
        },
      }
    )
  );
}

function toNumber(value, fallback = 0) {
  const numberValue = Number(value);

  return Number.isFinite(numberValue)
    ? numberValue
    : fallback;
}

function cleanText(value, fallback = "") {
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
    const text = String(value).trim();

    return text || fallback;
  }

  if (typeof value === "object") {
    const text = String(
      value?.name ??
        value?.label ??
        value?.value ??
        value?.title ??
        value?.size_name ??
        value?.color_name ??
        value?.code ??
        ""
    ).trim();

    return text || fallback;
  }

  return fallback;
}

function getProductId(product) {
  return (
    product?.product_id ??
    product?.productId ??
    product?.product?.id ??
    product?.id ??
    null
  );
}

function getVariantId(
  product,
  options = {}
) {
  return (
    options?.product_variant_id ??
    options?.variant_id ??
    options?.variantId ??
    product?.product_variant_id ??
    product?.variant_id ??
    product?.variantId ??
    product?.selected_variant_id ??
    product?.selectedVariantId ??
    product?.selected_variant?.id ??
    product?.selectedVariant?.id ??
    product?.variant?.id ??
    product?.product_variant?.id ??
    null
  );
}

function getCartSize(
  product,
  options = {}
) {
  return cleanText(
    options?.size ??
      options?.size_name ??
      product?.size_name ??
      product?.size ??
      product?.selected_variant?.size_name ??
      product?.selected_variant?.size ??
      product?.selectedVariant?.size_name ??
      product?.selectedVariant?.size ??
      product?.variant?.size_name ??
      product?.variant?.size,
    "Freesize"
  );
}

function getCartColor(
  product,
  options = {}
) {
  return cleanText(
    options?.color ??
      options?.color_name ??
      product?.color_name ??
      product?.color ??
      product?.selected_variant?.color_name ??
      product?.selected_variant?.color ??
      product?.selectedVariant?.color_name ??
      product?.selectedVariant?.color ??
      product?.variant?.color_name ??
      product?.variant?.color,
    "Mặc định"
  );
}

function getCartKey(
  product,
  options = {}
) {
  const productId =
    getProductId(product) ||
    "unknown-product";

  const variantId =
    getVariantId(product, options) ||
    "no-variant";

  const size = getCartSize(
    product,
    options
  );

  const color = getCartColor(
    product,
    options
  );

  return [
    productId,
    variantId,
    size,
    color,
  ].join("-");
}

function getCartImage(product) {
  const selectedVariant =
    product?.selected_variant ||
    product?.selectedVariant ||
    product?.variant ||
    product?.product_variant ||
    product?.productVariant ||
    null;

  return (
    product?.variant_image ||
    product?.variantImage ||
    selectedVariant?.image_url ||
    selectedVariant?.image ||
    selectedVariant?.thumbnail ||
    product?.product_image ||
    product?.productImage ||
    product?.image_url ||
    product?.image ||
    product?.thumbnail ||
    product?.product?.image_url ||
    product?.product?.image ||
    product?.product?.thumbnail ||
    ""
  );
}

function getSelectedVariant(product) {
  return (
    product?.selected_variant ||
    product?.selectedVariant ||
    product?.variant ||
    product?.product_variant ||
    product?.productVariant ||
    null
  );
}

function getFinalPrice(product) {
  const variant =
    getSelectedVariant(product);

  const regularPrice = toNumber(
    product?.original_price ??
      product?.old_price ??
      product?.oldPrice ??
      product?.compare_price ??
      variant?.price ??
      product?.price,
    0
  );

  const directPrice = toNumber(
    product?.price ??
      product?.sale_price ??
      product?.unit_price ??
      product?.final_price ??
      variant?.price,
    0
  );

  const discountPrice = toNumber(
    product?.discount_price ??
      variant?.discount_price,
    0
  );

  if (
    discountPrice > 0 &&
    (regularPrice <= 0 ||
      discountPrice < regularPrice)
  ) {
    return discountPrice;
  }

  return directPrice > 0
    ? directPrice
    : regularPrice;
}

function sameCartSelection(
  first,
  second
) {
  if (!first || !second) {
    return false;
  }

  const firstProductId = String(
    getProductId(first) ?? ""
  );

  const secondProductId = String(
    getProductId(second) ?? ""
  );

  if (
    !firstProductId ||
    firstProductId !== secondProductId
  ) {
    return false;
  }

  const firstVariantId =
    getVariantId(first);

  const secondVariantId =
    getVariantId(second);

  if (
    firstVariantId !== null &&
    firstVariantId !== undefined &&
    firstVariantId !== "" &&
    secondVariantId !== null &&
    secondVariantId !== undefined &&
    secondVariantId !== ""
  ) {
    return (
      String(firstVariantId) ===
      String(secondVariantId)
    );
  }

  return (
    getCartSize(first) ===
      getCartSize(second) &&
    getCartColor(first) ===
      getCartColor(second)
  );
}

function findMatchingCartItem(
  items,
  target
) {
  if (!Array.isArray(items)) {
    return null;
  }

  return (
    items.find((item) => {
      if (
        target?.cart_item_id &&
        String(item?.cart_item_id) ===
          String(target.cart_item_id)
      ) {
        return true;
      }

      return sameCartSelection(
        item,
        target
      );
    }) || null
  );
}

export function getAuthToken() {
  if (!isBrowser()) return "";

  return (
    localStorage.getItem(
      "dynova_auth_token"
    ) ||
    localStorage.getItem(
      "auth_token"
    ) ||
    localStorage.getItem(
      "access_token"
    ) ||
    localStorage.getItem("token") ||
    ""
  );
}

export function hasAuthSession() {
  return Boolean(getAuthToken());
}

export function readJson(
  key,
  fallback
) {
  if (!isBrowser()) return fallback;

  try {
    const raw =
      window.localStorage.getItem(key);

    return raw
      ? JSON.parse(raw)
      : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(
  key,
  value
) {
  if (!isBrowser()) return value;

  try {
    window.localStorage.setItem(
      key,
      JSON.stringify(value)
    );

    dispatchStorageEvent();
  } catch {
    return value;
  }

  return value;
}

export function getProducts() {
  const saved = readJson(
    KEYS.products,
    []
  );

  const safeSaved = Array.isArray(saved)
    ? saved
    : [];

  const savedIds = new Set(
    safeSaved.map((item) =>
      Number(item.id)
    )
  );

  return [
    ...safeSaved,
    ...products.filter(
      (item) =>
        !savedIds.has(Number(item.id))
    ),
  ];
}

export function saveProducts(items) {
  return writeJson(
    KEYS.products,
    Array.isArray(items) ? items : []
  );
}

export function getCategories() {
  const saved = readJson(
    KEYS.categories,
    null
  );

  return Array.isArray(saved)
    ? saved
    : categories;
}

export function saveCategories(items) {
  return writeJson(
    KEYS.categories,
    Array.isArray(items) ? items : []
  );
}

export function getCoupons() {
  const saved = readJson(
    KEYS.coupons,
    null
  );

  return Array.isArray(saved)
    ? saved
    : coupons;
}

export function saveCoupons(items) {
  return writeJson(
    KEYS.coupons,
    Array.isArray(items) ? items : []
  );
}

export function getSettings() {
  const saved = readJson(
    KEYS.settings,
    {}
  );

  return {
    ...defaultSettings,
    ...(saved &&
    typeof saved === "object"
      ? saved
      : {}),
  };
}

export function saveSettings(settings) {
  return writeJson(
    KEYS.settings,
    settings &&
      typeof settings === "object"
      ? settings
      : {}
  );
}

export function normalizeCartItem(
  product,
  options = {}
) {
  const selectedVariant =
    getSelectedVariant(product);

  const productId =
    getProductId(product);

  const variantId =
    getVariantId(
      product,
      options
    );

  const quantity = Math.max(
    1,
    toNumber(
      options?.quantity ??
        product?.quantity,
      1
    )
  );

  const size = getCartSize(
    product,
    options
  );

  const color = getCartColor(
    product,
    options
  );

  const image =
    getCartImage(product);

  const price =
    getFinalPrice(product);

  const stock = Math.max(
    0,
    toNumber(
      product?.stock ??
        product?.max_quantity ??
        product?.quantity_available ??
        selectedVariant?.stock,
      0
    )
  );

  const category = cleanText(
    product?.category_name ??
      product?.category ??
      product?.categoryName ??
      product?.product?.category,
    ""
  );

  const brand = cleanText(
    product?.brand_name ??
      product?.brand ??
      product?.brandName ??
      product?.product?.brand,
    ""
  );

  const cartItemId =
    product?.cart_item_id ??
    product?.cartItemId ??
    (
      product?.source === "server"
        ? product?.id
        : null
    );

  const normalized = {
    ...product,

    cart_item_id:
      cartItemId || null,

    cartItemId:
      cartItemId || null,

    id: productId,
    productId,
    product_id: productId,

    variantId,
    variant_id: variantId,
    product_variant_id: variantId,

    name:
      product?.product_name ||
      product?.name ||
      product?.title ||
      product?.product?.name ||
      "Sản phẩm",

    product_name:
      product?.product_name ||
      product?.name ||
      product?.title ||
      product?.product?.name ||
      "Sản phẩm",

    image,
    image_url:
      product?.image_url ||
      image,

    product_image:
      product?.product_image ||
      product?.productImage ||
      product?.product?.image_url ||
      product?.product?.image ||
      image,

    variant_image:
      product?.variant_image ||
      product?.variantImage ||
      selectedVariant?.image_url ||
      selectedVariant?.image ||
      image,

    thumbnail:
      product?.thumbnail ||
      image,

    price,
    unit_price: price,

    sale_price: toNumber(
      product?.sale_price ??
        product?.discount_price ??
        price,
      price
    ),

    original_price: toNumber(
      product?.original_price ??
        product?.old_price ??
        product?.oldPrice ??
        product?.compare_price ??
        selectedVariant?.price ??
        price,
      price
    ),

    oldPrice:
      product?.oldPrice ??
      product?.old_price ??
      product?.original_price ??
      product?.compare_price ??
      null,

    old_price:
      product?.old_price ??
      product?.oldPrice ??
      product?.original_price ??
      product?.compare_price ??
      null,

    category,
    category_name: category,

    categoryId:
      product?.categoryId ??
      product?.category_id ??
      product?.category?.id ??
      product?.product?.category_id ??
      product?.product?.category?.id ??
      null,

    category_id:
      product?.category_id ??
      product?.categoryId ??
      product?.category?.id ??
      product?.product?.category_id ??
      product?.product?.category?.id ??
      null,

    brand,
    brand_name: brand,

    brandId:
      product?.brandId ??
      product?.brand_id ??
      product?.brand?.id ??
      product?.product?.brand_id ??
      product?.product?.brand?.id ??
      null,

    brand_id:
      product?.brand_id ??
      product?.brandId ??
      product?.brand?.id ??
      product?.product?.brand_id ??
      product?.product?.brand?.id ??
      null,

    size,
    size_name: size,

    size_id:
      product?.size_id ??
      selectedVariant?.size_id ??
      selectedVariant?.size?.id ??
      null,

    color,
    color_name: color,

    color_id:
      product?.color_id ??
      selectedVariant?.color_id ??
      selectedVariant?.color?.id ??
      null,

    sku:
      product?.sku ||
      product?.variant_sku ||
      selectedVariant?.sku ||
      product?.product_sku ||
      "",

    stock,
    max_quantity: stock,
    quantity,

    line_total:
      price * quantity,

    is_available:
      product?.is_available !==
      undefined
        ? Boolean(
            product.is_available
          )
        : stock > 0,

    source:
      product?.source ||
      (
        hasAuthSession()
          ? "pending-server"
          : "guest"
      ),
  };

  normalized.key = getCartKey(
    normalized,
    normalized
  );

  return normalized;
}

function normalizeCartList(
  items,
  source
) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => ({
      ...normalizeCartItem(
        item,
        item
      ),
      source:
        item?.source || source,
    }))
    .filter(
      (item) => item.product_id
    );
}

export function getGuestCart() {
  const cart = readJson(
    KEYS.cart,
    []
  );

  return normalizeCartList(
    cart,
    "guest"
  );
}

export function saveGuestCart(items) {
  const normalized =
    normalizeCartList(
      items,
      "guest"
    ).map((item) => ({
      ...item,
      source: "guest",
    }));

  writeJson(
    KEYS.cart,
    normalized
  );

  dispatchCartEvent();

  return normalized;
}

export function clearGuestCart() {
  if (!isBrowser()) return [];

  window.localStorage.removeItem(
    KEYS.cart
  );

  dispatchStorageEvent();
  dispatchCartEvent();

  return [];
}

export function getServerCartCache() {
  const cart = readJson(
    KEYS.serverCart,
    []
  );

  return normalizeCartList(
    cart,
    "server"
  ).map((item) => ({
    ...item,
    source: "server",
  }));
}

export function saveServerCartCache(
  items
) {
  const normalized =
    normalizeCartList(
      items,
      "server"
    ).map((item) => ({
      ...item,
      source: "server",
    }));

  writeJson(
    KEYS.serverCart,
    normalized
  );

  dispatchCartEvent();

  return normalized;
}

export function clearServerCartCache() {
  if (!isBrowser()) return [];

  window.localStorage.removeItem(
    KEYS.serverCart
  );

  dispatchStorageEvent();
  dispatchCartEvent();

  return [];
}

function startAutomaticHydration() {
  if (!isBrowser()) return;

  const token = getAuthToken();

  if (
    !token ||
    hydratedToken === token ||
    hydrationPromise
  ) {
    return;
  }

  hydratedToken = token;

  hydrationPromise =
    syncCartAfterLogin()
      .catch((error) => {
        dispatchCartSyncError(error);

        return null;
      })
      .finally(() => {
        hydrationPromise = null;
      });
}

export function getCart() {
  if (!hasAuthSession()) {
    return getGuestCart();
  }

  const serverCart =
    getServerCartCache();

  const guestCart =
    getGuestCart();

  startAutomaticHydration();

  if (serverCart.length > 0) {
    return serverCart;
  }

  return guestCart;
}

export function saveCart(items) {
  if (hasAuthSession()) {
    return saveServerCartCache(
      items
    );
  }

  return saveGuestCart(items);
}

function applyServerCartResult(result) {
  const items =
    Array.isArray(result?.items)
      ? result.items
      : Array.isArray(
            result?.data?.items
          )
        ? result.data.items
        : null;

  if (items) {
    return saveServerCartCache(
      items
    );
  }

  return getServerCartCache();
}

function registerPendingRequest(
  key,
  promise
) {
  pendingCartRequests.set(
    key,
    promise
  );

  promise.finally(() => {
    if (
      pendingCartRequests.get(key) ===
      promise
    ) {
      pendingCartRequests.delete(key);
    }
  });

  return promise;
}

async function resolveServerCartItem(
  target
) {
  const cached = findMatchingCartItem(
    getServerCartCache(),
    target
  );

  if (cached?.cart_item_id) {
    return cached;
  }

  const pending =
    pendingCartRequests.get(
      target?.key
    );

  if (pending) {
    const pendingResult =
      await pending;

    const pendingItem =
      findMatchingCartItem(
        pendingResult?.items ||
          getServerCartCache(),
        target
      );

    if (
      pendingItem?.cart_item_id
    ) {
      return pendingItem;
    }
  }

  const {
    getCartApi,
  } = await import(
    "@/services/cart.service"
  );

  const freshResult =
    await getCartApi();

  applyServerCartResult(
    freshResult
  );

  return findMatchingCartItem(
    freshResult?.items || [],
    target
  );
}

export function addToCart(
  product,
  options = {}
) {
  const currentCart = getCart();

  const cartItem =
    normalizeCartItem(
      product,
      options
    );

  if (!cartItem.product_id) {
    return currentCart;
  }

  const existingIndex =
    currentCart.findIndex(
      (item) =>
        sameCartSelection(
          item,
          cartItem
        )
    );

  const requestedQuantity =
    Math.max(
      1,
      Number(
        cartItem.quantity || 1
      )
    );

  const currentQuantity =
    existingIndex >= 0
      ? Number(
          currentCart[
            existingIndex
          ]?.quantity || 0
        )
      : 0;

  const desiredQuantity =
    currentQuantity +
    requestedQuantity;

  const finalQuantity =
    cartItem.stock > 0
      ? Math.min(
          desiredQuantity,
          cartItem.stock
        )
      : desiredQuantity;

  const next =
    existingIndex >= 0
      ? currentCart.map(
          (item, index) => {
            if (
              index !== existingIndex
            ) {
              return item;
            }

            return normalizeCartItem(
              {
                ...item,
                ...cartItem,
                cart_item_id:
                  item?.cart_item_id ||
                  cartItem?.cart_item_id ||
                  null,
              },
              {
                ...item,
                ...cartItem,
                quantity:
                  finalQuantity,
              }
            );
          }
        )
      : [
          ...currentCart,
          normalizeCartItem(
            cartItem,
            {
              ...options,
              quantity:
                finalQuantity,
            }
          ),
        ];

  saveCart(next);

  if (!hasAuthSession()) {
    return next;
  }

  const previousCart =
    getServerCartCache();

  const request = import(
    "@/services/cart.service"
  )
    .then(
      ({
        addCartItemApi,
      }) =>
        addCartItemApi({
          product_id:
            cartItem.product_id,

          product_variant_id:
            cartItem.product_variant_id,

          quantity:
            requestedQuantity,
        })
    )
    .then((result) => {
      applyServerCartResult(result);

      return result;
    })
    .catch((error) => {
      saveServerCartCache(
        previousCart
      );

      dispatchCartSyncError(
        error
      );

      return {
        error,
        items: previousCart,
      };
    });

  registerPendingRequest(
    cartItem.key,
    request
  );

  return next;
}

export function updateCartItem(
  key,
  quantity
) {
  const currentCart = getCart();

  const target =
    currentCart.find(
      (item) =>
        item?.key === key
    ) || null;

  if (!target) {
    return currentCart;
  }

  let nextQuantity = Math.max(
    1,
    toNumber(quantity, 1)
  );

  const stock = Math.max(
    0,
    toNumber(
      target?.stock ??
        target?.max_quantity,
      0
    )
  );

  if (
    stock > 0 &&
    nextQuantity > stock
  ) {
    nextQuantity = stock;
  }

  const next = currentCart.map(
    (item) => {
      if (item?.key !== key) {
        return item;
      }

      return normalizeCartItem(
        {
          ...item,
          quantity:
            nextQuantity,
        },
        {
          ...item,
          quantity:
            nextQuantity,
        }
      );
    }
  );

  saveCart(next);

  if (!hasAuthSession()) {
    return next;
  }

  const previousCart =
    getServerCartCache();

  const request = Promise.resolve()
    .then(async () => {
      const serverItem =
        await resolveServerCartItem(
          target
        );

      if (
        !serverItem?.cart_item_id
      ) {
        return {
          items:
            getServerCartCache(),
        };
      }

      const {
        updateCartItemApi,
      } = await import(
        "@/services/cart.service"
      );

      return updateCartItemApi(
        serverItem.cart_item_id,
        nextQuantity
      );
    })
    .then((result) => {
      applyServerCartResult(result);

      return result;
    })
    .catch((error) => {
      saveServerCartCache(
        previousCart
      );

      dispatchCartSyncError(
        error
      );

      return {
        error,
        items: previousCart,
      };
    });

  registerPendingRequest(
    `update:${key}`,
    request
  );

  return next;
}

export function removeCartItem(key) {
  const currentCart = getCart();

  const target =
    currentCart.find(
      (item) =>
        item?.key === key
    ) || null;

  if (!target) {
    return currentCart;
  }

  const next =
    currentCart.filter(
      (item) =>
        item?.key !== key
    );

  saveCart(next);

  if (!hasAuthSession()) {
    return next;
  }

  const previousCart =
    getServerCartCache();

  const request = Promise.resolve()
    .then(async () => {
      const serverItem =
        await resolveServerCartItem(
          target
        );

      if (
        !serverItem?.cart_item_id
      ) {
        return {
          items:
            getServerCartCache(),
        };
      }

      const {
        removeCartItemApi,
      } = await import(
        "@/services/cart.service"
      );

      return removeCartItemApi(
        serverItem.cart_item_id
      );
    })
    .then((result) => {
      applyServerCartResult(result);

      return result;
    })
    .catch((error) => {
      saveServerCartCache(
        previousCart
      );

      dispatchCartSyncError(
        error
      );

      return {
        error,
        items: previousCart,
      };
    });

  registerPendingRequest(
    `remove:${key}`,
    request
  );

  return next;
}

export function clearCart() {
  if (!hasAuthSession()) {
    return clearGuestCart();
  }

  const previousCart =
    getServerCartCache();

  clearServerCartCache();

  const request = Promise.resolve()
    .then(async () => {
      const pending = Array.from(
        pendingCartRequests.values()
      );

      if (pending.length > 0) {
        await Promise.allSettled(
          pending
        );
      }

      const {
        clearCartApi,
      } = await import(
        "@/services/cart.service"
      );

      return clearCartApi();
    })
    .then((result) => {
      clearServerCartCache();

      return result;
    })
    .catch((error) => {
      saveServerCartCache(
        previousCart
      );

      dispatchCartSyncError(
        error
      );

      return {
        error,
        items: previousCart,
      };
    });

  registerPendingRequest(
    "clear-cart",
    request
  );

  return [];
}

export async function refreshCartFromServer() {
  if (!hasAuthSession()) {
    return {
      items: getGuestCart(),
      summary: null,
    };
  }

  const {
    getCartApi,
  } = await import(
    "@/services/cart.service"
  );

  const result =
    await getCartApi();

  applyServerCartResult(result);

  return result;
}

export async function syncCartAfterLogin() {
  if (!hasAuthSession()) {
    return {
      items: getGuestCart(),
      summary: null,
    };
  }

  const guestItems =
    getGuestCart();

  const {
    hydrateAuthenticatedCart,
  } = await import(
    "@/services/cart.service"
  );

  const result =
    await hydrateAuthenticatedCart(
      guestItems
    );

  applyServerCartResult(result);

  if (guestItems.length > 0) {
    clearGuestCart();
  }

  return result;
}

export function getWishlist() {
  const wishlist = readJson(
    KEYS.wishlist,
    []
  );

  return Array.isArray(wishlist)
    ? wishlist
    : [];
}

export function toggleWishlist(
  productId
) {
  const list =
    getWishlist().map(Number);

  const id = Number(productId);

  const next = list.includes(id)
    ? list.filter(
        (item) => item !== id
      )
    : [...list, id];

  writeJson(
    KEYS.wishlist,
    next
  );

  return next;
}

export function getWishlistProducts() {
  const ids =
    getWishlist().map(Number);

  return getProducts().filter(
    (product) =>
      ids.includes(
        Number(product.id)
      )
  );
}

export function getUsers() {
  const saved = readJson(
    KEYS.users,
    null
  );

  if (Array.isArray(saved)) {
    return saved;
  }

  return [
    {
      id: "USR001",
      fullName: "Admin Dynova",
      email: "admin@dynova.vn",
      phone: "0866347730",
      password: "123456",
      role: "admin",
      status: "Hoạt động",
      address: "TP. Hồ Chí Minh",
    },
    {
      id: "USR002",
      fullName: "Khách hàng mẫu",
      email: "demo@dynova.vn",
      phone: "0909000000",
      password: "123456",
      role: "customer",
      status: "Hoạt động",
      address: "Hà Nội",
    },
  ];
}

export function saveUsers(users) {
  return writeJson(
    KEYS.users,
    Array.isArray(users)
      ? users
      : []
  );
}

export function registerUser(data) {
  const users = getUsers();

  const email = String(
    data?.email || ""
  )
    .trim()
    .toLowerCase();

  if (
    users.some(
      (user) =>
        String(user.email || "")
          .trim()
          .toLowerCase() === email
    )
  ) {
    return {
      ok: false,
      message:
        "Email này đã được đăng ký.",
    };
  }

  const user = {
    id:
      "USR" +
      String(Date.now()).slice(-6),

    fullName:
      data?.fullName ||
      data?.name ||
      "Khách hàng",

    email,
    phone: data?.phone || "",
    password: data?.password || "",
    role: "customer",
    status: "Hoạt động",
    address: data?.address || "",
    createdAt:
      new Date().toISOString(),
  };

  saveUsers([
    ...users,
    user,
  ]);

  return {
    ok: true,
    user,
  };
}

export function loginUser(
  email,
  password
) {
  const normalizedEmail = String(
    email || ""
  )
    .trim()
    .toLowerCase();

  const user = getUsers().find(
    (item) =>
      String(item.email || "")
        .trim()
        .toLowerCase() ===
        normalizedEmail &&
      item.password === password
  );

  if (!user) {
    return {
      ok: false,
      message:
        "Email hoặc mật khẩu không đúng.",
    };
  }

  if (
    user.status === "Bị khóa"
  ) {
    return {
      ok: false,
      message:
        "Tài khoản đang bị khóa. Vui lòng liên hệ cửa hàng.",
    };
  }

  writeJson(
    KEYS.currentUser,
    {
      ...user,
      password: undefined,
    }
  );

  window.localStorage.setItem(
    "isLoggedIn",
    "true"
  );

  window.localStorage.setItem(
    "userDisplayName",
    user.fullName ||
      user.name ||
      "Khách hàng"
  );

  return {
    ok: true,
    user,
  };
}

export function logoutUser() {
  if (!isBrowser()) return;

  window.localStorage.removeItem(
    KEYS.currentUser
  );

  window.localStorage.removeItem(
    KEYS.serverCart
  );

  window.localStorage.removeItem(
    "isLoggedIn"
  );

  [
    "dynova_auth_token",
    "auth_token",
    "access_token",
    "token",
  ].forEach((key) => {
    window.localStorage.removeItem(key);
  });

  hydratedToken = "";
  hydrationPromise = null;

  dispatchStorageEvent();
  dispatchCartEvent();
}

export function getCurrentUser() {
  if (!isBrowser()) return null;

  const keys = [
    KEYS.currentUser,
    "dynova_auth_user",
    "auth_user",
    "currentUser",
    "current_user",
    "user",
  ];

  for (const key of keys) {
    try {
      const raw =
        window.localStorage.getItem(
          key
        );

      if (!raw) continue;

      const parsed =
        JSON.parse(raw);

      const user =
        parsed?.data?.user ||
        parsed?.user ||
        parsed;

      if (
        user &&
        typeof user === "object"
      ) {
        return user;
      }
    } catch {
      continue;
    }
  }

  return null;
}

export function updateCurrentUser(data) {
  const current =
    getCurrentUser();

  if (!current) return null;

  const next = {
    ...current,
    ...data,
  };

  writeJson(
    KEYS.currentUser,
    next
  );

  saveUsers(
    getUsers().map((user) =>
      String(user.id) ===
      String(current.id)
        ? {
            ...user,
            ...data,
          }
        : user
    )
  );

  window.localStorage.setItem(
    "userDisplayName",
    next.fullName ||
      next.full_name ||
      next.name ||
      "Khách hàng"
  );

  return next;
}

export function changePassword(
  email,
  oldPassword,
  newPassword
) {
  const users = getUsers();

  const normalizedEmail = String(
    email || ""
  )
    .trim()
    .toLowerCase();

  const user = users.find(
    (item) =>
      String(item.email || "")
        .trim()
        .toLowerCase() ===
      normalizedEmail
  );

  if (!user) {
    return {
      ok: false,
      message:
        "Không tìm thấy tài khoản.",
    };
  }

  if (
    oldPassword &&
    user.password !== oldPassword
  ) {
    return {
      ok: false,
      message:
        "Mật khẩu hiện tại không đúng.",
    };
  }

  saveUsers(
    users.map((item) =>
      String(item.id) ===
      String(user.id)
        ? {
            ...item,
            password: newPassword,
          }
        : item
    )
  );

  return {
    ok: true,
    message:
      "Mật khẩu đã được cập nhật.",
  };
}

export function getOrders() {
  const saved = readJson(
    KEYS.orders,
    null
  );

  return Array.isArray(saved)
    ? saved
    : seedOrders;
}

export function saveOrders(orders) {
  return writeJson(
    KEYS.orders,
    Array.isArray(orders)
      ? orders
      : []
  );
}

export function createOrder(payload) {
  const order = {
    id:
      "DNV" +
      String(Date.now()).slice(-6),

    createdAt:
      new Date().toISOString(),

    status:
      payload.paymentMethod === "COD"
        ? "Chờ xác nhận"
        : payload.paymentMethod ===
            "BANK"
          ? "Chờ chuyển khoản"
          : "Đã tiếp nhận",

    paymentStatus:
      payload.paymentStatus ||
      (
        payload.paymentMethod ===
        "COD"
          ? "Chờ thanh toán"
          : "Chờ thanh toán online"
      ),

    timeline: [
      "Đã tiếp nhận",
    ],

    ...payload,
  };

  saveOrders([
    order,
    ...getOrders(),
  ]);

  return order;
}

export function updateOrder(
  id,
  data
) {
  const next = getOrders().map(
    (order) =>
      String(order.id) ===
      String(id)
        ? {
            ...order,
            ...data,
          }
        : order
  );

  return saveOrders(next);
}

export function calculateOrder(
  items,
  couponCode = ""
) {
  const safeItems =
    Array.isArray(items)
      ? items
      : [];

  const settings =
    getSettings();

  const subtotal =
    safeItems.reduce(
      (sum, item) =>
        sum +
        toNumber(
          item?.price ??
            item?.unit_price,
          0
        ) *
          Math.max(
            1,
            toNumber(
              item?.quantity,
              1
            )
          ),
      0
    );

  const freeShipThreshold =
    toNumber(
      settings?.freeShipThreshold ??
        settings?.free_shipping_threshold,
      799000
    );

  const defaultShippingFee =
    toNumber(
      settings?.shippingFee ??
        settings?.shipping_fee,
      30000
    );

  const shipping =
    subtotal > 0 &&
    subtotal < freeShipThreshold
      ? defaultShippingFee
      : 0;

  const cleanCouponCode =
    String(couponCode || "")
      .trim()
      .toUpperCase();

  const coupon =
    getCoupons().find((item) => {
      const isActive =
        item?.active !== undefined
          ? Boolean(item.active)
          : item?.is_active !==
              undefined
            ? Boolean(
                Number(item.is_active)
              )
            : true;

      return (
        isActive &&
        String(item?.code || "")
          .trim()
          .toUpperCase() ===
          cleanCouponCode
      );
    });

  let discount = 0;
  let message = "";

  if (coupon) {
    const minOrder = toNumber(
      coupon?.minOrder ??
        coupon?.min_order,
      0
    );

    if (subtotal < minOrder) {
      message =
        "Mã hợp lệ nhưng đơn chưa đạt giá trị tối thiểu.";
    } else if (
      coupon.type === "fixed"
    ) {
      discount = toNumber(
        coupon.value,
        0
      );

      message =
        "Áp dụng mã giảm giá thành công.";
    } else if (
      coupon.type === "percent"
    ) {
      const percentDiscount =
        (
          subtotal *
          toNumber(
            coupon.value,
            0
          )
        ) /
        100;

      const maxDiscount =
        toNumber(
          coupon?.maxDiscount ??
            coupon?.max_discount,
          subtotal
        );

      discount = Math.min(
        percentDiscount,
        maxDiscount
      );

      message =
        "Áp dụng mã giảm giá thành công.";
    } else if (
      coupon.type === "shipping"
    ) {
      discount = Math.min(
        shipping,
        toNumber(
          coupon.value,
          shipping
        )
      );

      message =
        "Đã áp dụng ưu đãi vận chuyển.";
    }
  } else if (cleanCouponCode) {
    message =
      "Mã giảm giá không tồn tại hoặc đã tạm dừng.";
  }

  discount = Math.min(
    Math.max(0, discount),
    subtotal + shipping
  );

  const total = Math.max(
    0,
    subtotal +
      shipping -
      discount
  );

  return {
    subtotal,
    shipping,
    discount,
    total,
    coupon: coupon || null,
    message,
  };
}

export const storageKeys = KEYS;