"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  CheckCircle,
  ChevronRight,
  Heart,
  Loader2,
  Minus,
  PackageCheck,
  Plus,
  RotateCcw,
  Scale,
  Ruler,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
  Zap,
} from "lucide-react";

import { formatCurrency } from "@/data/shop";
import { addToCart } from "@/utils/shopStorage";
import { getProductImage, PRODUCT_FALLBACK } from "@/utils/imageUrl";
import {
  checkWishlistItem,
  toggleWishlistApi,
} from "@/services/wishlist.service";
import ProductReviews from "@/components/reviews/ProductReviews";
import { getAuthToken } from "@/services/auth.service";
import { addCompareId } from "@/utils/compareStorage";

const API_HOST = (
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"
).replace(/\/api\/?$/, "");

const FALLBACK_IMAGE =
  PRODUCT_FALLBACK ||
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1000&auto=format&fit=crop&q=85";

const SHOP_NAVIGATION_KEY = "dynova_shop_navigation_v2";
const BUY_NOW_KEY = "dynova_buy_now_v1";
const SHOP_RETURN_WINDOW = 30 * 60 * 1000;

function getSafeShopReturnUrl(value) {
  const path = String(value || "").trim();

  if (
    path === "/shop" ||
    (
      path.startsWith("/shop?") &&
      !path.startsWith("//") &&
      !path.includes("\\")
    )
  ) {
    return path;
  }

  return "/shop";
}

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

function normalizeImage(image) {
  const raw = String(image || "").trim();

  if (!raw || raw === "null" || raw === "undefined") {
    return FALLBACK_IMAGE;
  }

  if (
    raw.startsWith("http://") ||
    raw.startsWith("https://") ||
    raw.startsWith("data:") ||
    raw.startsWith("blob:")
  ) {
    return raw;
  }

  const clean = raw.replace(/\\/g, "/");

  if (clean.startsWith("/storage/")) {
    return API_HOST + encodePath(clean);
  }

  if (clean.startsWith("storage/")) {
    return API_HOST + "/" + encodePath(clean);
  }

  if (clean.startsWith("products/")) {
    return API_HOST + "/storage/" + encodePath(clean);
  }

  if (clean.startsWith("/products/")) {
    return API_HOST + "/storage" + encodePath(clean);
  }

  if (clean.startsWith("/")) {
    return clean;
  }

  return API_HOST + "/storage/products/" + encodePath(clean);
}

function getCategoryName(product) {
  if (typeof product?.category === "string") {
    return product.category;
  }

  return (
    product?.category?.name ||
    product?.category_data?.name ||
    product?.category_name ||
    product?.categoryName ||
    ""
  );
}

function getBrandName(product) {
  if (typeof product?.brand === "string") {
    return product.brand;
  }

  return (
    product?.brand?.name ||
    product?.brand_data?.name ||
    product?.brandInfo?.name ||
    product?.brand_name ||
    product?.brandName ||
    ""
  );
}

function getProductImageSafe(product) {
  const raw =
    product?.image_url ||
    product?.image ||
    product?.thumbnail ||
    product?.photo ||
    product?.images?.[0]?.url ||
    product?.images?.[0] ||
    "";

  if (raw) return normalizeImage(raw);

  return getProductImage(product) || FALLBACK_IMAGE;
}

function getRawVariants(product) {
  const variants =
    product?.variants ||
    product?.product_variants ||
    product?.productVariants ||
    product?.variant_list ||
    product?.variantList ||
    [];

  return Array.isArray(variants) ? variants : [];
}

function normalizeVariant(variant) {
  const sizeObject =
    variant?.size && typeof variant.size === "object"
      ? variant.size
      : null;

  const colorObject =
    variant?.color && typeof variant.color === "object"
      ? variant.color
      : null;

  const sizeName =
    sizeObject?.name ||
    variant?.size_name ||
    variant?.sizeName ||
    (typeof variant?.size === "string" ? variant.size : "") ||
    "";

  const colorName =
    colorObject?.name ||
    variant?.color_name ||
    variant?.colorName ||
    (typeof variant?.color === "string" ? variant.color : "") ||
    "";

  const discountPrice =
    variant?.discount_price !== null &&
    variant?.discount_price !== undefined &&
    variant?.discount_price !== ""
      ? Number(variant.discount_price)
      : null;

  const isActive =
    variant?.is_active !== undefined
      ? Boolean(Number(variant.is_active))
      : variant?.active !== undefined
        ? Boolean(variant.active)
        : true;

  return {
    ...variant,
    id: variant?.id || variant?.variant_id || variant?.variantId || null,

    size_id:
      variant?.size_id ||
      variant?.sizeId ||
      sizeObject?.id ||
      null,

    size_name: sizeName,
    size_type:
      sizeObject?.type ||
      variant?.size_type ||
      "",

    color_id:
      variant?.color_id ||
      variant?.colorId ||
      colorObject?.id ||
      null,

    color_name: colorName,
    color_code:
      colorObject?.code ||
      variant?.color_code ||
      variant?.colorCode ||
      "",

    color_hex:
      colorObject?.hex ||
      variant?.color_hex ||
      variant?.colorHex ||
      "",

    sku: variant?.sku || "",
    price: Number(variant?.price || 0),
    discount_price: discountPrice,
    stock: Number(
      variant?.stock ??
        variant?.quantity ??
        variant?.qty ??
        0
    ),
    image:
      variant?.image_url ||
      variant?.image ||
      variant?.thumbnail ||
      variant?.photo ||
      "",
    is_active: isActive,
  };
}

