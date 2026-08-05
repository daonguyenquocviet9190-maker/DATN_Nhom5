"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Boxes,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit3,
  ImagePlus,
  Loader2,
  PackageSearch,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { formatCurrency } from "@/data/shop";
import {
  extractItems,
  getAdminBrands,
  getAdminCategories,
  getNormalizedBrandName,
  getNormalizedCategoryName,
  getNormalizedStock,
  getNormalizedVariantCount,
} from "@/services/admin.service";
import {
  createAdminProduct,
  deleteAdminProduct,
  extractAdminErrorMessage,
  extractAdminProduct,
  extractAdminProductOptions,
  extractAdminProductPagination,
  extractAdminProductStats,
  extractAdminProducts,
  getAdminProduct,
  getAdminProductOptions,
  getAdminProducts,
  updateAdminProduct,
} from "@/services/admin-product.service";
import {
  getProductImage,
  PRODUCT_FALLBACK,
} from "@/utils/imageUrl";

const EMPTY_FORM = {
  name: "",
  slug: "",
  category_id: "",
  brand_id: "",
  short_description: "",
  description: "",
  status: "draft",
  is_featured: false,
  image: null,
};

const EMPTY_MATRIX = {
  price: "",
  discount_price: "",
  stock: "0",
};

const PRODUCT_STATUS_OPTIONS = [
  {
    value: "active",
    label: "Đang bán",
    description: "Hiển thị trên cửa hàng và cho phép khách mua.",
    badgeClass: "bg-emerald-500/10 text-emerald-300",
    cardClass: "border-emerald-400/50 bg-emerald-500/10",
  },
  {
    value: "inactive",
    label: "Tạm ngừng",
    description: "Ẩn khỏi cửa hàng nhưng vẫn giữ dữ liệu và lịch sử.",
    badgeClass: "bg-slate-500/10 text-slate-300",
    cardClass: "border-slate-400/40 bg-slate-500/10",
  },
  {
    value: "draft",
    label: "Bản nháp",
    description: "Chưa công khai; có thể hoàn thiện biến thể sau.",
    badgeClass: "bg-sky-500/10 text-sky-300",
    cardClass: "border-sky-400/50 bg-sky-500/10",
  },
];

const DEFAULT_PAGINATION = {
  current_page: 1,
  last_page: 1,
  per_page: 12,
  total: 0,
  from: 0,
  to: 0,
};

function createKey() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2)
  );
}

function toNumber(value, fallback = 0) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

function getProductStatusMeta(value) {
  const normalized = String(value || "draft").toLowerCase();

  return (
    PRODUCT_STATUS_OPTIONS.find((item) => item.value === normalized) ||
    PRODUCT_STATUS_OPTIONS[2]
  );
}

function getPaginationItems(currentPage, lastPage) {
  const current = Math.max(1, Number(currentPage || 1));
  const last = Math.max(1, Number(lastPage || 1));

  if (last <= 7) {
    return Array.from({ length: last }, (_, index) => index + 1);
  }

  const pages = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(last - 1, current + 1);

  if (start > 2) pages.push("left-ellipsis");

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (end < last - 1) pages.push("right-ellipsis");
  pages.push(last);

  return pages;
}

function isTruthy(value) {
  return value === true ||
    value === 1 ||
    value === "1" ||
    value === "true";
}

function normalizeId(value) {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    value === 0 ||
    value === "0"
  ) {
    return "";
  }

  return String(value);
}

function slugPart(value, fallback) {
  const result = String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase();

  return result || fallback;
}

function createVariant(overrides = {}) {
  return {
    client_key: createKey(),
    id: null,
    color_id: "",
    size_id: "",
    sku: "",
    price: "",
    discount_price: "",
    stock: "0",
    existing_image: "",
    image_file: null,
    preview: "",
    is_active: true,
    ...overrides,
  };
}

function normalizeVariant(variant) {
  const sizeObject =
    variant?.size &&
    typeof variant.size === "object"
      ? variant.size
      : null;

  const colorObject =
    variant?.color &&
    typeof variant.color === "object"
      ? variant.color
      : null;

  return createVariant({
    client_key:
      variant?.client_key || createKey(),
    id:
      variant?.id ??
      variant?.variant_id ??
      null,
    color_id: normalizeId(
      variant?.color_id ??
        variant?.colorId ??
        colorObject?.id
    ),
    size_id: normalizeId(
      variant?.size_id ??
        variant?.sizeId ??
        sizeObject?.id
    ),
    sku: String(variant?.sku || ""),
    price: String(
      variant?.price ?? ""
    ),
    discount_price:
      variant?.discount_price === null ||
      variant?.discount_price === undefined
        ? ""
        : String(
            variant.discount_price
          ),
    stock: String(
      variant?.stock ?? 0
    ),
    existing_image:
      variant?.image ||
      variant?.image_url ||
      "",
    is_active:
      variant?.is_active === undefined
        ? true
        : isTruthy(
            variant.is_active
          ),
  });
}

function getVariantCombinationKey(
  variant
) {
  return [
    normalizeId(variant?.color_id) ||
      "no-color",
    normalizeId(variant?.size_id) ||
      "no-size",
  ].join("-");
}

function getVariantFinalPrice(variant) {
  const price = toNumber(
    variant?.price,
    0
  );

  const discount = toNumber(
    variant?.discount_price,
    0
  );

  if (
    discount > 0 &&
    discount < price
  ) {
    return discount;
  }

  return price;
}

function getVariantPreview(variant) {
  if (variant?.preview) {
    return variant.preview;
  }

  if (variant?.existing_image) {
    return getProductImage({
      image:
        variant.existing_image,
    });
  }

  return PRODUCT_FALLBACK;
}

function getProductPriceRange(product) {
  const minPrice = toNumber(
    product?.price_min ??
      product?.min_price ??
      product?.price,
    0
  );

  const maxPrice = toNumber(
    product?.price_max ??
      product?.max_price ??
      product?.price,
    minPrice
  );

  if (
    maxPrice > 0 &&
    maxPrice !== minPrice
  ) {
    return (
      formatCurrency(minPrice) +
      " – " +
      formatCurrency(maxPrice)
    );
  }

  return formatCurrency(
    minPrice
  );
}

function buildAutoSku({
  productName,
  color,
  size,
  index,
}) {
  const productPart = slugPart(
    productName,
    "PRODUCT"
  ).slice(0, 26);

  const colorPart = slugPart(
    color?.code ||
      color?.name,
    "DEFAULT"
  ).slice(0, 14);

  const sizePart = slugPart(
    size?.name,
    "FREE"
  ).slice(0, 12);

  return [
    "DNV",
    productPart,
    colorPart,
    sizePart,
    String(index + 1)
      .padStart(2, "0"),
  ].join("-");
}

