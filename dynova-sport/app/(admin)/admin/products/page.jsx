'use client';
import React, { useState } from 'react';

export default function ProductsAdmin() {
  // 1. Giả lập danh sách sản phẩm ban đầu của Dynova Sport
  const [products, setProducts] = useState([
    { id: 'PROD-001', name: 'Giày Chạy Bộ Dynova X-Pro', category: 'Giày thể thao', price: 1250000, stock: 45, status: 'Còn hàng', image: '👟' },
    { id: 'PROD-002', name: 'Áo T-Shirt Thể Thao Pro-Dry', category: 'Quần áo', price: 350000, stock: 120, status: 'Còn hàng', image: '👕' },
    { id: 'PROD-003', name: 'Quần Short Tập Luyện Co Giãn', category: 'Quần áo', price: 280000, stock: 0, status: 'Hết hàng', image: '🩳' },
    { id: 'PROD-004', name: 'Bóng Đá Thăng Long Size 5', category: 'Phụ kiện', price: 450000, stock: 15, status: 'Còn hàng', image: '⚽' },
    { id: 'PROD-005', name: 'Thảm Tập Yoga TPE Cao Cấp', category: 'Phụ kiện', price: 520000, stock: 8, status: 'Sắp hết hàng', image: '🧘' },
  ]);

  // 2. State quản lý Tìm kiếm và Bộ lọc danh mục
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');

  // 3. Hàm xử lý Xóa sản phẩm nhanh
  const handleDelete = (id) => {
    if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này không?')) {
      setProducts(products.filter(prod => prod.id !== id));
    }   
  };

  // 4. Lọc sản phẩm theo từ khóa tìm kiếm và danh mục được chọn
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || product.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Tất cả' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 text-white">
      {/* TIÊU ĐỀ TRANG & NÚT THÊM MỚI */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Quản lý sản phẩm</h2>
          <p className="text-xs text-gray-500 mt-0.5">Danh sách sản phẩm hiện có trên hệ thống Dynova Sport</p>
        </div>
        <button className="bg-orange-500 hover:bg-orange-600 text-sm font-semibold px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-orange-500/10">
          <span>+</span> Thêm sản phẩm mới
        </button>
      </div>

      {/* THANH TÌM KIẾM & BỘ LỌC DANH MỤC */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#161616] border border-[#222222] p-4 rounded-2xl">
        {/* Khung tìm kiếm */}
        <div className="relative md:col-span-2">
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm theo tên hoặc mã mã sản phẩm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1c1c1c] border border-[#2d2d2d] focus:border-orange-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-all placeholder-gray-500 text-white"
          />
        </div>
        
        {/* Khung chọn Danh mục */}
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-[#1c1c1c] border border-[#2d2d2d] focus:border-orange-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-all text-white cursor-pointer"
          >
            <option value="Tất cả">Tất cả danh mục</option>
            <option value="Giày thể thao">Giày thể thao</option>
            <option value="Quần áo">Quần áo</option>
            <option value="Phụ kiện">Phụ kiện</option>
          </select>
        </div>
      </div>

      {/* BẢNG HIỂN THỊ DANH SÁCH SẢN PHẨM */}
      <div className="bg-[#161616] border border-[#222222] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="text-xs uppercase bg-[#1c1c1c] text-gray-500 font-bold">
              <tr>
                <th className="p-4">Hình ảnh</th>
                <th className="p-4">Mã sản phẩm</th>
                <th className="p-4">Tên sản phẩm</th>
                <th className="p-4">Danh mục</th>
                <th className="p-4">Giá bán</th>
                <th className="p-4">Kho hàng</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222222]">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-[#1c1c1c]/40 transition-colors">
                    {/* Ảnh đại diện demo bằng Emoji */}
                    <td className="p-4">
                      <div className="w-10 h-10 bg-[#222222] rounded-xl flex items-center justify-center text-xl border border-[#2d2d2d]">
                        {product.image}
                      </div>
                    </td>
                    {/* Mã sản phẩm */}
                    <td className="p-4 font-semibold text-gray-400">{product.id}</td>
                    {/* Tên sản phẩm */}
                    <td className="p-4 text-white font-medium max-w-[200px] truncate">{product.name}</td>
                    {/* Danh mục */}
                    <td className="p-4 text-gray-400">{product.category}</td>
                    {/* Giá tiền định dạng VND */}
                    <td className="p-4 text-white font-semibold">
                      {product.price.toLocaleString('vi-VN')}đ
                    </td>
                    {/* Số lượng tồn kho */}
                    <td className="p-4 text-gray-300 font-medium">{product.stock} sp</td>
                    {/* Trạng thái tồn kho với màu sắc tương ứng */}
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                        product.status === 'Còn hàng' ? 'text-emerald-500 bg-emerald-500/10' :
                        product.status === 'Sắp hết hàng' ? 'text-amber-500 bg-amber-500/10' :
                        'text-rose-500 bg-rose-500/10'
                      }`}>
                        {product.status}
                      </span>
                    </td>
                    {/* Nhóm nút hành động Sửa / Xóa */}
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors" title="Sửa sản phẩm">
                          ✏️
                        </button>
                        <button 
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors" 
                          title="Xóa sản phẩm"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                /* Hiển thị khi không tìm thấy kết quả lọc */
                <tr>
                  <td colSpan="8" className="p-8 text-center text-gray-500">
                    🔍 Không tìm thấy sản phẩm nào khớp với bộ lọc hiện tại.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* PHÂN TRANG GIẢ LẬP (FOOTER TABLE) */}
        <div className="p-4 bg-[#1c1c1c] border-t border-[#222222] flex justify-between items-center text-xs text-gray-500">
          <p>Hiển thị {filteredProducts.length} trên tổng số {products.length} sản phẩm</p>
          <div className="flex gap-1">
            <button className="px-3 py-1 bg-[#222222] rounded hover:text-white transition-colors" disabled>Trước</button>
            <button className="px-3 py-1 bg-orange-500 text-white rounded font-bold">1</button>
            <button className="px-3 py-1 bg-[#222222] rounded hover:text-white transition-colors" disabled>Sau</button>
          </div>
        </div>
      </div>
    </div>
  );
}