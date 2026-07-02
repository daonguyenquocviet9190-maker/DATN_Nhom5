"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  Layers3,
  Loader2,
  PackageCheck,
  PackageX,
  RefreshCw,
  Search,
} from "lucide-react";

import {
  extractItems,
  getAdminBrands,
  getAdminCategories,
  getAdminInventory,
  getNormalizedBrandName,
  getNormalizedCategoryName,
  getNormalizedMaxStock,
  getNormalizedMinStock,
  getNormalizedStock,
  getNormalizedVariantCount,
} from "@/services/admin.service";

function StatCard({ title, value, icon: Icon, tone = "orange" }) {
  const toneClass =
    tone === "green"
      ? "bg-emerald-50 text-emerald-600"
      : tone === "rose"
        ? "bg-rose-50 text-rose-600"
        : tone === "blue"
          ? "bg-sky-50 text-sky-600"
          : "bg-orange-50 text-orange-600";

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            {title}
          </p>
          <h3 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950">
            {value}
          </h3>
        </div>

        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${toneClass}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function StockBadge({ stock }) {
  if (stock <= 0) {
    return (
      <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-black text-rose-600">
        Hết hàng
      </span>
    );
  }

  if (stock <= 5) {
    return (
      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-600">
        Sắp hết
      </span>
    );
  }

  return (
    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-600">
      Còn hàng
    </span>
  );
}

export default function AdminInventoryPage() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [inventoryRes, categoriesRes, brandsRes] = await Promise.all([
        getAdminInventory({ per_page: 300 }),
        getAdminCategories({ per_page: 300 }),
        getAdminBrands({ per_page: 300 }),
      ]);

      setItems(extractItems(inventoryRes, ["inventory", "products", "items"]));
      setCategories(extractItems(categoriesRes, ["categories", "items"]));
      setBrands(extractItems(brandsRes, ["brands", "items"]));
    } catch (err) {
      setError(err?.message || "Không thể tải dữ liệu tồn kho.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredItems = useMemo(() => {
    const q = keyword.trim().toLowerCase();

    if (!q) return items;

    return items.filter((item) => {
      const name = String(item?.name || item?.product_name || "").toLowerCase();
      const sku = String(item?.sku || "").toLowerCase();
      const category = getNormalizedCategoryName(item, categories).toLowerCase();
      const brand = getNormalizedBrandName(item, brands).toLowerCase();

      return (
        name.includes(q) ||
        sku.includes(q) ||
        category.includes(q) ||
        brand.includes(q)
      );
    });
  }, [items, keyword, categories, brands]);

  const stats = useMemo(() => {
    const totalStock = items.reduce(
      (sum, item) => sum + getNormalizedStock(item),
      0
    );

    const totalVariants = items.reduce(
      (sum, item) => sum + getNormalizedVariantCount(item),
      0
    );

    const lowStock = items.filter((item) => {
      const stock = getNormalizedStock(item);
      return stock > 0 && stock <= 5;
    }).length;

    const outStock = items.filter((item) => getNormalizedStock(item) <= 0).length;

    return {
      totalProducts: items.length,
      totalStock,
      totalVariants,
      lowStock,
      outStock,
    };
  }, [items]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-500">
            Inventory Management
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950">
            Quản lý tồn kho
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
            Theo dõi tổng tồn kho theo sản phẩm, số biến thể, danh mục và thương hiệu.
            Tồn kho được tính từ bảng product_variants.stock.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {loading ? <Loader2 size={17} className="animate-spin" /> : <RefreshCw size={17} />}
          Tải lại
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Sản phẩm" value={stats.totalProducts} icon={Boxes} tone="blue" />
        <StatCard title="Tổng tồn" value={stats.totalStock} icon={PackageCheck} tone="green" />
        <StatCard title="Biến thể" value={stats.totalVariants} icon={Layers3} tone="orange" />
        <StatCard title="Sắp hết" value={stats.lowStock} icon={AlertTriangle} tone="orange" />
        <StatCard title="Hết hàng" value={stats.outStock} icon={PackageX} tone="rose" />
      </div>

      <div className="rounded-[30px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tìm theo sản phẩm, SKU, danh mục hoặc thương hiệu..."
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-bold outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-3xl border border-rose-100 bg-rose-50 p-5 text-sm font-bold text-rose-600">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
              <tr>
                <th className="px-5 py-4">Sản phẩm</th>
                <th className="px-5 py-4">Danh mục</th>
                <th className="px-5 py-4">Thương hiệu</th>
                <th className="px-5 py-4 text-center">Biến thể</th>
                <th className="px-5 py-4 text-center">Tổng tồn</th>
                <th className="px-5 py-4 text-center">Min / Max</th>
                <th className="px-5 py-4 text-center">Trạng thái</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-5 py-12 text-center text-sm font-bold text-slate-500">
                    <Loader2 className="mx-auto mb-3 animate-spin text-orange-500" size={28} />
                    Đang tải tồn kho...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-12 text-center text-sm font-bold text-slate-500">
                    Không có dữ liệu tồn kho.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const stock = getNormalizedStock(item);
                  const variantCount = getNormalizedVariantCount(item);
                  const minStock = getNormalizedMinStock(item);
                  const maxStock = getNormalizedMaxStock(item);
                  const category = getNormalizedCategoryName(item, categories);
                  const brand = getNormalizedBrandName(item, brands);

                  return (
                    <tr key={item?.id || item?.product_id || item?.sku} className="transition hover:bg-slate-50/70">
                      <td className="px-5 py-4">
                        <div>
                          <p className="line-clamp-1 font-black text-slate-950">
                            {item?.name || item?.product_name || "Sản phẩm"}
                          </p>
                          <p className="mt-1 text-xs font-bold text-slate-400">
                            ID: {item?.id || item?.product_id || "--"}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4 font-bold text-slate-600">{category}</td>
                      <td className="px-5 py-4 font-bold text-slate-600">{brand}</td>

                      <td className="px-5 py-4 text-center">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                          {variantCount}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-center text-base font-black text-slate-950">
                        {stock}
                      </td>

                      <td className="px-5 py-4 text-center text-xs font-black text-slate-500">
                        {minStock} / {maxStock}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <StockBadge stock={stock} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
