"use client";

import { useEffect, useState } from "react";
import { Edit3, Plus, Save, Trash2 } from "lucide-react";
import { getCategories, saveCategories } from "@/utils/shopStorage";

const empty = { id: "", name: "", description: "", image: "" };

export default function CategoriesAdmin() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  useEffect(() => { setItems(getCategories()); }, []);
  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const submit = (event) => { event.preventDefault(); const id = editing || form.id || form.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); const item = { ...form, id, image: form.image || "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=900&auto=format&fit=crop&q=80" }; const next = editing ? items.map((cat) => cat.id === editing ? item : cat) : [item, ...items]; setItems(next); saveCategories(next); setForm(empty); setEditing(null); };
  const edit = (item) => { setEditing(item.id); setForm(item); };
  const remove = (id) => { const next = items.filter((item) => item.id !== id); setItems(next); saveCategories(next); };
  return <div className="space-y-6"><div><p className="text-xs font-black uppercase tracking-[0.25em] text-orange-300">Category MGMT</p><h2 className="mt-2 text-3xl font-black">Quản lý danh mục</h2><p className="mt-2 text-sm text-slate-400">Cấu hình danh mục dùng cho trang chủ, shop và bộ lọc sản phẩm.</p></div><form onSubmit={submit} className="admin-card rounded-3xl p-5"><div className="grid gap-4 md:grid-cols-4"><input value={form.name} onChange={(e) => update("name", e.target.value)} required className="admin-input" placeholder="Tên danh mục" /><input value={form.id} onChange={(e) => update("id", e.target.value)} className="admin-input" placeholder="Slug" disabled={!!editing} /><input value={form.image} onChange={(e) => update("image", e.target.value)} className="admin-input md:col-span-2" placeholder="URL hình ảnh" /><textarea value={form.description} onChange={(e) => update("description", e.target.value)} className="admin-input md:col-span-4" placeholder="Mô tả" /></div><button className="mt-4 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black text-white"><Save className="mr-2 inline" size={16} /> {editing ? "Lưu danh mục" : "Tạo danh mục"}</button></form><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{items.map((item) => <article key={item.id} className="admin-card overflow-hidden rounded-3xl"><img src={item.image} alt={item.name} className="h-40 w-full object-cover opacity-80" /><div className="p-5"><p className="text-xs font-black uppercase tracking-wider text-orange-300">{item.id}</p><h3 className="mt-1 text-xl font-black">{item.name}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">{item.description}</p><div className="mt-4 flex gap-2"><button onClick={() => edit(item)} className="rounded-xl bg-blue-400/10 p-2 text-blue-300"><Edit3 size={16} /></button><button onClick={() => remove(item.id)} className="rounded-xl bg-rose-400/10 p-2 text-rose-300"><Trash2 size={16} /></button></div></div></article>)}</div></div>;
}
