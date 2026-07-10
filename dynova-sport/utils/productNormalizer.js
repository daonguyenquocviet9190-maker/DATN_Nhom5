function firstArray(...values) {
  return values.find(Array.isArray) || [];
}

function firstValue(...values) {
  return values.find(
    (value) => value !== undefined && value !== null && value !== ""
  );
}

export function extractProduct(response) {
  return (
    response?.data?.product ||
    response?.data?.data?.product ||
    response?.data?.data ||
    response?.data ||
    response?.product ||
    response ||
    null
  );
}

export function extractProducts(response) {
  return firstArray(
    response?.data?.products?.data,
    response?.data?.products,
    response?.data?.data?.data,
    response?.data?.data,
    response?.data,
    response?.products?.data,
    response?.products,
    response
  );
}

export function getProductCategoryName(product) {
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

export function getProductCategoryId(product) {
  return String(
    firstValue(
      product?.category_id,
      product?.categoryId,
      product?.category?.id,
      product?.category_data?.id
    ) || ""
  );
}

export function getProductBrandName(product) {
  if (typeof product?.brand === "string") {
    return product.brand;
  }

  return (
    product?.brand?.name ||
    product?.brand_data?.name ||
    product?.brand_name ||
    product?.brandName ||
    ""
  );
}

export function getProductBrandId(product) {
  return String(
    firstValue(
      product?.brand_id,
      product?.brandId,
      product?.brand?.id,
      product?.brand_data?.id
    ) || ""
  );
}

export function getRawVariants(product) {
  return firstArray(
    product?.variants,
    product?.product_variants,
    product?.productVariants,
    product?.variant_list,
    product?.variantList
  );
}

export function normalizeVariant(variant) {
  const sizeObject =
    variant?.size && typeof variant.size === "object" ? variant.size : null;

  const colorObject =
    variant?.color && typeof variant.color === "object" ? variant.color : null;

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

  const sizeId = firstValue(
    variant?.size_id,
    variant?.sizeId,
    sizeObject?.id
  );

  const colorId = firstValue(
    variant?.color_id,
    variant?.colorId,
    colorObject?.id
  );

  const price = Number(variant?.price || 0);
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
        : variant?.status
          ? String(variant.status).toLowerCase() !== "inactive"
          : true;

  return {
    ...variant,
    id: firstValue(variant?.id, variant?.variant_id, variant?.variantId),
    product_id: firstValue(
      variant?.product_id,
      variant?.productId,
      variant?.product?.id
    ),
    size_id: sizeId,
    color_id: colorId,
    size_name: sizeName,
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
    price,
    discount_price: discountPrice,
    stock: Number(variant?.stock ?? variant?.quantity ?? 0),
    image:
      variant?.image ||
      variant?.image_url ||
      variant?.thumbnail ||
      "",
    sku: variant?.sku || "",
    is_active: isActive,
  };
}

export function normalizeProduct(product) {
  if (!product || typeof product !== "object") return null;

  const variants = getRawVariants(product)
    .map(normalizeVariant)
    .filter((variant) => variant?.id && variant.is_active);

  return {
    ...product,
    id: firstValue(product?.id, product?.product_id, product?.productId),
    category_id: getProductCategoryId(product),
    category_name: getProductCategoryName(product),
    brand_id: getProductBrandId(product),
    brand_name: getProductBrandName(product),
    variants,
  };
}

export function getVariantFinalPrice(variant) {
  const price = Number(variant?.price || 0);
  const discountPrice = Number(variant?.discount_price || 0);

  if (discountPrice > 0 && discountPrice < price) {
    return discountPrice;
  }

  return price;
}

export function getProductDisplayPrice(product) {
  const variants = getRawVariants(product)
    .map(normalizeVariant)
    .filter((variant) => variant.is_active);

  const prices = variants
    .map(getVariantFinalPrice)
    .filter((price) => Number.isFinite(price) && price > 0);

  if (prices.length > 0) {
    return Math.min(...prices);
  }

  return Number(product?.price || 0);
}

export function getProductOriginalPrice(product) {
  const variants = getRawVariants(product)
    .map(normalizeVariant)
    .filter((variant) => variant.is_active);

  const discounted = variants
    .filter(
      (variant) =>
        Number(variant.discount_price || 0) > 0 &&
        Number(variant.discount_price) < Number(variant.price || 0)
    )
    .sort(
      (a, b) =>
        getVariantFinalPrice(a) - getVariantFinalPrice(b)
    );

  return discounted[0] ? Number(discounted[0].price || 0) : null;
}

export function getProductTotalStock(product) {
  const variants = getRawVariants(product)
    .map(normalizeVariant)
    .filter((variant) => variant.is_active);

  if (variants.length > 0) {
    return variants.reduce(
      (total, variant) => total + Number(variant.stock || 0),
      0
    );
  }

  const directStock = firstValue(
    product?.stock,
    product?.total_stock,
    product?.quantity
  );

  return directStock === undefined || directStock === null
    ? null
    : Number(directStock);
}

export function getProductAvailableColors(product) {
  const variants = getRawVariants(product)
    .map(normalizeVariant)
    .filter((variant) => variant.is_active && variant.color_id);

  const map = new Map();

  variants.forEach((variant) => {
    const key = String(variant.color_id);

    if (!map.has(key)) {
      map.set(key, {
        id: variant.color_id,
        name: variant.color_name || "Mặc định",
        code: variant.color_code || "",
        hex: variant.color_hex || "",
        image: variant.image || "",
      });
    }
  });

  return Array.from(map.values());
}

export function getProductAvailableSizes(product) {
  const variants = getRawVariants(product)
    .map(normalizeVariant)
    .filter((variant) => variant.is_active && variant.size_id);

  const map = new Map();

  variants.forEach((variant) => {
    const key = String(variant.size_id);

    if (!map.has(key)) {
      map.set(key, {
        id: variant.size_id,
        name: variant.size_name || "Freesize",
      });
    }
  });

  return Array.from(map.values());
}
