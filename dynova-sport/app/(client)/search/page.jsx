"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  PackageSearch,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { formatCurrency } from "@/data/shop";
import { addToCart } from "@/utils/shopStorage";
import { getProducts } from "@/services/product.service";
import { getProductImage, PRODUCT_FALLBACK } from "@/utils/imageUrl";

function extractProducts(response) {
  const candidates = [
    response?.data?.products,
    response?.data?.data,
    response?.data,
    response?.products,
    response,
  ];

  const result = candidates.find((item) => Array.isArray(item));

  return result || [];
}

function getProductCategory(product) {
  if (typeof product?.category === "string") return product.category;

  return (
    product?.category?.name ||
    product?.category_name ||
    product?.categoryName ||
    ""
  );
}

function getProductBrand(product) {
  if (typeof product?.brand === "string") return product.brand;

  return (
    product?.brand?.name ||
    product?.brand_name ||
    product?.brandName ||
    product?.brand_data?.name ||
    ""
  );
}

function getProductStock(product) {
  const directStock =
    product?.stock ??
    product?.total_stock ??
    product?.quantity ??
    product?.inventory ??
    null;

  if (directStock !== null && directStock !== undefined) {
    return Number(directStock);
  }

  const variants =
    product?.variants ||
    product?.product_variants ||
    product?.productVariants ||
    [];

  if (Array.isArray(variants) && variants.length > 0) {
    return variants.reduce((total, variant) => {
      return total + Number(variant?.stock || variant?.quantity || 0);
    }, 0);
  }

  return null;
}

function getProductOldPrice(product) {
  return (
    product?.oldPrice ||
    product?.compare_price ||
    product?.old_price ||
    product?.original_price ||
    0
  );
}

function getProductDescription(product) {
  return product?.short_description || product?.description || "";
}

function normalizeProductForCart(product) {
  return {
    ...product,
    id: product.id,
    product_id: product.id,
    image: getProductImage(product),
    category: getProductCategory(product),
    brand: getProductBrand(product),
    oldPrice: getProductOldPrice(product),
  };
}

