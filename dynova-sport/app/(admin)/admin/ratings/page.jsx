"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, EyeOff, Loader2, Search, ShieldCheck, Star, Trash2 } from "lucide-react";
import {
  deleteAdminRating,
  extractItems,
  getAdminRatings,
  updateAdminRatingStatus,
} from "@/services/admin.service";

export default function AdminRatingsPage() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState(null);

  async function load() {
    try {
      setLoading(true);
      setError("");
      const response = await getAdminRatings({ per_page: 200 });
      setItems(extractItems(response, ["ratings", "reviews"]));
    } catch (err) {
      setItems([]);
      setError(err?.message || "Không thể tải danh sách đánh giá.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesKeyword = !keyword || [item?.content, item?.customer_name, item?.customer_email, item?.product_name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword);
      const matchesStatus = status === "all" || (item?.status || "approved") === status;
      return matchesKeyword && matchesStatus;
    });
  }, [items, query, status]);

  async function changeStatus(item, nextStatus) {
    try {
      setBusyId(item.id);
      setNotice("");
      await updateAdminRatingStatus(item.id, nextStatus);
      setItems((prev) => prev.map((row) => row.id === item.id ? { ...row, status: nextStatus } : row));
      setNotice("Đã cập nhật trạng thái đánh giá.");
    } catch (err) {
      setNotice(err?.message || "Không thể cập nhật đánh giá.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(item) {
    if (!window.confirm("Bạn có chắc muốn xóa đánh giá này?")) return;
    try {
      setBusyId(item.id);
      await deleteAdminRating(item.id);
      setItems((prev) => prev.filter((row) => row.id !== item.id));
      setNotice("Đã xóa đánh giá.");
    } catch (err) {
      setNotice(err?.message || "Không thể xóa đánh giá.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-300">Ratings</p>
        <h2 className="mt-2 text-2xl font-black text-white">Quản lý đánh giá</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">Theo dõi, duyệt, ẩn hoặc xóa đánh giá sản phẩm.</p>
        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_190px]">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-slate-400">
            <Search size={18} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-500" placeholder="Tìm đánh giá..." />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-bold text-white outline-none">
            <option value="all">Tất cả trạng thái</option>
            <option value="approved">Đã duyệt</option>
            <option value="pending">Chờ duyệt</option>
            <option value="hidden">Đã ẩn</option>
          </select>
        </div>
      </section>

      {notice && <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4 text-sm font-bold text-orange-100">{notice}</div>}
      {error && <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm font-bold text-rose-200">{error}</div>}

      <section className="rounded-[32px] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl">
        {loading ? (
          <div className="grid h-72 place-items-center"><Loader2 className="animate-spin text-orange-300" size={34} /></div>
        ) : filtered.length === 0 ? (
          <div className="grid h-72 place-items-center text-center"><div><Star className="mx-auto text-orange-300" size={42} /><p className="mt-4 font-black text-white">Chưa có đánh giá phù hợp</p></div></div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filtered.map((item) => {
              const itemStatus = item.status || "approved";
              const verified = Boolean(item.order_item_id || item.verified_purchase);
              return (
                <article key={item.id} className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-white">{item.customer_name || item.user_name || "Khách hàng"}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.customer_email || ""}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-black text-amber-300"><Star size={13} className="fill-amber-400" />{item.rating || 0}</span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-orange-300">{item.product_name || "Sản phẩm"}</p>
                    {verified && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-black text-emerald-300"><ShieldCheck size={12} /> Đã mua hàng</span>}
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${itemStatus === "approved" ? "bg-emerald-500/10 text-emerald-300" : itemStatus === "hidden" ? "bg-slate-500/10 text-slate-400" : "bg-amber-500/10 text-amber-300"}`}>{itemStatus === "approved" ? "Đã duyệt" : itemStatus === "hidden" ? "Đã ẩn" : "Chờ duyệt"}</span>
                  </div>

                  <p className="mt-4 min-h-12 text-sm leading-6 text-slate-300">{item.content || "Không có nội dung"}</p>
                  <p className="mt-3 text-xs text-slate-600">{item.created_at || ""}</p>

                  <div className="mt-4 flex flex-wrap gap-2 border-t border-white/5 pt-4">
                    {itemStatus !== "approved" && <button disabled={busyId === item.id} onClick={() => changeStatus(item, "approved")} className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-black text-emerald-300 disabled:opacity-50"><CheckCircle2 size={14} /> Duyệt</button>}
                    {itemStatus !== "hidden" && <button disabled={busyId === item.id} onClick={() => changeStatus(item, "hidden")} className="inline-flex items-center gap-1 rounded-xl bg-slate-500/10 px-3 py-2 text-xs font-black text-slate-300 disabled:opacity-50"><EyeOff size={14} /> Ẩn</button>}
                    <button disabled={busyId === item.id} onClick={() => remove(item)} className="ml-auto inline-flex items-center gap-1 rounded-xl bg-rose-500/10 px-3 py-2 text-xs font-black text-rose-300 disabled:opacity-50"><Trash2 size={14} /> Xóa</button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
