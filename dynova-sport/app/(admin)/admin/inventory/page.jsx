'use client';
import React, { useState } from 'react';

export default function InventoryAdmin() {
  // 1. Giả lập dữ liệu kho hàng thực tế của Dynova Sport (chia theo biến thể)
  const [inventory, setInventory] = useState([
    { id: 'INV-001', name: 'Giày Chạy Bộ Dynova X-Pro', sku: 'DNV-SHO-01-42', variant: 'Size 42 / Đen', stock: 85, minStock: 20, location: 'Khu A - Kệ 3' },
    { id: 'INV-002', name: 'Giày Chạy Bộ Dynova X-Pro', sku: 'DNV-SHO-01-41', variant: 'Size 41 / Trắng', stock: 4, minStock: 15, location: 'Khu A - Kệ 3' },
    { id: 'INV-003', name: 'Áo T-Shirt Thể Thao Pro-Dry', sku: 'DNV-TOP-02-L', variant: 'Size L / Xám', stock: 150, minStock: 30, location: 'Khu B - Kệ 1' },
    { id: 'INV-004', name: 'Quần Short Tập Luyện Co Giãn', sku: 'DNV-BOT-05-M', variant: 'Size M / Đen', stock: 0, minStock: 25, location: 'Khu B - Kệ 5' },
    { id: 'INV-005', name: 'Thảm Tập Yoga TPE Cao Cấp', sku: 'DNV-ACC-09-6M', variant: '6mm / Tím', stock: 12, minStock: 10, location: 'Khu C - Kệ 2' },
  ]);

  // State tìm kiếm và bộ lọc trạng thái kho
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState('Tất cả');

  // 2. Hàm nhanh để cập nhật/điều chỉnh số lượng tồn kho (Ví dụ: Nhập thêm hàng)
  const handleQuickAdjust = (id, amount) => {
    setInventory(inventory.map(item => {
      if (item.id === id) {
        const newStock = Math.max(0, item.stock + amount);
        return { ...item, stock: newStock };
      }
      return item;
    }));
  };

  // 3. Xác định trạng thái tồn kho dựa trên số lượng hiện tại và mức tối thiểu (minStock)
  const getStockStatus = (stock, minStock) => {
    if (stock === 0) return { label: 'Cháy hàng', color: 'text-rose-500 bg-rose-500/10' };
    if (stock <= minStock) return { label: 'Sắp hết hàng', color: 'text-amber-500 bg-amber-500/10' };
    return { label: 'An toàn', color: 'text-emerald-500 bg-emerald-500/10' };
  };

  // 4. Bộ lọc tìm kiếm sản phẩm/SKU và lọc trạng thái kho hàng
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    const status = getStockStatus(item.stock, item.minStock).label;
    const matchesFilter = stockFilter === 'Tất cả' || status === stockFilter;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 text-white">
      {/* TIÊU ĐỀ TRANG */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Quản lý tồn kho</h2>
          <p className="text-xs text-gray-500 mt-0.5">Theo dõi số lượng hàng hóa biến thể, vị trí lưu kho và điều chỉnh lượng tồn nhanh</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-[#161616] border border-[#222222] hover:bg-[#222222] text-xs font-semibold px-4 py-2 rounded-xl transition-all">
            📦 Nhập kho (File Excel)
          </button>
        </div>
      </div>

      {/* THANH TÌM KIẾM & BỘ LỌC CẢNH BÁO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#161616] border border-[#222222] p-4 rounded-2xl">
        {/* Tìm theo Tên hoặc SKU */}
        <div className="relative md:col-span-2">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên sản phẩm hoặc mã định danh SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1c1c1c] border border-[#2d2d2d] focus:border-orange-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-all placeholder-gray-500 text-white"
          />
        </div>
        
        {/* Lọc trạng thái tồn kho */}
        <div>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="w-full bg-[#1c1c1c] border border-[#2d2d2d] focus:border-orange-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-all text-white cursor-pointer"
          >
            <option value="Tất cả">Tất cả tình trạng kho</option>
            <option value="An toàn">Còn hàng (An toàn)</option>
            <option value="Sắp hết hàng">Cảnh báo sắp hết hàng ⚠️</option>
            <option value="Cháy hàng">Đã cháy hàng 🚫</option>
          </select>
        </div>
      </div>

      {/* BẢNG SỐ LIỆU TỒN KHO THỰC TẾ */}
      <div className="bg-[#161616] border border-[#222222] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="text-xs uppercase bg-[#1c1c1c] text-gray-500 font-bold">
              <tr>
                <th className="p-4">Sản phẩm / Biến thể</th>
                <th className="p-4">Mã SKU</th>
                <th className="p-4">Vị trí kho</th>
                <th className="p-4 text-center">Mức tối thiểu</th>
                <th className="p-4 text-center">Tồn thực tế</th>
                <th className="p-4">Tình trạng</th>
                <th className="p-4 text-center">Điều chỉnh nhanh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222222]">
              {filteredInventory.length > 0 ? (
                filteredInventory.map((item) => {
                  const status = getStockStatus(item.stock, item.minStock);
                  return (
                    <tr key={item.id} className="hover:bg-[#1c1c1c]/40 transition-colors">
                      {/* Sản phẩm & Biến thể phân loại */}
                      <td className="p-4">
                        <div>
                          <p className="text-white font-medium text-sm">{item.name}</p>
                          <span className="text-xs text-gray-500 bg-[#222222] px-1.5 py-0.5 rounded mt-1 inline-block">
                            {item.variant}
                          </span>
                        </div>
                      </td>
                      {/* Mã SKU định danh mặt hàng */}
                      <td className="p-4 font-mono text-xs text-gray-400">{item.sku}</td>
                      {/* Vị trí lưu kho */}
                      <td className="p-4 text-xs text-gray-300">📍 {item.location}</td>
                      {/* Sàn định mức tối thiểu cần giữ */}
                      <td className="p-4 text-center font-medium text-gray-500">{item.minStock}</td>
                      {/* Số lượng tồn kho hiện tại */}
                      <td className="p-4 text-center">
                        <span className={`font-bold text-sm ${item.stock === 0 ? 'text-rose-500' : 'text-white'}`}>
                          {item.stock}
                        </span>
                      </td>
                      {/* Label trạng thái tự động tính */}
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      {/* Nút cộng trừ số lượng nhanh không cần vào trang sửa */}
                      <td className="p-4 text-center">
                        <div className="flex justify-center items-center gap-1">
                          <button 
                            onClick={() => handleQuickAdjust(item.id, -5)}
                            className="w-7 h-7 bg-[#222222] hover:bg-rose-950/40 hover:text-rose-400 border border-[#2d2d2d] rounded-lg text-xs font-bold transition-all"
                            title="Trừ 5 sản phẩm"
                          >
                            -5
                          </button>
                          <button 
                            onClick={() => handleQuickAdjust(item.id, 5)}
                            className="w-7 h-7 bg-[#222222] hover:bg-emerald-950/40 hover:text-emerald-400 border border-[#2d2d2d] rounded-lg text-xs font-bold transition-all"
                            title="Cộng thêm 5 sản phẩm"
                          >
                            +5
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                /* Không tìm thấy dữ liệu phù hợp */
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-500">
                    🔍 Không tìm thấy mã hàng hoặc biến thể nào khớp với điều kiện lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* FOOTER PHÂN TRANG */}
        <div className="p-4 bg-[#1c1c1c] border-t border-[#222222] flex justify-between items-center text-xs text-gray-500">
          <p>Hiển thị {filteredInventory.length} dòng biến thể phân loại kho</p>
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