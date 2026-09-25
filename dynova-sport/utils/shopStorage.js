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
  buyNow: "dynova_buy_now_checkout",
  wishlist: "dynova_wishlist",
  users: "dynova_users",
  currentUser: "dynova_current_user",
  orders: "dynova_orders",
  products: "dynova_admin_products",
  categories: "dynova_admin_categories",
  coupons: "dynova_admin_coupons",
  settings: "dynova_settings",
};

const AUTH_TOKEN_KEYS = [
  "dynova_auth_token",
  "auth_token",
  "access_token",
  "token",
];

const AUTH_USER_KEYS = [
  KEYS.currentUser,
  "dynova_auth_user",
  "dynova_user",
  "auth_user",
  "currentUser",
  "current_user",
  "user",
];

const AUTH_MISC_KEYS = [
  "isLoggedIn",
  "is_logged_in",
  "userDisplayName",
  "dynova_remember_login",
];

const LOGOUT_MARKER_KEY = "dynova_explicit_logout";

const pendingCartRequests = new Map();
const cartUpdateVersions = new Map();

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

function getProductVariants(product) {
  const variants =
    product?.variants ??
    product?.product_variants ??
    product?.productVariants ??
    product?.product?.variants ??
    [];

  return Array.isArray(variants)
    ? variants
    : [];
}

