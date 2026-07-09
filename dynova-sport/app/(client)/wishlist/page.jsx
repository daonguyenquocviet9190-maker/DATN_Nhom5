"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Heart,
  Loader2,
  PackageX,
  RefreshCw,
  Search,
  ShoppingBag,
  Trash2,
} from "lucide-react";

import { formatCurrency } from "@/data/shop";
import { addToCart } from "@/utils/shopStorage";
import {
  getWishlist,
  removeWishlistItem,
} from "@/services/wishlist.service";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"
).replace(/\/$/, "");

const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&auto=format&fit=crop&q=80";

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

function toStorageProductImage(value) {
  const raw = String(value || "").trim();

  if (
    !raw ||
    raw === "null" ||
    raw === "undefined" ||
    raw.includes("product-placeholder")
  ) {
    return FALLBACK_IMAGE;
  }

  if (
    /^(https?:)?\/\//i.test(raw) ||
    raw.startsWith("data:") ||
    raw.startsWith("blob:")
  ) {
    return raw;
  }

  const clean = raw.replace(/\\/g, "/");

  if (clean.startsWith("/storage/")) {
    return `${API_ORIGIN}${encodePath(clean)}`;
  }

  if (clean.startsWith("storage/")) {
    return `${API_ORIGIN}/${encodePath(clean)}`;
  }

  if (clean.startsWith("products/")) {
    return `${API_ORIGIN}/storage/${encodePath(clean)}`;
  }

  if (clean.startsWith("/products/")) {
    return `${API_ORIGIN}/storage${encodePath(clean)}`;
  }

  if (clean.startsWith("images/")) {
    return `/${encodePath(clean)}`;
  }

  if (clean.startsWith("/images/")) {
    return encodePath(clean);
  }

  if (clean.startsWith("/")) {
    return clean;
  }

  return `${API_ORIGIN}/storage/products/${encodePath(clean)}`;
}

function extractWishlistItems(data) {
  const candidates = [
    data?.items,
    data?.items?.data,

    data?.wishlist,
    data?.wishlist?.data,

    data?.products,
    data?.products?.data,

    data?.data?.items,
    data?.data?.items?.data,

    data?.data?.wishlist,
    data?.data?.wishlist?.data,

    data?.data?.products,
    data?.data?.products?.data,

    data?.data?.data,
    data?.data,

    data,
  ];

  return candidates.find((item) => Array.isArray(item)) || [];
}

function getFirstImageFromList(value) {
  if (!value) return "";

  if (Array.isArray(value)) {
    const first = value[0];

    if (typeof first === "string") return first;

    return (
      first?.image_url ||
      first?.image ||
      first?.url ||
      first?.path ||
      first?.src ||
      ""
    );
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return getFirstImageFromList(parsed);
      }

      if (parsed && typeof parsed === "object") {
        return (
          parsed.image_url ||
          parsed.image ||
          parsed.url ||
          parsed.path ||
          parsed.src ||
          ""
        );
      }
    } catch {
      return value;
    }
  }

  if (typeof value === "object") {
    return (
      value?.image_url ||
      value?.image ||
      value?.url ||
      value?.path ||
      value?.src ||
      ""
    );
  }

  return "";
}

function getRawProductImage(product = {}, item = {}) {
  return (
    item?.variant_image ||
    item?.product_image ||
    item?.image_url ||
    item?.image ||
    item?.thumbnail ||
    item?.thumb ||
    item?.photo ||

    product?.variant_image ||
    product?.product_image ||
    product?.main_image ||
    product?.image_url ||
    product?.image ||
    product?.thumbnail ||
    product?.thumb ||
    product?.photo ||

    product?.product_variant?.image_url ||
    product?.product_variant?.image ||
    product?.variant?.image_url ||
    product?.variant?.image ||

    getFirstImageFromList(product?.images) ||
    getFirstImageFromList(product?.gallery) ||
    getFirstImageFromList(product?.photos) ||
    getFirstImageFromList(item?.images) ||
    ""
  );
}

function getProductImage(product = {}, item = {}) {
  return toStorageProductImage(getRawProductImage(product, item));
}

