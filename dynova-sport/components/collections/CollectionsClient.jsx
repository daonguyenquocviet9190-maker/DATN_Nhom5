"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Boxes,
  ChevronRight,
  Flame,
  PackageCheck,
  Search,
  Sparkles,
  Star,
} from "lucide-react";

import { formatCurrency } from "@/data/shop";

const FALLBACK_BRAND_IMAGES = {
  nike:
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1300&auto=format&fit=crop&q=85",
  adidas:
    "https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=1300&auto=format&fit=crop&q=85",
  puma:
    "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=1300&auto=format&fit=crop&q=85",
  "new-balance":
    "https://images.unsplash.com/photo-1539185441755-769473a23570?w=1300&auto=format&fit=crop&q=85",
  asics:
    "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=1300&auto=format&fit=crop&q=85",
};

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1300&auto=format&fit=crop&q=85";

function normalizeText(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function getBrandCover(brand, products = []) {
  const slug = brand?.slug || normalizeText(brand?.name);

  const firstProductImage = products.find((item) => {
    const brandId =
      item?.brand_id ||
      item?.brand_data?.id ||
      item?.brandInfo?.id ||
      item?.brand?.id;

    const brandName =
      item?.brand_data?.name ||
      item?.brandInfo?.name ||
      item?.brand?.name ||
      item?.brand;

    return (
      Number(brandId) === Number(brand?.id) ||
      normalizeText(brandName) === slug
    );
  });

  return (
    brand?.cover ||
    brand?.banner ||
    brand?.image ||
    firstProductImage?.image ||
    firstProductImage?.image_url ||
    FALLBACK_BRAND_IMAGES[slug] ||
    DEFAULT_IMAGE
  );
}

function getBrandProducts(brand, products = []) {
  const slug = brand?.slug || normalizeText(brand?.name);

  return products.filter((item) => {
    const brandId =
      item?.brand_id ||
      item?.brand_data?.id ||
      item?.brandInfo?.id ||
      item?.brand?.id;

    const brandName =
      item?.brand_data?.name ||
      item?.brandInfo?.name ||
      item?.brand?.name ||
      item?.brand;

    return (
      Number(brandId) === Number(brand?.id) ||
      normalizeText(brandName) === slug
    );
  });
}

function getProductImage(product) {
  return (
    product?.image ||
    product?.image_url ||
    product?.imageUrl ||
    DEFAULT_IMAGE
  );
}

function BrandLogo({ brand }) {
  if (!brand?.logo) {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-[11px] font-black uppercase text-white">
        {String(brand?.name || "DNV").slice(0, 3)}
      </div>
    );
  }

  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white p-2 shadow-sm">
      <img
        src={brand.logo}
        alt={brand.name}
        className="max-h-full max-w-full object-contain"
      />
    </div>
  );
}

export default function CollectionsClient({
  brands = [],
  products = [],
  apiError = false,
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [keyword, setKeyword] = useState("");
  useEffect(() => {
  const elements = document.querySelectorAll(".reveal-smooth");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.14,
      rootMargin: "0px 0px -60px 0px",
    }
  );

  elements.forEach((element) => observer.observe(element));

  return () => observer.disconnect();
}, []);

  const safeBrands = Array.isArray(brands) ? brands : [];
  const safeProducts = Array.isArray(products) ? products : [];

  const visibleBrands = useMemo(() => {
    const q = keyword.trim().toLowerCase();

    if (!q) return safeBrands;

    return safeBrands.filter((brand) =>
      String(brand?.name || "").toLowerCase().includes(q)
    );
  }, [safeBrands, keyword]);

  const activeBrand = visibleBrands[activeIndex] || visibleBrands[0];
  const activeBrandProducts = activeBrand
  ? getBrandProducts(activeBrand, safeProducts)
  : [];

