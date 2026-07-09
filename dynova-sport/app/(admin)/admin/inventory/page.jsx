"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Layers3,
  Loader2,
  PackageCheck,
  PackageX,
  RefreshCw,
  Search,
} from "lucide-react";

import { getAdminInventory } from "@/services/admin.service";

function extractInventoryItems(response) {
  const candidates = [
    response?.data?.inventory,
    response?.data?.items,
    response?.data?.products,
    response?.data?.data?.inventory,
    response?.data?.data?.items,
    response?.data?.data?.products,
    response?.inventory,
    response?.items,
    response?.products,
    response?.data,
    response,
  ];

  const found = candidates.find((item) => Array.isArray(item));

  return found || [];
}

function toNumber(value, fallback = 0) {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function getProductName(item) {
  return item?.name || item?.product_name || "Sản phẩm";
}

function getCategoryName(item) {
  return item?.category_name || item?.category?.name || "Chưa phân loại";
}

function getBrandName(item) {
  return item?.brand_name || item?.brand?.name || "Không có";
}

function getSku(item) {
  return item?.sku || item?.product_sku || `SP-${String(item?.id || "").padStart(4, "0")}`;
}

function getVariantCount(item) {
  return toNumber(
    item?.variant_count ||
      item?.variants_count ||
      item?.total_variants ||
      item?.product_variants_count ||
      0
  );
}

function getTotalStock(item) {
  return toNumber(
    item?.total_stock ||
      item?.stock ||
      item?.variant_total_stock ||
      item?.quantity ||
      0
  );
}

function getMinStock(item) {
  return toNumber(
    item?.min_stock ||
      item?.variant_min_stock ||
      item?.minimum_stock ||
      0
  );
}

function getMaxStock(item) {
  return toNumber(
    item?.max_stock ||
      item?.variant_max_stock ||
      item?.maximum_stock ||
      0
  );
}

function getStockStatus(stock) {
  if (stock <= 0) {
    return {
      key: "out_of_stock",
      label: "Hết hàng",
      icon: PackageX,
      className: "bg-rose-500/10 text-rose-300 ring-rose-400/20",
      rowClass: "hover:bg-rose-500/[0.04]",
    };
  }

  if (stock <= 5) {
    return {
      key: "low_stock",
      label: "Sắp hết",
      icon: AlertTriangle,
      className: "bg-amber-500/10 text-amber-300 ring-amber-400/20",
      rowClass: "hover:bg-amber-500/[0.04]",
    };
  }

  return {
    key: "in_stock",
    label: "Còn hàng",
    icon: CheckCircle2,
    className: "bg-emerald-500/10 text-emerald-300 ring-emerald-400/20",
    rowClass: "hover:bg-emerald-500/[0.04]",
  };
}

function StatCard({ title, value, icon: Icon, tone = "orange" }) {
  const toneClass =
    tone === "green"
      ? "bg-emerald-500/10 text-emerald-300"
      : tone === "rose"
        ? "bg-rose-500/10 text-rose-300"
        : tone === "blue"
          ? "bg-sky-500/10 text-sky-300"
          : "bg-orange-500/10 text-orange-300";

  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-slate-950/10 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            {title}
          </p>

          <h3 className="mt-2 text-3xl font-black tracking-[-0.04em] text-white">
            {value}
          </h3>
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${toneClass}`}
        >
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ stock }) {
  const meta = getStockStatus(stock);
  const Icon = meta.icon;

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black ring-1 ${meta.className}`}
    >
      <Icon size={13} />
      {meta.label}
    </span>
  );
}

