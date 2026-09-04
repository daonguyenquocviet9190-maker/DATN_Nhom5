"use client";

import { CheckCircle2, Clock3, MapPin, PackageCheck, RefreshCcw, Truck } from "lucide-react";
import OrderDeliveryMap from "@/components/orders/OrderDeliveryMap";

const LABELS = {
  ready_to_pick: "Đã tạo vận đơn", picking: "GHN đang đến lấy hàng", money_collect_picking: "GHN đang làm việc với người gửi",
  picked: "GHN đã lấy hàng", storing: "Đã nhập kho GHN", transporting: "Đang trung chuyển", sorting: "Đang phân loại tại kho",
  delivering: "Đang giao đến bạn", money_collect_delivering: "Đang giao và thu hộ", delivered: "Giao hàng thành công",
  delivery_fail: "Giao hàng chưa thành công", waiting_to_return: "Đang chờ xử lý giao lại", return: "Đang chuẩn bị hoàn hàng",
  return_transporting: "Hàng hoàn đang trung chuyển", return_sorting: "Hàng hoàn đang phân loại", returning: "Đang hoàn về người gửi",
  return_fail: "Hoàn hàng chưa thành công", returned: "Đã hoàn hàng", cancel: "Vận đơn đã hủy", exception: "Đang xử lý ngoại lệ",
  damage: "Hàng hóa được ghi nhận hư hỏng", lost: "Hàng hóa được ghi nhận thất lạc",
};

const DESCRIPTIONS = {
  ready_to_pick: "Đơn vị vận chuyển đã tiếp nhận thông tin vận đơn.", picking: "Nhân viên GHN đang di chuyển đến điểm lấy hàng.",
  picked: "Kiện hàng đã được bàn giao cho GHN.", storing: "Kiện hàng đã được nhập vào kho vận chuyển.",
  transporting: "Kiện hàng đang di chuyển giữa các trung tâm khai thác.", sorting: "Kiện hàng đang được phân loại để chuyển tới khu vực giao.",
  delivering: "Shipper đang trên đường giao kiện hàng tới địa chỉ nhận.", delivered: "Người nhận đã nhận kiện hàng thành công.",
  delivery_fail: "Lần giao hiện tại chưa thành công và sẽ được xử lý tiếp.",
};

const STEPS = [
  { key: "created", label: "Đã tạo vận đơn", icon: PackageCheck },
  { key: "picked", label: "GHN đã lấy hàng", icon: PackageCheck },
  { key: "transport", label: "Đang vận chuyển", icon: Truck },
  { key: "delivering", label: "Đang giao", icon: Truck },
  { key: "delivered", label: "Đã giao", icon: CheckCircle2 },
];

const STAGE = {
  ready_to_pick: 0, picking: 0, money_collect_picking: 0,
  picked: 1, storing: 1,
  transporting: 2, sorting: 2,
  delivering: 3, money_collect_delivering: 3,
  delivery_fail: 3, waiting_to_return: 3,
  delivered: 4,
};

function dateText(value) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString("vi-VN");
}

function normalizeEvent(e = {}) {
  const status = String(e?.status || "").toLowerCase();
  return {
    status,
    title: e?.status_label || e?.description || LABELS[status] || "Cập nhật vận chuyển",
    description: e?.description || DESCRIPTIONS[status] || "Trạng thái vận chuyển đã được cập nhật.",
    time: e?.updated_date || e?.occurred_at || e?.created_at || null,
    location: e?.location || null,
    source: e?.source || e?.provider || null,
  };
}

