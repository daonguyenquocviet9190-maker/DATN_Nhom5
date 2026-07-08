"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Edit3,
  ImagePlus,
  Loader2,
  PackageSearch,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { formatCurrency } from "@/data/shop";
import { getProductImage, PRODUCT_FALLBACK } from "@/utils/imageUrl";
import {
  createAdminProduct,
  deleteAdminProduct,
  extractItems,
  getAdminBrands,
  getAdminCategories,
  getAdminProducts,
  getNormalizedBrandName,
  getNormalizedCategoryName,
  getNormalizedStock,
  updateAdminProduct,
} from "@/services/admin.service";

const emptyForm = {
  name: "",
  slug: "",
  category_id: "",
  brand_id: "",
  price: "",
  compare_price: "",
  stock: "",
  sold: "0",
  rating: "4.8",
  short_description: "",
  description: "",
  status: "active",
  is_featured: false,
  image: null,
};

function buildProductPayload(form) {
  const body = new FormData();

  Object.entries(form).forEach(([key, value]) => {
    if (value === null || value === undefined) return;

    if (key === "image") {
      if (value) body.append("image", value);
      return;
    }

    if (key === "is_featured") {
      body.append(key, value ? "1" : "0");
      return;
    }

    body.append(key, String(value));
  });

  return body;
}

