"use client";

import { useEffect, useMemo, useState } from "react";
import { Edit3, ImagePlus, Loader2, Plus, Search, Tags, Trash2, X } from "lucide-react";
import { CATEGORY_FALLBACK, getCategoryImage } from "@/utils/imageUrl";
import { createAdminCategory, deleteAdminCategory, extractItems, getAdminCategories, updateAdminCategory } from "@/services/admin.service";

const emptyForm = { name: "", slug: "", description: "", is_active: true, image: null };

function buildPayload(form) {
  const body = new FormData();
  body.append("name", form.name || "");
  body.append("slug", form.slug || "");
  body.append("description", form.description || "");
  body.append("is_active", form.is_active ? "1" : "0");
  if (form.image) body.append("image", form.image);
  return body;
}

export default function AdminCategoriesPage() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getAdminCategories({ per_page: 200 });
      setItems(extractItems(response, ["categories"]));
    } catch (err) {
      setError(err?.message || "Không thể tải danh mục.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return items.filter((item) => !keyword || [item.name, item.slug, item.description].filter(Boolean).join(" ").toLowerCase().includes(keyword));
  }, [items, query]);

  const showNotice = (message) => { setNotice(message); setTimeout(() => setNotice(""), 1800); };

  const openCreate = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (item) => { setEditing(item); setForm({ name: item.name || "", slug: item.slug || "", description: item.description || "", is_active: item.is_active !== false && item.is_active !== 0, image: null }); setOpen(true); };

  const submit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      const payload = buildPayload(form);
      if (editing?.id) await updateAdminCategory(editing.id, payload);
      else await createAdminCategory(payload);
      setOpen(false);
      showNotice(editing ? "Đã cập nhật danh mục." : "Đã thêm danh mục.");
      await loadData();
    } catch (err) {
      setError(err?.message || "Không thể lưu danh mục. Kiểm tra API admin/categories.");
    } finally { setSaving(false); }
  };

  const remove = async (item) => {
    if (!confirm(`Xóa danh mục "${item.name}"?`)) return;
    try { await deleteAdminCategory(item.id); showNotice("Đã xóa danh mục."); await loadData(); }
    catch (err) { setError(err?.message || "Không thể xóa danh mục."); }
  };

  return (
    <div className="space-y-6">
      {notice && <div className="fixed right-5 top-24 z-[120] rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black text-white">{notice}</div>}
      <section className="rounded-[32px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div><p className="text-xs font-black uppercase tracking-[0.22em] text-orange-300">Categories</p><h2 className="mt-2 text-2xl font-black text-white">Quản lý danh mục</h2>
          {/* <p className="mt-1 text-sm font-semibold text-slate-500">Danh mục sản phẩm hiển thị ngoài website.</p> */}
          </div>
          <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black text-white"><Plus size={17}/> Thêm danh mục</button>
        </div>
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-slate-400"><Search size={18}/><input value={query} onChange={(e)=>setQuery(e.target.value)} className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-500" placeholder="Tìm danh mục..." /></div>
      </section>
      {error && <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm font-bold text-rose-200">{error}</div>}
      <section className="rounded-[32px] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl">
        {loading ? <div className="grid h-64 place-items-center"><Loader2 className="animate-spin text-orange-300" size={34}/></div> : filtered.length === 0 ? <div className="grid h-64 place-items-center text-center"><div><Tags className="mx-auto text-orange-300" size={40}/><p className="mt-3 font-black text-white">Chưa có danh mục</p></div></div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item)=><div key={item.id} className="rounded-[26px] border border-white/10 bg-white/[0.04] p-4">
            <div className="flex gap-4"><img src={getCategoryImage(item)} onError={(e)=>{e.currentTarget.src=CATEGORY_FALLBACK}} alt={item.name} className="h-20 w-20 rounded-2xl object-cover"/><div className="min-w-0 flex-1"><p className="truncate text-base font-black text-white">{item.name}</p><p className="mt-1 line-clamp-2 text-sm text-slate-500">{item.description || "Chưa có mô tả"}</p><span className={(item.is_active === false || item.is_active === 0 ? "bg-slate-500/10 text-slate-400" : "bg-emerald-500/10 text-emerald-300") + " mt-3 inline-flex rounded-full px-3 py-1 text-xs font-black"}>{item.is_active === false || item.is_active === 0 ? "Ẩn" : "Hiển thị"}</span></div></div>
            <div className="mt-4 flex gap-2"><button onClick={()=>openEdit(item)} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white/[0.06] px-4 py-3 text-sm font-bold text-slate-300 hover:bg-orange-500 hover:text-white"><Edit3 size={16}/> Sửa</button><button onClick={()=>remove(item)} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.06] text-rose-300 hover:bg-rose-500 hover:text-white"><Trash2 size={16}/></button></div>
          </div>)}
        </div>}
      </section>
      {open && <div className="fixed inset-0 z-[140] bg-slate-950/70 p-4 backdrop-blur-sm"><div className="mx-auto mt-10 max-w-2xl rounded-[32px] border border-white/10 bg-slate-950 p-6"><div className="mb-5 flex items-center justify-between"><h3 className="text-xl font-black text-white">{editing ? "Cập nhật danh mục" : "Thêm danh mục"}</h3><button onClick={()=>setOpen(false)} className="text-slate-400 hover:text-white"><X/></button></div><form onSubmit={submit} className="grid gap-4"><input value={form.name} onChange={(e)=>setForm(p=>({...p,name:e.target.value}))} className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white outline-none" placeholder="Tên danh mục"/><input value={form.slug} onChange={(e)=>setForm(p=>({...p,slug:e.target.value}))} className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white outline-none" placeholder="Slug"/><textarea value={form.description} onChange={(e)=>setForm(p=>({...p,description:e.target.value}))} rows={3} className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white outline-none" placeholder="Mô tả"/><label className="rounded-2xl border border-dashed border-white/10 p-4 text-sm font-bold text-slate-400"><ImagePlus className="mb-2 text-orange-300"/><input type="file" accept="image/*" onChange={(e)=>setForm(p=>({...p,image:e.target.files?.[0] || null}))}/></label><label className="flex items-center gap-3 text-sm font-bold text-slate-300"><input type="checkbox" checked={form.is_active} onChange={(e)=>setForm(p=>({...p,is_active:e.target.checked}))}/> Hiển thị danh mục</label><button disabled={saving} className="rounded-2xl bg-orange-500 px-5 py-3 font-black text-white disabled:opacity-60">{saving ? "Đang lưu..." : "Lưu danh mục"}</button></form></div></div>}
    </div>
  );
}