function buildPayload(
  form,
  variants
) {
  const body = new FormData();

  body.append(
    "name",
    form.name.trim()
  );

  body.append(
    "slug",
    form.slug.trim()
  );

  body.append(
    "category_id",
    String(form.category_id)
  );

  if (form.brand_id) {
    body.append(
      "brand_id",
      String(form.brand_id)
    );
  }

  body.append(
    "short_description",
    form.short_description
  );

  body.append(
    "description",
    form.description
  );

  body.append(
    "status",
    form.status
  );

  body.append(
    "is_featured",
    form.is_featured
      ? "1"
      : "0"
  );

  if (form.image) {
    body.append(
      "image",
      form.image
    );
  }

  const variantPayload =
    variants.map(
      (variant, index) => {
        const uploadKey =
          String(index);

        if (
          variant.image_file
        ) {
          body.append(
            `variant_images[${uploadKey}]`,
            variant.image_file
          );
        }

        return {
          id:
            variant.id ||
            null,
          color_id:
            variant.color_id ||
            null,
          size_id:
            variant.size_id ||
            null,
          sku:
            variant.sku.trim(),
          price:
            Number(
              variant.price
            ),
          discount_price:
            variant.discount_price ===
              "" ||
            Number(
              variant.discount_price
            ) <= 0
              ? null
              : Number(
                  variant.discount_price
                ),
          stock:
            Number(
              variant.stock
            ),
          existing_image:
            variant.existing_image ||
            "",
          is_active:
            variant.is_active
              ? 1
              : 0,
          upload_key:
            uploadKey,
        };
      }
    );

  body.append(
    "variants",
    JSON.stringify(
      variantPayload
    )
  );

  return body;
}

function validateProduct(
  form,
  variants
) {
  if (!form.name.trim()) {
    return "Vui lòng nhập tên sản phẩm.";
  }

  if (!form.category_id) {
    return "Vui lòng chọn danh mục.";
  }

  if (form.status !== "draft" && !variants.length) {
    return "Sản phẩm đang bán hoặc tạm ngừng phải có ít nhất một biến thể.";
  }

  if (
    variants.length > 300
  ) {
    return "Một sản phẩm chỉ được tối đa 300 biến thể.";
  }

  const skuSet = new Set();
  const combinationSet =
    new Set();

  let activeCount = 0;

  for (
    let index = 0;
    index < variants.length;
    index += 1
  ) {
    const variant =
      variants[index];

    const position =
      index + 1;

    if (!variant.sku.trim()) {
      return `Biến thể ${position} chưa có SKU.`;
    }

    const skuKey =
      variant.sku
        .trim()
        .toLowerCase();

    if (skuSet.has(skuKey)) {
      return `SKU "${variant.sku}" đang bị trùng.`;
    }

    skuSet.add(skuKey);

    const combinationKey =
      getVariantCombinationKey(
        variant
      );

    if (
      combinationSet.has(
        combinationKey
      )
    ) {
      return `Biến thể ${position} bị trùng màu và kích thước.`;
    }

    combinationSet.add(
      combinationKey
    );

    const price = Number(
      variant.price
    );

    if (
      !Number.isFinite(price) ||
      price <= 0
    ) {
      return `Giá của biến thể ${position} phải lớn hơn 0.`;
    }

    const discount =
      variant.discount_price === ""
        ? 0
        : Number(
            variant.discount_price
          );

    if (
      !Number.isFinite(discount) ||
      discount < 0
    ) {
      return `Giá giảm của biến thể ${position} không hợp lệ.`;
    }

    if (
      discount > 0 &&
      discount >= price
    ) {
      return `Giá giảm của biến thể ${position} phải nhỏ hơn giá gốc.`;
    }

    const stock = Number(
      variant.stock
    );

    if (
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      return `Tồn kho của biến thể ${position} phải là số nguyên không âm.`;
    }

    if (
      variant.image_file &&
      variant.image_file.size >
        6 * 1024 * 1024
    ) {
      return `Ảnh biến thể ${position} vượt quá 6 MB.`;
    }

    if (variant.is_active) {
      activeCount += 1;
    }
  }

  if (form.status === "active" && activeCount === 0) {
    return "Sản phẩm đang bán phải có ít nhất một biến thể hoạt động.";
  }

  if (
    form.image &&
    form.image.size >
      6 * 1024 * 1024
  ) {
    return "Ảnh đại diện sản phẩm vượt quá 6 MB.";
  }

  return "";
}

function Field({
  label,
  required = false,
  children,
  className = "",
}) {
  return (
    <label
      className={className}
    >
      <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-400">
        {label}
        {required && (
          <span className="ml-1 text-orange-300">
            *
          </span>
        )}
      </span>

      {children}
    </label>
  );
}

