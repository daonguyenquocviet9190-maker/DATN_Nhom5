"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Edit3,
  Loader2,
  Percent,
  Plus,
  Search,
  TicketPercent,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import {
  createAdminPromotion,
  deleteAdminPromotion,
  extractItems,
  getAdminPromotions,
  updateAdminPromotion,
} from "@/services/admin.service";
import { formatCurrency } from "@/data/shop";

const EMPTY_FORM = {
  code: "",
  title: "",
  description: "",
  discount_type: "fixed",
  discount_value: "",
  min_order_value: "",
  max_discount: "",
  usage_limit: "",
  per_user_limit: "",
  start_date: "",
  end_date: "",
  is_active: true,
};

function toDateInput(value) {
  if (!value) return "";
  const text = String(value);
  return text.length >= 10 ? text.slice(0, 10) : text;
}

function toNumberOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export default function AdminPromotionsPage() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  async function load() {
    try {
      setLoading(true);
      setError("");
      const response = await getAdminPromotions({ per_page: 200 });
      setItems(extractItems(response, ["promotions"]));
    } catch (err) {
      setItems([]);
      setError(err?.message || "Không thể tải danh sách mã giảm giá.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter((item) =>
      [item?.code, item?.title, item?.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [items, query]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setNotice("");
    setModalOpen(true);
  }

  function openEdit(item) {
    setEditingId(item.id);
    setForm({
      code: item.code || "",
      title: item.title || "",
      description: item.description || "",
      discount_type: item.discount_type || "fixed",
      discount_value: item.discount_value ?? "",
      min_order_value: item.min_order_value ?? "",
      max_discount: item.max_discount ?? "",
      usage_limit: item.usage_limit ?? "",
      per_user_limit: item.per_user_limit ?? "",
      start_date: toDateInput(item.start_date),
      end_date: toDateInput(item.end_date),
      is_active: Boolean(item.is_active),
    });
    setNotice("");
    setModalOpen(true);
  }

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.code.trim() || !form.title.trim() || !form.discount_value) {
      setNotice("Vui lòng nhập mã, tên chương trình và mức giảm.");
      return;
    }

    const payload = {
      code: form.code.trim().toUpperCase(),
      title: form.title.trim(),
      description: form.description.trim() || null,
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      min_order_value: Number(form.min_order_value || 0),
      max_discount: toNumberOrNull(form.max_discount),
      usage_limit: toNumberOrNull(form.usage_limit),
      per_user_limit: toNumberOrNull(form.per_user_limit),
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      is_active: Boolean(form.is_active),
    };

    try {
      setSubmitting(true);
      setNotice("");
      if (editingId) {
        await updateAdminPromotion(editingId, payload);
      } else {
        await createAdminPromotion(payload);
      }
      setModalOpen(false);
      setNotice(editingId ? "Đã cập nhật mã giảm giá." : "Đã tạo mã giảm giá.");
      await load();
    } catch (err) {
      setNotice(err?.message || "Không thể lưu mã giảm giá.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Bạn có chắc muốn xóa/tắt mã "${item.code}"?`)) return;
    try {
      setNotice("");
      const response = await deleteAdminPromotion(item.id);
      setNotice(response?.message || "Đã xử lý mã giảm giá.");
      await load();
    } catch (err) {
      setNotice(err?.message || "Không thể xóa mã giảm giá.");
    }
  }

  return (
    <div className="space-y-6 p-6 text-slate-100">
      <section className="rounded-[28px] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-400">Promotions</p>
            <h1 className="mt-2 text-2xl font-black text-white">Quản lý mã giảm giá</h1>
            <p className="mt-1 text-sm font-semibold text-slate-400">Tạo, chỉnh sửa, giới hạn lượt dùng và thời gian áp dụng voucher.</p>
          </div>
          <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black text-white transition hover:bg-orange-600">
            <Plus size={18} /> Thêm mã mới
          </button>
        </div>

        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
          <Search size={18} className="text-slate-500" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-600" placeholder="Tìm theo mã, tên hoặc mô tả..." />
          {query && <button onClick={() => setQuery("")} className="text-xs font-bold text-slate-400 hover:text-white">Xóa</button>}
        </div>
      </section>

      {notice && <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 px-4 py-3 text-sm font-bold text-orange-100">{notice}</div>}
      {error && <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-200">{error}</div>}

      <section className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] backdrop-blur-xl">
        {loading ? (
          <div className="grid h-72 place-items-center"><Loader2 className="animate-spin text-orange-400" size={34} /></div>
        ) : filtered.length === 0 ? (
          <div className="grid h-72 place-items-center text-center"><div><TicketPercent className="mx-auto text-orange-400" size={42} /><p className="mt-4 font-black text-white">Chưa có mã giảm giá</p></div></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4">Mã / chương trình</th>
                  <th className="px-5 py-4">Mức giảm</th>
                  <th className="px-5 py-4">Đơn tối thiểu</th>
                  <th className="px-5 py-4">Lượt dùng</th>
                  <th className="px-5 py-4">Trạng thái</th>
                  <th className="px-5 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((item) => {
                  const percent = item.discount_type === "percent";
                  return (
                    <tr key={item.id} className="hover:bg-white/[0.025]">
                      <td className="px-5 py-4">
                        <p className="font-mono text-base font-black tracking-wider text-orange-400">{item.code}</p>
                        <p className="mt-1 font-bold text-white">{item.title || "Mã giảm giá"}</p>
                      </td>
                      <td className="px-5 py-4 font-black text-emerald-400">
                        {percent ? <span className="inline-flex items-center gap-1"><Percent size={14} />{Number(item.discount_value || 0)}%</span> : formatCurrency(Number(item.discount_value || 0))}
                      </td>
                      <td className="px-5 py-4 text-slate-300">{Number(item.min_order_value || 0) > 0 ? formatCurrency(Number(item.min_order_value)) : "Không yêu cầu"}</td>
                      <td className="px-5 py-4 text-slate-300">{Number(item.used_count || 0)} / {item.usage_limit || "∞"}</td>
                      <td className="px-5 py-4">
                        {item.is_active ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-300"><CheckCircle2 size={13} /> Hoạt động</span> : <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 px-3 py-1 text-xs font-black text-slate-400"><XCircle size={13} /> Đã tắt</span>}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openEdit(item)} className="rounded-xl border border-white/10 p-2 text-slate-300 hover:border-orange-500/30 hover:text-orange-300" title="Chỉnh sửa"><Edit3 size={16} /></button>
                          <button onClick={() => handleDelete(item)} className="rounded-xl border border-white/10 p-2 text-slate-300 hover:border-rose-500/30 hover:text-rose-300" title="Xóa hoặc tắt"><Trash2 size={16} /></button>
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

      {modalOpen && (
        <div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
          <div className="my-8 w-full max-w-2xl rounded-[28px] border border-white/10 bg-slate-950 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs font-black uppercase tracking-[0.2em] text-orange-400">Voucher</p><h2 className="mt-1 text-xl font-black text-white">{editingId ? "Chỉnh sửa mã giảm giá" : "Tạo mã giảm giá mới"}</h2></div>
              <button onClick={() => setModalOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-white/5 hover:text-white"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2"><span className="text-xs font-black uppercase text-slate-400">Mã code *</span><input value={form.code} onChange={(e) => updateField("code", e.target.value.toUpperCase())} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-bold text-white outline-none focus:border-orange-500/50" placeholder="DYNOVA50K" /></label>
              <label className="grid gap-2"><span className="text-xs font-black uppercase text-slate-400">Tên chương trình *</span><input value={form.title} onChange={(e) => updateField("title", e.target.value)} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-orange-500/50" placeholder="Giảm 50K" /></label>
              <label className="grid gap-2"><span className="text-xs font-black uppercase text-slate-400">Loại giảm *</span><select value={form.discount_type} onChange={(e) => updateField("discount_type", e.target.value)} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"><option value="fixed">Số tiền</option><option value="percent">Phần trăm</option></select></label>
              <label className="grid gap-2"><span className="text-xs font-black uppercase text-slate-400">Giá trị giảm *</span><input type="number" min="0" value={form.discount_value} onChange={(e) => updateField("discount_value", e.target.value)} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-orange-500/50" /></label>
              <label className="grid gap-2"><span className="text-xs font-black uppercase text-slate-400">Đơn tối thiểu</span><input type="number" min="0" value={form.min_order_value} onChange={(e) => updateField("min_order_value", e.target.value)} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-orange-500/50" /></label>
              <label className="grid gap-2"><span className="text-xs font-black uppercase text-slate-400">Giảm tối đa</span><input type="number" min="0" value={form.max_discount} onChange={(e) => updateField("max_discount", e.target.value)} disabled={form.discount_type !== "percent"} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none disabled:opacity-40" /></label>
              <label className="grid gap-2"><span className="text-xs font-black uppercase text-slate-400">Tổng lượt dùng</span><input type="number" min="1" value={form.usage_limit} onChange={(e) => updateField("usage_limit", e.target.value)} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" /></label>
              <label className="grid gap-2"><span className="text-xs font-black uppercase text-slate-400">Lượt / khách</span><input type="number" min="1" value={form.per_user_limit} onChange={(e) => updateField("per_user_limit", e.target.value)} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" /></label>
              <label className="grid gap-2"><span className="text-xs font-black uppercase text-slate-400">Bắt đầu</span><input type="date" value={form.start_date} onChange={(e) => updateField("start_date", e.target.value)} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" /></label>
              <label className="grid gap-2"><span className="text-xs font-black uppercase text-slate-400">Kết thúc</span><input type="date" value={form.end_date} onChange={(e) => updateField("end_date", e.target.value)} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" /></label>
              <label className="sm:col-span-2 grid gap-2"><span className="text-xs font-black uppercase text-slate-400">Mô tả</span><textarea rows={3} value={form.description} onChange={(e) => updateField("description", e.target.value)} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" /></label>
              <label className="sm:col-span-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"><input type="checkbox" checked={form.is_active} onChange={(e) => updateField("is_active", e.target.checked)} /><span className="text-sm font-bold text-slate-200">Cho phép sử dụng mã ngay</span></label>
              {notice && <p className="sm:col-span-2 text-sm font-bold text-orange-300">{notice}</p>}
              <div className="sm:col-span-2 flex justify-end gap-3 pt-2"><button type="button" onClick={() => setModalOpen(false)} className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-black text-slate-300">Hủy</button><button disabled={submitting} className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black text-white disabled:opacity-60">{submitting && <Loader2 size={16} className="animate-spin" />}{editingId ? "Lưu thay đổi" : "Tạo mã"}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
