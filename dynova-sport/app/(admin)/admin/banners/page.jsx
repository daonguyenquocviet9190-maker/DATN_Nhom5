"use client";

import { useEffect, useMemo, useState } from "react";
import { Edit3, Image, ImagePlus, Loader2, Plus, Search, Trash2, X } from "lucide-react";
import { createAdminBanner, deleteAdminBanner, extractItems, getAdminBanners, updateAdminBanner } from "@/services/admin.service";

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/api\/?$/, "").replace(/\/$/, "");
const emptyForm = { title: "", subtitle: "", description: "", button_text: "Mua sắm ngay", button_link: "/shop", sort_order: 1, is_active: true, image: null };

function bannerImage(item) {
  const value = item?.image_url || item?.image || item?.thumbnail || "";
  if (!value) return "";
  if (String(value).startsWith("http")) return value;
  if (String(value).startsWith("/storage/")) return API_ORIGIN + encodeURI(value);
  if (String(value).startsWith("storage/")) return API_ORIGIN + "/" + encodeURI(value);
  return `${API_ORIGIN}/storage/banners/${encodeURIComponent(value)}`;
}

function payload(form) {
  const body = new FormData();
  Object.entries(form).forEach(([k, v]) => {
    if (v === null || v === undefined) return;
    if (k === "image") { if (v) body.append("image", v); return; }
    if (k === "is_active") { body.append(k, v ? "1" : "0"); return; }
    body.append(k, String(v));
  });
  return body;
}

export default function AdminBannersPage() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadData = async () => { try{setLoading(true); const res=await getAdminBanners({per_page:100}); setItems(extractItems(res,["banners"])); setError("");}catch(err){setError(err?.message||"Không thể tải banner."); setItems([])}finally{setLoading(false)}};
  useEffect(()=>{loadData()},[]);
  const filtered = useMemo(()=>{const k=query.trim().toLowerCase(); return items.filter(i=>!k || [i.title,i.subtitle,i.description].filter(Boolean).join(" ").toLowerCase().includes(k))},[items,query]);
  const showNotice=m=>{setNotice(m); setTimeout(()=>setNotice(""),1800)};
  const openCreate=()=>{setEditing(null); setForm(emptyForm); setOpen(true)};
  const openEdit=(i)=>{setEditing(i); setForm({title:i.title||"",subtitle:i.subtitle||i.tagline||"",description:i.description||"",button_text:i.button_text||i.buttonText||"Mua sắm ngay",button_link:i.button_link||i.buttonLink||i.cta_link||"/shop",sort_order:i.sort_order||i.sortOrder||1,is_active:i.is_active!==false&&i.is_active!==0,image:null}); setOpen(true)};
  const submit=async(e)=>{e.preventDefault(); try{setSaving(true); if(editing?.id) await updateAdminBanner(editing.id,payload(form)); else await createAdminBanner(payload(form)); setOpen(false); showNotice(editing?"Đã cập nhật banner.":"Đã thêm banner."); await loadData()}catch(err){setError(err?.message||"Không thể lưu banner.")}finally{setSaving(false)}};
  const remove=async(i)=>{if(!confirm(`Xóa banner "${i.title}"?`))return; try{await deleteAdminBanner(i.id); showNotice("Đã xóa banner."); await loadData()}catch(err){setError(err?.message||"Không thể xóa banner.")}};

  return <div className="space-y-6">{notice&&<div className="fixed right-5 top-24 z-[120] rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black text-white">{notice}</div>}<section className="rounded-[32px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.22em] text-orange-300">Banners</p><h2 className="mt-2 text-2xl font-black text-white">Quản lý banner</h2><p className="mt-1 text-sm font-semibold text-slate-500">Banner trang chủ lấy từ API và ảnh trong storage/banners.</p></div><button onClick={openCreate} className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black text-white"><Plus size={17}/> Thêm banner</button></div><div className="mt-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-slate-400"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-500" placeholder="Tìm banner..."/></div></section>{error&&<div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm font-bold text-rose-200">{error}</div>}<section className="rounded-[32px] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl">{loading?<div className="grid h-72 place-items-center"><Loader2 className="animate-spin text-orange-300" size={34}/></div>:filtered.length===0?<div className="grid h-72 place-items-center text-center"><div><Image className="mx-auto text-orange-300" size={42}/><p className="mt-4 font-black text-white">Chưa có banner</p></div></div>:<div className="grid gap-5 xl:grid-cols-2">{filtered.map(item=><div key={item.id} className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04]"><div className="relative h-56 bg-slate-900">{bannerImage(item)?<img src={bannerImage(item)} alt={item.title} className="h-full w-full object-cover opacity-80"/>:<div className="grid h-full place-items-center text-slate-500">Không có ảnh</div>}<div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 to-transparent"/><div className="absolute bottom-4 left-4 right-4"><p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">{item.subtitle||"Dynova"}</p><h3 className="mt-1 line-clamp-2 text-xl font-black text-white">{item.title}</h3></div></div><div className="flex items-center justify-between gap-3 p-4"><span className={(item.is_active===false||item.is_active===0?"bg-slate-500/10 text-slate-400":"bg-emerald-500/10 text-emerald-300")+" rounded-full px-3 py-1.5 text-xs font-black"}>{item.is_active===false||item.is_active===0?"Ẩn":"Hiển thị"}</span><div className="flex gap-2"><button onClick={()=>openEdit(item)} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.06] text-slate-300 hover:bg-orange-500 hover:text-white"><Edit3 size={16}/></button><button onClick={()=>remove(item)} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.06] text-rose-300 hover:bg-rose-500 hover:text-white"><Trash2 size={16}/></button></div></div></div>)}</div>}</section>{open&&<div className="fixed inset-0 z-[140] bg-slate-950/70 p-4 backdrop-blur-sm"><div className="mx-auto mt-10 max-w-2xl rounded-[32px] border border-white/10 bg-slate-950 p-6"><div className="mb-5 flex items-center justify-between"><h3 className="text-xl font-black text-white">{editing?"Cập nhật banner":"Thêm banner"}</h3><button onClick={()=>setOpen(false)} className="text-slate-400 hover:text-white"><X/></button></div><form onSubmit={submit} className="grid gap-4"><input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white outline-none" placeholder="Tiêu đề"/><input value={form.subtitle} onChange={e=>setForm(p=>({...p,subtitle:e.target.value}))} className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white outline-none" placeholder="Subtitle"/><textarea value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} rows={3} className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white outline-none" placeholder="Mô tả"/><div className="grid gap-4 md:grid-cols-2"><input value={form.button_text} onChange={e=>setForm(p=>({...p,button_text:e.target.value}))} className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white outline-none" placeholder="Text nút"/><input value={form.button_link} onChange={e=>setForm(p=>({...p,button_link:e.target.value}))} className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white outline-none" placeholder="Link nút"/></div><label className="rounded-2xl border border-dashed border-white/10 p-4 text-sm font-bold text-slate-400"><ImagePlus className="mb-2 text-orange-300"/><input type="file" accept="image/*" onChange={e=>setForm(p=>({...p,image:e.target.files?.[0]||null}))}/></label><label className="flex items-center gap-3 text-sm font-bold text-slate-300"><input type="checkbox" checked={form.is_active} onChange={e=>setForm(p=>({...p,is_active:e.target.checked}))}/> Hiển thị banner</label><button disabled={saving} className="rounded-2xl bg-orange-500 px-5 py-3 font-black text-white disabled:opacity-60">{saving?"Đang lưu...":"Lưu banner"}</button></form></div></div>}</div>;
}
