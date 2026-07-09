"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, Settings } from "lucide-react";
import { extractObject, getAdminSettings, updateAdminSettings } from "@/services/admin.service";

export default function AdminSettingsPage() {
  const [form, setForm] = useState({
    site_name: "Dynova Sport",
    hotline: "0866 347 730",
    email: "cskh@dynova.vn",
    address: "TP. Hồ Chí Minh",
    facebook: "",
    instagram: "",
    tiktok: "",
    shipping_note: "Miễn phí giao hàng cho đơn từ 500K",
    return_policy: "Đổi trả 30 ngày",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const res = await getAdminSettings();
        const data = extractObject(res, ["settings"]);
        setForm((prev) => ({ ...prev, ...data }));
      } catch (err) {
        setError(err?.message || "Không thể tải cài đặt. Cần API /api/admin/settings.");
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      setError("");
      await updateAdminSettings(form);
      setNotice("Đã lưu cấu hình website.");
      setTimeout(() => setNotice(""), 1800);
    } catch (err) {
      setError(err?.message || "Không thể lưu cấu hình website.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="grid h-72 place-items-center rounded-[32px] border border-white/10 bg-white/[0.06]"><Loader2 className="animate-spin text-orange-300" size={34}/></div>;
  }

  return <div className="space-y-6">{notice&&<div className="fixed right-5 top-24 z-[120] rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black text-white">{notice}</div>}<section className="rounded-[32px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
    <div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-white">
      <Settings size={22}/></div><div><p className="text-xs font-black uppercase tracking-[0.22em] text-orange-300">Settings</p>
      <h2 className="mt-1 text-2xl font-black text-white">Cấu hình website</h2>
      {/* <p className="mt-1 text-sm font-semibold text-slate-500">Cập nhật thông tin hiển thị ở header, footer và hệ thống.</p> */}
      </div>
      </div></section>{error&&<div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm font-bold text-rose-200">{error}</div>}<form onSubmit={submit} className="rounded-[32px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl"><div className="grid gap-4 md:grid-cols-2"><label><span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-400">Tên website</span><input value={form.site_name} onChange={e=>updateField('site_name',e.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white outline-none"/></label><label><span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-400">Hotline</span><input value={form.hotline} onChange={e=>updateField('hotline',e.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white outline-none"/></label><label><span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-400">Email</span><input value={form.email} onChange={e=>updateField('email',e.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white outline-none"/></label><label><span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-400">Địa chỉ</span><input value={form.address} onChange={e=>updateField('address',e.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white outline-none"/></label><label><span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-400">Facebook</span><input value={form.facebook} onChange={e=>updateField('facebook',e.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white outline-none"/></label><label><span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-400">Instagram</span><input value={form.instagram} onChange={e=>updateField('instagram',e.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white outline-none"/></label><label className="md:col-span-2"><span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-400">Thông báo giao hàng</span><textarea rows={3} value={form.shipping_note} onChange={e=>updateField('shipping_note',e.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white outline-none"/></label><label className="md:col-span-2"><span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-400">Chính sách đổi trả</span><textarea rows={3} value={form.return_policy} onChange={e=>updateField('return_policy',e.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white outline-none"/></label></div><div className="mt-6 flex justify-end"><button disabled={saving} className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-6 py-3 text-sm font-black text-white disabled:opacity-60"><Save size={17}/>{saving?'Đang lưu...':'Lưu cấu hình'}</button></div></form></div>;
}
