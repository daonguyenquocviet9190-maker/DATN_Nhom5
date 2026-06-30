'use client';

import { useEffect, useState } from "react";
import { Plus, Search, Trash2, Edit, Package, X } from "lucide-react";
import { productService } from "../../../../services/product.service";

export default function ProductsAdmin() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  // States quản lý Modal Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null = Thêm mới, có object = Sửa
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    stock: "0", // Giữ state này để phục vụ UI ô nhập
    image: ""
  });

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getAll();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Lỗi lấy danh sách sản phẩm:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = products.filter((p) => {
    const name = p.name || "";
    return name.toLowerCase().includes(query.toLowerCase());
  });

  // --- HÀM MỞ MODAL ---
  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name || "",
        price: product.price || "",
        stock: "0", // Database không có cột này nên mặc định luôn là 0 ở UI
        image: product.image || ""
      });
    } else {
      setEditingProduct(null);
      setFormData({ name: "", price: "", stock: "0", image: "" });
    }
    setIsModalOpen(true);
  };

  // --- CHỨC NĂNG: LƯU (THÊM HOẶC SỬA) ---
  // --- CHỨC NĂNG: LƯU (XỬ LÝ CẢ THÊM HOẶC SỬA) ---
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      // payload hoàn chỉnh, đáp ứng 100% các trường bắt buộc của Database
      const payload = {
        name: formData.name.trim(),
        price: Number(formData.price) || 0,
        image: formData.image && formData.image.trim() !== "" ? formData.image.trim() : "https://placehold.co/600x400",
        
        // FIX TRIỆT ĐỂ: Bổ sung category_id bắt buộc mà database yêu cầu
        category_id: 1 // Gán mặc định là 1 (hoặc thay bằng ID danh mục hợp lệ có sẵn trong DB của bạn)
      };

      if (editingProduct) {
        // Thực thi API Cập nhật (Sửa)
        await productService.update(editingProduct.id, payload);
        alert("Cập nhật sản phẩm thành công!");
      } else {
        // Thực thi API Tạo mới (Thêm)
        await productService.create(payload);
        alert("Thêm sản phẩm thành công!");
      }

      setIsModalOpen(false); // Đóng modal
      fetchProducts();       // Tải lại danh sách mới nhất
    } catch (error) {
      // Hiển thị trực tiếp câu thông báo lỗi chi tiết từ Backend trả về
      const errorMsg = error.response?.data?.message || error.message || "Thao tác thất bại!";
      alert(`Lỗi: ${errorMsg}`);
      console.error("Chi tiết lỗi hệ thống:", error.response?.data);
    }
  };

  // --- CHỨC NĂNG: XÓA ---
  const handleDelete = async (id) => {
    if (!confirm("Bạn có chắc chắn muốn xóa sản phẩm này không?")) return;
    try {
      await productService.delete(id);
      alert("Xóa sản phẩm thành công!");
      fetchProducts();
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || "Xóa thất bại!";
      alert(`Lỗi: ${errorMsg}`);
    }
  };

  if (loading) {
    return <div className="text-center text-gray-400 py-10">Đang tải danh sách sản phẩm...</div>;
  }

  return (
    <div className="space-y-6 p-2 relative">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-300">Catalog</p>
          <h2 className="mt-2 text-3xl font-black uppercase text-white">Quản lý sản phẩm</h2>
        </div>
        <button 
          onClick={() => openModal()}
          className="py-2.5 px-4 bg-orange-500 hover:bg-orange-600 font-bold rounded-xl text-white text-sm flex items-center gap-2 transition-all"
        >
          <Plus size={16} /> Thêm sản phẩm
        </button>
      </div>

      {/* DANH SÁCH BẢNG */}
      <div className="admin-card rounded-3xl p-5 bg-[#161616] border border-[#222222]">
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-3.5 text-slate-500" size={16} />
          <input 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            className="w-full pl-10 bg-[#1c1c1c] border border-[#2d2d2d] rounded-xl py-2.5 text-sm text-white outline-none focus:border-orange-500" 
            placeholder="Tìm kiếm sản phẩm theo tên..." 
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="text-xs uppercase text-slate-500 bg-[#1c1c1c]">
              <tr>
                <th className="p-3">Sản phẩm</th>
                <th className="p-3">Giá bán</th>
                <th className="p-3">Kho hàng</th>
                <th className="p-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-3 flex items-center gap-3">
                      {p.image && (
                        <img src={p.image} alt="" className="w-10 h-10 object-cover rounded-lg bg-neutral-800" />
                      )}
                      <div>
                        <p className="font-bold text-white line-clamp-1">{p.name}</p>
                        <p className="text-xs text-slate-500 font-mono">ID: {p.id}</p>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-orange-300">{formatCurrency(p.price || 0)}</td>
                    {/* DB không có trường số lượng thì hiển thị tạm cố định là Có sẵn hoặc Vô hạn */}
                    <td className="p-3 font-mono text-slate-300">Có sẵn</td>
                    <td className="p-3 text-right flex justify-end gap-2">
                      <button 
                        onClick={() => openModal(p)}
                        className="text-orange-400 p-2 hover:bg-orange-500/10 rounded-xl"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(p.id)} 
                        className="text-rose-400 p-2 hover:bg-rose-500/10 rounded-xl"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-slate-500">
                    <Package className="mx-auto mb-2 opacity-30" size={24} /> Không tìm thấy sản phẩm nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL THÊM / SỬA SẢN PHẨM --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#161616] border border-[#222222] rounded-3xl w-full max-w-md p-6 relative shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            
            <button 
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-black uppercase text-white mb-6">
              {editingProduct ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Tên sản phẩm</label>
                <input 
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-[#1c1c1c] border border-[#2d2d2d] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-orange-500"
                  placeholder="Nhập tên sản phẩm..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Giá bán (VND)</label>
                  <input 
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full bg-[#1c1c1c] border border-[#2d2d2d] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-orange-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="Ví dụ: 150000"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Số lượng kho (Mặc định)</label>
                  <input 
                    type="number"
                    disabled
                    value={formData.stock}
                    className="w-full bg-[#1c1c1c]/50 border border-[#2d2d2d] rounded-xl px-4 py-2.5 text-sm text-gray-500 outline-none cursor-not-allowed"
                    placeholder="Không quản lý kho"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Đường dẫn ảnh (URL)</label>
                <input 
                  type="text"
                  value={formData.image}
                  onChange={(e) => setFormData({...formData, image: e.target.value})}
                  className="w-full bg-[#1c1c1c] border border-[#2d2d2d] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-orange-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5 mt-6">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#2d2d2d] text-sm text-slate-400 hover:bg-white/5 font-medium transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-sm text-white font-bold transition-colors"
                >
                  {editingProduct ? "Lưu thay đổi" : "Tạo sản phẩm"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}