function getSelectedVariant(
  product,
  options = {}
) {
  const explicitVariant =
    product?.selected_variant ||
    product?.selectedVariant ||
    product?.variant ||
    product?.product_variant ||
    product?.productVariant ||
    null;

  const variantId =
    options?.product_variant_id ??
    options?.variant_id ??
    options?.variantId ??
    product?.product_variant_id ??
    product?.variant_id ??
    product?.variantId ??
    product?.selected_variant_id ??
    product?.selectedVariantId ??
    explicitVariant?.id ??
    null;

  if (
    explicitVariant &&
    (
      variantId === null ||
      variantId === undefined ||
      variantId === "" ||
      String(explicitVariant?.id ?? "") ===
        String(variantId)
    )
  ) {
    return explicitVariant;
  }

  if (
    variantId !== null &&
    variantId !== undefined &&
    variantId !== ""
  ) {
    const matchedVariant =
      getProductVariants(product).find(
        (variant) =>
          String(
            variant?.id ??
              variant?.variant_id ??
              variant?.variantId ??
              ""
          ) === String(variantId)
      );

    if (matchedVariant) {
      return matchedVariant;
    }
  }

  return explicitVariant;
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

function getStorageByPriority() {
  if (!isBrowser()) return [null, null];

  return [window.localStorage, window.sessionStorage];
}

function clearAuthStorage() {
  if (!isBrowser()) return;

  const storages = getStorageByPriority();

  storages.forEach((storage) => {
    if (!storage) return;

    [...AUTH_TOKEN_KEYS, ...AUTH_USER_KEYS, ...AUTH_MISC_KEYS].forEach((key) => {
      storage.removeItem(key);
    });
  });
}

function isExplicitLogout() {
  if (!isBrowser()) return false;

  return (
    window.localStorage.getItem(LOGOUT_MARKER_KEY) === "1" ||
    window.sessionStorage.getItem(LOGOUT_MARKER_KEY) === "1"
  );
}

export function getAuthToken() {
  if (!isBrowser()) return "";

  if (isExplicitLogout()) return "";

  for (const storage of getStorageByPriority()) {
    if (!storage) continue;

    for (const key of AUTH_TOKEN_KEYS) {
      const value = storage.getItem(key);
      if (value) return value;
    }
  }

  return "";
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
    getSelectedVariant(
      product,
      options
    );

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

  /*
   * Tồn kho phải đi theo đúng biến thể đang chọn.
   * Trước đây product.stock được ưu tiên trước selectedVariant.stock nên
   * biến thể còn 9 sản phẩm vẫn có thể lấy nhầm tồn kho tổng của sản phẩm.
   */
  const hasVariant =
    variantId !== null &&
    variantId !== undefined &&
    variantId !== "";

  const stockRaw = hasVariant
    ? (
        selectedVariant?.stock ??
        product?.variant_stock ??
        product?.variantStock ??
        (
          product?.source === "server" ||
          product?.cart_item_id ||
          product?.cartItemId
            ? (
                product?.stock ??
                product?.max_quantity
              )
            : undefined
        )
      )
    : (
        product?.stock ??
        product?.max_quantity ??
        product?.quantity_available
      );

  const stockKnown =
    stockRaw !== undefined &&
    stockRaw !== null &&
    stockRaw !== "";

  const stock = Math.max(
    0,
    toNumber(stockRaw, 0)
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
    stock_known: stockKnown,
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

  startAutomaticHydration();

  /*
   * Khi đã đăng nhập, giỏ server là nguồn sự thật kể cả khi nó rỗng.
   * Không fallback về dynova_cart vì giỏ guest cũ có thể làm sản phẩm đã xóa
   * "sống lại" khi đổi trang và làm badge hiển thị số lượng cũ.
   */
  return serverCart;
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
  /*
   * target được lấy trước khi optimistic update/delete nên nếu đã có id server
   * thì dùng luôn. Không fetch lại giỏ giữa lúc xóa vì fetch đó có thể làm item
   * vừa xóa xuất hiện lại tạm thời trên badge/UI.
   */
  if (target?.cart_item_id) {
    return target;
  }

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

  // Chỉ dùng response để tìm server id. Không ghi response này ngược vào
  // cache vì UI đã optimistic update/remove; ghi lại ở đây có thể làm item
  // vừa xóa xuất hiện trở lại trong badge trước khi request DELETE hoàn tất.
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

  const variantId =
    getVariantId(product, options);

  const activeVariants =
    getProductVariants(product).filter(
      (variant) =>
        variant?.is_active !== false &&
        variant?.is_active !== 0 &&
        variant?.is_active !== "0"
    );

  if (
    activeVariants.length > 0 &&
    (
      variantId === null ||
      variantId === undefined ||
      variantId === ""
    )
  ) {
    if (isBrowser()) {
      window.dispatchEvent(
        new CustomEvent("dynova:cart-stock-warning", {
          detail: {
            message:
              "Vui lòng chọn màu sắc/kích thước trước khi thêm sản phẩm vào giỏ hàng.",
            productId:
              getProductId(product),
          },
        })
      );
    }

    return currentCart;
  }

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

  if (
    cartItem.stock_known &&
    cartItem.stock <= 0
  ) {
    window.dispatchEvent(
      new CustomEvent("dynova:cart-stock-warning", {
        detail: {
          message: `${cartItem.name} hiện đã hết hàng.`,
          productId: cartItem.product_id,
          stock: 0,
        },
      })
    );
    return currentCart;
  }

  const finalQuantity =
    cartItem.stock_known
      ? Math.min(
          desiredQuantity,
          cartItem.stock
        )
      : desiredQuantity;

  if (finalQuantity < desiredQuantity) {
    window.dispatchEvent(
      new CustomEvent("dynova:cart-stock-warning", {
        detail: {
          message: `${cartItem.name} chỉ còn ${cartItem.stock} sản phẩm trong kho.`,
          productId: cartItem.product_id,
          stock: cartItem.stock,
        },
      })
    );
  }

  const quantityToAdd = Math.max(
    0,
    finalQuantity - currentQuantity
  );

  /*
   * Nếu giỏ đã đạt đúng tồn kho thì chỉ cảnh báo, không gửi thêm request lên
   * server. Nếu người dùng yêu cầu 5 nhưng chỉ còn chỗ cho 1 thì API cũng chỉ
   * được cộng 1, tránh backend từ chối toàn bộ request và rollback sai UI.
   */
  if (
    existingIndex >= 0 &&
    quantityToAdd <= 0
  ) {
    return currentCart;
  }

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

  const authenticated =
    hasAuthSession();

  const previousCart = authenticated
    ? getServerCartCache()
    : currentCart;

  saveCart(next);

  if (!authenticated) {
    return next;
  }

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
            quantityToAdd,
        })
    )
    .then((result) => {
      applyServerCartResult(result);

      return result;
    })
    .catch(async (error) => {
      let restoredItems =
        previousCart;

      /* Backend là nguồn sự thật. Nếu request bị từ chối (thường do hết kho),
       * lấy lại giỏ mới nhất thay vì giữ optimistic cart sai ở localStorage. */
      try {
        const {
          getCartApi,
        } = await import(
          "@/services/cart.service"
        );

        const fresh =
          await getCartApi();

        restoredItems =
          fresh?.items || [];
        applyServerCartResult(fresh);
      } catch {
        saveServerCartCache(
          previousCart
        );
      }

      dispatchCartSyncError(error);

      return {
        error,
        items: restoredItems,
      };
    });

  registerPendingRequest(
    cartItem.key,
    request
  );

  return next;
}