function getVariantFinalPrice(variant) {
  const price = Number(variant?.price || 0);
  const discountPrice = Number(variant?.discount_price || 0);

  if (
    discountPrice > 0 &&
    price > 0 &&
    discountPrice < price
  ) {
    return discountPrice;
  }

  return price;
}

function uniqueBy(list, getKey) {
  const map = new Map();

  list.forEach((item) => {
    const key = getKey(item);

    if (
      key !== undefined &&
      key !== null &&
      key !== "" &&
      !map.has(String(key))
    ) {
      map.set(String(key), item);
    }
  });

  return Array.from(map.values());
}

function getGallery(product, variants) {
  const images = [];

  if (Array.isArray(product?.gallery)) {
    product.gallery.forEach((item) => {
      const raw =
        typeof item === "string"
          ? item
          : item?.url ||
            item?.image ||
            item?.image_url ||
            "";

      if (raw) images.push(normalizeImage(raw));
    });
  }

  if (Array.isArray(product?.images)) {
    product.images.forEach((item) => {
      const raw =
        typeof item === "string"
          ? item
          : item?.url ||
            item?.image ||
            item?.image_url ||
            "";

      if (raw) images.push(normalizeImage(raw));
    });
  }

  images.push(getProductImageSafe(product));

  variants.forEach((variant) => {
    if (variant.image) {
      images.push(normalizeImage(variant.image));
    }
  });

  return Array.from(new Set(images.filter(Boolean)));
}

function getProductDisplayPrice(product, variants) {
  const prices = variants
    .filter((variant) => variant.is_active)
    .map(getVariantFinalPrice)
    .filter((price) => price > 0);

  if (prices.length > 0) {
    return Math.min(...prices);
  }

  return Number(product?.price || 0);
}

function getProductOriginalPrice(product, variants) {
  const discountedVariants = variants.filter((variant) => {
    const price = Number(variant.price || 0);
    const discountPrice = Number(variant.discount_price || 0);

    return (
      price > 0 &&
      discountPrice > 0 &&
      discountPrice < price
    );
  });

  if (discountedVariants.length > 0) {
    discountedVariants.sort(
      (a, b) =>
        getVariantFinalPrice(a) -
        getVariantFinalPrice(b)
    );

    return Number(discountedVariants[0].price || 0);
  }

  return null;
}

function getProductRating(product) {
  const rating = Number(
    product?.average_rating ||
      product?.rating_average ||
      product?.rating ||
      0
  );

  return Number.isFinite(rating) ? rating : 0;
}

function getProductReviewCount(product) {
  const count = Number(
    product?.reviews_count ||
      product?.review_count ||
      product?.total_reviews ||
      0
  );

  return Number.isFinite(count) ? count : 0;
}

function buildCartProduct({
  product,
  selectedVariant,
  selectedImage,
  displayPrice,
}) {
  const sizeName = selectedVariant?.size_name || "";
  const colorName = selectedVariant?.color_name || "";
  const variantId = selectedVariant?.id || null;

  return {
    ...product,

    key: [
      product?.id,
      variantId || "default",
      selectedVariant?.size_id || "no-size",
      selectedVariant?.color_id || "no-color",
    ].join("-"),

    id: product?.id,
    product_id: product?.id,

    name:
      product?.name ||
      product?.product_name ||
      "Sản phẩm",

    product_name:
      product?.name ||
      product?.product_name ||
      "Sản phẩm",

    image: selectedImage,
    product_image: getProductImageSafe(product),
    variant_image: selectedVariant?.image
      ? normalizeImage(selectedVariant.image)
      : "",

    price: Number(displayPrice || 0),
    sale_price: Number(displayPrice || 0),

    category: getCategoryName(product),
    category_id:
      product?.category_id ||
      product?.category?.id ||
      null,

    brand: getBrandName(product),
    brand_id:
      product?.brand_id ||
      product?.brand?.id ||
      null,

    variantId,
    variant_id: variantId,
    product_variant_id: variantId,

    size_id: selectedVariant?.size_id || null,
    color_id: selectedVariant?.color_id || null,

    size: sizeName,
    color: colorName,

    size_name: sizeName,
    color_name: colorName,

    sku:
      selectedVariant?.sku ||
      product?.sku ||
      `DNV-${product?.id}`,
  };
}

