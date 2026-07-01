'use client';

import { useEffect, useState } from "react";
import { Edit3, Save, Trash2, Layers, Search, X } from "lucide-react";
import { categoryService } from "@/services/category.service"; 

const emptyForm = { name: "", description: "", image: "", is_active: 1 };

export default function CategoriesAdmin() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(""); 

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryService.getAll();
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Lỗi khi kết nối API danh mục:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const filteredItems = items.filter((item) => {
    const categoryName = item.name ? item.name.toLowerCase() : "";
    return categoryName.includes(query.toLowerCase());
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    const generatedSlug = form.name.trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const itemData = {
      name: form.name.trim(),
      slug: generatedSlug, 
      description: form.description.trim() || null,
      image: form.image.trim() || "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=900",
      is_active: Number(form.is_active),
      sort_order: 0
    };

    try {
      if (editing) {
        await categoryService.update(editing, itemData);
        alert("Cập nhật danh mục thành công!");
      } else {
        await categoryService.create(itemData);
        alert("Tạo danh mục mới thành công!");
      }
      
      setForm(emptyForm);
      setEditing(null);
      fetchCategories(); 
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || "Thao tác thất bại!";
      alert(`Lỗi hệ thống: ${errorMsg}`);
    }
  };

  const handleEdit = (item) => {
    setEditing(item.id); 
    setForm({
      name: item.name || "",
      description: item.description || "",
      image: item.image || "",
      is_active: item.is_active !== undefined ? item.is_active : 1
    });
  };

  const handleCancel = () => {
    setForm(emptyForm);
    setEditing(null);
  };

  const handleRemove = async (id) => {
    if (!confirm("Bạn có chắc chắn muốn xóa danh mục này vĩnh viễn không?")) return;
    try {
      await categoryService.delete(id);
      alert("Đã xóa danh mục thành công!");
      fetchCategories(); 
    } catch (error) {
      alert("Xóa danh mục thất bại!");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500 mb-4"></div>
        <p className="text-xs uppercase tracking-widest text-slate-500">Đang đồng bộ dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-2">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-300">Category MGMT</p>
        <h2 className="mt-2 text-3xl font-black uppercase tracking-wide text-white">Quản lý danh mục</h2>
      </div>

      <form onSubmit={handleSubmit} className="admin-card rounded-3xl p-5 bg-[#161616] border border-[#222222]">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
          {editing ? `Đang chỉnh sửa danh mục: [ID: ${editing}]` : "Thêm danh mục mới"}
        </h3>
        
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Tên danh mục</label>
            <input value={form.name} onChange={(e) => updateField("name", e.target.value)} required className="w-full bg-[#1c1c1c] border border-[#2d2d2d] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-orange-500 transition-all" placeholder="Ví dụ: Giày Chạy Bộ" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Đường dẫn ảnh (URL)</label>
            <input value={form.image} onChange={(e) => updateField("image", e.target.value)} className="w-full bg-[#1c1c1c] border border-[#2d2d2d] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-orange-500 transition-all" placeholder="https://..." />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Trạng thái hiển thị</label>
            <select value={form.is_active} onChange={(e) => updateField("is_active", e.target.value)} className="w-full bg-[#1c1c1c] border border-[#2d2d2d] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-orange-500 transition-all">
              <option value={1}>Hiển thị kích hoạt</option>
              <option value={0}>Ẩn / Khóa tạm thời</option>
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Mô tả danh mục</label>
            <textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} className="w-full bg-[#1c1c1c] border border-[#2d2d2d] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-orange-500 transition-all resize-none h-20" placeholder="Nhập mô tả..." />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button type="submit" className="rounded-2xl bg-orange-500 hover:bg-orange-600 px-5 py-2.5 text-sm font-black text-white flex items-center gap-2 transition-all">
            <Save size={16} /> {editing ? "Lưu thay đổi" : "Tạo danh mục"}
          </button>
          {editing && (
            <button type="button" onClick={handleCancel} className="rounded-2xl border border-[#2d2d2d] text-slate-400 hover:bg-white/5 px-4 py-2.5 text-sm font-medium flex items-center gap-1 transition-colors">
              <X size={16} /> Hủy sửa
            </button>
          )}
        </div>
      </form>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3.5 text-slate-500" size={16} />
        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} className="w-full pl-10 bg-[#161616] border border-[#222222] rounded-xl py-2.5 text-sm text-white outline-none focus:border-orange-500 transition-all" placeholder="Gõ tìm kiếm danh mục..." />
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <article key={item.id} className="admin-card overflow-hidden rounded-3xl bg-[#161616] border border-[#222222] flex flex-col justify-between">
              <div>
                <img src={item.image} alt={item.name} className="h-40 w-full object-cover opacity-80 bg-neutral-900" onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=900"; }} />
                <div className="p-5 space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-black text-orange-300 font-mono">ID: {item.id}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${item.is_active === 1 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {item.is_active === 1 ? 'ACTIVE' : 'HIDDEN'}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white">{item.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">Slug: {item.slug}</p>
                  <p className="line-clamp-2 text-sm text-slate-400">{item.description || 'Không có mô tả.'}</p>
                </div>
              </div>

              <div className="px-5 pb-5">
                <div className="flex gap-2 pt-3 border-t border-[#222222]">
                  <button onClick={() => handleEdit(item)} className="rounded-xl bg-blue-400/10 p-2 text-blue-300 hover:bg-blue-400/20 transition-all"><Edit3 size={16} /></button>
                  <button onClick={() => handleRemove(item.id)} className="rounded-xl bg-rose-400/10 p-2 text-rose-300 hover:bg-rose-400/20 transition-all"><Trash2 size={16} /></button>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="col-span-full bg-[#161616] border border-[#222222] py-16 text-center text-slate-500 rounded-3xl">
            <Layers className="mx-auto mb-3 text-neutral-700" size={32} /> Không tìm thấy danh mục nào.
          </div>
        )}
      </div>
    </div>
  );
}