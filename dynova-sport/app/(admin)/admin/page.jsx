"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Download,
  PackageCheck,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Truck,
  UserPlus,
  Users,
  WalletCards,
  XCircle,
} from "lucide-react";

import { formatCurrency } from "@/data/shop";
import {
  getAdminDashboardReport,
} from "@/services/admin-dashboard.service";

const PERIODS = [
  { value: "all", label: "Toàn bộ" },
  { value: "7d", label: "7 ngày" },
  { value: "30d", label: "30 ngày" },
  { value: "90d", label: "90 ngày" },
  { value: "12m", label: "12 tháng" },
];

function toNumber(value, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeStatus(status = "") {
  const clean = String(status || "").trim().toLowerCase();

  if (["completed", "success", "done", "hoàn thành"].includes(clean)) {
    return "completed";
  }

  if (["shipping", "delivering", "đang giao"].includes(clean)) {
    return "shipping";
  }

  if (["confirmed", "processing", "packing", "đã xác nhận", "đang xử lý"].includes(clean)) {
    return "confirmed";
  }

  if (["cancelled", "canceled", "cancel", "đã hủy"].includes(clean)) {
    return "cancelled";
  }

  return "pending";
}

function getStatusMeta(status) {
  const normalized = normalizeStatus(status);

  const map = {
    pending: {
      label: "Chờ xác nhận",
      color: "#f59e0b",
      className: "bg-amber-500/10 text-amber-300 ring-amber-400/20",
      icon: ClipboardList,
    },
    confirmed: {
      label: "Đã xác nhận",
      color: "#38bdf8",
      className: "bg-sky-500/10 text-sky-300 ring-sky-400/20",
      icon: PackageCheck,
    },
    shipping: {
      label: "Đang giao",
      color: "#8b5cf6",
      className: "bg-violet-500/10 text-violet-300 ring-violet-400/20",
      icon: Truck,
    },
    completed: {
      label: "Hoàn thành",
      color: "#10b981",
      className: "bg-emerald-500/10 text-emerald-300 ring-emerald-400/20",
      icon: CheckCircle2,
    },
    cancelled: {
      label: "Đã hủy",
      color: "#f43f5e",
      className: "bg-rose-500/10 text-rose-300 ring-rose-400/20",
      icon: XCircle,
    },
  };

  return map[normalized] || map.pending;
}

function getOrderCode(order) {
  return (
    order?.order_code ||
    order?.code ||
    order?.invoice_code ||
    `DNV-${String(order?.id || "").padStart(6, "0")}`
  );
}

function getOrderCustomer(order) {
  return (
    order?.customer_name ||
    order?.customerName ||
    order?.receiver_name ||
    order?.recipient_name ||
    order?.account_name ||
    order?.user?.name ||
    "Khách hàng"
  );
}

function getOrderTotal(order) {
  return toNumber(
    order?.grand_total ??
      order?.final_total ??
      order?.total ??
      order?.total_price ??
      order?.subtotal,
    0
  );
}

function getOrderDate(order) {
  const raw = order?.created_at || order?.createdAt || order?.date;
  if (!raw) return "Chưa có thời gian";

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return String(raw);

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCompact(value, metric) {
  const number = toNumber(value, 0);

  if (metric === "orders") {
    return `${Math.round(number)} đơn`;
  }

  if (number >= 1_000_000_000) {
    return `${(number / 1_000_000_000).toFixed(1)} tỷ`;
  }

  if (number >= 1_000_000) {
    return `${(number / 1_000_000).toFixed(1)} tr`;
  }

  if (number >= 1_000) {
    return `${Math.round(number / 1_000)} nghìn`;
  }

  return formatCurrency(number);
}

function niceMax(value) {
  const safe = Math.max(toNumber(value, 0), 1);
  const magnitude = 10 ** Math.floor(Math.log10(safe));
  const normalized = safe / magnitude;
  let nice = 1;

  if (normalized <= 1) nice = 1;
  else if (normalized <= 2) nice = 2;
  else if (normalized <= 5) nice = 5;
  else nice = 10;

  return nice * magnitude;
}

function ChangeBadge({ value }) {
  if (value === null || value === undefined || value === "") return null;

  const number = toNumber(value, 0);
  const positive = number > 0;
  const negative = number < 0;
  const Icon = positive ? ArrowUpRight : negative ? ArrowDownRight : ArrowRight;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black ${
        positive
          ? "bg-emerald-500/10 text-emerald-300"
          : negative
            ? "bg-rose-500/10 text-rose-300"
            : "bg-white/[0.06] text-slate-400"
      }`}
    >
      <Icon size={12} />
      {Math.abs(number).toFixed(1)}%
    </span>
  );
}

function StatCard({ stat }) {
  const Icon = stat.icon;

  return (
    <Link
      href={stat.href}
      className="group rounded-[24px] border border-white/10 bg-white/[0.045] p-5 shadow-lg shadow-slate-950/10 transition duration-300 hover:-translate-y-0.5 hover:border-orange-400/30 hover:bg-white/[0.065]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${stat.iconClass}`}>
          <Icon size={20} />
        </div>
        <ChangeBadge value={stat.change} />
      </div>

      <p className="mt-5 text-xs font-black uppercase tracking-[0.12em] text-slate-500">{stat.label}</p>
      <p className="mt-2 text-2xl font-black tracking-tight text-white">{stat.value}</p>
      <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{stat.desc}</p>
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-44 animate-pulse rounded-[28px] border border-white/10 bg-white/[0.045]" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-40 animate-pulse rounded-[24px] border border-white/10 bg-white/[0.045]" />
        ))}
      </div>
      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.7fr)_390px]">
        <div className="h-[430px] animate-pulse rounded-[26px] border border-white/10 bg-white/[0.045]" />
        <div className="h-[430px] animate-pulse rounded-[26px] border border-white/10 bg-white/[0.045]" />
      </div>
    </div>
  );
}