export async function addToCartConfirmed(
  product,
  options = {}
) {
  const candidate = normalizeCartItem(
    product,
    options
  );

  const beforeCart = getCart();
  const beforeItem = findMatchingCartItem(
    beforeCart,
    candidate
  );
  const beforeQuantity = Number(
    beforeItem?.quantity || 0
  );

  const next = addToCart(
    product,
    options
  );

  const afterItem = findMatchingCartItem(
    next,
    candidate
  );
  const afterQuantity = Number(
    afterItem?.quantity || 0
  );

  if (afterQuantity <= beforeQuantity) {
    return {
      success: false,
      items: next,
      item: afterItem || beforeItem || null,
      addedQuantity: 0,
      message:
        candidate?.stock_known && beforeQuantity >= candidate.stock
          ? `${candidate.name} chỉ còn ${candidate.stock} sản phẩm trong kho.`
          : "Không thể thêm sản phẩm vào giỏ hàng.",
    };
  }

  if (!hasAuthSession()) {
    return {
      success: true,
      items: next,
      item: afterItem || null,
      addedQuantity: afterQuantity - beforeQuantity,
    };
  }

  const pending =
    pendingCartRequests.get(
      candidate.key
    );

  if (!pending) {
    return {
      success: false,
      items: getCart(),
      item: null,
      addedQuantity: 0,
      message: "Không thể đồng bộ giỏ hàng với máy chủ.",
    };
  }

  const result = await pending;

  if (result?.error) {
    return {
      success: false,
      error: result.error,
      items:
        result?.items || getCart(),
      item: null,
      addedQuantity: 0,
      message:
        result.error?.message ||
        "Không thể thêm sản phẩm vào giỏ hàng.",
    };
  }

  const confirmedItems =
    Array.isArray(result?.items)
      ? result.items
      : getCart();

  return {
    success: true,
    items: confirmedItems,
    item: findMatchingCartItem(
      confirmedItems,
      candidate
    ),
    addedQuantity: afterQuantity - beforeQuantity,
  };
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

  const stockKnown =
    target?.stock_known !== false &&
    (target?.stock !== undefined ||
      target?.max_quantity !== undefined);

  if (stockKnown && stock <= 0) {
    window.dispatchEvent(
      new CustomEvent("dynova:cart-stock-warning", {
        detail: {
          message: `${target.name || "Sản phẩm"} hiện đã hết hàng.`,
          productId: target.product_id,
          stock: 0,
        },
      })
    );
    return currentCart;
  }

  if (
    stockKnown &&
    nextQuantity > stock
  ) {
    nextQuantity = stock;
    window.dispatchEvent(
      new CustomEvent("dynova:cart-stock-warning", {
        detail: {
          message: `${target.name || "Sản phẩm"} chỉ còn ${stock} sản phẩm trong kho.`,
          productId: target.product_id,
          stock,
        },
      })
    );
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

  const authenticated =
    hasAuthSession();

  const previousCart = authenticated
    ? getServerCartCache()
    : currentCart;

  saveCart(next);

  if (!authenticated) {
    return next;
  }

  const mutationKey = `update:${key}`;
  const mutationVersion =
    (cartUpdateVersions.get(mutationKey) || 0) + 1;
  const previousRequest =
    pendingCartRequests.get(mutationKey);

  cartUpdateVersions.set(
    mutationKey,
    mutationVersion
  );

  const request = Promise.resolve(
    previousRequest
  )
    .catch(() => null)
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
        nextQuantity,
        { persist: false }
      );
    })
    .then((result) => {
      if (
        cartUpdateVersions.get(mutationKey) ===
        mutationVersion
      ) {
        applyServerCartResult(result);
      }

      return result;
    })
    .catch(async (error) => {
      if (
        cartUpdateVersions.get(mutationKey) !==
        mutationVersion
      ) {
        return {
          error,
          items: getServerCartCache(),
        };
      }

      let restoredItems =
        previousCart;

      try {
        const {
          getCartApi,
        } = await import(
          "@/services/cart.service"
        );

        const fresh =
          await getCartApi();

        restoredItems =
          fresh?.items || [];
        applyServerCartResult(fresh);
      } catch {
        saveServerCartCache(
          previousCart
        );
      }

      dispatchCartSyncError(error);

      return {
        error,
        items: restoredItems,
      };
    });

  registerPendingRequest(mutationKey, request);

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

  const authenticated =
    hasAuthSession();

  const previousCart = authenticated
    ? getServerCartCache()
    : currentCart;

  saveCart(next);

  if (!authenticated) {
    return next;
  }

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
    .catch(async (error) => {
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

export function getBuyNowItems() {
  if (!isBrowser()) return [];

  const items = readJson(KEYS.buyNow, []);

  return normalizeCartList(items, "buy_now").map((item) => ({
    ...item,
    source: "buy_now",
  }));
}

export function saveBuyNowItems(items) {
  const normalized = normalizeCartList(items, "buy_now").map((item) => ({
    ...item,
    source: "buy_now",
  }));

  writeJson(KEYS.buyNow, normalized);

  return normalized;
}

export function clearBuyNowItems() {
  if (!isBrowser()) return [];

  window.localStorage.removeItem(KEYS.buyNow);
  dispatchStorageEvent();
  return [];
}

export function clearCart() {
  if (!hasAuthSession()) {
    return clearGuestCart();
  }

  const previousCart =
    getServerCartCache();

  /* Xóa cả cache server lẫn giỏ guest cũ để không có dữ liệu cũ hồi sinh. */
  saveServerCartCache([]);
  clearGuestCart();

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
      saveServerCartCache([]);
      clearGuestCart();

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

  const warnings = Array.isArray(
    result?.warnings
  )
    ? result.warnings
    : [];

  if (warnings.length > 0 && isBrowser()) {
    const message = warnings
      .map((warning) => warning?.message)
      .filter(Boolean)
      .join(" ");

    if (message) {
      window.dispatchEvent(
        new CustomEvent("dynova:cart-stock-warning", {
          detail: { message },
        })
      );
    }
  }

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
    KEYS.serverCart
  );
  window.sessionStorage.removeItem(
    KEYS.serverCart
  );

  clearAuthStorage();

  window.localStorage.setItem(LOGOUT_MARKER_KEY, "1");
  window.sessionStorage.setItem(LOGOUT_MARKER_KEY, "1");

  hydratedToken = "";
  hydrationPromise = null;

  dispatchStorageEvent();
  dispatchCartEvent();
}

export function getCurrentUser() {
  if (!isBrowser()) return null;

  if (isExplicitLogout()) return null;

  for (const storage of getStorageByPriority()) {
    if (!storage) continue;

    for (const key of AUTH_USER_KEYS) {
      try {
        const raw = storage.getItem(key);
        if (!raw) continue;

        const parsed = JSON.parse(raw);
        const user = parsed?.data?.user || parsed?.user || parsed;

        if (user && typeof user === "object") {
          return user;
        }
      } catch {
        continue;
      }
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
