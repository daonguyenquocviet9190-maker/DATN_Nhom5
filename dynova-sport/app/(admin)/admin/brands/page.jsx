'use client';
import React, { useState, useEffect } from 'react';
import { brandService } from '@/services/brand.service'; // Import file dịch vụ thương hiệu

export default function BrandsAdmin() {
  // 1. Chuyển đổi danh sách thương hiệu sang State trống để hứng dữ liệu từ Backend Laravel
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  // 2. State quản lý tìm kiếm và bộ lọc trạng thái
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tất cả');

  // Hàm gọi API lấy danh sách thương hiệu thực tế từ hệ thống Laravel
  const fetchBrands = async () => {
    try {
      setLoading(true);
      const data = await brandService.getAll();
      setBrands(data);
    } catch (error) {
      console.error("Lỗi khi kết nối API lấy danh sách thương hiệu:", error);
    } finally {
      setLoading(false);
    }
  };

  // Tự động kích hoạt nạp dữ liệu ngay khi vừa truy cập trang Admin
  useEffect(() => {
    fetchBrands();
  }, []);

  // 3. Hàm thay đổi trạng thái Hiển thị / Ẩn thương hiệu đồng bộ trực tiếp lên Database
  const toggleStatus = async (brand) => {
    const updatedStatus = brand.status === 'Hiển thị' ? 'Đang ẩn' : 'Hiển thị';
    try {
      // Gọi API cập nhật dữ liệu của Laravel
      await brandService.update(brand.id, {
        ...brand,
        status: updatedStatus
      });
      // Tải lại danh sách mới nhất để giao diện cập nhật ngay lập tức
      fetchBrands();
    } catch (error) {
      alert("Cập nhật trạng thái thương hiệu thất bại!");
      console.error(error);
    }
  };

  // 4. Lọc dữ liệu mượt mà dựa trên từ khóa tìm kiếm và bộ lọc trạng thái từ dữ liệu API đổ về
  const filteredBrands = brands.filter(brand => {
    const brandName = brand.name || '';
    const brandId = String(brand.id || '');
    const brandStatus = brand.status || 'Hiển thị';

    const matchesSearch = brandName.toLowerCase().includes(searchTerm.toLowerCase()) || brandId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Tất cả' || brandStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-400 font-sans">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500 mb-4"></div>
        <p className="text-xs uppercase tracking-widest">Đang kết nối cơ sở dữ liệu thương hiệu...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white p-2">
      {/* TIÊU ĐỀ TRANG & NÚT THÊM MỚI */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-wider">Quản lý <span className="text-orange-500">thương hiệu</span></h2>
          <p className="text-xs text-gray-500 mt-0.5">Quản lý các nhãn hàng, thương hiệu đối tác đang kinh doanh tại hệ thống (Real-time API)</p>
        </div>
        <button className="bg-orange-500 hover:bg-orange-600 text-sm font-semibold px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-orange-500/10">
          <span>+</span> Thêm thương hiệu mới
        </button>
      </div>

      {/* THANH TÌM KIẾM & BỘ LỌC TRẠNG THÁI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#161616] border border-[#222222] p-4 rounded-2xl">
        {/* Ô tìm kiếm */}
        <div className="relative md:col-span-2">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên thương hiệu hoặc mã số..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1c1c1c] border border-[#2d2d2d] focus:border-orange-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-all placeholder-gray-500 text-white"
          />
        </div>
        
        {/* Khung lọc trạng thái */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-[#1c1c1c] border border-[#2d2d2d] focus:border-orange-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-all text-white cursor-pointer"
          >
            <option value="Tất cả">Tất cả trạng thái</option>
            <option value="Hiển thị">Đang hiển thị</option>
            <option value="Đang ẩn">Đang ẩn</option>
          </select>
        </div>
      </div>

      {/* BẢNG HIỂN THỊ THƯƠNG HIỆU */}
      <div className="bg-[#161616] border border-[#222222] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="text-xs uppercase bg-[#1c1c1c] text-gray-500 font-bold">
              <tr>
                <th className="p-4">Logo</th>
                <th className="p-4">Mã số</th>
                <th className="p-4">Tên thương hiệu</th>
                <th className="p-4">Đường dẫn (Slug)</th>
                <th className="p-4 text-center">Số lượng sản phẩm</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222222]">
              {filteredBrands.length > 0 ? (
                filteredBrands.map((brand) => (
                  <tr key={brand.id} className="hover:bg-[#1c1c1c]/40 transition-colors">
                    {/* Cột Logo đại diện (Hỗ trợ URL ảnh từ DB hoặc render Icon mặc định) */}
                    <td className="p-4">
                      <div className="w-9 h-9 bg-[#222222] rounded-xl flex items-center justify-center text-lg border border-[#2d2d2d] overflow-hidden">
                        {(brand.logo && (brand.logo.startsWith('http') || brand.logo.startsWith('/'))) ? (
                          <img src={brand.logo} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span>{brand.logo || '🏷️'}</span>
                        )}
                      </div>
                    </td>
                    {/* Mã số */}
                    <td className="p-4 font-mono text-xs text-gray-500">ID: {brand.id}</td>
                    {/* Tên thương hiệu */}
                    <td className="p-4 text-white font-medium">{brand.name || 'Chưa đặt tên'}</td>
                    {/* Slug */}
                    <td className="p-4 font-mono text-xs text-orange-400/80">{brand.slug || 'no-slug'}</td>
                    {/* Tổng số lượng sản phẩm gắn liền nhãn hàng */}
                    <td className="p-4 text-center text-white font-semibold">
                      {brand.totalProducts || brand.products_count || 0} sp
                    </td>
                    {/* Trạng thái tag */}
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                        (brand.status || 'Hiển thị') === 'Hiển thị' ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10'
                      }`}>
                        {brand.status || 'Hiển thị'}
                      </span>
                    </td>
                    {/* Nút hành động */}
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors" title="Sửa thông tin">
                          ✏️
                        </button>
                        <button 
                          onClick={() => toggleStatus(brand)}
                          className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                            (brand.status || 'Hiển thị') === 'Hiển thị' 
                              ? 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10' 
                              : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                          }`}
                        >
                          {(brand.status || 'Hiển thị') === 'Hiển thị' ? '👁️ Ẩn đi' : '👀 Hiện lại'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                /* Kết quả rỗng */
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-500">
                    🔍 Không tìm thấy nhãn hàng nào khớp với bộ lọc tìm kiếm trong Database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER PHÂN TRANG */}
        <div className="p-4 bg-[#1c1c1c] border-t border-[#222222] flex justify-between items-center text-xs text-gray-500">
          <p>Hiển thị {filteredBrands.length} trên tổng số {brands.length} nhãn hiệu</p>
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