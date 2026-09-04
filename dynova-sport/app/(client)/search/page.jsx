"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
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

function removeVietnameseTones(str = "") {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

function extractProducts(response) {
  const candidates = [
    response?.data?.products,
    response?.data?.data,
    response?.data,
    response?.products,
    response,
  ];
  return candidates.find((item) => Array.isArray(item)) || [];
}

function SearchLoading() {
  return (
    <main className="min-h-screen bg-[#f7f8fb] pb-16">
      <section className="bg-slate-950 py-14 text-white">
        <div className="container-page">
          <div className="h-10 w-32 animate-pulse rounded-2xl bg-white/10" />
          <div className="mt-6 h-8 w-64 animate-pulse rounded-2xl bg-white/10" />
          <div className="mt-6 h-14 w-full max-w-3xl animate-pulse rounded-2xl bg-white/10" />
        </div>
      </section>
      <section className="container-page py-10">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-96 animate-pulse rounded-3xl bg-white" />
          ))}
        </div>
      </section>
    </main>
  );
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q") || "";

  const [keyword, setKeyword] = useState(searchQuery);
  const [products, setProducts] = useState([]);
  const [sort, setSort] = useState("relevant");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setKeyword(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const res = await getProducts({ page: 1, per_page: 120 });
        if (isMounted) {
          setProducts(extractProducts(res));
        }
      } catch (err) {
        console.error("Search page fetch error:", err);
        if (isMounted) setProducts([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const cleanKey = removeVietnameseTones(searchQuery);
    let result = [...products];

    if (cleanKey) {
      result = result.filter((p) => {
        const searchStr = removeVietnameseTones(
          `${p?.name || ""} ${p?.brand?.name || p?.brand || ""} ${
            p?.category?.name || p?.category || ""
          } ${p?.description || ""}`
        );
        return searchStr.includes(cleanKey);
      });
    }

    if (sort === "price-asc") {
      result.sort((a, b) => Number(a?.price || 0) - Number(b?.price || 0));
    } else if (sort === "price-desc") {
      result.sort((a, b) => Number(b?.price || 0) - Number(a?.price || 0));
    }

    return result;
  }, [products, searchQuery, sort]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const val = keyword.trim();
    if (val) {
      router.push(`/search?q=${encodeURIComponent(val)}`);
    } else {
      router.push("/search");
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f8fb] pb-16">
      <section className="bg-slate-950 py-14 text-white">
        <div className="container-page">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-slate-200 transition hover:bg-white/20"
          >
            <ArrowLeft size={16} /> Về trang chủ
          </Link>

          <h1 className="mt-6 text-3xl font-black uppercase md:text-4xl">
            Kết quả tìm kiếm
          </h1>

          <form
            onSubmit={handleSearchSubmit}
            className="mt-6 flex max-w-2xl items-center gap-2 rounded-2xl bg-white p-2 text-slate-900"
          >
            <Search size={20} className="ml-2 text-slate-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Nhập tên sản phẩm..."
              className="w-full bg-transparent text-sm font-bold outline-none"
            />
            {keyword && (
              <button
                type="button"
                onClick={() => {
                  setKeyword("");
                  router.push("/search");
                }}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            )}
            <button
              type="submit"
              className="rounded-xl bg-orange-500 px-6 py-3 text-xs font-black uppercase text-white transition hover:bg-orange-600"
            >
              Tìm kiếm
            </button>
          </form>
        </div>
      </section>

      <section className="container-page py-8">
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-bold text-slate-700">
            {searchQuery ? `Từ khóa: "${searchQuery}"` : "Tất cả sản phẩm"} (
            {filteredProducts.length} kết quả)
          </p>

          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-orange-500" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none"
            >
              <option value="relevant">Mới nhất / Liên quan</option>
              <option value="price-asc">Giá thấp đến cao</option>
              <option value="price-desc">Giá cao đến thấp</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-2xl bg-white" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
            <PackageSearch size={40} className="mx-auto text-orange-500" />
            <h3 className="mt-4 text-lg font-bold">Không tìm thấy sản phẩm</h3>
            <p className="mt-1 text-xs text-slate-500">
              Hãy thử tìm kiếm với từ khóa khác.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:shadow-md"
              >
                <Link href={`/shop/product/${product.id}`}>
                  <img
                    src={getProductImage(product)}
                    alt={product.name}
                    onError={(e) => {
                      e.currentTarget.src = PRODUCT_FALLBACK;
                    }}
                    className="aspect-square w-full rounded-xl object-cover"
                  />
                  <h4 className="mt-3 line-clamp-2 min-h-[40px] text-sm font-bold text-slate-900">
                    {product.name}
                  </h4>
                </Link>
                <div className="mt-auto pt-3 flex items-center justify-between">
                  <p className="text-base font-black text-orange-600">
                    {formatCurrency(Number(product?.price || 0))}
                  </p>
                  <button
                    onClick={() =>
                      addToCart({ ...product, image: getProductImage(product) }, { quantity: 1 })
                    }
                    className="rounded-xl bg-slate-950 p-2.5 text-white transition hover:bg-orange-500"
                  >
                    <ShoppingBag size={16} />
                  </button>
                </div>
              </div>
            ))}
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