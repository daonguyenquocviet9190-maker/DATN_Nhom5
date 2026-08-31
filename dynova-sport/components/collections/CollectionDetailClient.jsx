"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  Flame,
  Heart,
  Layers,
  PackageCheck,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
} from "lucide-react";

import { formatCurrency } from "@/data/shop";
import { addToCart, toggleWishlist } from "@/utils/shopStorage";
import { getProductImage, PRODUCT_FALLBACK } from "@/utils/imageUrl";

const FALLBACK_BRAND_IMAGES = {
  nike:
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1400&auto=format&fit=crop&q=85",
  adidas:
    "https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=1400&auto=format&fit=crop&q=85",
  puma:
    "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=1400&auto=format&fit=crop&q=85",
  "new-balance":
    "https://images.unsplash.com/photo-1539185441755-769473a23570?w=1400&auto=format&fit=crop&q=85",
  asics:
    "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=1400&auto=format&fit=crop&q=85",
};

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1400&auto=format&fit=crop&q=85";

function getBrandCover(brand, products = []) {
  const slug = brand?.slug;

  return (
    brand?.cover ||
    brand?.banner ||
    brand?.image ||
    (products?.[0] ? getProductImage(products[0]) : null) ||
    FALLBACK_BRAND_IMAGES[slug] ||
    DEFAULT_IMAGE
  );
}

function getCategoryName(product) {
  if (typeof product?.category === "string") return product.category;

  return (
    product?.category?.name ||
    product?.category_name ||
    product?.categoryName ||
    "Dynova Sport"
  );
}

function getBrandName(product, brand) {
  if (typeof product?.brand === "string") return product.brand;

  return (
    product?.brand_data?.name ||
    product?.brandInfo?.name ||
    product?.brand?.name ||
    product?.brand_name ||
    brand?.name ||
    "Dynova"
  );
}

function buildCartProduct(product, brand) {
  return {
    ...product,
    image: getProductImage(product),
    category: getCategoryName(product),
    brand: getBrandName(product, brand),
    oldPrice: product.oldPrice || product.compare_price,
  };
}

function BrandLogo({ brand }) {
  if (!brand?.logo) {
    return (
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[12px] font-black uppercase text-slate-950 shadow-sm">
        {String(brand?.name || "DNV").slice(0, 3)}
      </div>
    );
  }

  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white p-2 shadow-sm">
      <img
        src={brand.logo}
        alt={brand.name}
        className="max-h-full max-w-full object-contain"
      />
    </div>
  );
}