function SearchLoading() {
  return (
    <main className="min-h-screen bg-[#f7f8fb] pb-16">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(249,115,22,0.2),transparent_35%)]" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/95 to-slate-900" />

        <div className="container-page relative z-10 py-14">
          <div className="h-12 w-40 animate-pulse rounded-2xl bg-white/10" />
          <div className="mt-8 h-10 w-72 animate-pulse rounded-2xl bg-white/10" />
          <div className="mt-4 h-5 w-full max-w-xl animate-pulse rounded-full bg-white/10" />
          <div className="mt-8 h-16 w-full max-w-3xl animate-pulse rounded-[24px] bg-white/10" />
        </div>
      </section>

      <section className="container-page py-10">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="h-[420px] animate-pulse rounded-[28px] bg-white"
            />
          ))}
        </div>
      </section>
    </main>
  );
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") || "";

  const [keyword, setKeyword] = useState(q);
  const [products, setProducts] = useState([]);
  const [sort, setSort] = useState("relevant");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setKeyword(q);
  }, [q]);

  useEffect(() => {
    let mounted = true;

    async function loadProducts() {
      try {
        setLoading(true);

        const response = await getProducts({
          page: 1,
          per_page: 120,
        });

        const list = extractProducts(response);

        if (mounted) {
          setProducts(Array.isArray(list) ? list : []);
        }
      } catch (error) {
        console.log("Search products error:", error);

        if (mounted) {
          setProducts([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const text = q.trim().toLowerCase();

    let result = Array.isArray(products) ? [...products] : [];

    if (text) {
      result = result.filter((product) => {
        const searchableText = [
          product?.name,
          product?.slug,
          product?.description,
          product?.short_description,
          getProductBrand(product),
          getProductCategory(product),
          product?.sku,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(text);
      });
    }

    if (sort === "price-asc") {
      result.sort((a, b) => Number(a?.price || 0) - Number(b?.price || 0));
    }

    if (sort === "price-desc") {
      result.sort((a, b) => Number(b?.price || 0) - Number(a?.price || 0));
    }

    if (sort === "newest") {
      result.sort((a, b) => {
        const dateA = new Date(a?.created_at || 0).getTime();
        const dateB = new Date(b?.created_at || 0).getTime();

        if (dateA || dateB) return dateB - dateA;

        return Number(b?.id || 0) - Number(a?.id || 0);
      });
    }

    return result;
  }, [products, q, sort]);

  const showNotice = (message) => {
    setNotice(message);
    setTimeout(() => setNotice(""), 1800);
  };

  const handleSearch = (event) => {
    event.preventDefault();

    const value = keyword.trim();

    if (!value) {
      router.push("/search");
      return;
    }

    router.push("/search?q=" + encodeURIComponent(value));
  };

  const clearSearch = () => {
    setKeyword("");
    router.push("/search");
  };

  const handleAddToCart = (product) => {
    const stock = getProductStock(product);

    if (stock === 0) {
      showNotice("Sản phẩm hiện chưa có hàng.");
      return;
    }

    addToCart(normalizeProductForCart(product), {
      quantity: 1,
    });

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("dynova:storage"));
      window.dispatchEvent(new Event("dynova:cart"));
    }

    showNotice("Đã thêm sản phẩm vào giỏ hàng.");
  };

  return (
    <main className="min-h-screen bg-[#f7f8fb] pb-16">
      {notice && (
        <div className="fixed right-5 top-24 z-[90] rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-2xl">
          {notice}
        </div>
      )}

      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(249,115,22,0.2),transparent_35%)]" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/95 to-slate-900" />

        <div className="container-page relative z-10 py-14">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-black text-slate-200 transition hover:bg-white/15 hover:text-orange-200"
          >
            <ArrowLeft size={16} />
            Về trang chủ
          </Link>

          <div className="mt-8 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2 text-xs font-black uppercase tracking-[0.2em]">
              <Search size={15} />
              Tìm kiếm
            </div>

            <h1 className="mt-4 text-4xl font-black uppercase tracking-[-0.04em] md:text-5xl">
              Kết quả tìm kiếm
            </h1>

            <p className="mt-4 text-sm leading-7 text-slate-300">
              Tìm sản phẩm theo tên, thương hiệu, danh mục hoặc mô tả sản phẩm.
            </p>
          </div>

          <form
            onSubmit={handleSearch}
            className="mt-8 flex max-w-3xl flex-col gap-2 rounded-[24px] border border-white/10 bg-white p-2 shadow-2xl shadow-slate-950/25 sm:flex-row"
          >
            <div className="flex flex-1 items-center gap-3 px-3 text-slate-400">
              <Search size={19} />

              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                className="h-12 w-full bg-transparent text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400"
                placeholder="Nhập tên sản phẩm, thương hiệu, danh mục..."
              />

              {keyword && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Xóa từ khóa"
                >
                  <X size={17} />
                </button>
              )}
            </div>

            <button className="rounded-[20px] bg-orange-500 px-6 py-3 text-sm font-black uppercase tracking-wider text-white transition hover:bg-orange-600">
              Tìm kiếm
            </button>
          </form>
        </div>
      </section>

      <section className="container-page py-10">
        <div className="mb-7 flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black text-slate-950">
              {q ? `Từ khóa: "${q}"` : "Tất cả sản phẩm"}
            </p>

            <p className="mt-1 text-xs font-semibold text-slate-500">
              {loading
                ? "Đang tải sản phẩm..."
                : `Tìm thấy ${filteredProducts.length} sản phẩm phù hợp`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <SlidersHorizontal size={18} className="text-orange-500" />

            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
            >
              <option value="relevant">Liên quan nhất</option>
              <option value="newest">Mới nhất</option>
              <option value="price-asc">Giá thấp đến cao</option>
              <option value="price-desc">Giá cao đến thấp</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="h-[420px] animate-pulse rounded-[28px] bg-white"
              />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-[32px] border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-orange-50 text-orange-500">
              <PackageSearch size={30} />
            </div>

            <h2 className="mt-5 text-xl font-black text-slate-950">
              Không tìm thấy sản phẩm
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Hãy thử từ khóa khác hoặc quay lại cửa hàng để xem thêm sản phẩm.
            </p>

            <Link
              href="/shop"
              className="mt-6 inline-flex rounded-2xl bg-orange-500 px-6 py-3 text-sm font-black uppercase tracking-wider text-white transition hover:bg-orange-600"
            >
              Xem cửa hàng
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {filteredProducts.map((product) => {
              const category = getProductCategory(product);
              const brand = getProductBrand(product);
              const description = getProductDescription(product);
              const oldPrice = Number(getProductOldPrice(product));
              const price = Number(product?.price || 0);
              const stock = getProductStock(product);
              const isOutOfStock = stock === 0;

              return (
                <article
                  key={product.id}
                  className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl"
                >
                  <Link
                    href={"/shop/product/" + product.id}
                    className="relative block overflow-hidden bg-slate-100"
                  >
                    <img
                      src={getProductImage(product)}
                      alt={product.name || "Sản phẩm Dynova Sport"}
                      onError={(event) => {
                        event.currentTarget.src = PRODUCT_FALLBACK;
                      }}
                      className="aspect-[4/4.25] w-full object-cover transition duration-500 group-hover:scale-105"
                    />

                    {category && (
                      <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-orange-600 shadow-sm">
                        {category}
                      </span>
                    )}
                  </Link>

                  <div className="flex flex-1 flex-col p-4">
                    {brand && (
                      <p className="line-clamp-1 text-[11px] font-black uppercase tracking-[0.16em] text-orange-500">
                        {brand}
                      </p>
                    )}

                    <Link href={"/shop/product/" + product.id}>
                      <h3 className="mt-2 line-clamp-2 min-h-[44px] text-sm font-black leading-6 text-slate-950 transition hover:text-orange-600">
                        {product.name}
                      </h3>
                    </Link>

                    {description && (
                      <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">
                        {description}
                      </p>
                    )}

                    <div className="mt-auto pt-4">
                      <div className="flex items-end justify-between gap-3">
                        <div>
                          <p className="text-lg font-black text-slate-950">
                            {formatCurrency(price)}
                          </p>

                          {oldPrice > price && (
                            <p className="text-xs font-bold text-slate-400 line-through">
                              {formatCurrency(oldPrice)}
                            </p>
                          )}
                        </div>

                        {stock !== null && (
                          <span
                            className={
                              "rounded-full px-3 py-1 text-xs font-black " +
                              (isOutOfStock
                                ? "bg-rose-50 text-rose-600"
                                : "bg-emerald-50 text-emerald-600")
                            }
                          >
                            {isOutOfStock ? "Hết hàng" : `Còn ${stock}`}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={isOutOfStock}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        <ShoppingBag size={15} />
                        {isOutOfStock ? "Hết hàng" : "Thêm vào giỏ"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchLoading />}>
      <SearchContent />
    </Suspense>
  );
}