'use client';

import { useEffect, useState } from "react";
import { Edit3, Save, Trash2, Layers } from "lucide-react";
import { categoryService } from "@/services/category.service"; // Import file dịch vụ danh mục của bạn

const empty = { id: "", name: "", description: "", image: "", status: "Hiển thị" };

export default function CategoriesAdmin() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hàm gọi API lấy danh sách danh mục từ Laravel
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryService.getAll();
      setItems(data);
    } catch (error) {
      console.error("Lỗi khi kết nối API lấy danh sách danh mục:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  // Hàm xử lý Thêm / Sửa qua API
  const submit = async (event) => {
    event.preventDefault();
    
    // Tự động tạo slug nếu không nhập id/slug (Xử lý tiếng Việt chuẩn)
    const generatedSlug = form.id || form.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const itemData = {
      ...form,
      slug: generatedSlug, // Laravel thường dùng cột 'slug'
      id: generatedSlug,
      image: form.image || "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=900&auto=format&fit=crop&q=80"
    };

    try {
      if (editing) {
        // Gọi API PUT cập nhật danh mục
        await categoryService.update(editing, itemData);
        alert("Cập nhật danh mục thành công!");
      } else {
        // Gọi API POST thêm mới danh mục
        await categoryService.create(itemData);
        alert("Tạo danh mục mới thành công!");
      }
      setForm(empty);
      setEditing(null);
      fetchCategories(); // Tải lại dữ liệu mới nhất từ Database
    } catch (error) {
      alert("Lưu danh mục thất bại. Vui lòng kiểm tra lại kết nối backend.");
      console.error(error);
    }
  };

  const edit = (item) => {
    setEditing(item.id);
    setForm({
      id: item.id || item.slug || "",
      name: item.name || "",
      description: item.description || "",
      image: item.image || item.image_url || "",
      status: item.status || "Hiển thị"
    });
  };

  // Hàm xử lý Xóa qua API
  const remove = async (id) => {
    if (confirm("Bạn có chắc chắn muốn xóa danh mục này vĩnh viễn khỏi Database?")) {
      try {
        await categoryService.delete(id);
        alert("Đã xóa danh mục thành công!");
        fetchCategories(); // Cập nhật lại danh sách sau khi xóa
      } catch (error) {
        alert("Xóa danh mục thất bại.");
        console.error(error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-400 font-sans">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500 mb-4"></div>
        <p className="text-xs uppercase tracking-widest">Đang đồng bộ dữ liệu danh mục từ Laravel...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-2">
      {/* TIÊU ĐỀ TRANG */}
      <div>
        <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-300">Category MGMT</p>
        <h2 className="mt-2 text-3xl font-black uppercase tracking-wide text-white">Quản lý danh mục</h2>
        <p className="mt-2 text-sm text-slate-400">Cấu hình danh mục dùng cho trang chủ, shop và bộ lọc sản phẩm (Dữ liệu API).</p>
      </div>

      {/* FORM THÊM / SỬA DANH MỤC */}
      <form onSubmit={submit} className="admin-card rounded-3xl p-5 bg-[#161616] border border-[#222222]">
        <div className="grid gap-4 md:grid-cols-4">
          <input 
            value={form.name} 
            onChange={(e) => update("name", e.target.value)} 
            required 
            className="admin-input bg-[#1c1c1c] border border-[#2d2d2d] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-orange-500 transition-all" 
            placeholder="Tên danh mục" 
          />
          <input 
            value={form.id} 
            onChange={(e) => update("id", e.target.value)} 
            className="admin-input bg-[#1c1c1c] border border-[#2d2d2d] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-orange-500 transition-all disabled:opacity-50" 
            placeholder="Slug (id định danh)" 
            disabled={!!editing} 
          />
          <input 
            value={form.image} 
            onChange={(e) => update("image", e.target.value)} 
            className="admin-input md:col-span-2 bg-[#1c1c1c] border border-[#2d2d2d] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-orange-500 transition-all" 
            placeholder="URL hình ảnh danh mục" 
          />
          <textarea 
            value={form.description} 
            onChange={(e) => update("description", e.target.value)} 
            className="admin-input md:col-span-4 bg-[#1c1c1c] border border-[#2d2d2d] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-orange-500 transition-all resize-none h-20" 
            placeholder="Mô tả tóm tắt cho danh mục này..." 
          />
        </div>
        <button type="submit" className="mt-4 rounded-2xl bg-orange-500 hover:bg-orange-600 px-5 py-3 text-sm font-black text-white flex items-center gap-2 transition-all">
          <Save size={16} /> {editing ? "Lưu danh mục" : "Tạo danh mục mới"}
        </button>
      </form>

      {/* DANH SÁCH HIỂN THỊ DẠNG GRID CARDS */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {items.length > 0 ? (
          items.map((item) => (
            <article key={item.id} className="admin-card overflow-hidden rounded-3xl bg-[#161616] border border-[#222222] transition-all hover:border-neutral-700">
              <img src={item.image || item.image_url} alt={item.name} className="h-40 w-full object-cover opacity-80" />
              <div className="p-5">
                <p className="text-xs font-black uppercase tracking-wider text-orange-300 font-mono">ID: {item.id || item.slug}</p>
                <h3 className="mt-1 text-xl font-black text-white">{item.name}</h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">{item.description || 'Không có mô tả cho danh mục này.'}</p>
                
                <div className="mt-4 flex gap-2 pt-3 border-t border-[#222222]">
                  <button onClick={() => edit(item)} className="rounded-xl bg-blue-400/10 p-2 text-blue-300 hover:bg-blue-400/20 transition-all" title="Chỉnh sửa">
                    <Edit3 size={16} />
                  </button>
                  <button onClick={() => remove(item.id)} className="rounded-xl bg-rose-400/10 p-2 text-rose-300 hover:bg-rose-400/20 transition-all" title="Xóa bỏ">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="col-span-full bg-[#161616] border border-[#222222] py-16 text-center text-slate-500 rounded-3xl">
            <Layers className="mx-auto mb-3 text-neutral-700" size={32} />
            Không có danh mục nào được tìm thấy trong Database của bạn.
          </div>
        )}
      </div>
    </div>
  );
}