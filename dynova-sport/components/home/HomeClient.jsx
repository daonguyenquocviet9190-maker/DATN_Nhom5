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
  Loader2,
  PackageCheck,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
} from "lucide-react";

import {
  getProductImage,
  getCategoryImage,
  PRODUCT_FALLBACK,
  CATEGORY_FALLBACK,
} from "@/utils/imageUrl";

import { formatCurrency } from "@/data/shop";
import { addToCart } from "@/utils/shopStorage";
import { toggleWishlistApi } from "@/services/wishlist.service";

const API_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"
)
  .replace(/\/api\/?$/, "")
  .replace(/\/$/, "");

function encodePath(path) {
  return String(path)
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function getBannerImage(banner) {
  const value =
    banner?.image_url ||
    banner?.imageUrl ||
    banner?.image ||
    banner?.thumbnail ||
    banner?.background ||
    "";

  if (!value) return "";

  const raw = String(value).trim();

  if (!raw) return "";

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }

  if (raw.startsWith("/storage/")) {
    return API_ORIGIN + encodePath(raw);
  }

  if (raw.startsWith("storage/")) {
    return API_ORIGIN + "/" + encodePath(raw);
  }

  if (raw.startsWith("/images/")) {
    return raw;
  }

  return `${API_ORIGIN}/storage/banners/${encodePath(raw.replace(/^\/+/, ""))}`;
}