function ProductCard({ product, brand, onAdd, onWishlist }) {
  return (
    <article className="collection-soft-card reveal-smooth group flex h-full flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm hover:border-orange-200 hover:shadow-xl">
      <Link
        href={"/shop/product/" + product.id}
        className="relative block overflow-hidden bg-slate-100"
      >
        <img
          src={getProductImage(product)}
          alt={product.name}
          onError={(event) => {
            event.currentTarget.src = PRODUCT_FALLBACK;
          }}
          className="collection-soft-img aspect-[4/4.35] w-full object-cover"
        />

        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-orange-600 shadow-sm">
          {getBrandName(product, brand)}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="line-clamp-1 text-[11px] font-black uppercase tracking-[0.16em] text-orange-500">
            {getCategoryName(product)}
          </p>

          <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500">
            <Star size={13} className="fill-orange-400 text-orange-400" />
            {product.rating || 4.8}
          </span>
        </div>

        <Link href={"/shop/product/" + product.id}>
          <h3 className="mt-2 line-clamp-2 min-h-[44px] text-sm font-black leading-6 text-slate-950 transition group-hover:text-orange-600">
            {product.name}
          </h3>
        </Link>

        <div className="mt-auto pt-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold text-slate-400">
                Giá bán
              </p>
              <p className="text-base font-black text-slate-950">
                {formatCurrency(product.price || 0)}
              </p>
            </div>

            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-600">
              Còn hàng
            </span>
          </div>

          <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
            <button
              onClick={() => onAdd(product)}
              className="btn-primary flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-wider"
            >
              <ShoppingBag size={15} />
              Thêm giỏ
            </button>

            <button
              onClick={() => onWishlist(product)}
              className="btn-ghost flex h-11 w-11 items-center justify-center rounded-2xl"
              aria-label="Yêu thích"
            >
              <Heart size={16} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function CollectionDetailClient({
  brand,
  products = [],
  relatedBrands = [],
}) {
  const [keyword, setKeyword] = useState("");
  const [notice, setNotice] = useState("");

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

  const safeProducts = Array.isArray(products) ? products : [];

  const filteredProducts = useMemo(() => {
    const q = keyword.trim().toLowerCase();

    if (!q) return safeProducts;

    return safeProducts.filter((product) =>
      String(product?.name || "").toLowerCase().includes(q)
    );
  }, [safeProducts, keyword]);

  const heroImage = getBrandCover(brand, safeProducts);
  const lookbookImages = safeProducts.slice(0, 4);

  const showNotice = (text) => {
    setNotice(text);
    setTimeout(() => setNotice(""), 1800);
  };

  const handleAdd = (product) => {
    addToCart(buildCartProduct(product, brand), {
      quantity: 1,
    });

    window.dispatchEvent(new Event("dynova:storage"));
    showNotice("Đã thêm sản phẩm vào giỏ hàng.");
  };

  const handleWishlist = (product) => {
    toggleWishlist(product.id);

    window.dispatchEvent(new Event("dynova:storage"));
    showNotice("Đã cập nhật danh sách yêu thích.");
  };

  return (
    <div className="collection-detail-page min-h-screen bg-[#f7f8fb]">
      {notice && (
        <div className="collection-float fixed right-5 top-24 z-[90] max-w-sm rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-2xl">
          {notice}
        </div>
      )}

      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt={brand.name}
            className="collection-hero-bg h-full w-full object-cover opacity-35"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/92 to-slate-950/58" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(249,115,22,0.2),transparent_34%)]" />
        </div>

        <div className="container-page relative z-10 py-12 md:py-20">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-400">
            <Link href="/" className="transition hover:text-orange-300">
              Trang chủ
            </Link>
            <ChevronRight size={14} />
            <Link
              href="/collections"
              className="transition hover:text-orange-300"
            >
              Bộ sưu tập
            </Link>
            <ChevronRight size={14} />
            <span className="text-orange-300">{brand.name}</span>
          </div>

          <div className="mt-8 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-200 backdrop-blur">
                <BrandLogo brand={brand} />
                Premium Collection
              </div>

              <h1 className="mt-6 max-w-4xl text-5xl font-black uppercase leading-[0.96] tracking-[-0.06em] md:text-7xl">
                {brand.name}
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
                {brand.description ||
                  "Không gian bộ sưu tập thương hiệu với các sản phẩm nổi bật, phong cách hiện đại và trải nghiệm mua sắm rõ ràng."}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={"/shop?brand=" + brand.id}
                  className="btn-primary inline-flex items-center gap-2 rounded-2xl px-6 py-4 text-sm font-black uppercase tracking-wider"
                >
                  Mua ngay
                  <ArrowRight size={16} />
                </Link>

                <Link
                  href="/collections"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-sm font-black uppercase tracking-wider text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20"
                >
                  <ArrowLeft size={16} />
                  Bộ sưu tập khác
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  icon: Layers,
                  value: safeProducts.length,
                  label: "Sản phẩm",
                },
                {
                  icon: Flame,
                  value: safeProducts.filter((item) => item.is_featured)
                    .length,
                  label: "Nổi bật",
                },
                {
                  icon: Star,
                  value: "4.8",
                  label: "Đánh giá",
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur"
                  >
                    <Icon size={19} className="text-orange-300" />
                    <p className="mt-4 text-3xl font-black">{item.value}</p>
                    <p className="mt-1 text-xs font-bold text-slate-400">
                      {item.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="container-page -mt-8 relative z-20">
        <div className="grid gap-4 rounded-[32px] border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/70 md:grid-cols-4">
          {[
            {
              icon: BadgeCheck,
              title: "Thương hiệu rõ ràng",
              text: "Sản phẩm được phân nhóm theo brand.",
            },
            {
              icon: PackageCheck,
              title: "Sản phẩm cập nhật",
              text: "Thông tin sản phẩm được cập nhật thường xuyên.",
            },
            {
              icon: Truck,
              title: "Mua sắm nhanh",
              text: "Đi thẳng sang shop theo brand.",
            },
            {
              icon: ShieldCheck,
              title: "Trải nghiệm tốt",
              text: "UI gọn, hiện đại, dễ mở rộng.",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-[26px] bg-slate-50 p-5 transition hover:-translate-y-1 hover:bg-orange-50"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-orange-500 shadow-sm">
                  <Icon size={21} />
                </div>

                <h3 className="mt-4 text-base font-black text-slate-950">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {item.text}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {lookbookImages.length > 0 && (
        <section className="container-page py-14">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-500">
                Lookbook
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-[-0.03em] text-slate-950">
                Hình ảnh nổi bật
              </h2>
            </div>

            <p className="max-w-xl text-sm leading-7 text-slate-500">
              Lookbook được tổng hợp từ các sản phẩm nổi bật của thương hiệu.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {lookbookImages.map((product, index) => (
              <Link
                key={product.id}
                href={"/shop/product/" + product.id}
                className={
                  "collection-soft-button collection-soft-card reveal-smooth group relative min-h-[320px] overflow-hidden rounded-[30px] bg-slate-950 text-white shadow-sm hover:shadow-xl " +
                  (index === 0 ? "md:col-span-2" : "")
                }
              >
                <img
                  src={getProductImage(product)}
                  alt={product.name}
                  onError={(event) => {
                    event.currentTarget.src = PRODUCT_FALLBACK;
                  }}
                  className="collection-soft-img absolute inset-0 h-full w-full object-cover opacity-75 group-hover:opacity-90"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent" />

                <div className="absolute bottom-5 left-5 right-5">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-300">
                    Look 0{index + 1}
                  </p>

                  <h3 className="mt-2 line-clamp-2 text-xl font-black">
                    {product.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="container-page pb-16">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-500">
              Products
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-[-0.03em] text-slate-950">
              Sản phẩm thuộc {brand.name}
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
              Khám phá các sản phẩm hiện có của thương hiệu này.
            </p>
          </div>

          <div className="relative w-full max-w-md">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-bold text-slate-950 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-500/10"
              placeholder="Tìm trong bộ sưu tập..."
            />
          </div>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                brand={brand}
                onAdd={handleAdd}
                onWishlist={handleWishlist}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[32px] border border-dashed border-slate-300 bg-white p-10 text-center">
            <ShoppingBag size={36} className="mx-auto text-orange-500" />

            <h3 className="mt-4 text-2xl font-black text-slate-950">
              Chưa có sản phẩm phù hợp
            </h3>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-slate-500">
              Kiểm tra lại brand_id của sản phẩm hoặc thử tìm từ khóa khác.
            </p>

            <Link
              href="/shop"
              className="btn-primary mt-6 inline-flex rounded-2xl px-6 py-4 text-sm font-black uppercase tracking-wider"
            >
              Vào cửa hàng
            </Link>
          </div>
        )}
      </section>

      {relatedBrands.length > 0 && (
        <section className="container-page pb-16">
          <div className="rounded-[34px] bg-slate-950 p-8 text-white md:p-10">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-300">
                  Related
                </p>

                <h2 className="mt-2 text-3xl font-black tracking-[-0.03em]">
                  Bộ sưu tập khác
                </h2>
              </div>

              <Link
                href="/collections"
                className="hidden text-sm font-black text-orange-300 hover:text-orange-200 sm:inline-flex"
              >
                Xem tất cả
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {relatedBrands.slice(0, 4).map((item) => (
                <Link
                  key={item.id}
                  href={"/collections/" + item.slug}
                  className="rounded-3xl border border-white/10 bg-white/10 p-5 transition hover:-translate-y-1 hover:bg-white/20"
                >
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-300">
                    Collection
                  </p>

                  <h3 className="mt-2 text-xl font-black">{item.name}</h3>

                  <p className="mt-3 inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-300">
                    Khám phá
                    <ArrowRight size={14} />
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}