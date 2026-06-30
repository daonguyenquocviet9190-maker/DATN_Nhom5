"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgePercent,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Heart,
  PackageCheck,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
} from "lucide-react";

import { categories, formatCurrency, heroSlides } from "@/data/shop";
import { addToCart, toggleWishlist } from "@/utils/shopStorage";

const DEFAULT_BANNER = {
  id: 1,
  title: "Bứt tốc cùng Dynova Sport",
  subtitle: "Sport Collection 2026",
  description:
    "Khám phá sản phẩm thể thao hiện đại, dễ mua sắm, dễ theo dõi đơn hàng và sẵn sàng mở rộng với backend Laravel.",
  image:
    "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1600&auto=format&fit=crop&q=90",
  buttonText: "Mua sắm ngay",
  buttonLink: "/shop",
  secondaryText: "Xem bộ sưu tập",
  secondaryLink: "/collections",
};

export default function HomeClient({ products = [], banners = [] }) {
  const router = useRouter();

  const [notice, setNotice] = useState("");
  const [keyword, setKeyword] = useState("");
  const [activeBanner, setActiveBanner] = useState(0);
  const [pauseBanner, setPauseBanner] = useState(false);

  const safeProducts = Array.isArray(products) ? products : [];

  const featured = useMemo(() => {
    const featuredProducts = safeProducts.filter(
      (item) => item?.is_featured || item?.isFeatured
    );

    return (featuredProducts.length ? featuredProducts : safeProducts).slice(
      0,
      8
    );
  }, [safeProducts]);

  const bestSeller = useMemo(() => {
    return [...safeProducts]
      .sort((a, b) => Number(b?.sold || 0) - Number(a?.sold || 0))
      .slice(0, 4);
  }, [safeProducts]);

  const heroBanners = useMemo(() => {
    const source =
      Array.isArray(banners) && banners.length > 0
        ? banners
        : Array.isArray(heroSlides) && heroSlides.length > 0
          ? heroSlides
          : [DEFAULT_BANNER];

    const normalized = [...source]
      .filter((banner) => banner?.isActive !== false && banner?.is_active !== 0)
      .sort(
        (a, b) =>
          Number(a?.sortOrder || a?.sort_order || 0) -
          Number(b?.sortOrder || b?.sort_order || 0)
      )
      .map((banner, index) => ({
        id: banner.id || index + 1,
        title:
          banner.title ||
          banner.name ||
          "Trang bị thể thao cho phong cách sống năng động",
        subtitle:
          banner.subtitle ||
          banner.tagline ||
          "Sport Collection 2026",
        description:
          banner.description ||
          "Dynova Sport mang đến trải nghiệm mua sắm thể thao hiện đại, rõ ràng và dễ sử dụng.",
        image:
          banner.image ||
          banner.imageUrl ||
          banner.image_url ||
          DEFAULT_BANNER.image,
        buttonText:
          banner.buttonText ||
          banner.ctaText ||
          banner.cta_text ||
          "Mua sắm ngay",
        buttonLink:
          banner.buttonLink ||
          banner.ctaLink ||
          banner.cta_link ||
          "/shop",
        secondaryText:
          banner.secondaryText ||
          banner.secondary_text ||
          "Xem bộ sưu tập",
        secondaryLink:
          banner.secondaryLink ||
          banner.secondary_link ||
          "/collections",
      }));

    return normalized.length > 0 ? normalized : [DEFAULT_BANNER];
  }, [banners]);

  const currentBanner = heroBanners[activeBanner] || heroBanners[0];

  useEffect(() => {
    if (activeBanner >= heroBanners.length) {
      setActiveBanner(0);
    }
  }, [activeBanner, heroBanners.length]);

  useEffect(() => {
    if (heroBanners.length <= 1 || pauseBanner) return;

    const timer = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % heroBanners.length);
    }, 5200);

    return () => clearInterval(timer);
  }, [heroBanners.length, pauseBanner]);

  const showNotice = (message) => {
    setNotice(message);
    setTimeout(() => setNotice(""), 1800);
  };

  const handleAdd = (product) => {
    addToCart(product, { quantity: 1 });

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("dynova:storage"));
    }

    showNotice("Đã thêm " + product.name + " vào giỏ hàng.");
  };

  const handleWishlist = (product) => {
    toggleWishlist(product.id);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("dynova:storage"));
    }

    showNotice("Đã cập nhật danh sách yêu thích.");
  };

  const handleSearch = (event) => {
    event.preventDefault();

    const value = keyword.trim();
    if (!value) return;

    router.push("/search?q=" + encodeURIComponent(value));
  };

  const goPrevBanner = () => {
    setActiveBanner((prev) =>
      prev === 0 ? heroBanners.length - 1 : prev - 1
    );
  };

  const goNextBanner = () => {
    setActiveBanner((prev) => (prev + 1) % heroBanners.length);
  };

  const getProductImage = (product) => {
    return (
      product?.image ||
      product?.image_url ||
      product?.imageUrl ||
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&auto=format&fit=crop&q=80"
    );
  };

  const getProductCategory = (product) => {
    if (typeof product?.category === "string") return product.category;

    return (
      product?.category?.name ||
      product?.category_name ||
      product?.categoryName ||
      "Dynova Sport"
    );
  };

  const ProductCard = ({ product }) => {
    if (!product) return null;

    return (
      <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl">
        <Link
          href={"/shop/product/" + product.id}
          className="relative block overflow-hidden bg-slate-100"
        >
          <img
            src={getProductImage(product)}
            alt={product.name}
            className="aspect-[4/4.35] w-full object-cover transition duration-500 group-hover:scale-105"
          />

          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-orange-600 shadow-sm">
            Hot
          </span>
        </Link>

        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="line-clamp-1 text-[11px] font-black uppercase tracking-[0.16em] text-orange-500">
              {getProductCategory(product)}
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
                onClick={() => handleAdd(product)}
                className="btn-primary rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-wider"
              >
                Thêm giỏ
              </button>

              <button
                onClick={() => handleWishlist(product)}
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
  };

  return (
    <div className="bg-[#f7f8fb]">
      {notice && (
        <div className="float-in fixed right-5 top-24 z-[90] max-w-sm rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-2xl">
          {notice}
        </div>
      )}

      <section
        className="relative isolate overflow-hidden bg-slate-950 text-white"
        onMouseEnter={() => setPauseBanner(true)}
        onMouseLeave={() => setPauseBanner(false)}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="flex h-full transition-transform duration-700 ease-out"
            style={{
              transform: `translateX(-${activeBanner * 100}%)`,
            }}
          >
            {heroBanners.map((banner) => (
              <div key={banner.id} className="relative h-full min-w-full">
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="h-full w-full object-cover opacity-45"
                />
              </div>
            ))}
          </div>

          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/92 to-slate-950/45" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_25%,rgba(249,115,22,0.22),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.08),transparent_26%)]" />
        </div>

        <div className="container-page relative z-10 grid min-h-[620px] items-center gap-10 py-14 lg:grid-cols-[1.04fr_0.96fr]">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-200 backdrop-blur">
              <Sparkles size={14} />
              {currentBanner.subtitle}
            </div>

            <h1 className="max-w-2xl text-4xl font-black uppercase leading-tight tracking-[-0.04em] md:text-6xl">
              {currentBanner.title}
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-300 md:text-base">
              {currentBanner.description}
            </p>

            <form
              onSubmit={handleSearch}
              className="mt-7 flex max-w-xl flex-col gap-2 rounded-2xl bg-white p-2 shadow-xl sm:flex-row"
            >
              <div className="flex flex-1 items-center gap-3 px-3 text-slate-400">
                <Search size={18} />

                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onFocus={() => setPauseBanner(true)}
                  onBlur={() => setPauseBanner(false)}
                  className="h-11 w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                  placeholder="Tìm sản phẩm, danh mục, thương hiệu..."
                />
              </div>

              <button className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-black uppercase tracking-wider text-white transition hover:bg-orange-600">
                Tìm kiếm
              </button>
            </form>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={currentBanner.buttonLink}
                className="btn-primary inline-flex items-center gap-2 rounded-2xl px-6 py-4 text-sm font-black uppercase tracking-wider"
              >
                {currentBanner.buttonText}
                <ArrowRight size={16} />
              </Link>

              <Link
                href={currentBanner.secondaryLink}
                className="rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-sm font-black uppercase tracking-wider text-white transition hover:bg-white/20"
              >
                {currentBanner.secondaryText}
              </Link>
            </div>

            <div className="mt-10 grid max-w-lg grid-cols-3 gap-5">
              <div>
                <p className="text-2xl font-black">500+</p>
                <p className="mt-1 text-xs font-bold text-slate-400">
                  Sản phẩm
                </p>
              </div>

              <div>
                <p className="text-2xl font-black">30 ngày</p>
                <p className="mt-1 text-xs font-bold text-slate-400">
                  Đổi trả
                </p>
              </div>

              <div>
                <p className="text-2xl font-black">24/7</p>
                <p className="mt-1 text-xs font-bold text-slate-400">
                  Hỗ trợ
                </p>
              </div>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="relative ml-auto max-w-[470px] overflow-hidden rounded-[32px] border border-white/10 bg-white/10 p-3 shadow-2xl backdrop-blur">
              <div className="overflow-hidden rounded-[24px]">
                <div
                  className="flex transition-transform duration-700 ease-out"
                  style={{
                    transform: `translateX(-${activeBanner * 100}%)`,
                  }}
                >
                  {heroBanners.map((banner) => (
                    <img
                      key={banner.id}
                      src={banner.image}
                      alt={banner.title}
                      className="h-[470px] min-w-full object-cover"
                    />
                  ))}
                </div>
              </div>

              <div className="absolute bottom-7 left-7 right-7 rounded-3xl bg-white/95 p-5 text-slate-950 shadow-xl backdrop-blur">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-500">
                  Banner đang hiển thị
                </p>

                <h3 className="mt-2 line-clamp-1 text-lg font-black">
                  {currentBanner.title}
                </h3>

                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                  Sau này có thể quản lý ảnh, tiêu đề, mô tả và nút CTA từ
                  Laravel Admin.
                </p>
              </div>
            </div>

            {heroBanners.length > 1 && (
              <div className="absolute -left-5 bottom-8 flex flex-col gap-2">
                {heroBanners.slice(0, 3).map((banner, index) => (
                  <button
                    key={banner.id}
                    onClick={() => setActiveBanner(index)}
                    className={
                      "h-16 w-24 overflow-hidden rounded-2xl border transition " +
                      (activeBanner === index
                        ? "border-orange-400 opacity-100"
                        : "border-white/20 opacity-65 hover:opacity-100")
                    }
                    aria-label={"Chọn banner " + (index + 1)}
                  >
                    <img
                      src={banner.image}
                      alt={banner.title}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {heroBanners.length > 1 && (
          <>
            <button
              onClick={goPrevBanner}
              className="absolute left-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur transition hover:bg-white/20 lg:flex"
              aria-label="Banner trước"
            >
              <ChevronLeft size={22} />
            </button>

            <button
              onClick={goNextBanner}
              className="absolute right-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur transition hover:bg-white/20 lg:flex"
              aria-label="Banner sau"
            >
              <ChevronRight size={22} />
            </button>

            <div className="absolute bottom-7 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
              {heroBanners.map((banner, index) => (
                <button
                  key={banner.id}
                  onClick={() => setActiveBanner(index)}
                  className={
                    "h-2.5 rounded-full transition-all " +
                    (activeBanner === index
                      ? "w-9 bg-orange-500"
                      : "w-2.5 bg-white/40 hover:bg-white")
                  }
                  aria-label={"Chuyển banner " + (index + 1)}
                />
              ))}
            </div>
          </>
        )}
      </section>

      <section className="container-page -mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            icon: Truck,
            title: "Giao hàng nhanh",
            text: "Hỗ trợ giao hàng toàn quốc, trạng thái đơn rõ ràng.",
          },
          {
            icon: ShieldCheck,
            title: "Đổi trả 30 ngày",
            text: "Chính sách đổi trả minh bạch, dễ theo dõi.",
          },
          {
            icon: PackageCheck,
            title: "Sản phẩm rõ biến thể",
            text: "Có size, màu sắc, giá bán và tồn kho.",
          },
          {
            icon: Headphones,
            title: "Hỗ trợ tư vấn",
            text: "Tư vấn size, đơn hàng và thanh toán nhanh.",
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="h-full rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                <Icon size={22} />
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
      </section>

      <section className="container-page py-16">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-500">
              Danh mục
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-[-0.03em] text-slate-950">
              Mua theo nhu cầu tập luyện
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
              Các danh mục được sắp xếp rõ ràng để người dùng dễ tìm sản phẩm
              phù hợp.
            </p>
          </div>

          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-sm font-black text-orange-600 hover:text-orange-700"
          >
            Xem tất cả
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={"/shop?category=" + category.id}
              className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl"
            >
              <div className="h-40 overflow-hidden bg-slate-100">
                <img
                  src={category.image || category.image_url}
                  alt={category.name}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>

              <div className="flex flex-1 flex-col p-4">
                <h3 className="text-base font-black text-slate-950 transition group-hover:text-orange-600">
                  {category.name}
                </h3>

                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                  {category.description ||
                    "Khám phá sản phẩm phù hợp với nhu cầu tập luyện."}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container-page">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-500">
                Sản phẩm nổi bật
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-[-0.03em] text-slate-950">
                Được chọn nhiều tuần này
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
                Hiển thị sản phẩm nổi bật giúp người dùng vào chi tiết, thêm giỏ
                hàng hoặc lưu yêu thích nhanh hơn.
              </p>
            </div>

            <Link
              href="/shop"
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-900 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
            >
              Vào cửa hàng
            </Link>
          </div>

          {featured.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <p className="text-lg font-black text-slate-950">
                Chưa có sản phẩm để hiển thị
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Hãy truyền dữ liệu products vào HomeClient.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="container-page grid gap-6 py-16 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="flex min-h-[420px] flex-col justify-between overflow-hidden rounded-[32px] bg-slate-950 p-7 text-white">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2 text-xs font-black uppercase tracking-wider">
              <BadgePercent size={15} />
              Ưu đãi thành viên
            </div>

            <h2 className="mt-5 max-w-xl text-3xl font-black leading-tight tracking-[-0.03em]">
              Nhập DYNOVANEW giảm ngay 100.000đ cho đơn từ 500.000đ
            </h2>

            <p className="mt-4 max-w-lg text-sm leading-7 text-slate-300">
              Khu vực khuyến mãi giúp trang chủ có điểm nhấn bán hàng nhưng vẫn
              gọn gàng, không quá rối.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/shop"
              className="rounded-2xl bg-white px-6 py-4 text-sm font-black uppercase tracking-wider text-slate-950 transition hover:bg-orange-500 hover:text-white"
            >
              Mua ngay
            </Link>

            <Link
              href="/checkout"
              className="rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-sm font-black uppercase tracking-wider text-white transition hover:bg-white/20"
            >
              Checkout
            </Link>
          </div>
        </div>

        <div>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-500">
                Best seller
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Sản phẩm bán chạy
              </h2>
            </div>

            <Link
              href="/shop"
              className="text-sm font-black text-orange-600 hover:text-orange-700"
            >
              Xem thêm
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {bestSeller.map((product) => (
              <Link
                key={product.id}
                href={"/shop/product/" + product.id}
                className="group flex h-full gap-4 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl"
              >
                <img
                  src={getProductImage(product)}
                  alt={product.name}
                  className="h-28 w-28 shrink-0 rounded-2xl object-cover"
                />

                <div className="min-w-0 py-1">
                  <p className="line-clamp-1 text-[11px] font-black uppercase tracking-wider text-orange-500">
                    {getProductCategory(product)}
                  </p>

                  <h3 className="mt-1 line-clamp-2 min-h-[44px] text-sm font-black leading-6 text-slate-950 group-hover:text-orange-600">
                    {product.name}
                  </h3>

                  <p className="mt-2 text-base font-black text-slate-900">
                    {formatCurrency(product.price || 0)}
                  </p>

                  <p className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-slate-500">
                    <Star
                      size={13}
                      className="fill-orange-400 text-orange-400"
                    />
                    {product.rating || 4.8} sao
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container-page">
          <div className="rounded-[32px] border border-slate-200 bg-[#f7f8fb] p-7 md:p-10">
            <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-500">
                  Trải nghiệm mua hàng
                </p>

                <h2 className="mt-2 text-3xl font-black tracking-[-0.03em] text-slate-950">
                  Luồng mua hàng rõ ràng, dễ hiểu
                </h2>

                <p className="mt-3 text-sm leading-7 text-slate-500">
                  Trang chủ dẫn người dùng theo đúng hành trình: xem danh mục,
                  chọn sản phẩm, thêm giỏ hàng, thanh toán và theo dõi đơn hàng.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  {
                    title: "01",
                    name: "Chọn sản phẩm",
                    text: "Xem danh mục và chi tiết sản phẩm.",
                  },
                  {
                    title: "02",
                    name: "Thêm giỏ hàng",
                    text: "Kiểm tra số lượng, giá và ưu đãi.",
                  },
                  {
                    title: "03",
                    name: "Thanh toán",
                    text: "COD, chuyển khoản hoặc online demo.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-3xl border border-slate-200 bg-white p-5"
                  >
                    <p className="text-3xl font-black text-orange-500">
                      {item.title}
                    </p>

                    <h3 className="mt-3 text-base font-black text-slate-950">
                      {item.name}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="overflow-hidden rounded-[32px] bg-gradient-to-r from-slate-950 to-slate-800 p-8 text-white md:p-10">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-300">
                Dynova Sport
              </p>

              <h2 className="mt-2 max-w-2xl text-3xl font-black tracking-[-0.03em]">
                Sẵn sàng nâng cấp trải nghiệm mua sắm thể thao?
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
                Giao diện gọn, đều, dễ mở rộng backend Laravel và phù hợp trình
                bày cho dự án tốt nghiệp.
              </p>
            </div>

            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 py-4 text-sm font-black uppercase tracking-wider text-white transition hover:bg-orange-600"
            >
              Xem sản phẩm
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}