const previewProducts = useMemo(() => {
  const items = activeBrandProducts.slice(0, 3);

  while (items.length < 3) {
    items.push(null);
  }

  return items;
}, [activeBrandProducts]);

  return (
    <div className="collections-page min-h-screen bg-[#f7f8fb]">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0">
          <img
            src={
              activeBrand
                ? getBrandCover(activeBrand, safeProducts)
                : DEFAULT_IMAGE
            }
            alt="Collections"
            className="collections-hero-image h-full w-full object-cover opacity-28"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/92 to-slate-950/70" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(249,115,22,0.2),transparent_34%)]" />
        </div>

        <div className="container-page relative z-10 py-14 md:py-20">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-400">
            <Link href="/" className="transition hover:text-orange-300">
              Trang chủ
            </Link>
            <ChevronRight size={14} />
            <span className="text-orange-300">Bộ sưu tập</span>
          </div>

          <div className="mt-8 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-200 backdrop-blur">
                <Sparkles size={14} />
                Dynova Collections
              </div>

              <h1 className="mt-5 max-w-3xl text-4xl font-black uppercase leading-[1.03] tracking-[-0.045em] md:text-6xl">
                Bộ sưu tập thương hiệu thể thao
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
                Khám phá các thương hiệu nổi bật, sản phẩm chủ lực và phong cách
                mua sắm hiện đại theo từng bộ sưu tập.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/shop"
                  className="btn-primary inline-flex items-center gap-2 rounded-2xl px-6 py-4 text-sm font-black uppercase tracking-wider"
                >
                  Xem sản phẩm
                  <ArrowRight size={16} />
                </Link>

                <a
                  href="#collections-list"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-sm font-black uppercase tracking-wider text-white transition hover:-translate-y-0.5 hover:bg-white/20"
                >
                  Khám phá ngay
                  <ArrowUpRight size={16} />
                </a>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/10 p-5 backdrop-blur">
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  {
                    icon: BadgeCheck,
                    value: safeBrands.length,
                    label: "Thương hiệu",
                  },
                  {
                    icon: PackageCheck,
                    value: safeProducts.length,
                    label: "Sản phẩm",
                  },
                  {
                    icon: Flame,
                    value: activeBrandProducts.length,
                    label: "Đang chọn",
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.label}
                      className="rounded-3xl border border-white/10 bg-white/10 p-4"
                    >
                      <Icon size={18} className="text-orange-300" />
                      <p className="mt-3 text-2xl font-black">
                        {item.value}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-400">
                        {item.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="collections-list" className="container-page py-12">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-500">
              Brand archive
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-[-0.03em] text-slate-950">
              Chọn thương hiệu bạn muốn khám phá
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
              {/* Dữ liệu thương hiệu và sản phẩm được lấy từ Laravel API. */}
            </p>
          </div>

          <div className="relative w-full max-w-md">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setActiveIndex(0);
              }}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-bold text-slate-950 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-500/10"
              placeholder="Tìm thương hiệu..."
            />
          </div>
        </div>

        {apiError && (
          <div className="mb-6 rounded-3xl border border-orange-200 bg-orange-50 p-5 text-sm font-bold text-orange-700">
            Không thể kết nối API. Kiểm tra lại Laravel server hoặc endpoint
            /api/brands.
          </div>
        )}

        {visibleBrands.length > 0 ? (
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="grid gap-3">
              {visibleBrands.map((brand, index) => {
                const active = activeIndex === index;
                const brandProducts = getBrandProducts(brand, safeProducts);

                return (
                  <button
                    key={brand.id}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => setActiveIndex(index)}
                    className={
                    "collection-brand-row reveal-smooth group flex min-h-[92px] items-center justify-between gap-4 rounded-[28px] border p-4 text-left " +
                      (active
                        ? "border-orange-200 bg-white shadow-xl shadow-slate-200/70"
                        : "border-slate-200 bg-white/70 hover:border-orange-200 hover:bg-white")
                    }
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <BrandLogo brand={brand} />

                      <div className="min-w-0">
                        <p
                          className={
                            "text-xs font-black uppercase tracking-[0.18em] " +
                            (active ? "text-orange-500" : "text-slate-400")
                          }
                        >
                          Collection 0{index + 1}
                        </p>

                        <h3 className="mt-1 truncate text-xl font-black text-slate-950">
                          {brand.name}
                        </h3>

                        <p className="mt-1 text-xs font-bold text-slate-400">
                          {brandProducts.length} sản phẩm
                        </p>
                      </div>
                    </div>

                    <span
                      className={
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition " +
                        (active
                          ? "bg-orange-500 text-white"
                          : "bg-slate-100 text-slate-500 group-hover:bg-orange-50 group-hover:text-orange-600")
                      }
                    >
                      <ArrowRight size={17} />
                    </span>
                  </button>
                );
              })}
            </div>

            {activeBrand && (
              <div className="collections-preview-card reveal-smooth relative overflow-hidden rounded-[34px] border border-slate-200 bg-slate-950 text-white shadow-xl shadow-slate-200/70">
                <img
                  src={getBrandCover(activeBrand, safeProducts)}
                  alt={activeBrand.name}
                  className="collection-soft-img absolute inset-0 h-full w-full object-cover opacity-45"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/72 to-slate-950/20" />

                <div className="relative z-10 flex min-h-[540px] flex-col justify-between p-6 md:p-8">
                  <div className="flex items-center justify-between gap-4">
                    <BrandLogo brand={activeBrand} />

                    <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-orange-200 backdrop-blur">
                      {activeBrandProducts.length} sản phẩm
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-300">
                      Premium collection
                    </p>

                    <h2 className="mt-3 text-5xl font-black uppercase leading-none tracking-[-0.05em] md:text-7xl">
                      {activeBrand.name}
                    </h2>

                    <p className="mt-5 max-w-xl text-sm leading-7 text-slate-300">
                      {activeBrand.description ||
                        "Bộ sưu tập sản phẩm nổi bật, được tuyển chọn theo phong cách thể thao hiện đại."}
                    </p>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <Link
                        href={"/collections/" + activeBrand.slug}
                        className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-6 py-4 text-sm font-black uppercase tracking-wider text-white transition hover:-translate-y-0.5 hover:bg-orange-600"
                      >
                        Xem bộ sưu tập
                        <ArrowRight size={16} />
                      </Link>

                      <Link
                        href={"/shop?brand=" + activeBrand.id}
                        className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-6 py-4 text-sm font-black uppercase tracking-wider text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20"
                      >
                        Mua ngay
                        <ArrowUpRight size={16} />
                      </Link>
                    </div>

                   <div className="mt-7 grid min-h-[178px] gap-3 sm:grid-cols-3">
  {previewProducts.map((product, index) => {
    if (!product) {
      return (
        <div
          key={"empty-" + index}
          className="rounded-3xl border border-white/10 bg-white/[0.06] p-3 backdrop-blur"
        >
          <div className="aspect-square rounded-2xl bg-white/10" />

          <p className="mt-3 line-clamp-2 min-h-[40px] text-xs font-black leading-5 text-slate-400">
            Chưa có sản phẩm
          </p>

          <p className="mt-1 text-xs font-black text-slate-500">
            Đang cập nhật
          </p>
        </div>
      );
    }

    return (
      <Link
        key={product.id}
        href={"/shop/product/" + product.id}
        className="collection-preview-product group rounded-3xl border border-white/10 bg-white/10 p-3 backdrop-blur"
      >
        <div className="overflow-hidden rounded-2xl bg-white/10">
          <img
            src={getProductImage(product)}
            alt={product.name}
            className="collection-preview-img aspect-square w-full object-cover"
          />
        </div>

        <p className="mt-3 line-clamp-2 min-h-[40px] text-xs font-black leading-5 text-white">
          {product.name}
        </p>

        <p className="mt-1 text-xs font-black text-orange-300">
          {formatCurrency(product.price || 0)}
        </p>
      </Link>
    );
  })}
</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-[32px] border border-dashed border-slate-300 bg-white p-10 text-center">
            <Boxes size={36} className="mx-auto text-orange-500" />

            <h3 className="mt-4 text-2xl font-black text-slate-950">
              Chưa có thương hiệu
            </h3>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-slate-500">
              Hãy kiểm tra bảng brands trong database hoặc endpoint /api/brands.
            </p>
          </div>
        )}
      </section>

      <section className="container-page pb-16">
        <div className="rounded-[34px] bg-gradient-to-r from-slate-950 to-slate-800 p-8 text-white md:p-10">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-300">
                Dynova Sport
              </p>

              <h2 className="mt-2 max-w-2xl text-3xl font-black tracking-[-0.03em]">
                Tìm sản phẩm phù hợp với phong cách của bạn
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
                Lọc theo thương hiệu, danh mục, giá và sản phẩm nổi bật trong
                cửa hàng.
              </p>
            </div>

            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 py-4 text-sm font-black uppercase tracking-wider text-white transition hover:bg-orange-600"
            >
              Vào cửa hàng
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}