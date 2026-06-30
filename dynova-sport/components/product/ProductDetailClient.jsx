"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle,
  ChevronRight,
  Heart,
  Minus,
  PackageCheck,
  Plus,
  RotateCcw,
  Ruler,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
  User,
  Zap,
} from "lucide-react";

import { formatCurrency } from "@/data/shop";
import {
  addToCart,
  getWishlist,
  toggleWishlist,
} from "@/utils/shopStorage";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1000&auto=format&fit=crop&q=85";

function uniqueArray(list) {
  return Array.from(new Set(list.filter(Boolean)));
}

function getImage(product) {
  return (
    product?.image ||
    product?.image_url ||
    product?.imageUrl ||
    FALLBACK_IMAGE
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

function getBrandName(product) {
  if (typeof product?.brand === "string") return product.brand;

  return (
    product?.brand_data?.name ||
    product?.brandInfo?.name ||
    product?.brand?.name ||
    product?.brand_name ||
    "Dynova"
  );
}

function getGallery(product) {
  const images = [];

  if (Array.isArray(product?.gallery)) images.push(...product.gallery);
  if (Array.isArray(product?.images)) images.push(...product.images);

  images.push(getImage(product));

  if (Array.isArray(product?.variants)) {
    product.variants.forEach((variant) => {
      if (variant?.image) images.push(variant.image);
      if (variant?.image_url) images.push(variant.image_url);
    });
  }

  return uniqueArray(images);
}

function getProductReviews(product) {
  if (Array.isArray(product?.reviews) && product.reviews.length > 0) {
    return product.reviews.map((review) => ({
      id: review.id,
      name:
        review?.user?.fullName ||
        review?.user?.name ||
        review?.name ||
        "Khách hàng",
      rating: Number(review.rating || 5),
      content: review.content || review.comment || "Sản phẩm tốt.",
      created_at: review.created_at,
    }));
  }

  return [
    {
      id: 1,
      name: "Nguyễn Hoàng",
      rating: 5,
      content: "Sản phẩm đẹp, đóng gói chỉn chu và đúng size tư vấn.",
    },
    {
      id: 2,
      name: "Minh Anh",
      rating: 4,
      content: "Chất liệu tốt, giao nhanh. Mình sẽ mua thêm màu khác.",
    },
  ];
}

function buildCartProduct(product, selectedVariant, displayPrice) {
  return {
    ...product,
    id: product.id,
    name: product.name,
    image: selectedVariant?.image || getImage(product),
    price: Number(displayPrice || product.price || 0),
    oldPrice: product.oldPrice || product.compare_price,
    category: getCategoryName(product),
    brand: getBrandName(product),
    variantId: selectedVariant?.id || null,
    sku: selectedVariant?.sku || product.sku || "DNV-" + product.id,
  };
}

function RelatedCard({ product }) {
  return (
    <Link
      href={"/shop/product/" + product.id}
      className="group flex h-full flex-col overflow-hidden rounded-[26px] border border-slate-200 bg-white p-3 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl"
    >
      <div className="overflow-hidden rounded-[20px] bg-slate-100">
        <img
          src={getImage(product)}
          alt={product.name}
          className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col p-2 pt-4">
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-orange-500">
          {getCategoryName(product)}
        </p>

        <h3 className="mt-2 line-clamp-2 min-h-[44px] text-sm font-black leading-6 text-slate-950 transition group-hover:text-orange-600">
          {product.name}
        </h3>

        <div className="mt-auto pt-4">
          <p className="text-base font-black text-slate-950">
            {formatCurrency(product.price || 0)}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default function ProductDetailClient({
  product,
  relatedProducts = [],
}) {
  const router = useRouter();

  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const gallery = useMemo(() => getGallery(product), [product]);

  const colorOptions = useMemo(() => {
    const fromVariants = uniqueArray(variants.map((item) => item.color));
    const fromProduct = Array.isArray(product?.colors) ? product.colors : [];

    return uniqueArray([...fromVariants, ...fromProduct]).length > 0
      ? uniqueArray([...fromVariants, ...fromProduct])
      : ["Mặc định"];
  }, [variants, product]);

  const [mainImage, setMainImage] = useState(gallery[0] || FALLBACK_IMAGE);
  const [selectedColor, setSelectedColor] = useState(colorOptions[0]);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [notice, setNotice] = useState("");
  const [wishlist, setWishlist] = useState([]);
  const [reviews, setReviews] = useState(() => getProductReviews(product));
  const [reviewForm, setReviewForm] = useState({
    name: "",
    rating: 5,
    content: "",
  });

  const sizeOptions = useMemo(() => {
    const matchedVariants = variants.filter((variant) => {
      if (!selectedColor || selectedColor === "Mặc định") return true;

      return variant.color === selectedColor;
    });

    const fromVariants = uniqueArray(matchedVariants.map((item) => item.size));
    const fromProduct = Array.isArray(product?.sizes) ? product.sizes : [];

    const result = uniqueArray([...fromVariants, ...fromProduct]);

    return result.length > 0 ? result : ["Freesize"];
  }, [variants, product, selectedColor]);

  const selectedVariant = useMemo(() => {
    if (variants.length === 0) return null;

    const exact = variants.find((variant) => {
      const colorMatched =
        !selectedColor ||
        selectedColor === "Mặc định" ||
        variant.color === selectedColor;

      const sizeMatched =
        !selectedSize ||
        selectedSize === "Freesize" ||
        variant.size === selectedSize;

      return colorMatched && sizeMatched;
    });

    return exact || variants[0];
  }, [variants, selectedColor, selectedSize]);

  const displayPrice = Number(
    selectedVariant?.price || product?.price || 0
  );

  const comparePrice = Number(
    product?.oldPrice || product?.compare_price || 0
  );

  const stock = Number(
    selectedVariant?.stock ??
      product?.stock ??
      product?.quantity ??
      99
  );

  const sold = Number(product?.sold || 0);
  const rating = Number(product?.rating || 4.8);
  const liked = wishlist.includes(Number(product.id));

  useEffect(() => {
    setMainImage(gallery[0] || FALLBACK_IMAGE);
  }, [gallery]);

  useEffect(() => {
    if (!sizeOptions.includes(selectedSize)) {
      setSelectedSize(sizeOptions[0]);
    }
  }, [sizeOptions, selectedSize]);

  useEffect(() => {
    setWishlist(getWishlist().map(Number));
  }, []);

  useEffect(() => {
    if (quantity > stock && stock > 0) {
      setQuantity(stock);
    }
  }, [stock, quantity]);

  const showNotice = (text) => {
    setNotice(text);
    setTimeout(() => setNotice(""), 1900);
  };

  const increaseQuantity = () => {
    if (stock <= 0) return;

    setQuantity((prev) => Math.min(stock, prev + 1));
  };

  const decreaseQuantity = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleAdd = (buyNow = false) => {
    if (stock <= 0) {
      showNotice("Sản phẩm hiện đang hết hàng.");
      return;
    }

    const cartProduct = buildCartProduct(
      product,
      selectedVariant,
      displayPrice
    );

    addToCart(cartProduct, {
      size: selectedSize,
      color: selectedColor,
      quantity,
      variantId: selectedVariant?.id || null,
    });

    window.dispatchEvent(new Event("dynova:storage"));

    if (buyNow) {
      router.push("/checkout");
      return;
    }

    showNotice("Đã thêm sản phẩm vào giỏ hàng.");
  };

  const handleWishlist = () => {
    const next = toggleWishlist(product.id).map(Number);

    setWishlist(next);
    window.dispatchEvent(new Event("dynova:storage"));

    showNotice(
      next.includes(Number(product.id))
        ? "Đã thêm vào danh sách yêu thích."
        : "Đã bỏ khỏi danh sách yêu thích."
    );
  };

  const handleShare = async () => {
    const url = window.location.href;

    try {
      await navigator.clipboard.writeText(url);
      showNotice("Đã copy liên kết sản phẩm.");
    } catch {
      showNotice("Không thể copy liên kết.");
    }
  };

  const submitReview = (event) => {
    event.preventDefault();

    if (!reviewForm.name.trim() || !reviewForm.content.trim()) {
      showNotice("Vui lòng nhập đủ họ tên và nội dung đánh giá.");
      return;
    }

    setReviews([
      {
        id: Date.now(),
        name: reviewForm.name,
        rating: Number(reviewForm.rating),
        content: reviewForm.content,
      },
      ...reviews,
    ]);

    setReviewForm({
      name: "",
      rating: 5,
      content: "",
    });

    showNotice("Đã gửi đánh giá demo.");
  };

  return (
    <div className="min-h-screen bg-[#f7f8fb] pb-16">
      {notice && (
        <div className="product-float-in fixed right-5 top-24 z-[90] max-w-sm rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-2xl">
          {notice}
        </div>
      )}

      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0">
          <img
            src={getImage(product)}
            alt={product.name}
            className="h-full w-full object-cover opacity-20 blur-sm"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/95 to-slate-950/75" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(249,115,22,0.18),transparent_34%)]" />
        </div>

        <div className="container-page relative z-10 py-10 md:py-14">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-400">
            <Link href="/" className="transition hover:text-orange-300">
              Trang chủ
            </Link>
            <ChevronRight size={14} />
            <Link href="/shop" className="transition hover:text-orange-300">
              Sản phẩm
            </Link>
            <ChevronRight size={14} />
            <span className="line-clamp-1 text-orange-300">
              {product.name}
            </span>
          </div>

          <div className="mt-8 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-200 backdrop-blur">
              <Sparkles size={14} />
              {getBrandName(product)}
            </div>

            <h1 className="mt-4 text-4xl font-black uppercase leading-tight tracking-[-0.04em] md:text-5xl">
              {product.name}
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              {product.short_description ||
                "Sản phẩm thể thao chất lượng, phù hợp luyện tập, thi đấu và phong cách sống năng động."}
            </p>
          </div>
        </div>
      </section>

      <div className="container-page -mt-6 relative z-20">
        <Link
          href="/shop"
          className="mb-5 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 shadow-sm transition hover:-translate-x-1 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
        >
          <ArrowLeft size={16} />
          Quay lại cửa hàng
        </Link>

        <section className="product-detail-card grid gap-8 rounded-[34px] border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/70 lg:grid-cols-[1.05fr_0.95fr] lg:p-7">
          <div className="grid gap-4 lg:grid-cols-[92px_1fr]">
            <div className="order-2 flex gap-3 overflow-x-auto pb-1 lg:order-1 lg:flex-col lg:overflow-visible lg:pb-0">
              {gallery.map((image) => (
                <button
                  key={image}
                  onClick={() => setMainImage(image)}
                  className={
                    "h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 bg-slate-100 transition hover:-translate-y-0.5 lg:h-[86px] lg:w-[86px] " +
                    (mainImage === image
                      ? "border-orange-500 shadow-lg shadow-orange-500/15"
                      : "border-slate-200 hover:border-orange-200")
                  }
                  aria-label="Chọn ảnh sản phẩm"
                >
                  <img
                src={image}
                alt="Ảnh sản phẩm"
                onError={(e) => {
                    e.currentTarget.src =
                    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=80";
                }}
                className="h-full w-full object-cover"
                />
                </button>
              ))}
            </div>

            <div className="product-image-frame order-1 relative overflow-hidden rounded-[30px] bg-slate-100 lg:order-2">
            <img
                src={mainImage}
                alt={product.name}
                onError={(e) => {
                e.currentTarget.src =
                    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1000&auto=format&fit=crop&q=85";
                }}
                className="product-main-image absolute inset-0 h-full w-full object-cover"
            />
            </div>
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-500">
                    {getCategoryName(product)}
                  </p>

                  <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.03em] text-slate-950">
                    {product.name}
                  </h2>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleShare}
                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition hover:bg-orange-50 hover:text-orange-600"
                    aria-label="Chia sẻ"
                  >
                    <Share2 size={18} />
                  </button>

                  <button
                    onClick={handleWishlist}
                    className={
                      "flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm transition " +
                      (liked
                        ? "bg-rose-500 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-500")
                    }
                    aria-label="Yêu thích"
                  >
                    <Heart
                      size={19}
                      className={liked ? "fill-current" : ""}
                    />
                  </button>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3 text-sm font-bold text-slate-500">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1.5 text-amber-600">
                  <Star size={15} className="fill-current" />
                  {rating.toFixed(1)}
                </span>

                <span>Đã bán {sold}</span>

                <span>
                  SKU {selectedVariant?.sku || product.sku || "DNV-" + product.id}
                </span>
              </div>

              <div className="mt-6 rounded-[24px] bg-gradient-to-r from-orange-50 to-slate-50 p-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  Giá bán
                </p>

                <div className="mt-2 flex flex-wrap items-end gap-3">
                  <span className="text-3xl font-black text-orange-600 md:text-4xl">
                    {formatCurrency(displayPrice)}
                  </span>

                  {comparePrice > displayPrice && (
                    <span className="pb-1 text-sm font-bold text-slate-400 line-through">
                      {formatCurrency(comparePrice)}
                    </span>
                  )}
                </div>

                {comparePrice > displayPrice && (
                  <p className="mt-2 inline-flex rounded-full bg-orange-500 px-3 py-1 text-xs font-black text-white">
                    Tiết kiệm {formatCurrency(comparePrice - displayPrice)}
                  </p>
                )}
              </div>

              <div className="mt-6 space-y-5">
                <div>
                  <p className="mb-3 text-xs font-black uppercase tracking-wider text-slate-500">
                    Màu sắc:
                    <span className="ml-1 text-slate-950">
                      {selectedColor}
                    </span>
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {colorOptions.map((item) => (
                      <button
                        key={item}
                        onClick={() => setSelectedColor(item)}
                        className={
                          "rounded-2xl border px-4 py-2.5 text-sm font-black transition " +
                          (selectedColor === item
                            ? "border-orange-500 bg-orange-50 text-orange-600 shadow-sm"
                            : "border-slate-200 text-slate-600 hover:border-orange-200 hover:bg-orange-50")
                        }
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                      Kích thước
                    </p>

                    <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400">
                      <Ruler size={14} />
                      Bảng size
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {sizeOptions.map((item) => (
                      <button
                        key={item}
                        onClick={() => setSelectedSize(item)}
                        className={
                          "flex h-12 min-w-12 items-center justify-center rounded-2xl border px-4 text-sm font-black transition " +
                          (selectedSize === item
                            ? "border-slate-950 bg-slate-950 text-white shadow-lg shadow-slate-950/10"
                            : "border-slate-200 text-slate-700 hover:border-orange-500 hover:text-orange-600")
                        }
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 p-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                      Số lượng
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      Còn {stock} sản phẩm
                    </p>
                  </div>

                  <div className="flex items-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <button
                      onClick={decreaseQuantity}
                      className="p-3 text-slate-500 transition hover:bg-slate-50 hover:text-orange-600"
                      aria-label="Giảm số lượng"
                    >
                      <Minus size={15} />
                    </button>

                    <span className="w-12 text-center text-sm font-black text-slate-950">
                      {quantity}
                    </span>

                    <button
                      onClick={increaseQuantity}
                      className="p-3 text-slate-500 transition hover:bg-slate-50 hover:text-orange-600"
                      aria-label="Tăng số lượng"
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={() => handleAdd(true)}
                    className="btn-primary flex items-center justify-center gap-2 rounded-2xl px-5 py-4 text-xs font-black uppercase tracking-wider"
                  >
                    <Zap size={16} />
                    Mua ngay
                  </button>

                  <button
                    onClick={() => handleAdd(false)}
                    className="btn-ghost flex items-center justify-center gap-2 rounded-2xl px-5 py-4 text-xs font-black uppercase tracking-wider"
                  >
                    <ShoppingBag size={16} />
                    Thêm giỏ
                  </button>
                </div>

                <div className="grid gap-3 text-sm font-bold text-slate-600 sm:grid-cols-3">
                  <p className="flex items-center gap-2 rounded-2xl bg-slate-50 p-3">
                    <Truck size={16} className="text-orange-500" />
                    Giao nhanh
                  </p>

                  <p className="flex items-center gap-2 rounded-2xl bg-slate-50 p-3">
                    <ShieldCheck size={16} className="text-orange-500" />
                    Bảo mật
                  </p>

                  <p className="flex items-center gap-2 rounded-2xl bg-slate-50 p-3">
                    <RotateCcw size={16} className="text-orange-500" />
                    Đổi trả
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-4">
          {[
            {
              icon: BadgeCheck,
              title: "Cam kết chất lượng",
              text: "Thông tin sản phẩm rõ ràng, dễ kiểm tra.",
            },
            {
              icon: Truck,
              title: "Giao hàng nhanh",
              text: "Theo dõi trạng thái đơn hàng tiện lợi.",
            },
            {
              icon: ShieldCheck,
              title: "Thanh toán an toàn",
              text: "Hỗ trợ COD và chuyển khoản.",
            },
            {
              icon: PackageCheck,
              title: "Đóng gói chỉn chu",
              text: "Sản phẩm được kiểm tra trước khi giao.",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
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
        </section>

        <section className="mt-8 rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm md:p-8">
          <div className="mb-7 flex gap-3 overflow-x-auto border-b border-slate-200">
            {[
              { id: "description", label: "Mô tả" },
              { id: "specs", label: "Thông số" },
              { id: "reviews", label: "Đánh giá (" + reviews.length + ")" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={
                  "shrink-0 pb-4 text-sm font-black uppercase tracking-wider transition " +
                  (activeTab === tab.id
                    ? "border-b-2 border-orange-500 text-orange-600"
                    : "text-slate-400 hover:text-slate-700")
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "description" && (
            <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
              <div className="max-w-3xl space-y-4 text-sm leading-8 text-slate-600">
                <h2 className="text-2xl font-black text-slate-950">
                  Thông tin sản phẩm
                </h2>

                <p>
                  {product.description ||
                    product.short_description ||
                    "Sản phẩm được thiết kế cho nhu cầu tập luyện và sử dụng hằng ngày, mang lại cảm giác thoải mái, bền bỉ và hiện đại."}
                </p>

                <div className="grid gap-3 rounded-[26px] bg-slate-50 p-5 sm:grid-cols-3">
                  <p>
                    <b className="text-slate-950">Thương hiệu:</b>
                    <br />
                    {getBrandName(product)}
                  </p>

                  <p>
                    <b className="text-slate-950">Danh mục:</b>
                    <br />
                    {getCategoryName(product)}
                  </p>

                  <p>
                    <b className="text-slate-950">Tình trạng:</b>
                    <br />
                    {stock > 0 ? "Còn hàng" : "Hết hàng"}
                  </p>
                </div>
              </div>

              <div className="rounded-[28px] bg-slate-950 p-6 text-white">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-300">
                  Dynova Care
                </p>

                <h3 className="mt-3 text-xl font-black">
                  Tư vấn size và chọn sản phẩm
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-300">
                  Khách hàng có thể xem thông tin size, màu sắc, giá bán và tồn
                  kho trước khi thêm vào giỏ hàng.
                </p>

                <div className="mt-5 grid gap-3 text-sm font-bold text-slate-300">
                  <p className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-orange-400" />
                    Chọn đúng biến thể
                  </p>

                  <p className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-orange-400" />
                    Kiểm tra tồn kho
                  </p>

                  <p className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-orange-400" />
                    Thêm giỏ nhanh
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "specs" && (
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["Mã sản phẩm", selectedVariant?.sku || product.sku || "DNV-" + product.id],
                ["Thương hiệu", getBrandName(product)],
                ["Danh mục", getCategoryName(product)],
                ["Giá hiện tại", formatCurrency(displayPrice)],
                ["Giá gốc", comparePrice ? formatCurrency(comparePrice) : "Không có"],
                ["Màu đang chọn", selectedColor],
                ["Size đang chọn", selectedSize],
                ["Tồn kho", stock + " sản phẩm"],
                ["Đã bán", sold + " sản phẩm"],
                ["Trạng thái", stock > 0 ? "Còn hàng" : "Hết hàng"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4"
                >
                  <span className="text-sm font-bold text-slate-500">
                    {label}
                  </span>

                  <span className="text-right text-sm font-black text-slate-950">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
              <form
                onSubmit={submitReview}
                className="rounded-[28px] bg-slate-50 p-5"
              >
                <h3 className="text-lg font-black text-slate-950">
                  Gửi đánh giá
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Phần này đang là đánh giá demo phía frontend. Sau này có thể
                  nối API POST review.
                </p>

                <input
                  value={reviewForm.name}
                  onChange={(e) =>
                    setReviewForm({
                      ...reviewForm,
                      name: e.target.value,
                    })
                  }
                  className="input-control mt-4"
                  placeholder="Họ tên"
                />

                <select
                  value={reviewForm.rating}
                  onChange={(e) =>
                    setReviewForm({
                      ...reviewForm,
                      rating: Number(e.target.value),
                    })
                  }
                  className="input-control mt-3"
                >
                  <option value="5">5 sao</option>
                  <option value="4">4 sao</option>
                  <option value="3">3 sao</option>
                  <option value="2">2 sao</option>
                  <option value="1">1 sao</option>
                </select>

                <textarea
                  value={reviewForm.content}
                  onChange={(e) =>
                    setReviewForm({
                      ...reviewForm,
                      content: e.target.value,
                    })
                  }
                  className="input-control mt-3 min-h-28"
                  placeholder="Nội dung đánh giá"
                />

                <button className="btn-primary mt-3 w-full rounded-2xl py-3 text-xs font-black uppercase tracking-wider">
                  Gửi đánh giá
                </button>
              </form>

              <div className="space-y-3">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-[24px] border border-slate-200 bg-white p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="flex items-center gap-3 font-black text-slate-950">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-orange-600">
                          <User size={16} />
                        </span>

                        {review.name}
                      </p>

                      <p className="text-sm font-black text-amber-500">
                        {review.rating} sao
                      </p>
                    </div>

                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {review.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {relatedProducts.length > 0 && (
          <section className="mt-12">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-500">
                  Gợi ý thêm
                </p>

                <h2 className="mt-2 text-3xl font-black tracking-[-0.03em] text-slate-950">
                  Sản phẩm liên quan
                </h2>
              </div>

              <Link
                href="/shop"
                className="hidden rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 sm:inline-flex"
              >
                Xem tất cả
              </Link>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.slice(0, 4).map((item) => (
                <RelatedCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}