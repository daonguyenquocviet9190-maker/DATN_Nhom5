'use client';
import React, { useState, useEffect } from 'react';
import { brandService } from '@/services/brand.service';

export default function BrandsAdmin() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tất cả');

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const data = await brandService.getAll();
      setBrands(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Lỗi lấy danh sách:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBrands(); }, []);

  // Hàm toggle status dùng giá trị 1 và 0
  const toggleStatus = async (brand) => {
    // 1 = Hiển thị, 0 = Ẩn
    const newStatus = (brand.status === 1) ? 0 : 1; 
    
    try {
        // Gửi request với status là số nguyên
        await brandService.update(brand.id, { 
            ...brand, 
            status: newStatus 
        });
        
        // Cập nhật lại giao diện ngay lập tức sau khi thành công
        fetchBrands(); 
    } catch (error) {
        // Nếu lỗi xảy ra, in ra console để biết lý do
        console.error("Lỗi chi tiết từ server:", error.response?.data || error);
        alert("Cập nhật thất bại! Vui lòng kiểm tra Console.");
    }
};

  // Logic lọc dữ liệu
  const filteredBrands = brands.filter(brand => {
    const matchesSearch = brand.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Tất cả' || 
                         (statusFilter === 'Hiển thị' ? brand.status === 1 : brand.status === 0);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 text-white p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold uppercase">Quản lý <span className="text-orange-500">thương hiệu</span></h2>
        <button className="bg-orange-500 px-4 py-2 rounded-xl text-sm font-semibold">+ Thêm thương hiệu</button>
      </div>

      <div className="grid grid-cols-3 gap-4 bg-[#161616] p-4 rounded-2xl border border-[#222222]">
        <input 
          className="col-span-2 bg-[#1c1c1c] border border-[#2d2d2d] rounded-xl px-4 py-2 outline-none"
          placeholder="Tìm theo tên..."
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select 
          className="bg-[#1c1c1c] border border-[#2d2d2d] rounded-xl px-4 py-2 outline-none"
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="Tất cả">Tất cả</option>
          <option value="Hiển thị">Hiển thị</option>
          <option value="Đang ẩn">Đang ẩn</option>
        </select>
      </div>

      <div className="bg-[#161616] border border-[#222222] rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-[#1c1c1c] text-gray-500 uppercase text-xs">
            <tr>
              <th className="p-4">Tên thương hiệu</th>
              <th className="p-4">Trạng thái</th>
              <th className="p-4 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#222222]">
            {filteredBrands.map((brand) => (
              <tr key={brand.id}>
                <td className="p-4 text-white font-medium">{brand.name}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${brand.status === 1 ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10'}`}>
                    {brand.status === 1 ? 'Hiển thị' : 'Đang ẩn'}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <button 
                    onClick={() => toggleStatus(brand)}
                    className="text-xs border border-gray-700 px-2 py-1 rounded hover:bg-gray-800"
                  >
                    {brand.status === 1 ? '👁️ Ẩn' : '👀 Hiện'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}