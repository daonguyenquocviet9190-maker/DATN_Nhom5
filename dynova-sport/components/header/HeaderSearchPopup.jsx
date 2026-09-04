"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Clock,
  Loader2,
  PackageSearch,
  Search,
  Sparkles,
  Star,
  TrendingUp,
  X,
} from "lucide-react";

import { getProducts } from "@/services/product.service";
import { formatCurrency } from "@/data/shop";
import { getProductImage, PRODUCT_FALLBACK } from "@/utils/imageUrl";

const RECENT_SEARCH_KEY = "dynova_recent_searches";

const TRENDING_KEYWORDS = [
  "Nike",
  "Adidas",
  "Áo thể thao",
  "Giày chạy bộ",
  "Phụ kiện",
  "Best seller",
];

function removeVietnameseTones(str = "") {
  return String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

function extractProducts(response) {
  return (
    response?.data?.products ||
    response?.data?.data ||
    response?.data ||
    response?.products ||
    (Array.isArray(response) ? response : [])
  );
}

function getProductCategory(product) {
  if (typeof product?.category === "string") return product.category;

  return (
    product?.category?.name ||
    product?.category_name ||
    product?.categoryName ||
    "Dynova Sport"
  );
}

function getProductBrand(product) {
  if (typeof product?.brand === "string") return product.brand;

  return (
    product?.brand_data?.name ||
    product?.brandInfo?.name ||
    product?.brand?.name ||
    product?.brand_name ||
    product?.brandName ||
    "Dynova"
  );
}

function getProductText(product) {
  const textRaw = [
    product?.name,
    product?.slug,
    product?.sku,
    product?.description,
    product?.short_description,
    getProductBrand(product),
    getProductCategory(product),
  ]
    .filter(Boolean)
    .join(" ");

  return removeVietnameseTones(textRaw);
}

export default function HeaderSearchPopup({ open, onClose }) {
  const router = useRouter();
  const inputRef = useRef(null);

  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [products, setProducts] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(removeVietnameseTones(keyword));
    }, 220);

    return () => clearTimeout(timer);
  }, [keyword]);

  useEffect(() => {
    if (!open) return;

    const saved = localStorage.getItem(RECENT_SEARCH_KEY);

    try {
      const parsed = JSON.parse(saved || "[]");
      setRecentSearches(Array.isArray(parsed) ? parsed : []);
    } catch {
      setRecentSearches([]);
    }

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 80);

    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    let ignore = false;

    async function loadProducts() {
      try {
        setLoading(true);

        const response = await getProducts({
          per_page: 200,
        });

        const list = extractProducts(response);

        if (!ignore) {
          setProducts(Array.isArray(list) ? list : []);
        }
      } catch (error) {
        console.error("Header search products error:", error);

        if (!ignore) {
          setProducts([]);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      ignore = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = oldOverflow;
    };
  }, [open]);

  const suggestions = useMemo(() => {
    if (!debouncedKeyword) return [];

    return products
      .filter((product) => getProductText(product).includes(debouncedKeyword))
      .sort((a, b) => {
        const aName = removeVietnameseTones(a?.name || "");
        const bName = removeVietnameseTones(b?.name || "");

        const aStarts = aName.startsWith(debouncedKeyword) ? 1 : 0;
        const bStarts = bName.startsWith(debouncedKeyword) ? 1 : 0;

        if (aStarts !== bStarts) return bStarts - aStarts;

        return Number(b?.sold || 0) - Number(a?.sold || 0);
      })
      .slice(0, 7);
  }, [products, debouncedKeyword]);

  const saveRecentSearch = (value) => {
    const cleanValue = String(value || "").trim();

    if (!cleanValue) return;

    const next = [
      cleanValue,
      ...recentSearches.filter(
        (item) => item.toLowerCase() !== cleanValue.toLowerCase()
      ),
    ].slice(0, 5);

    localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(next));
    setRecentSearches(next);
  };

  const handleClose = () => {
    setKeyword("");
    setDebouncedKeyword("");
    onClose?.();
  };

  const goSearch = (value) => {
    const cleanValue = String(value || "").trim();

    if (!cleanValue) return;

    saveRecentSearch(cleanValue);
    onClose?.();

    router.push("/search?q=" + encodeURIComponent(cleanValue));
  };

  const handleSearch = (event) => {
    if (event) event.preventDefault();
    goSearch(keyword);
  };

  const handleProductClick = (product) => {
    saveRecentSearch(product?.name || keyword);
    onClose?.();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120]">
      <button
        type="button"
        onClick={handleClose}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        aria-label="Đóng tìm kiếm"
      />

      <div className="float-in absolute left-1/2 top-5 w-[calc(100%-24px)] max-w-4xl -translate-x-1/2 overflow-hidden rounded-[34px] border border-white/15 bg-white shadow-2xl shadow-slate-950/30">
        <div className="relative overflow-hidden bg-slate-950 px-5 py-5 text-white md:px-7">
          <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-orange-500/25 blur-3xl" />
          <div className="absolute -bottom-24 left-10 h-52 w-52 rounded-full bg-white/10 blur-3xl" />

          <div className="relative z-10 flex items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-orange-200">
                <Sparkles size={13} />
                Dynova Search
              </div>

              <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] md:text-3xl">
                Tìm sản phẩm nhanh
              </h2>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Đóng"
            >
              <X size={20} />
            </button>
          </div>

          <form
            onSubmit={handleSearch}
            className="relative z-10 mt-5 flex flex-col gap-2 rounded-[24px] border border-white/10 bg-white p-2 shadow-2xl shadow-slate-950/30 sm:flex-row"
          >
            <div className="flex flex-1 items-center gap-3 px-3 text-slate-400">
              <Search size={20} />

              <input
                ref={inputRef}
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                className="h-12 w-full bg-transparent text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400"
                placeholder="Gõ Nike, Adidas, áo thể thao, giày chạy bộ..."
              />

              {keyword && (
                <button
                  type="button"
                  onClick={() => setKeyword("")}
                  className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Xóa từ khóa"
                >
                  <X size={17} />
                </button>
              )}
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-[20px] bg-orange-500 px-6 py-3 text-sm font-black uppercase tracking-wider text-white transition hover:bg-orange-600"
            >
              Tìm kiếm
              <ArrowRight size={16} />
            </button>
          </form>
        </div>

        <div className="max-h-[68vh] overflow-y-auto p-5 md:p-7">
          {!keyword.trim() ? (
            <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <TrendingUp size={17} className="text-orange-500" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-950">
                    Từ khóa phổ biến
                  </h3>
                </div>

                <div className="flex flex-wrap gap-2">
                  {TRENDING_KEYWORDS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => goSearch(item)}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-black text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Clock size={17} className="text-orange-500" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-950">
                    Tìm gần đây
                  </h3>
                </div>

                {recentSearches.length > 0 ? (
                  <div className="grid gap-2">
                    {recentSearches.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => goSearch(item)}
                        className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-bold text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
                      >
                        <span>{item}</span>
                        <ArrowRight size={15} />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-semibold text-slate-500">
                    Chưa có lịch sử tìm kiếm.
                  </div>
                )}
              </div>
            </div>
          ) : loading ? (
            <div className="flex min-h-[220px] items-center justify-center rounded-3xl bg-slate-50">
              <div className="text-center">
                <Loader2 className="mx-auto animate-spin text-orange-500" size={30} />
                <p className="mt-3 text-sm font-bold text-slate-500">
                  Đang tìm sản phẩm phù hợp...
                </p>
              </div>
            </div>
          ) : suggestions.length > 0 ? (
            <div>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-950">
                    Gợi ý cho “{keyword.trim()}”
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Hiển thị {suggestions.length} sản phẩm phù hợp
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSearch}
                  className="hidden rounded-2xl bg-slate-950 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white transition hover:bg-orange-500 sm:block"
                >
                  Xem tất cả
                </button>
              </div>

              <div className="grid gap-3">
                {suggestions.map((product) => (
                  <Link
                    key={product.id}
                    href={"/shop/product/" + product.id}
                    onClick={() => handleProductClick(product)}
                    className="group grid grid-cols-[76px_1fr_auto] items-center gap-4 rounded-[24px] border border-slate-200 bg-white p-3 transition hover:border-orange-200 hover:bg-orange-50/40 hover:shadow-lg"
                  >
                    <div className="h-[76px] w-[76px] overflow-hidden rounded-2xl bg-slate-100">
                      <img
                        src={getProductImage(product)}
                        alt={product.name}
                        onError={(event) => {
                          event.currentTarget.src = PRODUCT_FALLBACK;
                        }}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="line-clamp-1 text-[11px] font-black uppercase tracking-wider text-orange-500">
                        {getProductCategory(product)} · {getProductBrand(product)}
                      </p>

                      <h4 className="mt-1 line-clamp-2 text-sm font-black leading-5 text-slate-950 group-hover:text-orange-600">
                        {product.name}
                      </h4>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <p className="text-sm font-black text-slate-950">
                          {formatCurrency(product.price || 0)}
                        </p>

                        {(product.compare_price ||
                          product.old_price ||
                          product.oldPrice) && (
                          <p className="text-xs font-bold text-slate-400 line-through">
                            {formatCurrency(
                              product.compare_price ||
                                product.old_price ||
                                product.oldPrice
                            )}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="hidden flex-col items-end gap-2 sm:flex">
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-600">
                        <Star size={13} className="fill-amber-400 text-amber-400" />
                        {product.rating || 4.8}
                      </span>

                      <ArrowRight
                        size={18}
                        className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-orange-500"
                      />
                    </div>
                  </Link>
                ))}
              </div>

              {/* Đã sửa onClick chính xác thành handleSearch */}
              <button
                type="button"
                onClick={handleSearch}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black uppercase tracking-wider text-white transition hover:bg-orange-500 sm:hidden"
              >
                Xem tất cả kết quả
                <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-10 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-orange-50 text-orange-500">
                <PackageSearch size={30} />
              </div>

              <h3 className="mt-5 text-lg font-black text-slate-950">
                Chưa tìm thấy gợi ý phù hợp
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Bạn có thể bấm tìm kiếm để xem kết quả rộng hơn trên trang search.
              </p>

              <button
                type="button"
                onClick={handleSearch}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black uppercase tracking-wider text-white transition hover:bg-orange-600"
              >
                Tìm với từ khóa này
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}