function RelatedCard({ product, returnUrl }) {
  const variants = useMemo(
    () =>
      getRawVariants(product)
        .map(normalizeVariant)
        .filter((variant) => variant.is_active),
    [product]
  );

  const price = getProductDisplayPrice(product, variants);
  const brandName = getBrandName(product);

  return (
    <Link
      href={`/shop/product/${product.id}?from=${encodeURIComponent(
        returnUrl
      )}`}
      className="group flex h-full flex-col overflow-hidden rounded-[26px] border border-slate-200 bg-white p-3 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl"
    >
      <div className="overflow-hidden rounded-[20px] bg-slate-100">
        <img
          src={getProductImageSafe(product)}
          alt={product.name}
          onError={(event) => {
            event.currentTarget.src = FALLBACK_IMAGE;
          }}
          className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col p-2 pt-4">
        {brandName && (
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-orange-500">
            {brandName}
          </p>
        )}

        <h3 className="mt-2 line-clamp-2 min-h-[44px] text-sm font-black leading-6 text-slate-950 transition group-hover:text-orange-600">
          {product.name}
        </h3>

        <div className="mt-auto pt-4">
          <p className="text-base font-black text-slate-950">
            {formatCurrency(price)}
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
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const shopReturnUrl = useMemo(
    () => getSafeShopReturnUrl(searchParams.get("from")),
    [searchParams]
  );

  const returnToShop = () => {
    if (typeof window === "undefined") {
      router.replace(shopReturnUrl);
      return;
    }

    let navigation = null;

    try {
      const raw = sessionStorage.getItem(SHOP_NAVIGATION_KEY);
      navigation = raw ? JSON.parse(raw) : null;
    } catch {
      sessionStorage.removeItem(SHOP_NAVIGATION_KEY);
    }

    const cameDirectlyFromShop =
      navigation?.from === shopReturnUrl &&
      String(navigation?.productId || "") === String(product?.id || "") &&
      Date.now() - Number(navigation?.savedAt || 0) <
        SHOP_RETURN_WINDOW &&
      window.history.length > 1;

    if (cameDirectlyFromShop) {
      router.back();
      return;
    }

    router.replace(shopReturnUrl, {
      scroll: false,
    });
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    let navigation = null;

    try {
      const raw = sessionStorage.getItem(SHOP_NAVIGATION_KEY);
      navigation = raw ? JSON.parse(raw) : null;
    } catch {
      sessionStorage.removeItem(SHOP_NAVIGATION_KEY);
    }

    if (
      navigation?.from === shopReturnUrl &&
      String(navigation?.productId || "") === String(product?.id || "")
    ) {
      sessionStorage.setItem(
        SHOP_NAVIGATION_KEY,
        JSON.stringify({
          ...navigation,
          currentPath: pathname,
          savedAt: Number(navigation.savedAt || Date.now()),
        })
      );
    }
  }, [pathname, product?.id, shopReturnUrl]);

  const variants = useMemo(() => {
    return getRawVariants(product)
      .map(normalizeVariant)
      .filter((variant) => variant.id && variant.is_active);
  }, [product]);

  const firstVariant = useMemo(() => {
    return (
      variants.find((variant) => variant.stock > 0) ||
      variants[0] ||
      null
    );
  }, [variants]);

  const colorOptions = useMemo(() => {
    return uniqueBy(
      variants
        .filter((variant) => variant.color_id)
        .map((variant) => ({
          id: variant.color_id,
          name: variant.color_name || "Mặc định",
          code: variant.color_code || "",
          hex: variant.color_hex || "",
          image: variant.image || "",
        })),
      (item) => item.id
    );
  }, [variants]);

  const allSizeOptions = useMemo(() => {
    return uniqueBy(
      variants
        .filter((variant) => variant.size_id)
        .map((variant) => ({
          id: variant.size_id,
          name: variant.size_name || "Freesize",
          type: variant.size_type || "",
        })),
      (item) => item.id
    );
  }, [variants]);

  const gallery = useMemo(
    () => getGallery(product, variants),
    [product, variants]
  );

  const [selectedColorId, setSelectedColorId] = useState(
    firstVariant?.color_id
      ? String(firstVariant.color_id)
      : ""
  );

  const [selectedSizeId, setSelectedSizeId] = useState(
    variants.length === 1 && firstVariant?.size_id
      ? String(firstVariant.size_id)
      : ""
  );

  const [mainImage, setMainImage] = useState(
    gallery[0] || FALLBACK_IMAGE
  );

  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [notice, setNotice] = useState("");
  const [liked, setLiked] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  useEffect(() => {
    if (!firstVariant) {
      setSelectedColorId("");
      setSelectedSizeId("");
      setQuantity(1);
      return;
    }

    setSelectedColorId(
      firstVariant.color_id
        ? String(firstVariant.color_id)
        : ""
    );

    setSelectedSizeId(
      variants.length === 1 && firstVariant.size_id
        ? String(firstVariant.size_id)
        : ""
    );

    setQuantity(1);
  }, [firstVariant?.id, variants.length]);

  useEffect(() => {
    setMainImage(gallery[0] || FALLBACK_IMAGE);
  }, [gallery]);

  const variantsForSelectedColor = useMemo(() => {
    if (!selectedColorId) return variants;

    return variants.filter(
      (variant) =>
        String(variant.color_id) ===
        String(selectedColorId)
    );
  }, [variants, selectedColorId]);

  const sizeOptions = useMemo(() => {
    if (!selectedColorId) {
      return allSizeOptions;
    }

    return uniqueBy(
      variantsForSelectedColor
        .filter((variant) => variant.size_id)
        .map((variant) => ({
          id: variant.size_id,
          name: variant.size_name || "Freesize",
          type: variant.size_type || "",
        })),
      (item) => item.id
    );
  }, [
    allSizeOptions,
    selectedColorId,
    variantsForSelectedColor,
  ]);

  const productHasColors = colorOptions.length > 0;
  const productHasSizes = allSizeOptions.length > 0;

  const hasRequiredSelection =
    (!productHasColors || Boolean(selectedColorId)) &&
    (!productHasSizes || Boolean(selectedSizeId));

  const selectedVariant = useMemo(() => {
    if (variants.length === 0 || !hasRequiredSelection) {
      return null;
    }

    return (
      variants.find((variant) => {
        const colorMatched =
          !productHasColors ||
          String(variant.color_id) ===
            String(selectedColorId);

        const sizeMatched =
          !productHasSizes ||
          String(variant.size_id) ===
            String(selectedSizeId);

        return colorMatched && sizeMatched;
      }) || null
    );
  }, [
    variants,
    hasRequiredSelection,
    productHasColors,
    productHasSizes,
    selectedColorId,
    selectedSizeId,
  ]);

  useEffect(() => {
    if (selectedVariant?.image) {
      setMainImage(
        normalizeImage(selectedVariant.image)
      );
    }
  }, [selectedVariant?.id]);

  const selectedColor = useMemo(() => {
    return (
      colorOptions.find(
        (item) =>
          String(item.id) === String(selectedColorId)
      ) || null
    );
  }, [colorOptions, selectedColorId]);

  const selectedSize = useMemo(() => {
    return (
      sizeOptions.find(
        (item) =>
          String(item.id) === String(selectedSizeId)
      ) || null
    );
  }, [sizeOptions, selectedSizeId]);

  const displayPrice = selectedVariant
    ? getVariantFinalPrice(selectedVariant)
    : getProductDisplayPrice(product, variants);

  const originalPrice =
    selectedVariant &&
    Number(selectedVariant.discount_price || 0) > 0 &&
    Number(selectedVariant.discount_price) <
      Number(selectedVariant.price || 0)
      ? Number(selectedVariant.price)
      : getProductOriginalPrice(product, variants);

  const stock = selectedVariant
    ? Number(selectedVariant.stock || 0)
    : variants.length === 0
      ? Number(
          product?.stock ??
            product?.total_stock ??
            product?.quantity ??
            0
        )
      : 0;

  const hasCompletedVariant =
    variants.length === 0 || Boolean(selectedVariant);

  const canPurchase =
    hasCompletedVariant && stock > 0;

  const productRating = getProductRating(product);
  const reviewCount = getProductReviewCount(product);
  const brandName = getBrandName(product);
  const categoryName = getCategoryName(product);

  useEffect(() => {
    if (stock > 0 && quantity > stock) {
      setQuantity(stock);
    }

    if (stock <= 0 && quantity !== 1) {
      setQuantity(1);
    }
  }, [stock, quantity]);

  useEffect(() => {
    async function loadWishlistStatus() {
      if (!product?.id || !getAuthToken()) {
        setLiked(false);
        return;
      }

      try {
        const result = await checkWishlistItem(product.id);
        setLiked(Boolean(result?.wishlisted));
      } catch {
        setLiked(false);
      }
    }

    loadWishlistStatus();
  }, [product?.id]);

  const showNotice = (text) => {
    setNotice(text);
    setTimeout(() => setNotice(""), 1900);
  };

  const handleColorChange = (colorId) => {
    const colorVariants = variants.filter(
      (variant) =>
        String(variant.color_id) === String(colorId)
    );

    const previewVariant =
      colorVariants.find(
        (variant) => Number(variant.stock || 0) > 0
      ) ||
      colorVariants[0] ||
      null;

    setSelectedColorId(String(colorId));

    setSelectedSizeId(
      productHasSizes ? "" : selectedSizeId
    );

    if (previewVariant?.image) {
      setMainImage(normalizeImage(previewVariant.image));
    }

    setQuantity(1);
  };

  const handleSizeChange = (sizeId) => {
    setSelectedSizeId(String(sizeId));
    setQuantity(1);
  };

  const isSizeAvailable = (sizeId) => {
    return variantsForSelectedColor.some(
      (variant) =>
        String(variant.size_id) === String(sizeId) &&
        Number(variant.stock) > 0
    );
  };

  const increaseQuantity = () => {
    if (stock <= 0) return;

    setQuantity((previous) =>
      Math.min(stock, previous + 1)
    );
  };

  const decreaseQuantity = () => {
    setQuantity((previous) =>
      Math.max(1, previous - 1)
    );
  };

  const handleAdd = (buyNow = false) => {
    if (!product?.id) {
      showNotice("Không tìm thấy sản phẩm.");
      return;
    }

    if (productHasColors && !selectedColorId) {
      showNotice("Vui lòng chọn màu sắc.");
      return;
    }

    if (productHasSizes && !selectedSizeId) {
      showNotice("Vui lòng chọn kích thước.");
      return;
    }

    if (variants.length > 0 && !selectedVariant) {
      showNotice("Phân loại đã chọn không tồn tại.");
      return;
    }

    if (stock <= 0) {
      showNotice("Biến thể này hiện đang hết hàng.");
      return;
    }

    const cartProduct = buildCartProduct({
      product,
      selectedVariant,
      selectedImage: mainImage,
      displayPrice,
    });

    if (buyNow) {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          BUY_NOW_KEY,
          JSON.stringify({
            item: {
              ...cartProduct,
              quantity,
              qty: quantity,
            },
            createdAt: Date.now(),
          })
        );
      }

      router.push("/checkout?mode=buy-now");
      return;
    }

    addToCart(cartProduct, {
      quantity,
      size: cartProduct.size,
      color: cartProduct.color,
      variantId: cartProduct.variant_id,
      variant_id: cartProduct.variant_id,
      product_variant_id:
        cartProduct.product_variant_id,
    });

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new Event("dynova:storage")
      );
      window.dispatchEvent(
        new Event("dynova:cart")
      );
    }

    showNotice("Đã thêm đúng biến thể vào giỏ hàng.");
  };

  const handleWishlist = async () => {
    if (!product?.id) return;

    try {
      setWishlistLoading(true);

      const result = await toggleWishlistApi(product.id);
      setLiked(Boolean(result?.wishlisted));

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new Event("dynova:wishlist")
        );
        window.dispatchEvent(
          new Event("dynova:storage")
        );
      }

      showNotice(
        result?.wishlisted
          ? "Đã thêm vào danh sách yêu thích."
          : "Đã bỏ khỏi danh sách yêu thích."
      );
    } catch (error) {
      if (error?.status === 401) {
        router.push(
          `/login?redirect=/shop/product/${product.id}`
        );
        return;
      }

      showNotice(
        error?.message ||
          "Không thể cập nhật yêu thích."
      );
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: product?.name,
          text: product?.short_description || "",
          url,
        });

        return;
      }

      await navigator.clipboard.writeText(url);
      showNotice("Đã sao chép liên kết sản phẩm.");
    } catch (error) {
      if (error?.name !== "AbortError") {
        showNotice("Không thể chia sẻ sản phẩm.");
      }
    }
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
            src={getProductImageSafe(product)}
            alt={product.name}
            onError={(event) => {
              event.currentTarget.src =
                FALLBACK_IMAGE;
            }}
            className="h-full w-full object-cover opacity-20 blur-sm"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/95 to-slate-950/75" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(249,115,22,0.18),transparent_34%)]" />
        </div>