export default function AdminInventoryPage() {
  const [items, setItems] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getAdminInventory({
        per_page: 500,
      });

      const nextItems = extractInventoryItems(response);

      setItems(Array.isArray(nextItems) ? nextItems : []);
    } catch (err) {
      setError(
        err?.data?.message ||
          err?.message ||
          "Không thể tải dữ liệu tồn kho từ API."
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const normalizedItems = useMemo(() => {
    return items.map((item) => {
      const stock = getTotalStock(item);
      const statusMeta = getStockStatus(stock);

      return {
        ...item,
        productName: getProductName(item),
        sku: getSku(item),
        categoryName: getCategoryName(item),
        brandName: getBrandName(item),
        variantCount: getVariantCount(item),
        totalStock: stock,
        minStock: getMinStock(item),
        maxStock: getMaxStock(item),
        stockStatus: statusMeta.key,
        stockLabel: statusMeta.label,
      };
    });
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = keyword.trim().toLowerCase();

    return normalizedItems.filter((item) => {
      const text = [
        item.productName,
        item.sku,
        item.categoryName,
        item.brandName,
        item.stockLabel,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchKeyword = !q || text.includes(q);
      const matchStock =
        stockFilter === "all" || item.stockStatus === stockFilter;

      return matchKeyword && matchStock;
    });
  }, [normalizedItems, keyword, stockFilter]);

  const stats = useMemo(() => {
    const totalStock = normalizedItems.reduce(
      (sum, item) => sum + item.totalStock,
      0
    );

    const totalVariants = normalizedItems.reduce(
      (sum, item) => sum + item.variantCount,
      0
    );

    const inStock = normalizedItems.filter(
      (item) => item.stockStatus === "in_stock"
    ).length;

    const lowStock = normalizedItems.filter(
      (item) => item.stockStatus === "low_stock"
    ).length;

    const outStock = normalizedItems.filter(
      (item) => item.stockStatus === "out_of_stock"
    ).length;

    return {
      totalProducts: normalizedItems.length,
      totalStock,
      totalVariants,
      inStock,
      lowStock,
      outStock,
    };
  }, [normalizedItems]);

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-300">
              Inventory Management
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-white">
              Quản lý tồn kho
            </h1>

            {/* <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
              Theo dõi sản phẩm còn hàng, hết hàng, số biến thể, tổng tồn kho và
              tồn kho min/max. Dữ liệu được tính từ bảng product_variants.stock.
            </p> */}
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 text-sm font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <RefreshCw size={17} />
            )}
            Tải lại
          </button>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <StatCard title="Sản phẩm" value={stats.totalProducts} icon={Boxes} tone="blue" />
        <StatCard title="Tổng tồn" value={stats.totalStock} icon={PackageCheck} tone="green" />
        <StatCard title="Biến thể" value={stats.totalVariants} icon={Layers3} tone="orange" />
        <StatCard title="Còn hàng" value={stats.inStock} icon={CheckCircle2} tone="green" />
        <StatCard title="Sắp hết" value={stats.lowStock} icon={AlertTriangle} tone="orange" />
        <StatCard title="Hết hàng" value={stats.outStock} icon={PackageX} tone="rose" />
      </div>

      <section className="rounded-[30px] border border-white/10 bg-white/[0.06] p-4 shadow-xl shadow-slate-950/10 backdrop-blur-xl">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tìm theo sản phẩm, SKU, danh mục hoặc thương hiệu..."
              className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/60 pl-11 pr-4 text-sm font-bold text-white outline-none transition placeholder:text-slate-600 focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
            />
          </div>

          <select
            value={stockFilter}
            onChange={(event) => setStockFilter(event.target.value)}
            className="h-12 rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm font-black text-white outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
          >
            <option value="all">Tất cả tồn kho</option>
            <option value="in_stock">Còn hàng</option>
            <option value="low_stock">Sắp hết</option>
            <option value="out_of_stock">Hết hàng</option>
          </select>
        </div>
      </section>

      {error && (
        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-5 text-sm font-bold text-rose-200">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      <section className="overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.06] shadow-xl shadow-slate-950/10 backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-left text-sm">
            <thead className="border-b border-white/10 bg-white/[0.04] text-xs font-black uppercase tracking-[0.14em] text-slate-500">
              <tr>
                <th className="px-5 py-4">Sản phẩm</th>
                <th className="px-5 py-4">SKU</th>
                <th className="px-5 py-4">Danh mục</th>
                <th className="px-5 py-4">Thương hiệu</th>
                <th className="px-5 py-4 text-center">Biến thể</th>
                <th className="px-5 py-4 text-center">Tổng tồn</th>
                <th className="px-5 py-4 text-center">Min / Max</th>
                <th className="px-5 py-4 text-center">Trạng thái</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-5 py-14 text-center text-sm font-bold text-slate-500"
                  >
                    <Loader2
                      className="mx-auto mb-3 animate-spin text-orange-300"
                      size={30}
                    />
                    Đang tải dữ liệu tồn kho...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-5 py-14 text-center text-sm font-bold text-slate-500"
                  >
                    Không có dữ liệu tồn kho phù hợp.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const statusMeta = getStockStatus(item.totalStock);

                  return (
                    <tr
                      key={item?.id || item?.product_id || item?.sku}
                      className={`transition ${statusMeta.rowClass}`}
                    >
                      <td className="px-5 py-4">
                        <div>
                          <p className="line-clamp-1 font-black text-white">
                            {item.productName}
                          </p>

                          <p className="mt-1 text-xs font-bold text-slate-500">
                            ID: {item?.id || item?.product_id || "--"}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4 font-bold text-slate-400">
                        {item.sku}
                      </td>

                      <td className="px-5 py-4 font-bold text-slate-400">
                        {item.categoryName}
                      </td>

                      <td className="px-5 py-4 font-bold text-slate-400">
                        {item.brandName}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs font-black text-slate-300 ring-1 ring-white/10">
                          {item.variantCount}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-center text-base font-black text-white">
                        {item.totalStock}
                      </td>

                      <td className="px-5 py-4 text-center text-xs font-black text-slate-400">
                        {item.minStock} / {item.maxStock}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <StatusBadge stock={item.totalStock} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}