function getProductId(item = {}) {
  const product = item?.product || item?.product_data || item || {};

  return (
    product?.id ||
    product?.product_id ||
    item?.product_id ||
    item?.productId ||
    item?.id ||
    null
  );
}

function normalizeProduct(item) {
  const product = item?.product || item?.product_data || item || {};
  const productId = getProductId(item);

  return {
    id: productId,
    wishlistId: item?.id || item?.wishlist_id || null,

    name:
      product?.name ||
      product?.product_name ||
      item?.product_name ||
      item?.name ||
      "Sản phẩm",

    slug:
      product?.slug ||
      item?.slug ||
      null,

    image: getProductImage(product, item),

    price: Number(
      product?.sale_price ||
        product?.price ||
        item?.sale_price ||
        item?.price ||
        0
    ),

    oldPrice: Number(
      product?.old_price ||
        product?.compare_price ||
        product?.original_price ||
        item?.old_price ||
        item?.compare_price ||
        0
    ),

    stock:
      product?.stock ??
      product?.total_stock ??
      item?.stock ??
      null,

    status:
      product?.status ||
      item?.status ||
      "active",

    wishlistedAt:
      item?.wishlisted_at ||
      item?.created_at ||
      item?.createdAt ||
      null,
  };
}

function formatDate(value) {
  if (!value) return "Vừa thêm";

  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function handleImageError(event) {
  if (event.currentTarget.src !== FALLBACK_IMAGE) {
    event.currentTarget.src = FALLBACK_IMAGE;
  }
}

function EmptyWishlist() {
  return (
    <div className="rounded-[34px] border border-slate-200 bg-white p-10 text-center shadow-sm">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-orange-50 text-orange-500">
        <PackageX size={38} />
      </div>

      <h2 className="mt-5 text-2xl font-black tracking-[-0.04em] text-slate-950">
        Danh sách yêu thích đang trống
      </h2>

      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
        Hãy lưu những sản phẩm bạn thích để dễ dàng xem lại, so sánh và mua hàng
        nhanh hơn trong các lần truy cập sau.
      </p>

      <Link
        href="/shop"
        className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 text-xs font-black uppercase tracking-[0.16em] text-white shadow-xl shadow-orange-500/20 transition hover:-translate-y-0.5 hover:bg-orange-600"
      >
        <ShoppingBag size={16} />
        Mua sắm ngay
      </Link>
    </div>
  );
}

export default function WishlistPage() {
  const router = useRouter();

  const [items, setItems] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const products = useMemo(() => {
    return items.map(normalizeProduct).filter((product) => product.id);
  }, [items]);

  const filteredProducts = useMemo(() => {
    const cleanKeyword = keyword.trim().toLowerCase();

    if (!cleanKeyword) return products;

    return products.filter((product) =>
      String(product.name || "").toLowerCase().includes(cleanKeyword)
    );
  }, [products, keyword]);

  const showNotice = (text) => {
    setNotice(text);
    setTimeout(() => setNotice(""), 2400);
  };

  const loadWishlist = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getWishlist();
      const nextItems = extractWishlistItems(data);

      setItems(nextItems);
    } catch (err) {
      if (err?.status === 401) {
        router.push("/login?redirect=/wishlist");
        return;
      }

      setError(err?.message || "Không thể tải danh sách yêu thích.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWishlist();
  }, []);

  const handleRemove = async (productId) => {
    const ok = window.confirm("Bạn muốn xóa sản phẩm này khỏi yêu thích?");

    if (!ok) return;

    setRemovingId(productId);
    setError("");

    try {
      await removeWishlistItem(productId);

      setItems((prev) =>
        prev.filter((item) => String(getProductId(item)) !== String(productId))
      );

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("dynova:wishlist"));
      }

      showNotice("Đã xóa sản phẩm khỏi danh sách yêu thích.");
    } catch (err) {
      setError(err?.message || "Không thể xóa sản phẩm yêu thích.");
    } finally {
      setRemovingId(null);
    }
  };

  const handleAddToCart = (product) => {
    addToCart({
      id: product.id,
      product_id: product.id,
      name: product.name,
      product_name: product.name,
      image: product.image,
      product_image: product.image,
      price: product.price,
      sale_price: product.price,
      quantity: 1,
      size: "Freesize",
      color: "Mặc định",
    });

    window.dispatchEvent(new Event("dynova:cart"));
    window.dispatchEvent(new Event("dynova:storage"));

    showNotice("Đã thêm sản phẩm vào giỏ hàng.");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f8fb] py-10">
        <div className="container-page">
          <div className="grid place-items-center rounded-[34px] border border-slate-200 bg-white p-16 shadow-sm">
            <Loader2 size={38} className="animate-spin text-orange-500" />

            <p className="mt-4 text-sm font-black text-slate-500">
              Đang tải danh sách yêu thích...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fb] py-10">
      {notice && (
        <div className="fixed right-5 top-24 z-[95] rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-2xl">
          {notice}
        </div>
      )}

      <div className="container-page">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-500">
              Wishlist
            </p>

            <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] text-slate-950">
              Sản phẩm yêu thích
            </h1>

            {/* <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
              Lưu lại những sản phẩm bạn quan tâm, thêm nhanh vào giỏ hàng và
              quản lý danh sách yêu thích theo tài khoản.
            </p> */}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={loadWishlist}
              className="inline-flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCw size={15} />
              Làm mới
            </button>

            <Link
              href="/shop"
              className="inline-flex h-12 items-center gap-2 rounded-2xl bg-slate-950 px-5 text-xs font-black uppercase tracking-wider text-white transition hover:bg-orange-500"
            >
              <ShoppingBag size={15} />
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-3xl border border-rose-100 bg-rose-50 p-4 text-sm font-bold text-rose-600">
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="mt-0.5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        <div className="mb-6 rounded-[30px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                <Heart size={21} fill="currentColor" />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                  Tổng sản phẩm
                </p>

                <p className="text-xl font-black text-slate-950">
                  {products.length} sản phẩm
                </p>
              </div>
            </div>

            <div className="relative w-full md:max-w-sm">
              <Search
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Tìm trong yêu thích..."
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-bold text-slate-950 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
              />
            </div>
          </div>
        </div>

        {products.length === 0 ? (
          <EmptyWishlist />
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-[34px] border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-2xl font-black text-slate-950">
              Không tìm thấy sản phẩm
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Thử nhập từ khóa khác để tìm trong danh sách yêu thích.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {filteredProducts.map((product) => {
              const detailHref = product.slug
                ? `/product/${product.slug}`
                : `/product/${product.id}`;

              return (
                <div
                  key={product.id}
                  className="group overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/80"
                >
                  <div className="relative aspect-[4/4] overflow-hidden bg-slate-100">
                    <img
                      src={product.image}
                      alt={product.name}
                      onError={handleImageError}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />

                    <button
                      onClick={() => handleRemove(product.id)}
                      disabled={removingId === product.id}
                      className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/95 text-rose-500 shadow-lg backdrop-blur transition hover:bg-rose-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {removingId === product.id ? (
                        <Loader2 size={17} className="animate-spin" />
                      ) : (
                        <Trash2 size={17} />
                      )}
                    </button>
                  </div>

                  <div className="p-5">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-500">
                      Đã lưu {formatDate(product.wishlistedAt)}
                    </p>

                    <Link href={detailHref}>
                      <h2 className="mt-2 line-clamp-2 min-h-[48px] text-lg font-black leading-6 text-slate-950 transition hover:text-orange-500">
                        {product.name}
                      </h2>
                    </Link>

                    <div className="mt-3 flex items-end gap-2">
                      <p className="text-xl font-black text-orange-500">
                        {formatCurrency(product.price)}
                      </p>

                      {product.oldPrice > product.price && (
                        <p className="text-sm font-bold text-slate-400 line-through">
                          {formatCurrency(product.oldPrice)}
                        </p>
                      )}
                    </div>

                    <div className="mt-5 grid grid-cols-[1fr_auto] gap-2">
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-xs font-black uppercase tracking-wider text-white transition hover:bg-orange-500"
                      >
                        <ShoppingBag size={15} />
                        Thêm giỏ
                      </button>

                      <Link
                        href={detailHref}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-500"
                      >
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}