<<<<<<< HEAD
        <div className="container-page relative z-10 py-10 md:py-14">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-400">
            <Link
              href="/"
              className="transition hover:text-orange-300"
            >
              Trang chủ
            </Link>

            <ChevronRight size={14} />

            <button
              type="button"
              onClick={returnToShop}
              className="transition hover:text-orange-300"
            >
              Sản phẩm
            </button>

            <ChevronRight size={14} />

            <span className="line-clamp-1 text-orange-300">
              {product.name}
            </span>
          </div>

          <div className="mt-8 max-w-3xl">
            {brandName && (
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-200 backdrop-blur">
                <Sparkles size={14} />
                {brandName}
              </div>
            )}

            <h1 className="mt-4 text-4xl font-black uppercase leading-tight tracking-[-0.04em] md:text-5xl">
              {product.name}
            </h1>

            {product.short_description && (
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
                {product.short_description}
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="container-page relative z-20 -mt-6">
        <button
          type="button"
          onClick={returnToShop}
          className="mb-5 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 shadow-sm transition hover:-translate-x-1 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
        >
          <ArrowLeft size={16} />
          Quay lại cửa hàng
        </button>

        <section className="product-detail-card grid gap-8 rounded-[34px] border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/70 lg:grid-cols-[1.05fr_0.95fr] lg:p-7">
          <div className="grid gap-4 lg:grid-cols-[92px_1fr]">
            <div className="order-2 flex gap-3 overflow-x-auto pb-1 lg:order-1 lg:flex-col lg:overflow-visible lg:pb-0">
              {gallery.map((image) => (
                <button
                  key={image}
                  type="button"
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
                    onError={(event) => {
                      event.currentTarget.src =
                        FALLBACK_IMAGE;
                    }}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
=======
        <div className="mt-8 max-w-3xl">
          {brandName && (
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-200 backdrop-blur">
              <Sparkles size={14} />
              {brandName}
            </div>
          )}

          <h1 className="mt-4 text-4xl font-black uppercase leading-tight tracking-[-0.04em] md:text-5xl">
            {product?.name}
          </h1>
          {product?.short_description && (
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              {product.short_description}
            </p>
          )}

        </div>
      </div>
    </section>
    {/* MAIN CONTENT SECTION */}
    <div className="container-page relative z-20 -mt-6">
      <Link
        href="/shop"
        className="mb-5 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 shadow-sm transition hover:-translate-x-1 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
      >
        <ArrowLeft size={16} />
        Quay lại cửa hàng
      </Link>
>>>>>>> việt

            <div className="product-image-frame order-1 relative min-h-[480px] overflow-hidden rounded-[30px] bg-slate-100 lg:order-2">
              <img
                src={mainImage}
                alt={product.name}
                onError={(event) => {
                  event.currentTarget.src =
                    FALLBACK_IMAGE;
                }}
                className="product-main-image absolute inset-0 h-full w-full object-cover"
              />
            </div>
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  {categoryName && (
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-500">
                      {categoryName}
                    </p>
                  )}

                  <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.03em] text-slate-950">
                    {product.name}
                  </h2>

                  {brandName && (
                    <p className="mt-2 text-sm font-bold text-slate-500">
                      Thương hiệu:{" "}
                      <span className="font-black text-slate-950">
                        {brandName}
                      </span>
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleShare}
                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition hover:bg-orange-50 hover:text-orange-600"
                    aria-label="Chia sẻ"
                  >
                    <Share2 size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => { addCompareId(product.id); router.push("/compare"); }}
                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 shadow-sm transition hover:bg-orange-50 hover:text-orange-500"
                    aria-label="So sánh"
                  >
                    <Scale size={19} />
                  </button>

                  <button
                    type="button"
                    onClick={handleWishlist}
                    disabled={wishlistLoading}
                    className={
                      "flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm transition disabled:cursor-not-allowed disabled:opacity-70 " +
                      (liked
                        ? "bg-orange-500 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-orange-50 hover:text-orange-500")
                    }
                    aria-label="Yêu thích"
                  >
                    {wishlistLoading ? (
                      <Loader2
                        size={19}
                        className="animate-spin"
                      />
                    ) : (
                      <Heart
                        size={19}
                        className={
                          liked ? "fill-current" : ""
                        }
                      />
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3 text-sm font-bold text-slate-500">
                {productRating > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1.5 text-amber-600">
                    <Star
                      size={15}
                      className="fill-current"
                    />
                    {productRating.toFixed(1)}
                  </span>
                )}

                <button
                  type="button"
                  onClick={() =>
                    setActiveTab("reviews")
                  }
                  className="transition hover:text-orange-600"
                >
                  {reviewCount > 0
                    ? `${reviewCount} đánh giá`
                    : "Chưa có đánh giá"}
                </button>

                <span>
                  SKU{" "}
                  {selectedVariant?.sku ||
                    product?.sku ||
                    `DNV-${product.id}`}
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

                  {originalPrice &&
                    Number(originalPrice) >
                      Number(displayPrice) && (
                      <span className="pb-1 text-sm font-bold text-slate-400 line-through">
                        {formatCurrency(originalPrice)}
                      </span>
                    )}
                </div>

                {originalPrice &&
                  Number(originalPrice) >
                    Number(displayPrice) && (
                    <p className="mt-2 inline-flex rounded-full bg-orange-500 px-3 py-1 text-xs font-black text-white">
                      Tiết kiệm{" "}
                      {formatCurrency(
                        Number(originalPrice) -
                          Number(displayPrice)
                      )}
                    </p>
                  )}
              </div>

              <div className="mt-6 space-y-5">
                {colorOptions.length > 0 && (
                  <div>
                    <p className="mb-3 text-xs font-black uppercase tracking-wider text-slate-500">
                      Màu sắc:
                      <span className="ml-1 text-slate-950">
                        {selectedColor?.name || "Chọn màu"}
                      </span>
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {colorOptions.map((color) => {
                        const active =
                          String(selectedColorId) ===
                          String(color.id);

                        return (
                          <button
                            key={color.id}
                            type="button"
                            onClick={() =>
                              handleColorChange(color.id)
                            }
                            className={
                              "flex min-h-12 items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-black transition " +
                              (active
                                ? "border-orange-500 bg-orange-50 text-orange-600 shadow-sm ring-4 ring-orange-500/10"
                                : "border-slate-200 text-slate-600 hover:border-orange-200 hover:bg-orange-50")
                            }
                          >
                            <span
                              className="h-5 w-5 rounded-full border border-slate-300 shadow-inner"
                              style={{
                                backgroundColor:
                                  color.hex || "#e2e8f0",
                              }}
                            />

                            {color.name}

                            {active && <Check size={15} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {sizeOptions.length > 0 && (
                  <div>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                        Kích thước:
                        <span className="ml-1 text-slate-950">
                          {selectedSize?.name ||
                            "Chọn size"}
                        </span>
                      </p>

                      <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400">
                        <Ruler size={14} />
                        Chọn size phù hợp
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {sizeOptions.map((size) => {
                        const active =
                          String(selectedSizeId) ===
                          String(size.id);

                        const available =
                          isSizeAvailable(size.id);

                        return (
                          <button
                            key={size.id}
                            type="button"
                            disabled={!available}
                            onClick={() =>
                              handleSizeChange(size.id)
                            }
                            className={
                              "flex h-12 min-w-12 items-center justify-center rounded-2xl border px-4 text-sm font-black transition " +
                              (active
                                ? "border-slate-950 bg-slate-950 text-white shadow-lg shadow-slate-950/10"
                                : available
                                  ? "border-slate-200 text-slate-700 hover:border-orange-500 hover:text-orange-600"
                                  : "cursor-not-allowed border-slate-100 bg-slate-100 text-slate-300 line-through")
                            }
                          >
                            {size.name}
                          </button>
                        );
                      })}
                    </div>

                    {productHasSizes && !selectedSizeId && (
                      <p className="mt-3 text-xs font-bold text-orange-600">
                        Vui lòng chọn kích thước trước khi mua.
                      </p>
                    )}

                    {selectedVariant && (
                      <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                        <p className="text-xs font-black uppercase tracking-wider text-emerald-700">
                          Phân loại đã chọn
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-700">
                          {selectedColor?.name || "Mặc định"}
                          {productHasSizes
                            ? ` / ${selectedSize?.name || ""}`
                            : ""}
                          {` · Còn ${stock} sản phẩm`}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 p-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                      Số lượng
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      {!hasCompletedVariant
                        ? "Chọn phân loại để xem tồn kho"
                        : stock > 0
                          ? `Còn ${stock} sản phẩm`
                          : "Biến thể đã hết hàng"}
                    </p>
                  </div>

                  <div className="flex items-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <button
                      type="button"
                      onClick={decreaseQuantity}
                      disabled={!canPurchase}
                      className="p-3 text-slate-500 transition hover:bg-slate-50 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Giảm số lượng"
                    >
                      <Minus size={15} />
                    </button>

                    <span className="w-12 text-center text-sm font-black text-slate-950">
                      {quantity}
                    </span>

                    <button
                      type="button"
                      onClick={increaseQuantity}
                      disabled={!canPurchase}
                      className="p-3 text-slate-500 transition hover:bg-slate-50 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Tăng số lượng"
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => handleAdd(true)}
                    disabled={!canPurchase}
                    className="btn-primary flex items-center justify-center gap-2 rounded-2xl px-5 py-4 text-xs font-black uppercase tracking-wider disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Zap size={16} />
                    Mua ngay
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAdd(false)}
                    disabled={!canPurchase}
                    className="btn-ghost flex items-center justify-center gap-2 rounded-2xl px-5 py-4 text-xs font-black uppercase tracking-wider disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ShoppingBag size={16} />
                    Thêm giỏ
                  </button>
                </div>

                <div className="grid gap-3 text-sm font-bold text-slate-600 sm:grid-cols-3">
                  <p className="flex items-center gap-2 rounded-2xl bg-slate-50 p-3">
                    <Truck
                      size={16}
                      className="text-orange-500"
                    />
                    Giao nhanh
                  </p>

                  <p className="flex items-center gap-2 rounded-2xl bg-slate-50 p-3">
                    <ShieldCheck
                      size={16}
                      className="text-orange-500"
                    />
                    Bảo mật
                  </p>

                  <p className="flex items-center gap-2 rounded-2xl bg-slate-50 p-3">
                    <RotateCcw
                      size={16}
                      className="text-orange-500"
                    />
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
              {
                id: "description",
                label: "Mô tả",
              },
              {
                id: "specs",
                label: "Thông số",
              },
              {
                id: "reviews",
                label:
                  reviewCount > 0
                    ? `Đánh giá (${reviewCount})`
                    : "Đánh giá",
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setActiveTab(tab.id)
                }
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
                    "Thông tin chi tiết của sản phẩm đang được cập nhật."}
                </p>

                <div className="grid gap-3 rounded-[26px] bg-slate-50 p-5 sm:grid-cols-3">
                  <p>
                    <b className="text-slate-950">
                      Thương hiệu:
                    </b>
                    <br />
                    {brandName || "Đang cập nhật"}
                  </p>

                  <p>
                    <b className="text-slate-950">
                      Danh mục:
                    </b>
                    <br />
                    {categoryName || "Đang cập nhật"}
                  </p>

                  <p>
                    <b className="text-slate-950">
                      Tình trạng:
                    </b>
                    <br />
                    {stock > 0
                      ? "Còn hàng"
                      : "Hết hàng"}
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
                  Chọn màu và kích thước phù hợp trước khi thêm sản phẩm vào giỏ hàng.
                </p>

                <div className="mt-5 grid gap-3 text-sm font-bold text-slate-300">
                  <p className="flex items-center gap-2">
                    <CheckCircle
                      size={16}
                      className="text-orange-400"
                    />
                    Chọn đúng biến thể
                  </p>

                  <p className="flex items-center gap-2">
                    <CheckCircle
                      size={16}
                      className="text-orange-400"
                    />
                    Kiểm tra tồn kho
                  </p>

                  <p className="flex items-center gap-2">
                    <CheckCircle
                      size={16}
                      className="text-orange-400"
                    />
                    Kiểm tra đúng phân loại trước khi mua
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "specs" && (
            <div className="grid gap-4 md:grid-cols-2">
              {[
                [
                  "Mã sản phẩm",
                  selectedVariant?.sku ||
                    product?.sku ||
                    `DNV-${product.id}`,
                ],
                [
                  "Thương hiệu",
                  brandName || "Đang cập nhật",
                ],
                [
                  "Danh mục",
                  categoryName || "Đang cập nhật",
                ],
                [
                  "Giá hiện tại",
                  formatCurrency(displayPrice),
                ],
                [
                  "Giá gốc",
                  originalPrice
                    ? formatCurrency(originalPrice)
                    : "Không áp dụng",
                ],
                [
                  "Màu đang chọn",
                  selectedColor?.name ||
                    "Không có phân loại màu",
                ],
                [
                  "Size đang chọn",
                  selectedSize?.name ||
                    "Không có phân loại size",
                ],
                [
                  "Tồn kho",
                  `${stock} sản phẩm`,
                ],
                [
                  "Trạng thái",
                  stock > 0
                    ? "Còn hàng"
                    : "Hết hàng",
                ],
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
            <ProductReviews productId={product.id} />
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

            </div>

<<<<<<< HEAD
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts
                .slice(0, 4)
                .map((item) => (
                  <RelatedCard
                    key={item.id}
                    product={item}
                    returnUrl={shopReturnUrl}
                  />
                ))}
=======
            <div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition hover:bg-orange-50 hover:text-orange-600"
                  aria-label="Chia sẻ"
                >
                  <Share2 size={18} />
                </button>

                <button
                  type="button"
                  onClick={handleWishlist}
                  disabled={wishlistLoading}
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm transition disabled:cursor-not-allowed disabled:opacity-70 ${
                    liked
                      ? "bg-orange-500 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-orange-50 hover:text-orange-500"
                  }`}
                  aria-label="Yêu thích"
                >
                  {wishlistLoading ? (
                    <Loader2 size={19} className="animate-spin" />
                  ) : (
                    <Heart
                      size={19}
                      className={liked ? "fill-current" : ""}
                    />
                  )}
                </button>
              </div>
>>>>>>> việt
            </div>
          </section>
        )}
      </div>
    </div>
<<<<<<< HEAD
  );
}
=======
  </div>
);
}
>>>>>>> việt
