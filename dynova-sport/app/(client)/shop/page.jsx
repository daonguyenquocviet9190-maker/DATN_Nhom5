"use client";

import "./shop.css";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Heart,
  Loader2,
  PackageSearch,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";

import { categories as localCategories, formatCurrency } from "@/data/shop";
import {
  addToCart,
  getProducts as getLocalProducts,
} from "@/utils/shopStorage";
import { getProductImage, PRODUCT_FALLBACK } from "@/utils/imageUrl";
import { getProducts } from "@/services/product.service";
import { getCategories } from "@/services/category.service";
import {
  getWishlist as getWishlistApi,
  toggleWishlistApi,
} from "@/services/wishlist.service";
import {
  extractProducts,
  getProductBrandName,
  getProductCategoryId,
  getProductCategoryName,
  getProductDisplayPrice,
  getProductOriginalPrice,
  getProductTotalStock,
  normalizeProduct,
} from "@/utils/productNormalizer";

function extractCategories(response) {
  const candidates = [
    response?.data?.categories?.data,
    response?.data?.categories,
    response?.data?.data?.data,
    response?.data?.data,
    response?.data,
    response?.categories?.data,
    response?.categories,
    response,
  ];

  return candidates.find(Array.isArray) || [];
}

export default function ShopPage() {
  const router = useRouter();

  const [items, setItems] = useState([]);
  const [apiCategories, setApiCategories] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [brand, setBrand] = useState("all");
  const [maxPrice, setMaxPrice] = useState(5000000);
  const [sort, setSort] = useState("newest");
  const [wishlist, setWishlist] = useState([]);
  const [wishlistLoadingId, setWishlistLoadingId] = useState(null);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const PAGE_SIZE = 12;

  useEffect(() => {
    let mounted = true;

    async function loadShopData() {
      try {
        setLoading(true);

        const params =
          typeof window !== "undefined"
            ? new URLSearchParams(window.location.search)
            : new URLSearchParams();

        const categoryParam = params.get("category");
        const keywordParam = params.get("q");

        if (categoryParam) setCategory(categoryParam);
        if (keywordParam) setQuery(keywordParam);

        const [productResponse, categoryResponse] = await Promise.all([
          getProducts({ per_page: 100 }),
          getCategories(),
        ]);

        const normalizedProducts = extractProducts(productResponse)
          .map(normalizeProduct)
          .filter(Boolean);

        const categoryList = extractCategories(categoryResponse);

        if (!mounted) return;

        const fallbackProducts = getLocalProducts()
          .map(normalizeProduct)
          .filter(Boolean);

        const finalProducts =
          normalizedProducts.length > 0
            ? normalizedProducts
            : fallbackProducts;

        setItems(finalProducts);

        setApiCategories(
          Array.isArray(categoryList) && categoryList.length > 0
            ? categoryList
            : localCategories
        );

        const prices = finalProducts.map(getProductDisplayPrice);
        const highest =
          prices.length > 0
            ? Math.max(...prices, 5000000)
            : 5000000;

        setMaxPrice(highest);
      } catch (error) {
        console.log("Shop API error:", error);

        if (!mounted) return;

        const fallbackProducts = getLocalProducts()
          .map(normalizeProduct)
          .filter(Boolean);

        setItems(fallbackProducts);
        setApiCategories(localCategories);

        const prices = fallbackProducts.map(getProductDisplayPrice);
        setMaxPrice(
          prices.length > 0
            ? Math.max(...prices, 5000000)
            : 5000000
        );
      } finally {
        if (mounted) setLoading(false);
      }

      try {
        const wishlistData = await getWishlistApi();

        if (!mounted) return;

        const ids = (wishlistData?.items || [])
          .map((item) => item.product_id || item.product?.id)
          .filter(Boolean)
          .map(Number);

        setWishlist(ids);
      } catch {
        if (mounted) setWishlist([]);
      }
    }

    loadShopData();

    return () => {
      mounted = false;
    };
  }, []);

  const safeCategories =
    Array.isArray(apiCategories) && apiCategories.length > 0
      ? apiCategories
      : localCategories;

  const brands = useMemo(() => {
    return Array.from(
      new Set(
        items
          .map((item) => getProductBrandName(item))
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, "vi"));
  }, [items]);

  const highestPrice = useMemo(() => {
    const prices = items.map(getProductDisplayPrice);

    return prices.length > 0
      ? Math.max(...prices, 5000000)
      : 5000000;
  }, [items]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    const result = items
      .filter((product) => {
        if (category === "all") return true;

        return (
          getProductCategoryId(product) === String(category)
        );
      })
      .filter((product) => {
        if (brand === "all") return true;

        return getProductBrandName(product) === brand;
      })
      .filter(
        (product) =>
          getProductDisplayPrice(product) <= maxPrice
      )
      .filter((product) => {
        if (!keyword) return true;

        const text = [
          product?.name,
          getProductBrandName(product),
          getProductCategoryName(product),
          product?.short_description,
          product?.description,
          ...(product?.variants || []).flatMap((variant) => [
            variant?.size_name,
            variant?.color_name,
            variant?.sku,
          ]),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return text.includes(keyword);
      });

    if (sort === "price-asc") {
      return [...result].sort(
        (a, b) =>
          getProductDisplayPrice(a) -
          getProductDisplayPrice(b)
      );
    }

    if (sort === "price-desc") {
      return [...result].sort(
        (a, b) =>
          getProductDisplayPrice(b) -
          getProductDisplayPrice(a)
      );
    }

    return [...result].sort(
      (a, b) =>
        new Date(b?.created_at || 0).getTime() -
          new Date(a?.created_at || 0).getTime() ||
        Number(b?.id || 0) - Number(a?.id || 0)
    );
  }, [items, query, category, brand, maxPrice, sort]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, category, brand, maxPrice, sort]);

  const selectedCategoryName = useMemo(() => {
    if (category === "all") return "Tất cả sản phẩm";

    const found = safeCategories.find(
      (item) => String(item.id) === String(category)
    );

    return found?.name || "Danh mục sản phẩm";
  }, [category, safeCategories]);

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / PAGE_SIZE)
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const paginatedProducts = filtered.slice(startIndex, endIndex);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const goToPage = (page) => {
    const nextPage = Math.min(
      Math.max(page, 1),
      totalPages
    );

    setCurrentPage(nextPage);

    if (typeof window !== "undefined") {
      window.scrollTo({
        top: 420,
        behavior: "smooth",
      });
    }
  };

  const paginationNumbers = useMemo(() => {
    const pages = [];
    const maxButtons = 5;

    let start = Math.max(1, safeCurrentPage - 2);
    let end = Math.min(
      totalPages,
      start + maxButtons - 1
    );

    if (end - start < maxButtons - 1) {
      start = Math.max(
        1,
        end - maxButtons + 1
      );
    }

    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }

    return pages;
  }, [safeCurrentPage, totalPages]);

  const showNotice = (message) => {
    setNotice(message);
    setTimeout(() => setNotice(""), 1800);
  };

  const handleAdd = (product) => {
    const variants = Array.isArray(product?.variants)
      ? product.variants.filter(
          (variant) =>
            variant.is_active &&
            Number(variant.stock || 0) > 0
        )
      : [];

    if (variants.length !== 1) {
      router.push(`/shop/product/${product.id}`);
      return;
    }

    const variant = variants[0];
    const finalPrice =
      Number(variant.discount_price || 0) > 0 &&
      Number(variant.discount_price) <
        Number(variant.price || 0)
        ? Number(variant.discount_price)
        : Number(variant.price || product.price || 0);

    addToCart(
      {
        ...product,
        product_id: product.id,
        variant_id: variant.id,
        product_variant_id: variant.id,
        selected_variant: variant,
        size_id: variant.size_id,
        color_id: variant.color_id,
        size: variant.size_name,
        color: variant.color_name,
        sku: variant.sku,
        price: finalPrice,
        image: variant.image
          ? getProductImage({ image: variant.image })
          : getProductImage(product),
        brand: getProductBrandName(product),
        category: getProductCategoryName(product),
      },
      { quantity: 1 }
    );

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("dynova:storage"));
      window.dispatchEvent(new Event("dynova:cart"));
    }

    showNotice("Đã thêm sản phẩm vào giỏ hàng.");
  };

  const handleWishlist = async (product) => {
    const productId = product?.id || product?.product_id;

    if (!productId) return;

    setWishlistLoadingId(productId);

    try {
      const result = await toggleWishlistApi(productId);

      setWishlist((previous) => {
        const ids = previous.map(Number);
        const numericId = Number(productId);

        if (result?.wishlisted) {
          return ids.includes(numericId)
            ? ids
            : [...ids, numericId];
        }

        return ids.filter((id) => id !== numericId);
      });

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("dynova:wishlist"));
        window.dispatchEvent(new Event("dynova:storage"));
      }

      showNotice(
        result?.wishlisted
          ? "Đã thêm vào danh sách yêu thích."
          : "Đã xóa khỏi danh sách yêu thích."
      );
    } catch (error) {
      if (error?.status === 401) {
        router.push("/login?redirect=/wishlist");
        return;
      }

      showNotice(
        error?.message ||
          "Không thể cập nhật yêu thích."
      );
    } finally {
      setWishlistLoadingId(null);
    }
  };

  const resetFilters = () => {
    setQuery("");
    setCategory("all");
    setBrand("all");
    setMaxPrice(highestPrice);
    setSort("newest");
  };

  return (
    <div className="shop-page min-h-screen bg-[#f7f8fb] pb-16">
      {notice && (
        <div className="float-in fixed right-5 top-24 z-[90] rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-2xl">
          {notice}
        </div>
      )}

      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1600&auto=format&fit=crop&q=85"
            alt="Shop Dynova"
            className="h-full w-full object-cover opacity-35"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/92 to-slate-950/55" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(249,115,22,0.2),transparent_32%)]" />
        </div>

        <div className="container-page relative z-10 grid min-h-[390px] items-center gap-10 py-16 lg:grid-cols-[1fr_auto]">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-orange-200 backdrop-blur">
              <Sparkles size={14} />
              Dynova Store
            </div>

            <h1 className="max-w-3xl text-4xl font-black uppercase leading-tight tracking-[-0.04em] md:text-5xl">
              Cửa hàng sản phẩm thể thao
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
              Lọc sản phẩm theo danh mục, thương hiệu và khoảng giá để chọn đúng trang bị.
            </p>
          </div>

          <div className="hidden rounded-3xl border border-white/10 bg-white/10 p-5 text-right backdrop-blur lg:block">
            <p className="text-sm font-bold text-slate-300">
              Đang hiển thị
            </p>
            <p className="mt-1 text-3xl font-black text-orange-300">
              {filtered.length}
            </p>
            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-400">
              Sản phẩm phù hợp
            </p>
          </div>
        </div>
      </section>

      <div className="container-page py-12">
        <div className="mb-8 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-black text-slate-950">
                {selectedCategoryName}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Tìm thấy {filtered.length} sản phẩm phù hợp · Trang{" "}
                {safeCurrentPage}/{totalPages}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative min-w-[280px]">
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400"
                  size={17}
                />
                <input
                  value={query}
                  onChange={(event) =>
                    setQuery(event.target.value)
                  }
                  className="shop-search-input"
                  placeholder="Tìm sản phẩm, thương hiệu, màu, size..."
                />
              </div>

              <button
                onClick={() =>
                  setFilterOpen((value) => !value)
                }
                className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 lg:hidden"
              >
                <SlidersHorizontal size={17} />
                Bộ lọc
                <ChevronDown
                  size={16}
                  className={
                    filterOpen
                      ? "rotate-180 transition"
                      : "transition"
                  }
                />
              </button>

              <select
                value={sort}
                onChange={(event) =>
                  setSort(event.target.value)
                }
                className="input-control h-12 min-w-[190px]"
              >
                <option value="newest">Mới nhất</option>
                <option value="price-asc">
                  Giá thấp đến cao
                </option>
                <option value="price-desc">
                  Giá cao đến thấp
                </option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
          <aside
            className={
              "shop-filter h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-28 lg:block " +
              (filterOpen ? "block" : "hidden")
            }
          >
            <div className="mb-5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <SlidersHorizontal
                  className="text-orange-500"
                  size={18}
                />
                <h2 className="font-black text-slate-950">
                  Bộ lọc
                </h2>
              </div>

              <button
                onClick={resetFilters}
                className="text-xs font-black text-orange-600 hover:text-orange-700"
              >
                Xóa lọc
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <span className="mb-3 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Danh mục
                </span>

                <div className="grid gap-2">
                  <button
                    onClick={() => setCategory("all")}
                    className={
                      "category-filter-btn " +
                      (category === "all"
                        ? "category-filter-active"
                        : "category-filter-normal")
                    }
                  >
                    <span>Tất cả</span>
                    {category === "all" && <Check size={15} />}
                  </button>

                  {safeCategories.map((item) => (
                    <button
                      key={item.id}
                      onClick={() =>
                        setCategory(String(item.id))
                      }
                      className={
                        "category-filter-btn " +
                        (String(category) === String(item.id)
                          ? "category-filter-active"
                          : "category-filter-normal")
                      }
                    >
                      <span>{item.name}</span>
                      {String(category) === String(item.id) && (
                        <Check size={15} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Thương hiệu
                </span>

                <select
                  value={brand}
                  onChange={(event) =>
                    setBrand(event.target.value)
                  }
                  className="input-control"
                >
                  <option value="all">
                    Tất cả thương hiệu
                  </option>

                  {brands.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Giá tối đa
                </span>

                <input
                  type="range"
                  min="0"
                  max={highestPrice}
                  step="50000"
                  value={maxPrice}
                  onChange={(event) =>
                    setMaxPrice(Number(event.target.value))
                  }
                  className="custom-slider w-full"
                />

                <div className="mt-3 rounded-2xl bg-orange-50 px-4 py-3 text-sm font-black text-orange-600">
                  Dưới {formatCurrency(maxPrice)}
                </div>
              </label>

              {(query ||
                category !== "all" ||
                brand !== "all") && (
                <button
                  onClick={resetFilters}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
                >
                  <X size={16} />
                  Đặt lại bộ lọc
                </button>
              )}
            </div>
          </aside>

          <section>
            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map(
                  (_, index) => (
                    <div
                      key={index}
                      className="h-[430px] animate-pulse rounded-3xl bg-white"
                    />
                  )
                )}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-orange-50 text-orange-500">
                  <PackageSearch size={28} />
                </div>
                <p className="mt-5 text-lg font-black text-slate-950">
                  Không tìm thấy sản phẩm phù hợp
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Hãy thử bỏ bớt bộ lọc hoặc đổi từ khóa tìm kiếm.
                </p>
                <button
                  onClick={resetFilters}
                  className="btn-primary mt-6 rounded-2xl px-5 py-3 text-sm font-black uppercase tracking-wider"
                >
                  Xóa bộ lọc
                </button>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {paginatedProducts.map((product) => {
                  const liked = wishlist.includes(
                    Number(product.id)
                  );

                  const brandName =
                    getProductBrandName(product);
                  const categoryName =
                    getProductCategoryName(product);
                  const displayPrice =
                    getProductDisplayPrice(product);
                  const originalPrice =
                    getProductOriginalPrice(product);
                  const totalStock =
                    getProductTotalStock(product);
                  const availableVariants =
                    product?.variants?.filter(
                      (variant) =>
                        variant.is_active &&
                        Number(variant.stock || 0) > 0
                    ) || [];
                  const requiresSelection =
                    availableVariants.length !== 1;

                  return (
                    <article
                      key={product.id}
                      className="product-card-shop group flex h-full flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white"
                    >
                      <div className="relative overflow-hidden bg-slate-100">
                        <Link
                          href={`/shop/product/${product.id}`}
                        >
                          <img
                            src={getProductImage(product)}
                            alt={product.name}
                            onError={(event) => {
                              event.currentTarget.src =
                                PRODUCT_FALLBACK;
                            }}
                            className="aspect-[4/4.35] w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        </Link>

                        {brandName && (
                          <span className="absolute left-3 top-3 rounded-full bg-slate-950 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white">
                            {brandName}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            handleWishlist(product)
                          }
                          disabled={
                            wishlistLoadingId === product.id
                          }
                          className={
                            "absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full shadow-lg transition disabled:cursor-not-allowed disabled:opacity-70 " +
                            (liked
                              ? "bg-rose-500 text-white"
                              : "bg-white text-slate-600 hover:bg-rose-50 hover:text-rose-500")
                          }
                          aria-label="Yêu thích"
                        >
                          {wishlistLoadingId ===
                          product.id ? (
                            <Loader2
                              size={17}
                              className="animate-spin"
                            />
                          ) : (
                            <Heart
                              size={17}
                              className={
                                liked ? "fill-current" : ""
                              }
                            />
                          )}
                        </button>
                      </div>

                      <div className="flex flex-1 flex-col p-5">
                        <p className="line-clamp-1 text-[11px] font-black uppercase tracking-wider text-orange-500">
                          {categoryName || "Sản phẩm"}
                        </p>

                        {brandName && (
                          <p className="mt-2 text-xs font-bold text-slate-400">
                            Thương hiệu:{" "}
                            <span className="text-slate-700">
                              {brandName}
                            </span>
                          </p>
                        )}

                        <Link
                          href={`/shop/product/${product.id}`}
                        >
                          <h3 className="mt-2 line-clamp-2 min-h-11 text-base font-black leading-6 text-slate-950 transition hover:text-orange-600">
                            {product.name}
                          </h3>
                        </Link>

                        {product.short_description && (
                          <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">
                            {product.short_description}
                          </p>
                        )}

                        <div className="mt-4 flex items-end justify-between gap-3">
                          <div>
                            <p className="text-lg font-black text-slate-950">
                              {formatCurrency(displayPrice)}
                            </p>

                            {originalPrice &&
                              Number(originalPrice) >
                                Number(displayPrice) && (
                                <p className="text-xs font-bold text-slate-400 line-through">
                                  {formatCurrency(
                                    originalPrice
                                  )}
                                </p>
                              )}
                          </div>

                          {totalStock !== null && (
                            <span
                              className={
                                "rounded-full px-3 py-1 text-xs font-black " +
                                (Number(totalStock) > 0
                                  ? "bg-emerald-50 text-emerald-600"
                                  : "bg-rose-50 text-rose-600")
                              }
                            >
                              {Number(totalStock) > 0
                                ? `Còn ${totalStock}`
                                : "Hết hàng"}
                            </span>
                          )}
                        </div>

                        <div className="mt-auto pt-5">
                          <button
                            onClick={() =>
                              handleAdd(product)
                            }
                            disabled={
                              totalStock !== null &&
                              Number(totalStock) <= 0
                            }
                            className="btn-primary flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-xs font-black uppercase tracking-wider disabled:cursor-not-allowed disabled:bg-slate-300"
                          >
                            <ShoppingBag size={15} />
                            {requiresSelection
                              ? "Chọn phân loại"
                              : "Thêm vào giỏ"}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
                <p className="text-sm font-bold text-slate-500">
                  Hiển thị{" "}
                  <span className="font-black text-slate-950">
                    {filtered.length === 0
                      ? 0
                      : startIndex + 1}
                  </span>
                  {" - "}
                  <span className="font-black text-slate-950">
                    {Math.min(endIndex, filtered.length)}
                  </span>
                  {" / "}
                  <span className="font-black text-slate-950">
                    {filtered.length}
                  </span>{" "}
                  sản phẩm
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      goToPage(safeCurrentPage - 1)
                    }
                    disabled={safeCurrentPage === 1}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  {paginationNumbers.map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => goToPage(page)}
                      className={
                        "h-11 min-w-11 rounded-2xl border px-4 text-sm font-black transition " +
                        (safeCurrentPage === page
                          ? "border-orange-500 bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                          : "border-slate-200 bg-white text-slate-700 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600")
                      }
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() =>
                      goToPage(safeCurrentPage + 1)
                    }
                    disabled={
                      safeCurrentPage === totalPages
                    }
                    className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