function isActive(product) {
  const status = String(product?.status || "active").toLowerCase();
  const activeValue = product?.is_active;

  if (activeValue === 0 || activeValue === false || activeValue === "0") {
    return false;
  }

  return status !== "inactive" && status !== "hidden";
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [productResponse, categoryResponse, brandResponse] = await Promise.all([
        getAdminProducts({ per_page: 300 }),
        getAdminCategories({ per_page: 200 }),
        getAdminBrands({ per_page: 200 }),
      ]);

      setProducts(extractItems(productResponse, ["products"]));
      setCategories(extractItems(categoryResponse, ["categories"]));
      setBrands(extractItems(brandResponse, ["brands"]));
    } catch (err) {
      setError(err?.message || "Không thể tải danh sách sản phẩm.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const productStats = useMemo(() => {
    const total = products.length;
    const active = products.filter((item) => isActive(item)).length;
    const lowStock = products.filter((item) => getNormalizedStock(item) <= 10).length;

    return { total, active, lowStock };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return products.filter((product) => {
      const productCategoryName = getNormalizedCategoryName(product, categories);
      const productBrandName = getNormalizedBrandName(product, brands);
      const productStock = getNormalizedStock(product);

      const text = [
        product?.name,
        product?.slug,
        productCategoryName,
        productBrandName,
        product?.sku,
        productStock,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const productStatus = isActive(product) ? "active" : "inactive";
      const matchStatus = status === "all" || productStatus === status;
      const matchCategory =
        categoryFilter === "all" || String(product?.category_id || "") === String(categoryFilter);
      const matchKeyword = !keyword || text.includes(keyword);

      return matchStatus && matchCategory && matchKeyword;
    });
  }, [products, categories, brands, query, status, categoryFilter]);

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 1800);
  };

  const openCreate = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setOpenForm(true);
  };

  const openEdit = (product) => {
    setEditingProduct(product);
    setForm({
      name: product?.name || "",
      slug: product?.slug || "",
      category_id: product?.category_id || product?.category?.id || "",
      brand_id: product?.brand_id || product?.brand?.id || "",
      price: product?.price || "",
      compare_price: product?.compare_price || product?.old_price || "",
      stock: getNormalizedStock(product),
      sold: product?.sold || product?.sold_count || "0",
      rating: product?.rating || "4.8",
      short_description: product?.short_description || "",
      description: product?.description || "",
      status: isActive(product) ? "active" : "inactive",
      is_featured: Boolean(product?.is_featured || product?.isFeatured),
      image: null,
    });
    setOpenForm(true);
  };

  const closeForm = () => {
    if (saving) return;
    setOpenForm(false);
    setEditingProduct(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Vui lòng nhập tên sản phẩm.");
      return;
    }

    if (!form.category_id) {
      setError("Vui lòng chọn danh mục cho sản phẩm.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = buildProductPayload(form);

      if (editingProduct?.id) {
        await updateAdminProduct(editingProduct.id, payload);
        showNotice("Đã cập nhật sản phẩm.");
      } else {
        await createAdminProduct(payload);
        showNotice("Đã thêm sản phẩm mới.");
      }

      closeForm();
      await loadData();
    } catch (err) {
      setError(err?.message || "Không thể lưu sản phẩm. Kiểm tra API admin products.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    const ok = window.confirm(`Xóa sản phẩm "${product.name}"?`);
    if (!ok) return;

    try {
      setError("");
      await deleteAdminProduct(product.id);
      showNotice("Đã xóa sản phẩm.");
      await loadData();
    } catch (err) {
      setError(err?.message || "Không thể xóa sản phẩm.");
    }
  };

  return (
    <div className="space-y-6">
      {notice && (
        <div className="fixed right-5 top-24 z-[120] rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black text-white shadow-2xl shadow-orange-500/20">
          {notice}
        </div>
      )}

      <section className="rounded-[32px] border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-slate-950/10 backdrop-blur-xl md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-300">
              Products
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">Quản lý sản phẩm</h2>
            {/* <p className="mt-1 text-sm font-semibold text-slate-500">
              Sản phẩm lấy từ API Laravel, có phân loại danh mục, thương hiệu và tồn kho biến thể.
            </p> */}
          </div>

          <button
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black text-white transition hover:bg-orange-600"
          >
            <Plus size={17} /> Thêm sản phẩm
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
            <p className="text-xs font-black uppercase tracking-wider text-slate-500">Tổng sản phẩm</p>
            <p className="mt-2 text-2xl font-black text-white">{productStats.total}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
            <p className="text-xs font-black uppercase tracking-wider text-slate-500">Đang bán</p>
            <p className="mt-2 text-2xl font-black text-emerald-300">{productStats.active}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
            <p className="text-xs font-black uppercase tracking-wider text-slate-500">Sắp hết kho</p>
            <p className="mt-2 text-2xl font-black text-orange-300">{productStats.lowStock}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_220px_220px]">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-slate-400">
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-500"
              placeholder="Tìm tên, thương hiệu, danh mục..."
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm font-black text-white outline-none"
          >
            <option value="all">Tất cả danh mục</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm font-black text-white outline-none"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang bán</option>
            <option value="inactive">Tạm ẩn</option>
          </select>
        </div>
      </section>

      {error && (
        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm font-bold text-rose-200">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.06] shadow-xl shadow-slate-950/10 backdrop-blur-xl">
        {loading ? (
          <div className="grid min-h-[420px] place-items-center">
            <div className="text-center">
              <Loader2 className="mx-auto animate-spin text-orange-300" size={34} />
              <p className="mt-3 text-sm font-black text-slate-400">Đang tải sản phẩm...</p>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="grid min-h-[420px] place-items-center p-8 text-center">
            <div>
              <PackageSearch className="mx-auto text-orange-300" size={42} />
              <p className="mt-4 text-lg font-black text-white">Không có sản phẩm phù hợp</p>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Thử đổi bộ lọc hoặc thêm sản phẩm mới.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1120px] w-full text-left">
              <thead className="border-b border-white/10 bg-white/[0.04] text-xs font-black uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-4">Sản phẩm</th>
                  <th className="px-5 py-4">Danh mục</th>
                  <th className="px-5 py-4">Thương hiệu</th>
                  <th className="px-5 py-4">Giá</th>
                  <th className="px-5 py-4">Kho</th>
                  <th className="px-5 py-4">Trạng thái</th>
                  <th className="px-5 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredProducts.map((product) => {
                  const stock = getNormalizedStock(product);
                  const categoryName = getNormalizedCategoryName(product, categories);
                  const brandName = getNormalizedBrandName(product, brands);

                  return (
                    <tr key={product.id} className="transition hover:bg-white/[0.04]">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={getProductImage(product)}
                            alt={product.name}
                            onError={(event) => {
                              event.currentTarget.src = PRODUCT_FALLBACK;
                            }}
                            className="h-16 w-16 rounded-2xl object-cover"
                          />
                          <div className="min-w-0">
                            <p className="line-clamp-2 text-sm font-black text-white">{product.name}</p>
                            <p className="mt-1 text-xs font-semibold text-slate-500">
                              ID #{product.id} · {product.variant_count || 0} biến thể
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm font-bold text-slate-300">{categoryName}</td>
                      <td className="px-5 py-4 text-sm font-bold text-slate-300">{brandName}</td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-black text-orange-300">
                          {formatCurrency(product.price || 0)}
                        </p>
                        {(product.compare_price || product.old_price) && (
                          <p className="text-xs font-bold text-slate-500 line-through">
                            {formatCurrency(product.compare_price || product.old_price)}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={
                            (stock <= 0
                              ? "bg-rose-500/10 text-rose-300"
                              : stock <= 10
                              ? "bg-orange-500/10 text-orange-300"
                              : "bg-emerald-500/10 text-emerald-300") +
                            " rounded-full px-3 py-1.5 text-xs font-black"
                          }
                        >
                          {stock} sản phẩm
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={
                            (isActive(product)
                              ? "bg-emerald-500/10 text-emerald-300"
                              : "bg-slate-500/10 text-slate-400") +
                            " rounded-full px-3 py-1.5 text-xs font-black uppercase"
                          }
                        >
                          {isActive(product) ? "Đang bán" : "Tạm ẩn"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEdit(product)}
                            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.06] text-slate-300 transition hover:bg-orange-500 hover:text-white"
                            aria-label="Sửa"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(product)}
                            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.06] text-rose-300 transition hover:bg-rose-500 hover:text-white"
                            aria-label="Xóa"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {openForm && (
        <div className="fixed inset-0 z-[140] bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="mx-auto max-h-[92vh] max-w-4xl overflow-y-auto rounded-[32px] border border-white/10 bg-slate-950 p-5 shadow-2xl md:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-300">
                  Product Form
                </p>
                <h3 className="mt-1 text-xl font-black text-white">
                  {editingProduct ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}
                </h3>
              </div>
              <button
                onClick={closeForm}
                className="rounded-2xl p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              <label className="md:col-span-2">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-400">
                  Tên sản phẩm
                </span>
                <input
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-bold text-white outline-none focus:border-orange-400"
                  placeholder="Nhập tên sản phẩm"
                />
              </label>

              <label>
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-400">
                  Danh mục
                </span>
                <select
                  value={form.category_id}
                  onChange={(event) => setForm((prev) => ({ ...prev, category_id: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-bold text-white outline-none focus:border-orange-400"
                >
                  <option value="">Chọn danh mục</option>
                  {categories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-400">
                  Thương hiệu
                </span>
                <select
                  value={form.brand_id}
                  onChange={(event) => setForm((prev) => ({ ...prev, brand_id: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-bold text-white outline-none focus:border-orange-400"
                >
                  <option value="">Chọn thương hiệu</option>
                  {brands.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-400">
                  Giá bán
                </span>
                <input
                  value={form.price}
                  onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
                  type="number"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-bold text-white outline-none focus:border-orange-400"
                />
              </label>

              <label>
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-400">
                  Giá so sánh
                </span>
                <input
                  value={form.compare_price}
                  onChange={(event) => setForm((prev) => ({ ...prev, compare_price: event.target.value }))}
                  type="number"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-bold text-white outline-none focus:border-orange-400"
                />
              </label>

              <label>
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-400">
                  Tồn kho
                </span>
                <input
                  value={form.stock}
                  onChange={(event) => setForm((prev) => ({ ...prev, stock: event.target.value }))}
                  type="number"
                  min="0"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-bold text-white outline-none focus:border-orange-400"
                />
                <p className="mt-2 text-xs font-semibold text-slate-500">
                  Nếu DB không có products.stock, hệ thống sẽ lưu vào biến thể mặc định trong product_variants.
                </p>
              </label>

              <label>
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-400">
                  Trạng thái
                </span>
                <select
                  value={form.status}
                  onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-bold text-white outline-none focus:border-orange-400"
                >
                  <option value="active">Đang bán</option>
                  <option value="inactive">Tạm ẩn</option>
                </select>
              </label>

              <label className="md:col-span-2">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-400">
                  Mô tả ngắn
                </span>
                <textarea
                  value={form.short_description}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, short_description: event.target.value }))
                  }
                  rows={3}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-bold text-white outline-none focus:border-orange-400"
                />
              </label>

              <label className="md:col-span-2">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-400">
                  Ảnh sản phẩm
                </span>
                <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.04] p-4">
                  <div className="flex items-center gap-3 text-sm font-bold text-slate-400">
                    <ImagePlus className="text-orange-300" size={20} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, image: event.target.files?.[0] || null }))
                      }
                    />
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:col-span-2">
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, is_featured: event.target.checked }))
                  }
                />
                <span className="text-sm font-bold text-slate-300">Đánh dấu sản phẩm nổi bật</span>
              </label>

              <div className="flex justify-end gap-3 md:col-span-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-black text-slate-300 transition hover:bg-white/10"
                >
                  Hủy
                </button>
                <button
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black text-white transition hover:bg-orange-600 disabled:opacity-60"
                >
                  {saving ? <Loader2 size={17} className="animate-spin" /> : <CheckCircle2 size={17} />}
                  Lưu sản phẩm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
