"use client";

import { useMemo } from "react";
import {
  CheckCircle2,
  Clock3,
  Gauge,
  RefreshCw,
  Truck,
} from "lucide-react";
import OrderDeliveryMap from "@/components/orders/OrderDeliveryMap";

const STATUS_LABELS = {
  ready_to_pick: "Đã tạo vận đơn",
  picking: "Đang lấy hàng",
  picked: "Đã lấy hàng",
  storing: "Đã nhập kho GHN",
  transporting: "Đang trung chuyển",
  sorting: "Đang phân loại",
  delivering: "Đang giao hàng",
  delivered: "Giao thành công",
};

function timeText(seconds = 0) {
  const value = Math.max(0, Math.round(Number(seconds) || 0));
  const minutes = Math.floor(value / 60);
  const rest = value % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

export default function GhnDevSimulator({
  order,
  environment,
  busy = "",
  onSync,
}) {
  const simulation = order?.tracking?.delivery_map?.simulation || null;
  const current = String(
    simulation?.current_status ||
      order?.tracking?.status ||
      order?.ghn_status ||
      (order?.tracking_code ? "ready_to_pick" : "")
  ).toLowerCase();

  const progress = Math.max(0, Math.min(100, Number(simulation?.progress || 0)));
  const duration = Math.max(1, Number(simulation?.duration_seconds || 240));
  const elapsed = Math.min(duration, Number(simulation?.elapsed_seconds || 0));
  const speed = Math.max(0.5, Number(simulation?.speed || 1));
  const completed = Boolean(simulation?.completed) || progress >= 100 || current === "delivered" || order?.status === "completed";

  const remaining = useMemo(
    () => (completed ? 0 : Math.max(0, (duration - elapsed) / speed)),
    [completed, duration, elapsed, speed]
  );

  if (String(environment || "").toLowerCase() !== "staging") return null;
  if (!order?.tracking_code) return null;

  return (
    <section className="rounded-[32px] border border-emerald-400/20 bg-emerald-500/[0.08] p-6 backdrop-blur-xl">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white ${completed ? "bg-emerald-500" : "bg-sky-500"}`}>
            {completed ? <CheckCircle2 size={21} /> : <Truck size={21} />}
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">Giao Hàng Nhanh</p>
            <h3 className="mt-1 text-lg font-black text-white">
              {completed ? "Đã giao thành công" : "Theo dõi vận chuyển"}
            </h3>
          </div>
        </div>

        <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-300">
          {order.tracking_code}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Trạng thái</p>
          <div className="mt-2 flex items-center gap-2">
            {completed ? <CheckCircle2 size={16} className="text-emerald-300" /> : <Truck size={16} className="text-sky-300" />}
            <p className="text-sm font-black text-white">
              {completed ? "Giao hàng thành công" : simulation?.current_status_label || STATUS_LABELS[current] || "Đang vận chuyển"}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Tiến độ</p>
          <div className="mt-2 flex items-center gap-2">
            <Gauge size={16} className="text-emerald-300" />
            <p className="text-sm font-black text-white">{completed ? 100 : Math.round(progress)}%</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{completed ? "Hoàn tất" : "Thời gian dự kiến"}</p>
          <div className="mt-2 flex items-center gap-2">
            {completed ? <CheckCircle2 size={16} className="text-emerald-300" /> : <Clock3 size={16} className="text-amber-300" />}
            <p className="text-sm font-black text-white">{completed ? "Đã giao" : timeText(remaining)}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-950/50">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-500 via-emerald-400 to-emerald-500 transition-[width] duration-700"
          style={{ width: `${completed ? 100 : progress}%` }}
        />
      </div>

      <OrderDeliveryMap order={order} tracking={order?.tracking} compact />

      {!completed && (
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={onSync}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-200 transition hover:bg-white/[0.1] disabled:opacity-60"
        >
          <RefreshCw size={15} className={busy === "sync" ? "animate-spin" : ""} />
          Đồng bộ trạng thái
        </button>
      )}
    </section>
  );
}