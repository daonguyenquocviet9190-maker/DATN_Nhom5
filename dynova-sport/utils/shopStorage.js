import { categories, coupons, defaultSettings, products, seedOrders } from "@/data/shop";

const KEYS = {
  cart: "dynova_cart",
  wishlist: "dynova_wishlist",
  users: "dynova_users",
  currentUser: "dynova_current_user",
  orders: "dynova_orders",
  products: "dynova_admin_products",
  categories: "dynova_admin_categories",
  coupons: "dynova_admin_coupons",
  settings: "dynova_settings",
};

const isBrowser = () => typeof window !== "undefined";

function toNumber(value, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function cleanText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function getProductId(product) {
  return product?.product_id || product?.productId || product?.id;
}

function getVariantId(product, options = {}) {
  return (
    options?.variant_id ||
    options?.variantId ||
    options?.product_variant_id ||
    product?.variant_id ||
    product?.variantId ||
    product?.product_variant_id ||
    product?.selected_variant_id ||
    null
  );
}

function getCartKey(product, options = {}) {
  const productId = getProductId(product);
  const variantId = getVariantId(product, options) || "no-variant";
  const size = cleanText(options?.size || product?.size, "Freesize");
  const color = cleanText(options?.color || product?.color, "Mặc định");

  return `${productId}-${variantId}-${size}-${color}`;
}

function getCartImage(product) {
  return (
    product?.variant_image ||
    product?.variantImage ||
    product?.product_variant?.image ||
    product?.productVariant?.image ||
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

export function readJson(key, fallback) {
  if (!isBrowser()) return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(key, value) {
  if (!isBrowser()) return value;

  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event("dynova:storage"));

  return value;
}

export function getProducts() {
  const saved = readJson(KEYS.products, []);
  const savedIds = new Set(saved.map((item) => Number(item.id)));

  return [
    ...saved,
    ...products.filter((item) => !savedIds.has(Number(item.id))),
  ];
}

export function saveProducts(items) {
  return writeJson(KEYS.products, items);
}

export function getCategories() {
  const saved = readJson(KEYS.categories, null);
  return saved || categories;
}

export function saveCategories(items) {
  return writeJson(KEYS.categories, items);
}

export function getCoupons() {
  const saved = readJson(KEYS.coupons, null);
  return saved || coupons;
}

export function saveCoupons(items) {
  return writeJson(KEYS.coupons, items);
}

export function getSettings() {
  return { ...defaultSettings, ...readJson(KEYS.settings, {}) };
}

export function saveSettings(settings) {
  return writeJson(KEYS.settings, settings);
}

export function getCart() {
  const cart = readJson(KEYS.cart, []);
  return Array.isArray(cart) ? cart : [];
}

export function saveCart(items) {
  return writeJson(KEYS.cart, Array.isArray(items) ? items : []);
}

export function normalizeCartItem(product, options = {}) {
  const quantity = Math.max(1, toNumber(options?.quantity || product?.quantity, 1));
  const productId = getProductId(product);
  const variantId = getVariantId(product, options);
  const size = cleanText(options?.size || product?.size, "Freesize");
  const color = cleanText(options?.color || product?.color, "Mặc định");
  const image = getCartImage(product);
  const price = toNumber(
    product?.price || product?.sale_price || product?.unit_price || product?.final_price,
    0
  );

  return {
    key: getCartKey(product, { ...options, size, color }),

    id: productId,
    productId,
    product_id: productId,

    variantId,
    variant_id: variantId,
    product_variant_id: variantId,

    name: product?.name || product?.product_name || product?.title || "Sản phẩm",
    product_name: product?.product_name || product?.name || product?.title || "Sản phẩm",

    image,
    image_url: product?.image_url || image,
    product_image: product?.product_image || product?.productImage || product?.product?.image || image,
    variant_image: product?.variant_image || product?.variantImage || image,
    thumbnail: product?.thumbnail || image,

    price,
    sale_price: toNumber(product?.sale_price || price, price),
    oldPrice: product?.oldPrice || product?.old_price || product?.compare_price || null,
    old_price: product?.old_price || product?.oldPrice || product?.compare_price || null,

    category: product?.category || product?.category_name || product?.categoryName || "",
    categoryId: product?.categoryId || product?.category_id || product?.category?.id || null,
    category_id: product?.category_id || product?.categoryId || product?.category?.id || null,

    brand: product?.brand || product?.brand_name || product?.brandName || "",
    brandId: product?.brandId || product?.brand_id || product?.brand?.id || null,
    brand_id: product?.brand_id || product?.brandId || product?.brand?.id || null,

    size,
    color,
    sku: product?.sku || product?.variant_sku || product?.product_sku || "",
    stock: toNumber(product?.stock ?? product?.quantity_available, 0),
    quantity,
  };
}

export function addToCart(product, options = {}) {
  const cart = getCart();
  const cartItem = normalizeCartItem(product, options);

  const existingIndex = cart.findIndex((item) => {
    const itemKey = item?.key || getCartKey(item, item);
    return itemKey === cartItem.key;
  });

  const next =
    existingIndex >= 0
      ? cart.map((item, index) => {
          if (index !== existingIndex) return item;

          return {
            ...item,
            ...cartItem,
            quantity: toNumber(item?.quantity, 1) + cartItem.quantity,
          };
        })
      : [...cart, cartItem];

  return saveCart(next);
}

export function updateCartItem(key, quantity) {
  const nextQuantity = Math.max(1, toNumber(quantity, 1));

  const next = getCart().map((item) => {
    const itemKey = item?.key || getCartKey(item, item);

    if (itemKey !== key) return item;

    return {
      ...item,
      key: itemKey,
      quantity: nextQuantity,
    };
  });

  return saveCart(next);
}

export function removeCartItem(key) {
  return saveCart(
    getCart().filter((item) => {
      const itemKey = item?.key || getCartKey(item, item);
      return itemKey !== key;
    })
  );
}

export function clearCart() {
  return saveCart([]);
}

export function getWishlist() {
  return readJson(KEYS.wishlist, []);
}

export function toggleWishlist(productId) {
  const list = getWishlist().map(Number);
  const id = Number(productId);
  const next = list.includes(id)
    ? list.filter((item) => item !== id)
    : [...list, id];

  writeJson(KEYS.wishlist, next);

  return next;
}

export function getWishlistProducts() {
  const ids = getWishlist().map(Number);
  return getProducts().filter((product) => ids.includes(Number(product.id)));
}

export function getUsers() {
  const saved = readJson(KEYS.users, null);

  if (saved) return saved;

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
  return writeJson(KEYS.users, users);
}

export function registerUser(data) {
  const users = getUsers();

  if (
    users.some(
      (user) => user.email.toLowerCase() === data.email.toLowerCase()
    )
  ) {
    return { ok: false, message: "Email này đã được đăng ký." };
  }

  const user = {
    id: "USR" + String(Date.now()).slice(-6),
    fullName: data.fullName,
    email: data.email,
    phone: data.phone,
    password: data.password,
    role: "customer",
    status: "Hoạt động",
    address: data.address || "",
    createdAt: new Date().toISOString(),
  };

  saveUsers([...users, user]);

  return { ok: true, user };
}

export function loginUser(email, password) {
  const user = getUsers().find((item) => {
    return (
      item.email.toLowerCase() === email.toLowerCase() &&
      item.password === password
    );
  });

  if (!user) {
    return { ok: false, message: "Email hoặc mật khẩu không đúng." };
  }

  if (user.status === "Bị khóa") {
    return {
      ok: false,
      message: "Tài khoản đang bị khóa. Vui lòng liên hệ cửa hàng.",
    };
  }

  writeJson(KEYS.currentUser, { ...user, password: undefined });
  window.localStorage.setItem("isLoggedIn", "true");
  window.localStorage.setItem("userDisplayName", user.fullName);

  return { ok: true, user };
}

export function logoutUser() {
  if (!isBrowser()) return;

  window.localStorage.removeItem(KEYS.currentUser);
  window.localStorage.removeItem("isLoggedIn");
  window.dispatchEvent(new Event("dynova:storage"));
}

export function getCurrentUser() {
  return readJson(KEYS.currentUser, null);
}

export function updateCurrentUser(data) {
  const current = getCurrentUser();

  if (!current) return null;

  const next = { ...current, ...data };

  writeJson(KEYS.currentUser, next);
  saveUsers(
    getUsers().map((user) =>
      user.id === current.id ? { ...user, ...data } : user
    )
  );
  window.localStorage.setItem("userDisplayName", next.fullName || "Khách hàng");

  return next;
}

export function changePassword(email, oldPassword, newPassword) {
  const users = getUsers();
  const user = users.find(
    (item) => item.email.toLowerCase() === email.toLowerCase()
  );

  if (!user) return { ok: false, message: "Không tìm thấy tài khoản." };

  if (oldPassword && user.password !== oldPassword) {
    return { ok: false, message: "Mật khẩu hiện tại không đúng." };
  }

  saveUsers(
    users.map((item) =>
      item.id === user.id ? { ...item, password: newPassword } : item
    )
  );

  return { ok: true, message: "Mật khẩu đã được cập nhật." };
}

export function getOrders() {
  const saved = readJson(KEYS.orders, null);
  return saved || seedOrders;
}

export function saveOrders(orders) {
  return writeJson(KEYS.orders, orders);
}

export function createOrder(payload) {
  const order = {
    id: "DNV" + String(Date.now()).slice(-6),
    createdAt: new Date().toISOString(),
    status:
      payload.paymentMethod === "COD"
        ? "Chờ xác nhận"
        : payload.paymentMethod === "BANK"
          ? "Chờ chuyển khoản"
          : "Đã tiếp nhận",
    paymentStatus:
      payload.paymentStatus ||
      (payload.paymentMethod === "COD"
        ? "Chờ thanh toán"
        : "Chờ thanh toán online"),
    timeline: ["Đã tiếp nhận"],
    ...payload,
  };

  saveOrders([order, ...getOrders()]);

  return order;
}

export function updateOrder(id, data) {
  const next = getOrders().map((order) =>
    order.id === id ? { ...order, ...data } : order
  );

  return saveOrders(next);
}

export function calculateOrder(items, couponCode = "") {
  const settings = getSettings();
  const subtotal = items.reduce((sum, item) => {
    return sum + Number(item.price) * Number(item.quantity);
  }, 0);
  const shipping =
    subtotal > 0 && subtotal < Number(settings.freeShipThreshold)
      ? Number(settings.shippingFee)
      : 0;
  const coupon = getCoupons().find((item) => {
    return (
      item.active &&
      item.code.toUpperCase() === couponCode.trim().toUpperCase()
    );
  });
  let discount = 0;
  let message = "";

  if (coupon) {
    if (subtotal < Number(coupon.minOrder || 0)) {
      message = "Mã hợp lệ nhưng đơn chưa đạt giá trị tối thiểu.";
    } else if (coupon.type === "fixed") {
      discount = Number(coupon.value || 0);
      message = "Áp dụng mã giảm giá thành công.";
    } else if (coupon.type === "percent") {
      discount = Math.min(
        (subtotal * Number(coupon.value || 0)) / 100,
        Number(coupon.maxDiscount || subtotal)
      );
      message = "Áp dụng mã giảm giá thành công.";
    } else if (coupon.type === "shipping") {
      discount = Math.min(shipping, Number(coupon.value || shipping));
      message = "Đã áp dụng ưu đãi vận chuyển.";
    }
  } else if (couponCode.trim()) {
    message = "Mã giảm giá không tồn tại hoặc đã tạm dừng.";
  }   

  const total = Math.max(0, subtotal + shipping - discount);

  return { subtotal, shipping, discount, total, coupon, message };
}

export const storageKeys = KEYS;