export default function HomeClient({
  products = [],
  banners = [],
  categories = [],
  brands = [],
  apiCategories = [],
  apiBrands = [],
}) {
  const router = useRouter();

  const [notice, setNotice] = useState("");
  const [keyword, setKeyword] = useState("");
  const [activeBanner, setActiveBanner] = useState(0);
  const [pauseBanner, setPauseBanner] = useState(false);
  const [wishlistLoadingId, setWishlistLoadingId] = useState(null);

  const safeProducts = Array.isArray(products) ? products : [];

  const safeCategories =
    Array.isArray(apiCategories) && apiCategories.length > 0
      ? apiCategories
      : Array.isArray(categories)
        ? categories
        : [];

  const safeBrands =
    Array.isArray(apiBrands) && apiBrands.length > 0
      ? apiBrands
      : Array.isArray(brands)
        ? brands
        : [];

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
    const source = Array.isArray(banners) ? banners : [];

    return [...source]
      .filter((banner) => {
        const isActive =
          banner?.isActive !== false &&
          banner?.is_active !== 0 &&
          banner?.status !== "inactive" &&
          banner?.status !== 0;

        return isActive;
      })
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
          banner.sub_title ||
          "Sport Collection",
        description:
          banner.description ||
          banner.content ||
          "Khám phá những sản phẩm thể thao nổi bật, phù hợp cho luyện tập, thi đấu và phong cách sống năng động.",
        image: getBannerImage(banner),
        buttonText:
          banner.buttonText ||
          banner.button_text ||
          banner.ctaText ||
          banner.cta_text ||
          "Mua sắm ngay",
        buttonLink:
          banner.buttonLink ||
          banner.button_link ||
          banner.ctaLink ||
          banner.cta_link ||
          banner.link ||
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
  }, [banners]);

  const currentBanner = heroBanners[activeBanner] || heroBanners[0] || null;

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

  const getProductCategory = (product) => {
    if (typeof product?.category === "string") return product.category;

    return (
      product?.category?.name ||
      product?.category_name ||
      product?.categoryName ||
      "Dynova Sport"
    );
  };

  const getProductBrand = (product) => {
    if (typeof product?.brand === "string") return product.brand;

    return (
      product?.brand_data?.name ||
      product?.brandInfo?.name ||
      product?.brand?.name ||
      product?.brand_name ||
      "Dynova"
    );
  };

  const normalizeProductForStorage = (product) => {
    return {
      ...product,
      image: getProductImage(product),
      category: getProductCategory(product),
      brand: getProductBrand(product),
      oldPrice: product.oldPrice || product.compare_price,
    };
  };

  const handleAdd = (product) => {
    addToCart(normalizeProductForStorage(product), { quantity: 1 });

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("dynova:storage"));
    }

    showNotice("Đã thêm " + product.name + " vào giỏ hàng.");
  };

  const handleWishlist = async (product) => {
    const productId = product?.id || product?.product_id;

    if (!productId) {
      showNotice("Sản phẩm này chưa có ID nên chưa thể lưu yêu thích.");
      return;
    }

    setWishlistLoadingId(productId);

    try {
      const result = await toggleWishlistApi(productId);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("dynova:storage"));
        window.dispatchEvent(new Event("dynova:wishlist"));
      }

      showNotice(
        result?.wishlisted
          ? "Đã thêm vào danh sách yêu thích."
          : "Đã xóa khỏi danh sách yêu thích."
      );
    } catch (err) {
      if (err?.status === 401) {
        router.push("/login?redirect=/wishlist");
        return;
      }

      showNotice(err?.message || "Không thể cập nhật yêu thích.");
    } finally {
      setWishlistLoadingId(null);
    }
  };

  const handleSearch = (event) => {
    event.preventDefault();

    const value = keyword.trim();
    if (!value) return;

    router.push("/search?q=" + encodeURIComponent(value));
  };

  const goPrevBanner = () => {
    if (heroBanners.length <= 1) return;

    setActiveBanner((prev) =>
      prev === 0 ? heroBanners.length - 1 : prev - 1
    );
  };

  const goNextBanner = () => {
    if (heroBanners.length <= 1) return;

    setActiveBanner((prev) => (prev + 1) % heroBanners.length);
  };

  const ProductCard = ({ product }) => {
    if (!product) return null;

    return (
      <article className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl">
        <Link
          href={"/shop/product/" + product.id}
          className="relative block overflow-hidden bg-slate-100"
        >
          <img
            src={getProductImage(product)}
            alt={product.name}
            onError={(e) => {
              e.currentTarget.src = PRODUCT_FALLBACK;
            }}
            className="aspect-[4/4.25] w-full object-cover transition duration-500 group-hover:scale-105"
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

          <p className="mt-2 text-xs font-bold text-slate-400">
            {getProductBrand(product)}
          </p>

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
                type="button"
                onClick={() => handleWishlist(product)}
                disabled={wishlistLoadingId === product.id}
                className="btn-ghost flex h-11 w-11 items-center justify-center rounded-2xl disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Yêu thích"
              >
                {wishlistLoadingId === product.id ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Heart size={16} />
                )}
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
        className="home-hero-clean relative isolate overflow-hidden bg-slate-950 text-white"
        onMouseEnter={() => setPauseBanner(true)}
        onMouseLeave={() => setPauseBanner(false)}
      >
        <div className="absolute inset-0">
          {currentBanner?.image && (
            <div
              key={currentBanner.id}
              className="hero-soft-fade absolute inset-0"
            >
              <img
                src={currentBanner.image}
                alt={currentBanner.title}
                className="h-full w-full object-cover opacity-40"
              />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/92 to-slate-950/58" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(249,115,22,0.18),transparent_32%),radial-gradient(circle_at_85%_18%,rgba(255,255,255,0.08),transparent_26%)]" />
        </div>

        <div className="container-page relative z-10 grid min-h-[610px] items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-200 backdrop-blur">
              <Sparkles size={14} />
              {currentBanner?.subtitle || "Dynova Sport"}
            </div>

            <h1 className="max-w-3xl text-4xl font-black uppercase leading-[1.02] tracking-[-0.045em] md:text-6xl">
              {currentBanner?.title || "Cửa hàng thể thao Dynova Sport"}
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-300 md:text-base">
              {currentBanner?.description ||
                "Khám phá bộ sưu tập thể thao mới nhất cùng Dynova Sport."}
            </p>

            <form
              onSubmit={handleSearch}
              className="mt-8 flex max-w-xl flex-col gap-2 rounded-[22px] border border-white/10 bg-white p-2 shadow-2xl shadow-slate-950/25 sm:flex-row"
            >
              <div className="flex flex-1 items-center gap-3 px-3 text-slate-400">
                <Search size={18} />

                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onFocus={() => setPauseBanner(true)}
                  onBlur={() => setPauseBanner(false)}
                  className="h-12 w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                  placeholder="Tìm sản phẩm, thương hiệu..."
                />
              </div>

              <button className="rounded-[18px] bg-orange-500 px-6 py-3 text-sm font-black uppercase tracking-wider text-white transition hover:-translate-y-0.5 hover:bg-orange-600">
                Tìm kiếm
              </button>
            </form>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={currentBanner?.buttonLink || "/shop"}
                className="btn-primary inline-flex items-center gap-2 rounded-2xl px-6 py-4 text-sm font-black uppercase tracking-wider"
              >
                {currentBanner?.buttonText || "Mua sắm ngay"}
                <ArrowRight size={16} />
              </Link>

              <Link
                href={currentBanner?.secondaryLink || "/collections"}
                className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-sm font-black uppercase tracking-wider text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20"
              >
                {currentBanner?.secondaryText || "Xem bộ sưu tập"}
              </Link>
            </div>

            <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
              {[
                { value: "500+", label: "Sản phẩm" },
                { value: "30 ngày", label: "Đổi trả" },
                { value: "24/7", label: "Hỗ trợ" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur transition hover:bg-white/[0.14]"
                >
                  <p className="text-xl font-black text-white md:text-2xl">
                    {item.value}
                  </p>
                  <p className="mt-1 text-xs font-bold text-slate-400">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="hero-product-panel relative ml-auto max-w-[460px]">
              <div
                key={"panel-" + (currentBanner?.id || "empty")}
                className="hero-card-fade overflow-hidden rounded-[36px] border border-white/10 bg-white/10 p-3 shadow-2xl shadow-slate-950/30 backdrop-blur"
              >
                <div className="relative overflow-hidden rounded-[28px] bg-slate-900">
                  {currentBanner?.image ? (
                    <img
                      src={currentBanner.image}
                      alt={currentBanner.title}
                      className="h-[430px] w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-[430px] place-items-center bg-slate-900">
                      <div className="text-center">
                        <Sparkles className="mx-auto text-orange-300" size={42} />
                        <p className="mt-4 text-sm font-black uppercase tracking-[0.2em] text-slate-400">
                          Dynova Sport
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent" />

                  <div className="absolute bottom-5 left-5 right-5">
                    <div className="rounded-[26px] border border-white/10 bg-white/95 p-5 text-slate-950 shadow-2xl backdrop-blur">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-500">
                        Dynova Collection
                      </p>

                      <h3 className="mt-2 line-clamp-2 text-xl font-black leading-7">
                        {currentBanner?.title || "Dynova Collection"}
                      </h3>

                      <div className="mt-4 grid grid-cols-3 gap-2">
                        {["Chính hãng", "Dễ mua", "Dễ đổi"].map((item) => (
                          <span
                            key={item}
                            className="rounded-2xl bg-slate-100 px-3 py-2 text-center text-[11px] font-black text-slate-700"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {heroBanners.length > 1 && (
                <div className="mt-5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {heroBanners.map((banner, index) => (
                      <button
                        key={banner.id}
                        onClick={() => setActiveBanner(index)}
                        className={
                          "h-2.5 rounded-full transition-all duration-300 " +
                          (activeBanner === index
                            ? "w-9 bg-orange-500"
                            : "w-2.5 bg-white/35 hover:bg-white/70")
                        }
                        aria-label={"Chuyển banner " + (index + 1)}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={goPrevBanner}
                      className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20"
                      aria-label="Banner trước"
                    >
                      <ChevronLeft size={21} />
                    </button>

                    <button
                      onClick={goNextBanner}
                      className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20"
                      aria-label="Banner sau"
                    >
                      <ChevronRight size={21} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-10">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
        </div>
      </section>

      {safeBrands.length > 0 && (
        <section className="container-page pb-14">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-500">
                  Thương hiệu
                </p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  Brand nổi bật
                </h2>
              </div>

              <div className="flex flex-wrap gap-2">
                {safeBrands.slice(0, 8).map((brand) => (
                  <Link
                    key={brand.id}
                    href={"/shop?brand=" + brand.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-black text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
                  >
                    {brand.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="container-page pb-16">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-500">
              Danh mục
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-[-0.03em] text-slate-950">
              Mua theo nhu cầu tập luyện
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
              Khám phá nhanh các nhóm sản phẩm phù hợp cho luyện tập, thi đấu và phong cách năng động.
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
          {safeCategories.map((category) => (
            <Link
              key={category.id}
              href={"/shop?category=" + category.id}
              className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl"
            >
              <div className="h-40 overflow-hidden bg-slate-100">
                <img
                  src={getCategoryImage(category)}
                  alt={category.name}
                  onError={(e) => {
                    e.currentTarget.src = CATEGORY_FALLBACK;
                  }}
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
                Khám phá những sản phẩm được khách hàng quan tâm nhiều nhất tại Dynova Sport.
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
                Sản phẩm đang được cập nhật
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Dynova Sport sẽ sớm bổ sung thêm nhiều sản phẩm mới.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="container-page py-16">
        <div className="grid items-stretch gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative flex min-h-[430px] overflow-hidden rounded-[36px] bg-slate-950 p-7 text-white shadow-2xl shadow-slate-950/15 md:p-8">
            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-orange-500/20 blur-3xl" />
            <div className="absolute -bottom-24 left-10 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(249,115,22,0.22),transparent_35%)]" />

            <div className="relative z-10 flex w-full flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2 text-xs font-black uppercase tracking-wider shadow-lg shadow-orange-500/20">
                  <BadgePercent size={15} />
                  Ưu đãi thành viên
                </div>

                <h2 className="mt-5 max-w-xl text-3xl font-black leading-tight tracking-[-0.04em] md:text-4xl">
                  Nhập DYNOVANEW giảm ngay 100.000đ
                </h2>

                <p className="mt-3 max-w-lg text-sm leading-7 text-slate-300">
                  Áp dụng cho đơn hàng từ 500.000đ, giúp bạn mua sắm tiết kiệm hơn tại Dynova Sport.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[
                    { value: "100K", label: "Giảm trực tiếp" },
                    { value: "500K", label: "Đơn tối thiểu" },
                    { value: "30 ngày", label: "Đổi trả" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur"
                    >
                      <p className="text-xl font-black text-orange-300">
                        {item.value}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-400">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/shop"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-black uppercase tracking-wider text-slate-950 transition hover:-translate-y-0.5 hover:bg-orange-500 hover:text-white"
                >
                  Mua ngay
                  <ArrowRight size={16} />
                </Link>

                <Link
                  href="/checkout"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-sm font-black uppercase tracking-wider text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20"
                >
                  Checkout
                </Link>
              </div>
            </div>
          </div>

          <div className="rounded-[36px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-500">
                  Best seller
                </p>

                <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-slate-950 md:text-3xl">
                  Sản phẩm bán chạy
                </h2>
              </div>

              <Link
                href="/shop"
                className="shrink-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-black text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
              >

                Xem thêm
              </Link>
            </div>


            {bestSeller.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {bestSeller.map((product, index) => (
                  <Link
                    key={product.id}
                    href={"/shop/product/" + product.id}
                    className="group flex min-h-[150px] gap-4 overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50 p-3 transition duration-300 hover:-translate-y-1 hover:border-orange-200 hover:bg-white hover:shadow-xl"
                  >
                    <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-[22px] bg-slate-100 sm:h-32 sm:w-32">
                      <img
                        src={getProductImage(product)}
                        alt={product.name}
                        onError={(e) => {
                          e.currentTarget.src = PRODUCT_FALLBACK;
                        }}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />

                      <span className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 text-[11px] font-black text-white shadow-lg">
                        {index + 1}
                      </span>
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col py-1">
                      <p className="line-clamp-1 text-[11px] font-black uppercase tracking-wider text-orange-500">
                        {getProductCategory(product)}
                      </p>

                      <h3 className="mt-1 line-clamp-2 min-h-[44px] text-sm font-black leading-6 text-slate-950 transition group-hover:text-orange-600">
                        {product.name}
                      </h3>

                      <p className="mt-1 line-clamp-1 text-xs font-bold text-slate-400">
                        {getProductBrand(product)}
                      </p>

                      <div className="mt-auto flex items-end justify-between gap-3 pt-3">
                        <div>
                          <p className="text-base font-black text-slate-950">
                            {formatCurrency(product.price || 0)}
                          </p>

                          {(product.compare_price || product.old_price) && (
                            <p className="text-xs font-bold text-slate-400 line-through">
                              {formatCurrency(
                                product.compare_price || product.old_price
                              )}
                            </p>
                          )}
                        </div>

                        <p className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-600">
                          <Star
                            size={13}
                            className="fill-amber-400 text-amber-400"
                          />
                          {product.rating || 4.8}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="grid min-h-[310px] place-items-center rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <div>
                  <p className="text-lg font-black text-slate-950">
                    Sản phẩm bán chạy đang được cập nhật
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Những lựa chọn được yêu thích nhất sẽ sớm xuất hiện tại đây.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="container-page pb-16">
        <div className="overflow-hidden rounded-[32px] bg-gradient-to-r from-slate-950 to-slate-800 p-8 text-white md:p-10">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-300">
                Dynova Sport
              </p>

              <h2 className="mt-2 max-w-2xl text-3xl font-black tracking-[-0.03em]">
                Sẵn sàng nâng cấp phong cách thể thao của bạn?
              </h2>
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