function eventsOf(order, tracking) {
  const rows = [
    ...(Array.isArray(tracking?.logs) ? tracking.logs : []),
    ...(Array.isArray(order?.shipping_status_history) ? order.shipping_status_history : []),
  ]
    .map(normalizeEvent)
    .filter((x) => x.status);

  const seen = new Set();
  return rows
    .filter((x) => {
      const k = `${x.status}|${x.time || ""}|${x.source || ""}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .sort(
      (a, b) =>
        (b.time ? new Date(b.time).getTime() : 0) -
        (a.time ? new Date(a.time).getTime() : 0)
    );
}

export default function OrderTrackingTimeline({
  order,
  tracking,
  onRefresh,
  refreshing = false,
}) {
  if (!order?.tracking_code && !tracking) return null;

  const events = eventsOf(order, tracking);
  const current = String(
    tracking?.status || order?.ghn_status || events?.[0]?.status || "ready_to_pick"
  ).toLowerCase();
  const stage = STAGE[current] ?? 0;
  const progress = Math.max(0, Math.min(100, Math.round((stage / (STEPS.length - 1)) * 100)));
  const expected =
    tracking?.expected_delivery_time || tracking?.leadtime || order?.ghn_expected_delivery_at;
  const updated =
    tracking?.updated_date || order?.ghn_last_synced_at || events?.[0]?.time;

  // Map should be visible from the moment GHN has a tracking code.
  // OrderDeliveryMap decides whether enough location data exists to draw the route/marker.
  const canShowDeliveryMap = Boolean(
    order?.tracking_code || tracking?.order_code || tracking?.delivery_map
  );

  return (
    <div className="mt-6 overflow-hidden rounded-[30px] border border-indigo-100 bg-white shadow-sm">
      <div className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-orange-50 p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
              <Truck size={22} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-500">
                Giao Hàng Nhanh
              </p>
              <h3 className="mt-1 text-lg font-black text-slate-950">
                {tracking?.status_label || LABELS[current] || current}
              </h3>
              <p className="mt-1 break-all text-sm font-bold text-slate-600">
                Mã vận đơn: <span className="text-indigo-700">{order?.tracking_code || tracking?.order_code}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-indigo-200 bg-white px-4 py-2.5 text-xs font-black text-indigo-700 transition hover:bg-indigo-50 disabled:opacity-60"
          >
            <RefreshCcw size={15} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Đang cập nhật" : "Làm mới trạng thái"}
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-100 bg-white/80 p-3.5">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Dự kiến giao</p>
            <p className="mt-1 text-sm font-black text-slate-800">
              {expected ? dateText(expected) : "Đang cập nhật từ GHN"}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white/80 p-3.5">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Cập nhật gần nhất</p>
            <p className="mt-1 text-sm font-black text-slate-800">
              {updated ? dateText(updated) : "Chưa có dữ liệu"}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 md:p-6">
        <div className="mb-6 rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Tiến trình giao hàng</p>
            <span className="text-sm font-black text-indigo-700">{progress}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-5">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const done = index < stage || stage === 4;
            const active = index === stage && stage < 4;
            return (
              <div key={step.key} className="relative">
                {index < STEPS.length - 1 && (
                  <div
                    className={`absolute left-6 top-6 hidden h-0.5 w-[calc(100%-1.5rem)] md:block ${
                      index < stage ? "bg-indigo-500" : "bg-slate-200"
                    }`}
                  />
                )}
                <div className="relative z-10 flex items-center gap-3 md:block">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-4 border-white shadow-sm ${
                      done
                        ? "bg-emerald-500 text-white"
                        : active
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {done ? <CheckCircle2 size={20} /> : <Icon size={19} />}
                  </div>
                  <p
                    className={`text-xs font-black md:mt-2 ${
                      done || active ? "text-slate-800" : "text-slate-400"
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {canShowDeliveryMap && (
          <section className="mt-7 overflow-hidden rounded-3xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 md:px-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-500">Bản đồ giao hàng</p>
                <p className="mt-1 text-sm font-bold text-slate-600">
                  {current === "delivering" || current === "money_collect_delivering"
                    ? "Shipper đang trên đường giao hàng."
                    : "Theo dõi vị trí và hành trình đơn hàng."}
                </p>
              </div>
              <MapPin className="shrink-0 text-indigo-600" size={20} />
            </div>
            <div className="min-h-[280px] bg-slate-50">
              <OrderDeliveryMap order={order} tracking={tracking} />
            </div>
          </section>
        )}

        <div className="mt-7 border-t border-slate-100 pt-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Hành trình kiện hàng</p>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
              {events.length} cập nhật
            </span>
          </div>

          {events.length === 0 ? (
            <div className="mt-4 flex gap-3 rounded-2xl bg-slate-50 p-4">
              <Clock3 className="mt-0.5 shrink-0 text-slate-400" size={18} />
              <p className="text-sm font-semibold leading-6 text-slate-500">
                GHN đã tiếp nhận vận đơn. Hành trình chi tiết sẽ xuất hiện khi có cập nhật mới.
              </p>
            </div>
          ) : (
            <div className="mt-4">
              {events.map((e, index) => (
                <div
                  key={`${e.status}-${e.time || index}-${index}`}
                  className="relative flex gap-4 pb-5 last:pb-0"
                >
                  {index < events.length - 1 && (
                    <span className="absolute left-[7px] top-5 h-[calc(100%-4px)] w-px bg-slate-200" />
                  )}
                  <span
                    className={`relative z-10 mt-1.5 h-[15px] w-[15px] shrink-0 rounded-full border-4 border-white ring-1 ${
                      index === 0
                        ? "bg-indigo-600 ring-indigo-200"
                        : "bg-slate-300 ring-slate-200"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                      <div>
                        <p className={`text-sm font-black ${index === 0 ? "text-indigo-700" : "text-slate-800"}`}>
                          {e.title}
                        </p>
                        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{e.description}</p>
                        {e.location && (
                          <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-slate-400">
                            <MapPin size={12} />
                            {e.location}
                          </p>
                        )}
                      </div>
                      {e.time && (
                        <span className="shrink-0 text-[11px] font-bold text-slate-400">{dateText(e.time)}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tracking?.sync_error && (
            <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-700">
              Kết nối GHN tạm thời chưa cập nhật được. Hệ thống đang hiển thị lịch sử vận chuyển đã lưu gần nhất.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}