function TrendChart({ data, metric, rangeLabel }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const safeData = safeArray(data).map((item) => ({
    label: item?.label || "",
    value: toNumber(metric === "revenue" ? item?.revenue : item?.orders, 0),
  }));

  const hasData = safeData.some((item) => item.value > 0);

  if (!hasData) {
    return (
      <div className="grid h-[310px] place-items-center rounded-[20px] border border-dashed border-white/10 bg-slate-950/20 p-6 text-center">
        <div>
          <TrendingUp className="mx-auto text-slate-600" size={34} />
          <p className="mt-4 text-sm font-black text-white">Chưa có dữ liệu trong khoảng thời gian này</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">{rangeLabel}</p>
        </div>
      </div>
    );
  }

  const width = 980;
  const height = 320;
  const padding = { top: 30, right: 26, bottom: 50, left: 78 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const rawMax = Math.max(...safeData.map((item) => item.value), 1);
  const maxValue = niceMax(rawMax * 1.12);
  const stepX = safeData.length > 1 ? plotWidth / (safeData.length - 1) : plotWidth;

  const points = safeData.map((item, index) => ({
    ...item,
    x: padding.left + stepX * index,
    y: padding.top + plotHeight - (item.value / maxValue) * plotHeight,
  }));

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + plotHeight} L ${points[0].x} ${
    padding.top + plotHeight
  } Z`;

  const grid = Array.from({ length: 5 }, (_, index) => {
    const ratio = index / 4;
    return {
      y: padding.top + plotHeight * ratio,
      value: maxValue * (1 - ratio),
    };
  });

  const active = activeIndex !== null ? points[activeIndex] : null;
  const tooltipWidth = 150;
  const tooltipX = active
    ? Math.max(8, Math.min(width - tooltipWidth - 8, active.x - tooltipWidth / 2))
    : 0;
  const tooltipY = active ? Math.max(8, active.y - 76) : 0;

  const tickStep = Math.max(1, Math.ceil(points.length / 8));

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[720px]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-[310px] w-full"
          role="img"
          aria-label={metric === "revenue" ? "Biểu đồ doanh thu" : "Biểu đồ số đơn hàng"}
          onMouseLeave={() => setActiveIndex(null)}
        >
          <defs>
            <linearGradient id="dynova-dashboard-area-pro" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
            </linearGradient>
          </defs>

          {grid.map((item, index) => (
            <g key={index}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={item.y}
                y2={item.y}
                stroke="rgba(148,163,184,0.11)"
                strokeWidth="1"
              />
              <text
                x={padding.left - 14}
                y={item.y + 4}
                textAnchor="end"
                fill="#64748b"
                fontSize="12"
                fontWeight="700"
              >
                {metric === "orders" ? Math.round(item.value) : formatCompact(item.value, metric)}
              </text>
            </g>
          ))}

          <path d={areaPath} fill="url(#dynova-dashboard-area-pro)" />
          <path
            d={linePath}
            fill="none"
            stroke="#fb923c"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {active && (
            <line
              x1={active.x}
              x2={active.x}
              y1={padding.top}
              y2={padding.top + plotHeight}
              stroke="rgba(251,146,60,0.35)"
              strokeDasharray="5 6"
            />
          )}

          {points.map((point, index) => (
            <g key={`${point.label}-${index}`} onMouseEnter={() => setActiveIndex(index)}>
              <circle cx={point.x} cy={point.y} r="12" fill="transparent" />
              <circle
                cx={point.x}
                cy={point.y}
                r={activeIndex === index ? 7 : 5}
                fill="#0f172a"
                stroke="#fb923c"
                strokeWidth={activeIndex === index ? 4 : 3}
              />

              {(index % tickStep === 0 || index === points.length - 1) && (
                <text
                  x={point.x}
                  y={height - 16}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="11"
                  fontWeight="800"
                >
                  {point.label}
                </text>
              )}
            </g>
          ))}

          {active && (
            <g pointerEvents="none">
              <rect
                x={tooltipX}
                y={tooltipY}
                width={tooltipWidth}
                height="58"
                rx="14"
                fill="#0b1120"
                stroke="rgba(255,255,255,0.12)"
              />
              <text x={tooltipX + 14} y={tooltipY + 22} fill="#94a3b8" fontSize="11" fontWeight="700">
                {active.label}
              </text>
              <text x={tooltipX + 14} y={tooltipY + 43} fill="#ffffff" fontSize="13" fontWeight="900">
                {metric === "revenue" ? formatCompact(active.value, metric) : `${active.value} đơn`}
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}

function OrderStatusChart({ items }) {
  const normalizedItems = safeArray(items).map((item) => {
    const meta = getStatusMeta(item?.status);
    return {
      key: normalizeStatus(item?.status),
      label: meta.label,
      color: meta.color,
      value: toNumber(item?.count, 0),
    };
  });

  const total = normalizedItems.reduce((sum, item) => sum + item.value, 0);
  const safeTotal = Math.max(total, 1);
  let cursor = 0;

  const gradient = normalizedItems.map((item) => {
    const start = cursor;
    const end = cursor + (item.value / safeTotal) * 100;
    cursor = end;
    return `${item.color} ${start}% ${end}%`;
  });

  if (cursor < 100) gradient.push(`#1e293b ${cursor}% 100%`);

  return (
    <div className="grid gap-6 sm:grid-cols-[170px_1fr] sm:items-center 2xl:grid-cols-1">
      <div className="relative mx-auto h-40 w-40">
        <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(${gradient.join(", ")})` }} />
        <div className="absolute inset-[17px] grid place-items-center rounded-full border border-white/10 bg-[#0b1120] text-center">
          <div>
            <p className="text-3xl font-black text-white">{total}</p>
            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Đơn hàng</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {normalizedItems.map((item) => {
          const percent = total > 0 ? Math.round((item.value / total) * 100) : 0;

          return (
            <div key={item.key} className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-xs font-bold text-slate-300">{item.label}</p>
                  <p className="text-xs font-black text-white">{item.value}</p>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: item.color }} />
                </div>
              </div>
              <span className="w-10 text-right text-[11px] font-bold text-slate-500">{percent}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [period, setPeriod] = useState("all");
  const [chartMetric, setChartMetric] = useState("revenue");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);

    setError("");
    const controller = new AbortController();

    try {
      const response = await getAdminDashboardReport(period, controller.signal);
      setReport(response?.data || null);
    } catch (err) {
      if (err?.name === "AbortError") return;
      setError(err?.message || "Không thể tải dữ liệu quản trị.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }

    return () => controller.abort();
  };

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function run() {
      setLoading(true);
      setError("");

      try {
        const response = await getAdminDashboardReport(period, controller.signal);
        if (active) setReport(response?.data || null);
      } catch (err) {
        if (err?.name !== "AbortError" && active) {
          setError(err?.message || "Không thể tải dữ liệu quản trị.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    run();

    return () => {
      active = false;
      controller.abort();
    };
  }, [period]);

  const summary = report?.summary || {};
  const lifetime = report?.lifetime || {};
  const comparison = report?.comparison || {};
  const analytics = report?.analytics || {};
  const meta = report?.meta || {};
  const recentOrders = safeArray(report?.recent_orders);
  const topProducts = safeArray(report?.top_products);
  const lowStockProducts = safeArray(report?.low_stock_products);
  const rangeLabel = report?.range?.label || "";
  const emptyPeriod = Boolean(meta?.empty_period);
  const latestOrderLabel = meta?.latest_order_at
    ? new Date(meta.latest_order_at).toLocaleDateString("vi-VN")
    : "";

  const stats = useMemo(
    () => [
      {
        label: "Doanh thu",
        value: formatCurrency(toNumber(summary.revenue, 0)),
        desc: `${toNumber(summary.completed_orders, 0)} đơn hoàn thành`,
        change: comparison.revenue,
        icon: TrendingUp,
        iconClass: "bg-emerald-500/10 text-emerald-300",
        href: "/admin/orders",
      },
      {
        label: "Đơn hàng",
        value: toNumber(summary.orders, 0),
        desc: `${toNumber(summary.pending_orders, 0)} đơn cần xử lý`,
        change: comparison.orders,
        icon: ClipboardList,
        iconClass: "bg-orange-500/10 text-orange-300",
        href: "/admin/orders",
      },
      {
        label: "Giá trị đơn TB",
        value: formatCurrency(toNumber(summary.aov, 0)),
        desc: "Tính trên đơn đã hoàn thành",
        change: comparison.aov,
        icon: WalletCards,
        iconClass: "bg-sky-500/10 text-sky-300",
        href: "/admin/orders",
      },
      {
        label: "Khách hàng mới",
        value: toNumber(summary.new_customers, 0),
        desc: "Tài khoản mới trong kỳ",
        change: comparison.new_customers,
        icon: UserPlus,
        iconClass: "bg-violet-500/10 text-violet-300",
        href: "/admin/customers",
      },
    ],
    [summary, comparison]
  );

  const handleExport = () => {
    if (!report) return;

    setExporting(true);

    const rows = [
      ["Khoảng thời gian", rangeLabel],
      ["Doanh thu", toNumber(summary.revenue, 0)],
      ["Tổng đơn", toNumber(summary.orders, 0)],
      ["Đơn hoàn thành", toNumber(summary.completed_orders, 0)],
      ["Đơn đã hủy", toNumber(summary.cancelled_orders, 0)],
      ["Giá trị đơn trung bình", toNumber(summary.aov, 0)],
      ["Khách hàng mới", toNumber(summary.new_customers, 0)],
      ["Tỷ lệ hoàn thành", `${toNumber(summary.completion_rate, 0)}%`],
      ["Tỷ lệ hủy", `${toNumber(summary.cancel_rate, 0)}%`],
      ["Tổng đơn toàn hệ thống", toNumber(lifetime.orders, 0)],
      ["Doanh thu toàn hệ thống", toNumber(lifetime.revenue, 0)],
      ["Tổng khách hàng", toNumber(lifetime.customers, 0)],
      ["Tổng sản phẩm", toNumber(lifetime.products, 0)],
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `dynova-dashboard-${period}.csv`;
    link.click();

    URL.revokeObjectURL(url);
    window.setTimeout(() => setExporting(false), 350);
  };

  if (loading && !report) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-[22px] border border-rose-400/20 bg-rose-500/10 p-4 text-sm font-bold text-rose-200">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p>{error}</p>
              <button
                type="button"
                onClick={() => loadDashboard()}
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-xs font-black uppercase tracking-wider text-white transition hover:bg-rose-600"
              >
                <RefreshCw size={14} />
                Tải lại
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="rounded-[28px] border border-white/10 bg-white/[0.045] p-6 shadow-xl shadow-slate-950/15 md:p-7">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-300">Tổng quan kinh doanh</p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-white md:text-4xl">Hoạt động cửa hàng</h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-slate-500">
              <span>{rangeLabel}</span>
              {report?.updated_at && (
                <span>
                  Cập nhật {new Date(report.updated_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap rounded-2xl border border-white/10 bg-slate-950/35 p-1">
              {PERIODS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setPeriod(item.value)}
                  className={`rounded-xl px-3.5 py-2 text-xs font-black transition ${
                    period === item.value ? "bg-orange-500 text-white" : "text-slate-400 hover:bg-white/[0.05] hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => loadDashboard({ silent: true })}
              disabled={refreshing}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] px-4 text-xs font-black text-white transition hover:border-orange-400/30 hover:bg-white/[0.07] disabled:opacity-60"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              Làm mới
            </button>

            <button
              type="button"
              onClick={handleExport}
              disabled={exporting || !report}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] px-4 text-xs font-black text-white transition hover:border-orange-400/30 hover:bg-white/[0.07] disabled:opacity-60"
            >
              <Download size={14} />
              Xuất báo cáo
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[20px] border border-white/[0.07] bg-slate-950/25 p-4">
            <p className="text-xs font-bold text-slate-500">Đơn cần xử lý</p>
            <p className="mt-2 text-xl font-black text-white">{toNumber(summary.pending_orders, 0)}</p>
          </div>
          <div className="rounded-[20px] border border-white/[0.07] bg-slate-950/25 p-4">
            <p className="text-xs font-bold text-slate-500">Đang giao</p>
            <p className="mt-2 text-xl font-black text-white">{toNumber(summary.shipping_orders, 0)}</p>
          </div>
          <div className="rounded-[20px] border border-white/[0.07] bg-slate-950/25 p-4">
            <p className="text-xs font-bold text-slate-500">Tỷ lệ hoàn thành</p>
            <p className="mt-2 text-xl font-black text-emerald-300">{toNumber(summary.completion_rate, 0)}%</p>
          </div>
          <div className="rounded-[20px] border border-white/[0.07] bg-slate-950/25 p-4">
            <p className="text-xs font-bold text-slate-500">Tỷ lệ hủy</p>
            <p className="mt-2 text-xl font-black text-rose-300">{toNumber(summary.cancel_rate, 0)}%</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-[18px] border border-white/[0.07] bg-white/[0.025] px-4 py-3 text-xs font-semibold text-slate-500">
          <span className="font-black text-slate-300">Toàn hệ thống</span>
          <span><b className="text-white">{toNumber(lifetime.orders, 0)}</b> đơn</span>
          <span><b className="text-white">{formatCurrency(toNumber(lifetime.revenue, 0))}</b> doanh thu</span>
          <span><b className="text-white">{toNumber(lifetime.customers, 0)}</b> khách hàng</span>
          <span><b className="text-white">{toNumber(lifetime.products, 0)}</b> sản phẩm</span>
        </div>

        {period !== "all" && emptyPeriod && (
          <div className="mt-4 flex flex-col gap-3 rounded-[18px] border border-amber-400/20 bg-amber-500/[0.07] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-amber-200">Không có đơn hàng trong khoảng thời gian đang chọn.</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {latestOrderLabel ? `Đơn gần nhất được tạo ngày ${latestOrderLabel}.` : "Hệ thống chưa phát sinh đơn hàng."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPeriod("all")}
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-amber-400 px-4 py-2 text-xs font-black text-slate-950 transition hover:bg-amber-300"
            >
              Xem toàn bộ dữ liệu
            </button>
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </section>

      <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.7fr)_390px]">
        <div className="rounded-[26px] border border-white/10 bg-white/[0.045] p-5 shadow-lg shadow-slate-950/10 md:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-orange-300">Xu hướng</p>
              <h2 className="mt-2 text-xl font-black text-white">
                {chartMetric === "revenue" ? "Doanh thu theo thời gian" : "Số đơn theo thời gian"}
              </h2>
              <p className="mt-1 text-xs font-semibold text-slate-500">{rangeLabel}</p>
            </div>

            <div className="flex rounded-xl border border-white/10 bg-slate-950/35 p-1">
              <button
                type="button"
                onClick={() => setChartMetric("revenue")}
                className={`rounded-lg px-4 py-2 text-xs font-black transition ${
                  chartMetric === "revenue" ? "bg-orange-500 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Doanh thu
              </button>
              <button
                type="button"
                onClick={() => setChartMetric("orders")}
                className={`rounded-lg px-4 py-2 text-xs font-black transition ${
                  chartMetric === "orders" ? "bg-orange-500 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Đơn hàng
              </button>
            </div>
          </div>

          <div className="mt-5 rounded-[20px] border border-white/[0.07] bg-slate-950/25 p-3 md:p-4">
            <TrendChart data={analytics.series} metric={chartMetric} rangeLabel={rangeLabel} />
          </div>
        </div>

        <div className="rounded-[26px] border border-white/10 bg-white/[0.045] p-5 shadow-lg shadow-slate-950/10 md:p-6">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-orange-300">Đơn hàng</p>
              <h2 className="mt-2 text-xl font-black text-white">Cơ cấu trạng thái</h2>
            </div>

            <Link
              href="/admin/orders"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition hover:border-orange-400/30 hover:text-orange-300"
              aria-label="Xem danh sách đơn hàng"
            >
              <ChevronRight size={18} />
            </Link>
          </div>

          <OrderStatusChart items={analytics.order_statuses} />
        </div>
      </section>

      <section className="rounded-[26px] border border-white/10 bg-white/[0.045] p-5 shadow-lg shadow-slate-950/10 md:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-orange-300">Đơn hàng gần đây</p>
            <h2 className="mt-2 text-xl font-black text-white">Hoạt động mới nhất</h2>
          </div>

          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-black text-white transition hover:border-orange-400/30 hover:text-orange-300"
          >
            Xem tất cả
            <ArrowRight size={14} />
          </Link>
        </div>

        {recentOrders.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {recentOrders.map((order) => {
              const statusMeta = getStatusMeta(order?.status);
              const StatusIcon = statusMeta.icon;

              return (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="group rounded-[20px] border border-white/[0.08] bg-white/[0.03] p-4 transition duration-300 hover:-translate-y-0.5 hover:border-orange-400/30 hover:bg-white/[0.055]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-black text-orange-300">#{getOrderCode(order)}</p>
                      <p className="mt-2 truncate text-sm font-black text-white">{getOrderCustomer(order)}</p>
                    </div>

                    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black ring-1 ${statusMeta.className}`}>
                      <StatusIcon size={12} />
                      {statusMeta.label}
                    </span>
                  </div>

                  <div className="mt-4 flex items-end justify-between gap-3 border-t border-white/[0.07] pt-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-500">Tổng thanh toán</p>
                      <p className="mt-1 text-sm font-black text-white">{formatCurrency(getOrderTotal(order))}</p>
                    </div>
                    <ArrowRight size={17} className="text-slate-600 transition group-hover:translate-x-1 group-hover:text-orange-300" />
                  </div>

                  <p className="mt-3 text-xs font-semibold text-slate-500">{getOrderDate(order)}</p>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="grid min-h-44 place-items-center rounded-[20px] border border-dashed border-white/10 bg-white/[0.025] p-6 text-center">
            <div>
              <ClipboardList className="mx-auto text-slate-600" size={34} />
              <p className="mt-4 text-sm font-black text-white">Chưa có đơn hàng</p>
            </div>
          </div>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[26px] border border-white/10 bg-white/[0.045] p-6 shadow-lg shadow-slate-950/10">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-orange-300">Bán hàng</p>
              <h2 className="mt-2 text-lg font-black text-white">Sản phẩm bán chạy</h2>
            </div>
            <ShoppingBag className="text-orange-300" size={21} />
          </div>

          <div className="space-y-3">
            {topProducts.length > 0 ? (
              topProducts.map((product, index) => (
                <Link
                  href="/admin/products"
                  key={product.id || index}
                  className="flex items-center gap-4 rounded-[20px] border border-white/[0.08] bg-white/[0.03] p-4 transition hover:border-orange-400/30 hover:bg-white/[0.055]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-sm font-black text-white">
                    {index + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-white">{product.name || product.product_name || "Sản phẩm"}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">Đã bán {toNumber(product.sold, 0)} sản phẩm</p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-black text-emerald-300">{formatCurrency(toNumber(product.revenue, 0))}</p>
                    <p className="mt-1 text-[10px] font-bold text-slate-600">Doanh thu</p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-[20px] border border-dashed border-white/10 bg-white/[0.025] p-6 text-center text-sm font-semibold text-slate-500">
                Chưa có sản phẩm phát sinh doanh số trong kỳ.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[26px] border border-white/10 bg-white/[0.045] p-6 shadow-lg shadow-slate-950/10">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-orange-300">Kho hàng</p>
              <h2 className="mt-2 text-lg font-black text-white">Cảnh báo tồn kho</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-rose-500/10 px-2.5 py-1 text-[10px] font-black text-rose-300">
                {toNumber(report?.inventory?.low_stock_count, 0)} cần kiểm tra
              </span>
              <Boxes className="text-orange-300" size={21} />
            </div>
          </div>

          <div className="space-y-3">
            {lowStockProducts.length > 0 ? (
              lowStockProducts.map((product, index) => {
                const stock = toNumber(product.total_stock, 0);
                const outOfStock = stock <= 0;

                return (
                  <Link
                    href="/admin/inventory"
                    key={product.id || index}
                    className="flex items-center justify-between gap-4 rounded-[20px] border border-white/[0.08] bg-white/[0.03] p-4 transition hover:border-orange-400/30 hover:bg-white/[0.055]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-white">{product.name || "Sản phẩm"}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{toNumber(product.variant_count, 0)} biến thể</p>
                    </div>

                    <span className={`rounded-full px-3 py-1.5 text-xs font-black ${outOfStock ? "bg-rose-500/10 text-rose-300" : "bg-amber-500/10 text-amber-300"}`}>
                      {outOfStock ? "Hết hàng" : `Còn ${stock}`}
                    </span>
                  </Link>
                );
              })
            ) : (
              <div className="rounded-[20px] border border-dashed border-white/10 bg-white/[0.025] p-6 text-center">
                <PackageCheck className="mx-auto text-emerald-300" size={34} />
                <p className="mt-3 text-sm font-black text-white">Tồn kho đang ổn</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">Không có sản phẩm dưới ngưỡng cảnh báo.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}