export default function AdminProductsPage() {
  const [
    products,
    setProducts,
  ] = useState([]);

  const [
    categories,
    setCategories,
  ] = useState([]);

  const [
    brands,
    setBrands,
  ] = useState([]);

  const [
    sizes,
    setSizes,
  ] = useState([]);

  const [
    colors,
    setColors,
  ] = useState([]);

  const [
    query,
    setQuery,
  ] = useState("");

  const [
    status,
    setStatus,
  ] = useState("all");

  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState("all");

  const [
    debouncedQuery,
    setDebouncedQuery,
  ] = useState("");

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const [
    perPage,
    setPerPage,
  ] = useState(12);

  const [
    pagination,
    setPagination,
  ] = useState(DEFAULT_PAGINATION);

  const [
    serverStats,
    setServerStats,
  ] = useState({
    total: 0,
    active: 0,
    totalVariants: 0,
    lowStock: 0,
  });

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    editorLoading,
    setEditorLoading,
  ] = useState(false);

  const [
    editingId,
    setEditingId,
  ] = useState(null);

  const [
    deletingId,
    setDeletingId,
  ] = useState(null);

  const [
    error,
    setError,
  ] = useState("");

  const [
    notice,
    setNotice,
  ] = useState("");

  const [
    openForm,
    setOpenForm,
  ] = useState(false);

  const [portalReady, setPortalReady] = useState(false);

  const [
    form,
    setForm,
  ] = useState(
    EMPTY_FORM
  );

  const [
    mainPreview,
    setMainPreview,
  ] = useState("");

  const [
    variants,
    setVariants,
  ] = useState([]);

  const [
    selectedColorIds,
    setSelectedColorIds,
  ] = useState([]);

  const [
    selectedSizeIds,
    setSelectedSizeIds,
  ] = useState([]);

  const [
    matrixDefaults,
    setMatrixDefaults,
  ] = useState(
    EMPTY_MATRIX
  );

  const showNotice = (
    message
  ) => {
    setNotice(message);

    window.setTimeout(
      () => setNotice(""),
      2200
    );
  };

  const loadData = async ({
    page = currentPage,
    showLoading = true,
  } = {}) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      setError("");

      const requestedPage = Math.max(1, Number(page || 1));

      const [
        productResponse,
        categoryResponse,
        brandResponse,
        optionResponse,
      ] = await Promise.all([
        getAdminProducts({
          page: requestedPage,
          per_page: perPage,
          search: debouncedQuery || undefined,
          category_id:
            categoryFilter === "all"
              ? undefined
              : categoryFilter,
          status:
            status === "all"
              ? undefined
              : status,
        }),
        getAdminCategories({
          per_page: 300,
        }),
        getAdminBrands({
          per_page: 300,
        }),
        getAdminProductOptions(),
      ]);

      const options =
        extractAdminProductOptions(
          optionResponse
        );

      const nextPagination =
        extractAdminProductPagination(
          productResponse,
          {
            current_page: requestedPage,
            per_page: perPage,
          }
        );

      setProducts(
        extractAdminProducts(
          productResponse
        )
      );

      setPagination(
        nextPagination
      );

      setServerStats(
        extractAdminProductStats(
          productResponse
        )
      );

      setCategories(
        extractItems(
          categoryResponse,
          ["categories"]
        )
      );

      setBrands(
        extractItems(
          brandResponse,
          ["brands"]
        )
      );

      setSizes(
        options.sizes.filter(
          (item) =>
            item?.is_active !== false &&
            item?.is_active !== 0 &&
            item?.is_active !== "0"
        )
      );

      setColors(
        options.colors.filter(
          (item) =>
            item?.is_active !== false &&
            item?.is_active !== 0 &&
            item?.is_active !== "0"
        )
      );

      if (
        requestedPage > nextPagination.last_page &&
        nextPagination.last_page > 0
      ) {
        setCurrentPage(
          nextPagination.last_page
        );
      }
    } catch (loadError) {
      setError(
        extractAdminErrorMessage(
          loadError,
          "Không thể tải dữ liệu quản lý sản phẩm."
        )
      );
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(
        query.trim()
      );
      setCurrentPage(1);
    }, 350);

    return () =>
      window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    loadData();
  }, [
    currentPage,
    perPage,
    debouncedQuery,
    categoryFilter,
    status,
  ]);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!openForm || typeof document === "undefined") return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [openForm]);

  const productStats = useMemo(() => {
    return {
      total: toNumber(
        serverStats.total,
        pagination.total
      ),
      active: toNumber(
        serverStats.active,
        0
      ),
      totalVariants: toNumber(
        serverStats.totalVariants,
        0
      ),
      lowStock: toNumber(
        serverStats.lowStock,
        0
      ),
    };
  }, [
    serverStats,
    pagination.total,
  ]);

  const filteredProducts = products;

  const paginationItems = useMemo(
    () =>
      getPaginationItems(
        pagination.current_page,
        pagination.last_page
      ),
    [
      pagination.current_page,
      pagination.last_page,
    ]
  );

  const variantSummary =
    useMemo(() => {
      const activeVariants =
        variants.filter(
          (variant) =>
            variant.is_active
        );

      const totalStock =
        activeVariants.reduce(
          (sum, variant) =>
            sum +
            Math.max(
              0,
              toNumber(
                variant.stock,
                0
              )
            ),
          0
        );

      const prices =
        activeVariants
          .map(
            getVariantFinalPrice
          )
          .filter(
            (price) =>
              price > 0
          );

      return {
        total:
          variants.length,
        active:
          activeVariants.length,
        totalStock,
        minPrice:
          prices.length
            ? Math.min(
                ...prices
              )
            : 0,
        maxPrice:
          prices.length
            ? Math.max(
                ...prices
              )
            : 0,
      };
    }, [variants]);

  const resetEditor = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setMainPreview("");
    setVariants([]);
    setSelectedColorIds([]);
    setSelectedSizeIds([]);
    setMatrixDefaults(
      EMPTY_MATRIX
    );
    setError("");
  };

  const openCreate = () => {
    resetEditor();
    setVariants([]);
    setOpenForm(true);
  };

  const openEdit = async (
    product
  ) => {
    try {
      setOpenForm(true);
      setEditorLoading(true);
      setEditingId(
        product.id
      );
      setError("");

      const response =
        await getAdminProduct(
          product.id
        );

      const detail =
        extractAdminProduct(
          response
        );

      const detailVariants =
        Array.isArray(
          detail?.variants
        )
          ? detail.variants.map(
              normalizeVariant
            )
          : [];

      const safeVariants =
        detailVariants.length
          ? detailVariants
          : [
              createVariant({
                sku:
                  `DNV-${detail.id}-DEFAULT`,
                price:
                  detail?.price ||
                  product?.price ||
                  "",
                stock:
                  detail?.total_stock ||
                  product?.total_stock ||
                  0,
              }),
            ];

      setForm({
        name:
          detail?.name || "",
        slug:
          detail?.slug || "",
        category_id:
          normalizeId(
            detail?.category_id ??
              detail?.category?.id
          ),
        brand_id:
          normalizeId(
            detail?.brand_id ??
              detail?.brand?.id
          ),
        short_description:
          detail?.short_description ||
          "",
        description:
          detail?.description ||
          "",
        status:
          detail?.status ||
          "active",
        is_featured:
          isTruthy(
            detail?.is_featured
          ),
        image: null,
      });

      setMainPreview(
        getProductImage(
          detail
        )
      );

      setVariants(
        safeVariants
      );

      setSelectedColorIds(
        Array.from(
          new Set(
            safeVariants
              .map(
                (variant) =>
                  normalizeId(
                    variant.color_id
                  )
              )
              .filter(Boolean)
          )
        )
      );

      setSelectedSizeIds(
        Array.from(
          new Set(
            safeVariants
              .map(
                (variant) =>
                  normalizeId(
                    variant.size_id
                  )
              )
              .filter(Boolean)
          )
        )
      );

      const firstVariant =
        safeVariants[0];

      setMatrixDefaults({
        price:
          String(
            firstVariant?.price ||
              ""
          ),
        discount_price:
          String(
            firstVariant
              ?.discount_price ||
              ""
          ),
        stock:
          String(
            firstVariant?.stock ??
              10
          ),
      });
    } catch (editError) {
      setError(
        extractAdminErrorMessage(
          editError,
          "Không thể tải chi tiết sản phẩm."
        )
      );
    } finally {
      setEditorLoading(false);
    }
  };

  const closeForm = () => {
    if (saving) return;

    setOpenForm(false);
    resetEditor();
  };

  const updateVariant = (
    clientKey,
    patch
  ) => {
    setVariants(
      (current) =>
        current.map(
          (variant) =>
            variant.client_key ===
            clientKey
              ? {
                  ...variant,
                  ...patch,
                }
              : variant
        )
    );
  };

  const removeVariant = (
    clientKey
  ) => {
    const target =
      variants.find(
        (variant) =>
          variant.client_key ===
          clientKey
      );

    if (!target) return;

    const label =
      target.sku ||
      "biến thể này";

    const accepted =
      window.confirm(
        `Xóa ${label} khỏi sản phẩm?`
      );

    if (!accepted) return;

    setVariants(
      (current) =>
        current.filter(
          (variant) =>
            variant.client_key !==
            clientKey
        )
    );
  };

  const duplicateVariant = (
    source,
    index
  ) => {
    const duplicate =
      createVariant({
        ...source,
        id: null,
        client_key:
          createKey(),
        sku:
          source.sku
            ? source.sku +
              "-COPY"
            : buildAutoSku({
                productName:
                  form.name,
                color:
                  colors.find(
                    (color) =>
                      String(
                        color.id
                      ) ===
                      String(
                        source.color_id
                      )
                  ),
                size:
                  sizes.find(
                    (size) =>
                      String(
                        size.id
                      ) ===
                      String(
                        source.size_id
                      )
                  ),
                index:
                  variants.length,
              }),
        image_file: null,
        preview:
          source.preview ||
          "",
      });

    setVariants(
      (current) => [
        ...current.slice(
          0,
          index + 1
        ),
        duplicate,
        ...current.slice(
          index + 1
        ),
      ]
    );
  };

  const toggleSelection = (
    value,
    setter
  ) => {
    const id =
      String(value);

    setter((current) =>
      current.includes(id)
        ? current.filter(
            (item) =>
              item !== id
          )
        : [...current, id]
    );
  };

  const generateMatrix = () => {
    const selectedColors = selectedColorIds.length
      ? selectedColorIds
      : [""];

    const selectedSizes = selectedSizeIds.length
      ? selectedSizeIds
      : [""];

    const next = [...variants];
    const combinationSet = new Set(
      variants.map(getVariantCombinationKey)
    );

    let addedCount = 0;

    selectedColors.forEach((colorId) => {
      selectedSizes.forEach((sizeId) => {
        const combinationKey = [
          colorId || "no-color",
          sizeId || "no-size",
        ].join("-");

        if (combinationSet.has(combinationKey)) {
          return;
        }

        const color =
          colors.find(
            (item) => String(item.id) === String(colorId)
          ) || null;

        const size =
          sizes.find(
            (item) => String(item.id) === String(sizeId)
          ) || null;

        next.push(
          createVariant({
            color_id: colorId,
            size_id: sizeId,
            sku: buildAutoSku({
              productName: form.name,
              color,
              size,
              index: next.length,
            }),
            price: matrixDefaults.price,
            discount_price: matrixDefaults.discount_price,
            stock: matrixDefaults.stock,
          })
        );

        combinationSet.add(combinationKey);
        addedCount += 1;
      });
    });

    if (next.length > 300) {
      setError(
        "Sản phẩm chỉ được tối đa 300 biến thể."
      );
      return;
    }

    if (addedCount === 0) {
      showNotice("Các tổ hợp đã có trong danh sách.");
      return;
    }

    setVariants(next);
    setError("");
    showNotice(`Đã thêm ${addedCount} biến thể.`);
  };

  const regenerateSku = (
    variant,
    index
  ) => {
    const color =
      colors.find(
        (item) =>
          String(item.id) ===
          String(
            variant.color_id
          )
      ) || null;

    const size =
      sizes.find(
        (item) =>
          String(item.id) ===
          String(
            variant.size_id
          )
      ) || null;

    updateVariant(
      variant.client_key,
      {
        sku:
          buildAutoSku({
            productName:
              form.name,
            color,
            size,
            index,
          }),
      }
    );
  };

  const handleMainImage = (
    file
  ) => {
    if (!file) return;

    if (
      mainPreview.startsWith(
        "blob:"
      )
    ) {
      URL.revokeObjectURL(
        mainPreview
      );
    }

    setMainPreview(
      URL.createObjectURL(file)
    );

    setForm((current) => ({
      ...current,
      image: file,
    }));
  };

  const handleVariantImage = (
    variant,
    file
  ) => {
    if (!file) return;

    if (
      variant.preview?.startsWith(
        "blob:"
      )
    ) {
      URL.revokeObjectURL(
        variant.preview
      );
    }

    updateVariant(
      variant.client_key,
      {
        image_file: file,
        preview:
          URL.createObjectURL(
            file
          ),
      }
    );
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    const validationMessage =
      validateProduct(
        form,
        variants
      );

    if (validationMessage) {
      setError(
        validationMessage
      );

      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload =
        buildPayload(
          form,
          variants
        );

      const response =
        editingId
          ? await updateAdminProduct(
              editingId,
              payload
            )
          : await createAdminProduct(
              payload
            );

      showNotice(
        response?.message ||
          (
            editingId
              ? "Đã cập nhật sản phẩm và biến thể."
              : "Đã tạo sản phẩm và biến thể."
          )
      );

      setOpenForm(false);
      resetEditor();

      if (editingId || currentPage === 1) {
        await loadData({
          page: editingId ? currentPage : 1,
        });
      } else {
        setCurrentPage(1);
      }
    } catch (saveError) {
      setError(
        extractAdminErrorMessage(
          saveError,
          "Không thể lưu sản phẩm."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (
    product
  ) => {
    const accepted =
      window.confirm(
        `Xóa sản phẩm "${product.name}"?\n\nSản phẩm đã phát sinh đơn hàng sẽ được chuyển sang tạm ngừng để giữ lịch sử.`
      );

    if (!accepted) return;

    try {
      setDeletingId(
        product.id
      );

      setError("");

      const response =
        await deleteAdminProduct(
          product.id
        );

      showNotice(
        response?.message ||
          "Đã xử lý sản phẩm."
      );

      const nextPage =
        products.length === 1 && currentPage > 1
          ? currentPage - 1
          : currentPage;

      if (nextPage !== currentPage) {
        setCurrentPage(nextPage);
      } else {
        await loadData({ page: nextPage });
      }
    } catch (deleteError) {
      setError(
        extractAdminErrorMessage(
          deleteError,
          "Không thể xóa sản phẩm."
        )
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {notice && (
        <div className="fixed right-5 top-24 z-[180] rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black text-white shadow-2xl shadow-orange-500/20">
          {notice}
        </div>
      )}

      <section className="rounded-[32px] border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-slate-950/10 backdrop-blur-xl md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">
              Quản lý sản phẩm
            </h1>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black text-white transition hover:bg-orange-600"
          >
            <Plus size={17} />
            Thêm sản phẩm
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            [
              "Tổng sản phẩm",
              productStats.total,
              "text-white",
            ],
            [
              "Đang bán",
              productStats.active,
              "text-emerald-300",
            ],
            [
              "Tổng biến thể",
              productStats.totalVariants,
              "text-sky-300",
            ],
            [
              "Sắp hết kho",
              productStats.lowStock,
              "text-orange-300",
            ],
          ].map(
            ([
              label,
              value,
              tone,
            ]) => (
              <div
                key={label}
                className="rounded-3xl border border-white/10 bg-slate-950/40 p-4"
              >
                <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                  {label}
                </p>

                <p
                  className={`mt-2 text-2xl font-black ${tone}`}
                >
                  {value}
                </p>
              </div>
            )
          )}
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_220px_220px_auto]">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-slate-400">
            <Search size={18} />

            <input
              value={query}
              onChange={(event) =>
                setQuery(
                  event.target.value
                )
              }
              className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-500"
              placeholder="Tìm tên, thương hiệu, danh mục, ID..."
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(event) => {
              setCategoryFilter(
                event.target.value
              );
              setCurrentPage(1);
            }}
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm font-black text-white outline-none"
          >
            <option value="all">
              Tất cả danh mục
            </option>

            {categories.map(
              (item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.name}
                </option>
              )
            )}
          </select>

          <select
            value={status}
            onChange={(event) => {
              setStatus(
                event.target.value
              );
              setCurrentPage(1);
            }}
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm font-black text-white outline-none"
          >
            <option value="all">
              Tất cả trạng thái
            </option>
            <option value="active">
              Đang bán
            </option>
            <option value="inactive">
              Tạm ngừng
            </option>
            <option value="draft">
              Bản nháp
            </option>
          </select>

          <button
            type="button"
            onClick={() => loadData({ page: currentPage })}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-black text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            <RefreshCcw
              size={17}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />
            Làm mới
          </button>
        </div>
      </section>

      {error && !openForm && (
        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm font-bold text-rose-200">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.06] shadow-xl shadow-slate-950/10 backdrop-blur-xl">
        {loading ? (
          <div className="grid min-h-[420px] place-items-center">
            <div className="text-center">
              <Loader2
                className="mx-auto animate-spin text-orange-300"
                size={34}
              />

              <p className="mt-3 text-sm font-black text-slate-400">
                Đang tải sản phẩm...
              </p>
            </div>
          </div>
        ) : filteredProducts.length ===
          0 ? (
          <div className="grid min-h-[420px] place-items-center p-8 text-center">
            <div>
              <PackageSearch
                className="mx-auto text-orange-300"
                size={42}
              />

              <p className="mt-4 text-lg font-black text-white">
                Không có sản phẩm phù hợp
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-500">
                Thử đổi bộ lọc hoặc thêm sản phẩm mới.
              </p>
            </div>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1240px] text-left">
              <thead className="border-b border-white/10 bg-white/[0.04] text-xs font-black uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-4">
                    Sản phẩm
                  </th>
                  <th className="px-5 py-4">
                    Danh mục
                  </th>
                  <th className="px-5 py-4">
                    Thương hiệu
                  </th>
                  <th className="px-5 py-4">
                    Khoảng giá
                  </th>
                  <th className="px-5 py-4">
                    Biến thể
                  </th>
                  <th className="px-5 py-4">
                    Tồn kho
                  </th>
                  <th className="px-5 py-4">
                    Trạng thái
                  </th>
                  <th className="px-5 py-4 text-right">
                    Thao tác
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10">
                {filteredProducts.map(
                  (product) => {
                    const stock =
                      getNormalizedStock(
                        product
                      );

                    const variantCount =
                      getNormalizedVariantCount(
                        product
                      );

                    const categoryName =
                      getNormalizedCategoryName(
                        product,
                        categories
                      );

                    const brandName =
                      getNormalizedBrandName(
                        product,
                        brands
                      );

                    const productStatusMeta =
                      getProductStatusMeta(
                        product?.status
                      );

                    return (
                      <tr
                        key={product.id}
                        className="transition hover:bg-white/[0.04]"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={getProductImage(
                                product
                              )}
                              alt={
                                product.name
                              }
                              onError={(
                                event
                              ) => {
                                event.currentTarget.src =
                                  PRODUCT_FALLBACK;
                              }}
                              className="h-16 w-16 rounded-2xl object-cover"
                            />

                            <div className="min-w-0">
                              <p className="line-clamp-2 max-w-[300px] text-sm font-black text-white">
                                {product.name}
                              </p>

                              <p className="mt-1 text-xs font-semibold text-slate-500">
                                ID #{product.id}
                                {" · "}
                                {product.slug}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm font-bold text-slate-300">
                          {categoryName}
                        </td>

                        <td className="px-5 py-4 text-sm font-bold text-slate-300">
                          {brandName}
                        </td>

                        <td className="px-5 py-4 text-sm font-black text-orange-300">
                          {getProductPriceRange(
                            product
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-2 rounded-full bg-sky-500/10 px-3 py-1.5 text-xs font-black text-sky-300">
                            <Boxes
                              size={14}
                            />
                            {variantCount} SKU
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={
                              (
                                stock <= 0
                                  ? "bg-rose-500/10 text-rose-300"
                                  : stock <=
                                      10
                                    ? "bg-orange-500/10 text-orange-300"
                                    : "bg-emerald-500/10 text-emerald-300"
                              ) +
                              " rounded-full px-3 py-1.5 text-xs font-black"
                            }
                          >
                            {stock} sản phẩm
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={
                              productStatusMeta.badgeClass +
                              " rounded-full px-3 py-1.5 text-xs font-black uppercase"
                            }
                          >
                            {productStatusMeta.label}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openEdit(
                                  product
                                )
                              }
                              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.06] text-slate-300 transition hover:bg-orange-500 hover:text-white"
                              aria-label="Sửa sản phẩm"
                            >
                              <Edit3
                                size={16}
                              />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  product
                                )
                              }
                              disabled={
                                deletingId ===
                                product.id
                              }
                              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.06] text-rose-300 transition hover:bg-rose-500 hover:text-white disabled:opacity-50"
                              aria-label="Xóa sản phẩm"
                            >
                              {deletingId ===
                              product.id ? (
                                <Loader2
                                  size={16}
                                  className="animate-spin"
                                />
                              ) : (
                                <Trash2
                                  size={16}
                                />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-4 border-t border-white/10 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-400">
                <span>
                  Hiển thị {pagination.from}-{pagination.to} trong {pagination.total} sản phẩm
                </span>

                <label className="inline-flex items-center gap-2">
                  <span>Số dòng</span>
                  <select
                    value={perPage}
                    onChange={(event) => {
                      setPerPage(Number(event.target.value));
                      setCurrentPage(1);
                    }}
                    className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs font-black text-white outline-none focus:border-orange-400"
                  >
                    {[12, 24, 48].map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <nav
                className="flex flex-wrap items-center gap-2"
                aria-label="Phân trang sản phẩm"
              >
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                  disabled={pagination.current_page <= 1}
                  className="inline-flex h-10 items-center gap-1 rounded-xl border border-white/10 px-3 text-xs font-black text-slate-300 transition hover:border-orange-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <ChevronLeft size={15} />
                  Trước
                </button>

                {paginationItems.map((item) => {
                  if (typeof item !== "number") {
                    return (
                      <span
                        key={item}
                        className="grid h-10 w-9 place-items-center text-sm font-black text-slate-600"
                      >
                        …
                      </span>
                    );
                  }

                  const active = item === pagination.current_page;

                  return (
                    <button
                      key={item}
                      type="button"
                      aria-current={active ? "page" : undefined}
                      onClick={() => setCurrentPage(item)}
                      className={
                        "grid h-10 min-w-10 place-items-center rounded-xl border px-3 text-xs font-black transition " +
                        (active
                          ? "border-orange-500 bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                          : "border-white/10 text-slate-300 hover:border-orange-400 hover:text-white")
                      }
                    >
                      {item}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.min(pagination.last_page, page + 1)
                    )
                  }
                  disabled={pagination.current_page >= pagination.last_page}
                  className="inline-flex h-10 items-center gap-1 rounded-xl border border-white/10 px-3 text-xs font-black text-slate-300 transition hover:border-orange-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
                >
                  Sau
                  <ChevronRight size={15} />
                </button>
              </nav>
            </div>
          </div>
        )}
      </section>

      {portalReady &&
        openForm &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex h-[100dvh] w-screen items-stretch justify-center overflow-hidden bg-slate-950/85 p-0 backdrop-blur-sm sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-label={editingId ? "Cập nhật sản phẩm" : "Thêm sản phẩm"}
          >
            <div className="grid h-full w-full max-w-[1480px] grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-none border border-white/10 bg-slate-950 shadow-2xl sm:h-[calc(100dvh-2rem)] sm:rounded-[24px]">
            <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-white/10 bg-slate-950/95 px-5 py-4 backdrop-blur-xl md:px-7">
              <div>
                <h2 className="text-xl font-black text-white md:text-2xl">
                  {editingId ? "Cập nhật sản phẩm" : "Thêm sản phẩm"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-2xl p-2 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                aria-label="Đóng"
              >
                <X size={24} />
              </button>
            </div>

            {editorLoading ? (
              <div className="grid min-h-[560px] place-items-center">
                <div className="text-center">
                  <Loader2
                    size={36}
                    className="mx-auto animate-spin text-orange-300"
                  />

                  <p className="mt-3 text-sm font-black text-slate-400">
                    Đang tải sản phẩm và biến thể...
                  </p>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="min-h-0 space-y-5 overflow-y-auto overscroll-contain p-4 pb-6 sm:p-5 lg:p-6"
              >
                {error && (
                  <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm font-bold text-rose-200">
                    {error}
                  </div>
                )}

                <section className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <h3 className="text-lg font-black text-white">
                      Thông tin sản phẩm
                    </h3>
                    <span className="rounded-full bg-white/[0.06] px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Bắt buộc
                    </span>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field
                        label="Tên sản phẩm"
                        required
                        className="md:col-span-2"
                      >
                        <input
                          value={form.name}
                          onChange={(event) =>
                            setForm(
                              (current) => ({
                                ...current,
                                name:
                                  event
                                    .target
                                    .value,
                              })
                            )
                          }
                          className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-bold text-white outline-none transition focus:border-orange-400"
                          placeholder="Ví dụ: Giày Nike Air Zoom Pegasus 41"
                        />
                      </Field>

                      <Field label="Slug">
                        <input
                          value={form.slug}
                          onChange={(event) =>
                            setForm(
                              (current) => ({
                                ...current,
                                slug:
                                  event
                                    .target
                                    .value,
                              })
                            )
                          }
                          className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-bold text-white outline-none transition focus:border-orange-400"
                          placeholder="Để trống để tự tạo"
                        />
                      </Field>

                      <div className="md:col-span-2">
                        <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-400">
                          Trạng thái
                          <span className="ml-1 text-orange-300">
                            *
                          </span>
                        </span>

                        <div className="grid gap-3 md:grid-cols-3">
                          {PRODUCT_STATUS_OPTIONS.map((option) => {
                            const active = form.status === option.value;

                            return (
                              <button
                                key={option.value}
                                type="button"
                                aria-pressed={active}
                                onClick={() =>
                                  setForm((current) => ({
                                    ...current,
                                    status: option.value,
                                  }))
                                }
                                className={
                                  "rounded-2xl border p-4 text-left transition " +
                                  (active
                                    ? option.cardClass + " ring-2 ring-white/10"
                                    : "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.07]")
                                }
                              >
                                <span className="flex items-center justify-between gap-3">
                                  <span className="text-sm font-black text-white">
                                    {option.label}
                                  </span>

                                  <span
                                    className={
                                      "grid h-5 w-5 place-items-center rounded-full border " +
                                      (active
                                        ? "border-orange-400 bg-orange-500 text-white"
                                        : "border-slate-600")
                                    }
                                  >
                                    {active && <Check size={12} />}
                                  </span>
                                </span>

                                <span className="mt-2 block text-xs font-semibold leading-5 text-slate-400">
                                  {option.description}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <Field
                        label="Danh mục"
                        required
                      >
                        <select
                          value={form.category_id}
                          onChange={(event) =>
                            setForm(
                              (current) => ({
                                ...current,
                                category_id:
                                  event
                                    .target
                                    .value,
                              })
                            )
                          }
                          className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-bold text-white outline-none focus:border-orange-400"
                        >
                          <option value="">
                            Chọn danh mục
                          </option>

                          {categories.map(
                            (item) => (
                              <option
                                key={
                                  item.id
                                }
                                value={
                                  item.id
                                }
                              >
                                {
                                  item.name
                                }
                              </option>
                            )
                          )}
                        </select>
                      </Field>

                      <Field label="Thương hiệu">
                        <select
                          value={form.brand_id}
                          onChange={(event) =>
                            setForm(
                              (current) => ({
                                ...current,
                                brand_id:
                                  event
                                    .target
                                    .value,
                              })
                            )
                          }
                          className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-bold text-white outline-none focus:border-orange-400"
                        >
                          <option value="">
                            Không có thương hiệu
                          </option>

                          {brands.map(
                            (item) => (
                              <option
                                key={
                                  item.id
                                }
                                value={
                                  item.id
                                }
                              >
                                {
                                  item.name
                                }
                              </option>
                            )
                          )}
                        </select>
                      </Field>

                      <Field
                        label="Mô tả ngắn"
                        className="md:col-span-2"
                      >
                        <textarea
                          value={form.short_description}
                          onChange={(event) =>
                            setForm(
                              (current) => ({
                                ...current,
                                short_description:
                                  event
                                    .target
                                    .value,
                              })
                            )
                          }
                          rows={3}
                          className="w-full resize-y rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold leading-6 text-white outline-none transition focus:border-orange-400"
                          placeholder="Nội dung hiển thị ngắn ở trang danh sách và phần đầu chi tiết."
                        />
                      </Field>

                      <Field
                        label="Mô tả chi tiết"
                        className="md:col-span-2"
                      >
                        <textarea
                          value={form.description}
                          onChange={(event) =>
                            setForm(
                              (current) => ({
                                ...current,
                                description:
                                  event
                                    .target
                                    .value,
                              })
                            )
                          }
                          rows={7}
                          className="w-full resize-y rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold leading-7 text-white outline-none transition focus:border-orange-400"
                          placeholder="Mô tả chất liệu, công nghệ, công dụng, hướng dẫn sử dụng..."
                        />
                      </Field>

                      <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:col-span-2">
                        <input
                          type="checkbox"
                          checked={
                            form.is_featured
                          }
                          onChange={(event) =>
                            setForm(
                              (current) => ({
                                ...current,
                                is_featured:
                                  event
                                    .target
                                    .checked,
                              })
                            )
                          }
                          className="h-4 w-4 accent-orange-500"
                        />

                        <span className="text-sm font-bold text-slate-300">
                          Hiển thị trong nhóm sản phẩm nổi bật
                        </span>
                      </label>
                    </div>

                    <div>
                      <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-400">
                        Ảnh đại diện
                      </p>

                      <div className="overflow-hidden rounded-[22px] border border-dashed border-white/15 bg-white/[0.04] p-3">
                        <img
                          src={
                            mainPreview ||
                            PRODUCT_FALLBACK
                          }
                          alt="Xem trước sản phẩm"
                          onError={(
                            event
                          ) => {
                            event.currentTarget.src =
                              PRODUCT_FALLBACK;
                          }}
                          className="aspect-square w-full rounded-[20px] object-cover"
                        />

                        <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white/[0.07] px-4 py-3 text-sm font-black text-slate-300 transition hover:bg-orange-500 hover:text-white">
                          <ImagePlus
                            size={17}
                          />
                          Chọn ảnh sản phẩm

                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(
                              event
                            ) =>
                              handleMainImage(
                                event.target
                                  .files?.[0]
                              )
                            }
                          />
                        </label>

                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <h3 className="text-lg font-black text-white">
                        Phân loại và biến thể
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={generateMatrix}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-500 px-5 py-3 text-sm font-black text-white transition hover:bg-sky-600"
                    >
                      <Plus
                        size={17}
                      />
                      Tạo biến thể
                    </button>
                  </div>

                  <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_1fr_360px]">
                    <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
                      <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                        Màu sắc
                      </p>


                      <div className="mt-3 flex max-h-44 flex-wrap gap-2 overflow-y-auto">
                        {colors.map(
                          (color) => {
                            const active =
                              selectedColorIds.includes(
                                String(
                                  color.id
                                )
                              );

                            return (
                              <button
                                key={
                                  color.id
                                }
                                type="button"
                                onClick={() =>
                                  toggleSelection(
                                    color.id,
                                    setSelectedColorIds
                                  )
                                }
                                className={
                                  "inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-black transition " +
                                  (
                                    active
                                      ? "border-orange-400 bg-orange-500/15 text-orange-200"
                                      : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-orange-400/50"
                                  )
                                }
                              >
                                <span
                                  className="h-4 w-4 rounded-full border border-white/20"
                                  style={{
                                    backgroundColor:
                                      color.hex ||
                                      "#cbd5e1",
                                  }}
                                />

                                {
                                  color.name
                                }

                                {active && (
                                  <Check
                                    size={13}
                                  />
                                )}
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
                      <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                        Kích thước
                      </p>


                      <div className="mt-3 flex max-h-44 flex-wrap gap-2 overflow-y-auto">
                        {sizes.map(
                          (size) => {
                            const active =
                              selectedSizeIds.includes(
                                String(
                                  size.id
                                )
                              );

                            return (
                              <button
                                key={
                                  size.id
                                }
                                type="button"
                                onClick={() =>
                                  toggleSelection(
                                    size.id,
                                    setSelectedSizeIds
                                  )
                                }
                                className={
                                  "rounded-2xl border px-3 py-2 text-xs font-black transition " +
                                  (
                                    active
                                      ? "border-sky-400 bg-sky-500/15 text-sky-200"
                                      : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-sky-400/50"
                                  )
                                }
                              >
                                {size.name}
                                <span className="ml-1 text-[10px] uppercase text-slate-500">
                                  {
                                    size.type
                                  }
                                </span>
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
                      <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                        Giá trị mặc định
                      </p>

                      <div className="mt-3 grid gap-3">
                        <input
                          type="number"
                          min="1"
                          value={
                            matrixDefaults.price
                          }
                          onChange={(event) =>
                            setMatrixDefaults(
                              (
                                current
                              ) => ({
                                ...current,
                                price:
                                  event
                                    .target
                                    .value,
                              })
                            )
                          }
                          className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-bold text-white outline-none focus:border-orange-400"
                          placeholder="Giá gốc"
                        />

                        <input
                          type="number"
                          min="0"
                          value={
                            matrixDefaults.discount_price
                          }
                          onChange={(event) =>
                            setMatrixDefaults(
                              (
                                current
                              ) => ({
                                ...current,
                                discount_price:
                                  event
                                    .target
                                    .value,
                              })
                            )
                          }
                          className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-bold text-white outline-none focus:border-orange-400"
                          placeholder="Giá giảm, có thể bỏ trống"
                        />

                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={
                            matrixDefaults.stock
                          }
                          onChange={(event) =>
                            setMatrixDefaults(
                              (
                                current
                              ) => ({
                                ...current,
                                stock:
                                  event
                                    .target
                                    .value,
                              })
                            )
                          }
                          className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-bold text-white outline-none focus:border-orange-400"
                          placeholder="Tồn kho"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <section className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04]">
                  <div className="flex flex-col gap-4 border-b border-white/10 p-5 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <h3 className="text-lg font-black text-white">
                        Danh sách biến thể
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white/[0.06] px-3 py-2 text-xs font-black text-slate-300">
                        {variantSummary.total} biến thể
                      </span>

                      <span className="rounded-full bg-emerald-500/10 px-3 py-2 text-xs font-black text-emerald-300">
                        {variantSummary.totalStock} tồn kho
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setVariants((current) => [
                            ...current,
                            createVariant({
                              sku: buildAutoSku({
                                productName: form.name,
                                color: null,
                                size: null,
                                index: current.length,
                              }),
                              price: matrixDefaults.price,
                              discount_price: matrixDefaults.discount_price,
                              stock: matrixDefaults.stock,
                            }),
                          ])
                        }
                        className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-xs font-black text-slate-300 transition hover:bg-orange-500 hover:text-white"
                      >
                        <Plus
                          size={15}
                        />
                        Thêm biến thể
                      </button>
                    </div>
                  </div>

                  {variants.length ===
                  0 ? (
                    <div className="p-10 text-center">
                      <Boxes
                        size={42}
                        className="mx-auto text-slate-600"
                      />

                      <p className="mt-4 font-black text-white">
                        Chưa có biến thể
                      </p>


                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[1240px] text-left">
                        <thead className="border-b border-white/10 bg-slate-950/50 text-[11px] font-black uppercase tracking-wider text-slate-500">
                          <tr>
                            <th className="px-3 py-3">
                              #
                            </th>
                            <th className="px-3 py-3">
                              Màu
                            </th>
                            <th className="px-3 py-3">
                              Kích thước
                            </th>
                            <th className="px-3 py-3">
                              SKU
                            </th>
                            <th className="px-3 py-3">
                              Giá gốc
                            </th>
                            <th className="px-3 py-3">
                              Giá giảm
                            </th>
                            <th className="px-3 py-3">
                              Tồn kho
                            </th>
                            <th className="px-3 py-3">
                              Hoạt động
                            </th>
                            <th className="px-3 py-3">
                              Ảnh
                            </th>
                            <th className="px-3 py-3 text-right">
                              Thao tác
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-white/10">
                          {variants.map(
                            (
                              variant,
                              index
                            ) => (
                              <tr
                                key={
                                  variant.client_key
                                }
                                className={
                                  variant.is_active
                                    ? "bg-transparent"
                                    : "bg-slate-950/30 opacity-70"
                                }
                              >
                                <td className="px-3 py-3 text-xs font-black text-slate-500">
                                  {index +
                                    1}
                                </td>

                                <td className="px-3 py-3">
                                  <select
                                    value={
                                      variant.color_id
                                    }
                                    onChange={(event) =>
                                      updateVariant(
                                        variant.client_key,
                                        {
                                          color_id:
                                            event
                                              .target
                                              .value,
                                        }
                                      )
                                    }
                                    className="w-40 rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-xs font-bold text-white outline-none focus:border-orange-400"
                                  >
                                    <option value="">
                                      Mặc định
                                    </option>

                                    {colors.map(
                                      (
                                        color
                                      ) => (
                                        <option
                                          key={
                                            color.id
                                          }
                                          value={
                                            color.id
                                          }
                                        >
                                          {
                                            color.name
                                          }
                                        </option>
                                      )
                                    )}
                                  </select>
                                </td>

                                <td className="px-3 py-3">
                                  <select
                                    value={
                                      variant.size_id
                                    }
                                    onChange={(event) =>
                                      updateVariant(
                                        variant.client_key,
                                        {
                                          size_id:
                                            event
                                              .target
                                              .value,
                                        }
                                      )
                                    }
                                    className="w-36 rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-xs font-bold text-white outline-none focus:border-orange-400"
                                  >
                                    <option value="">
                                      Freesize
                                    </option>

                                    {sizes.map(
                                      (
                                        size
                                      ) => (
                                        <option
                                          key={
                                            size.id
                                          }
                                          value={
                                            size.id
                                          }
                                        >
                                          {
                                            size.name
                                          }
                                        </option>
                                      )
                                    )}
                                  </select>
                                </td>

                                <td className="px-3 py-3">
                                  <div className="flex w-[310px] gap-2">
                                    <input
                                      value={
                                        variant.sku
                                      }
                                      onChange={(event) =>
                                        updateVariant(
                                          variant.client_key,
                                          {
                                            sku:
                                              event
                                                .target
                                                .value,
                                          }
                                        )
                                      }
                                      className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5 text-xs font-bold text-white outline-none focus:border-orange-400"
                                      placeholder="SKU duy nhất"
                                    />

                                    <button
                                      type="button"
                                      onClick={() =>
                                        regenerateSku(
                                          variant,
                                          index
                                        )
                                      }
                                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 text-slate-400 transition hover:bg-sky-500 hover:text-white"
                                      title="Tạo lại SKU"
                                    >
                                      <RefreshCcw
                                        size={14}
                                      />
                                    </button>
                                  </div>
                                </td>

                                <td className="px-3 py-3">
                                  <input
                                    type="number"
                                    min="1"
                                    value={
                                      variant.price
                                    }
                                    onChange={(event) =>
                                      updateVariant(
                                        variant.client_key,
                                        {
                                          price:
                                            event
                                              .target
                                              .value,
                                        }
                                      )
                                    }
                                    className="w-36 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5 text-xs font-bold text-white outline-none focus:border-orange-400"
                                  />
                                </td>

                                <td className="px-3 py-3">
                                  <input
                                    type="number"
                                    min="0"
                                    value={
                                      variant.discount_price
                                    }
                                    onChange={(event) =>
                                      updateVariant(
                                        variant.client_key,
                                        {
                                          discount_price:
                                            event
                                              .target
                                              .value,
                                        }
                                      )
                                    }
                                    className="w-36 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5 text-xs font-bold text-white outline-none focus:border-orange-400"
                                    placeholder="Không giảm"
                                  />
                                </td>

                                <td className="px-3 py-3">
                                  <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={
                                      variant.stock
                                    }
                                    onChange={(event) =>
                                      updateVariant(
                                        variant.client_key,
                                        {
                                          stock:
                                            event
                                              .target
                                              .value,
                                        }
                                      )
                                    }
                                    className="w-28 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5 text-xs font-bold text-white outline-none focus:border-orange-400"
                                  />
                                </td>

                                <td className="px-3 py-3">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateVariant(
                                        variant.client_key,
                                        {
                                          is_active:
                                            !variant.is_active,
                                        }
                                      )
                                    }
                                    className={
                                      "relative h-7 w-12 rounded-full transition " +
                                      (
                                        variant.is_active
                                          ? "bg-emerald-500"
                                          : "bg-slate-700"
                                      )
                                    }
                                    aria-label="Bật tắt biến thể"
                                  >
                                    <span
                                      className={
                                        "absolute top-1 h-5 w-5 rounded-full bg-white transition " +
                                        (
                                          variant.is_active
                                            ? "left-6"
                                            : "left-1"
                                        )
                                      }
                                    />
                                  </button>
                                </td>

                                <td className="px-3 py-3">
                                  <label className="relative block h-14 w-14 cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-white/[0.05]">
                                    <img
                                      src={getVariantPreview(
                                        variant
                                      )}
                                      alt={
                                        variant.sku ||
                                        "Ảnh biến thể"
                                      }
                                      onError={(
                                        event
                                      ) => {
                                        event.currentTarget.src =
                                          PRODUCT_FALLBACK;
                                      }}
                                      className="h-full w-full object-cover"
                                    />

                                    <span className="absolute inset-0 grid place-items-center bg-slate-950/60 text-white opacity-0 transition hover:opacity-100">
                                      <ImagePlus
                                        size={16}
                                      />
                                    </span>

                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(event) =>
                                        handleVariantImage(
                                          variant,
                                          event
                                            .target
                                            .files?.[0]
                                        )
                                      }
                                    />
                                  </label>
                                </td>

                                <td className="px-3 py-3">
                                  <div className="flex justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        duplicateVariant(
                                          variant,
                                          index
                                        )
                                      }
                                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-slate-400 transition hover:bg-sky-500 hover:text-white"
                                      title="Nhân bản"
                                    >
                                      <Copy
                                        size={14}
                                      />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeVariant(
                                          variant.client_key
                                        )
                                      }
                                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-rose-300 transition hover:bg-rose-500 hover:text-white"
                                      title="Xóa biến thể"
                                    >
                                      <Trash2
                                        size={14}
                                      />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                <section className="grid gap-3 rounded-[24px] border border-white/10 bg-slate-950/70 p-5 sm:grid-cols-2 xl:grid-cols-5">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                      Tổng biến thể
                    </p>
                    <p className="mt-2 text-xl font-black text-white">
                      {variantSummary.total}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                      Đang hoạt động
                    </p>
                    <p className="mt-2 text-xl font-black text-emerald-300">
                      {variantSummary.active}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                      Tổng tồn kho
                    </p>
                    <p className="mt-2 text-xl font-black text-sky-300">
                      {variantSummary.totalStock}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                      Giá thấp nhất
                    </p>
                    <p className="mt-2 text-base font-black text-orange-300">
                      {formatCurrency(
                        variantSummary.minPrice
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                      Giá cao nhất
                    </p>
                    <p className="mt-2 text-base font-black text-orange-300">
                      {formatCurrency(
                        variantSummary.maxPrice
                      )}
                    </p>
                  </div>
                </section>

                <div className="sticky bottom-3 z-20 flex flex-col gap-3 rounded-[22px] border border-white/10 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xs font-bold text-slate-400">
                    {variantSummary.total} biến thể · {variantSummary.totalStock} sản phẩm trong kho
                  </div>

                  <div className="flex shrink-0 justify-end gap-3">
                    <button
                      type="button"
                      onClick={closeForm}
                      disabled={saving}
                      className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-black text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
                    >
                      Hủy
                    </button>

                    <button
                      disabled={
                        saving ||
                        editorLoading
                      }
                      className="inline-flex min-w-44 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? (
                        <Loader2
                          size={17}
                          className="animate-spin"
                        />
                      ) : (
                        <CheckCircle2
                          size={17}
                        />
                      )}

                      {saving
                        ? "Đang lưu..."
                        : "Lưu sản phẩm"}
                    </button>
                  </div>
                </div>
              </form>
            )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}