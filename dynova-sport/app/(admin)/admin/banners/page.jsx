'use client';
import React, { useState } from 'react';

export default function BannersAdmin() {
  // 1. Giả lập danh sách banner truyền thông của Dynova Sport
  const [banners, setBanners] = useState([
    { id: 'BNR-001', title: 'Bộ Sưu Tập Hè Đột Phá 2026', position: 'Slide Trang Chủ (Chính)', link: '/collection/summer-2026', clicks: 1420, status: 'Hiển thị', bgPreview: 'bg-gradient-to-r from-orange-600 to-amber-500' },
    { id: 'BNR-002', title: 'Giày Chạy Siêu Nhẹ Dynova X-Pro', position: 'Slide Trang Chủ (Phụ)', link: '/products/dynova-x-pro', clicks: 890, status: 'Hiển thị', bgPreview: 'bg-gradient-to-r from-blue-600 to-indigo-900' },
    { id: 'BNR-003', title: 'Ưu Đãi Thành Viên Mới - Giảm 10%', position: 'Banner Giữa Trang', link: '/promotions', clicks: 2310, status: 'Hiển thị', bgPreview: 'bg-gradient-to-r from-rose-600 to-pink-500' },
    { id: 'BNR-004', title: 'Xả Kho Cuối Mùa - Up To 50%', position: 'Slide Trang Chủ (Chính)', link: '/sale-off', clicks: 0, status: 'Đang ẩn', bgPreview: 'bg-gradient-to-r from-neutral-700 to-neutral-900' },
  ]);

  // State quản lý bộ lọc vị trí banner
  const [positionFilter, setPositionFilter] = useState('Tất cả');

  // 2. Hàm xử lý Ẩn / Hiện nhanh Banner trên giao diện người dùng
  const toggleStatus = (id) => {
    setBanners(banners.map(banner => {
      if (banner.id === id) {
        const nextStatus = banner.status === 'Hiển thị' ? 'Đang ẩn' : 'Hiển thị';
        return { ...banner, status: nextStatus };
      }
      return banner;
    }));
  };

  // 3. Lọc danh sách banner theo vị trí được chọn
  const filteredBanners = banners.filter(banner => {
    return positionFilter === 'Tất cả' || banner.position === positionFilter;
  });

  return (
    <div className="space-y-6 text-white">
      {/* TIÊU ĐỀ TRANG & NÚT THÊM BANNER */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Quản lý Banner</h2>
          <p className="text-xs text-gray-500 mt-0.5">Cập nhật hình ảnh quảng cáo, chiến dịch truyền thông và liên kết ngoài trang chủ</p>
        </div>
        <button className="bg-orange-500 hover:bg-orange-600 text-sm font-semibold px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-orange-500/10">
          <span>+</span> Thêm Banner mới
        </button>
      </div>

      {/* THANH BỘ LỌC VỊ TRÍ */}
      <div className="bg-[#161616] border border-[#222222] p-4 rounded-2xl flex justify-between items-center">
        <span className="text-xs text-gray-400 font-medium">Bộ lọc vị trí xuất hiện:</span>
        <div className="flex gap-2">
          {['Tất cả', 'Slide Trang Chủ (Chính)', 'Slide Trang Chủ (Phụ)', 'Banner Giữa Trang'].map((pos) => (
            <button
              key={pos}
              onClick={() => setPositionFilter(pos)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                positionFilter === pos 
                  ? 'bg-orange-500/10 border-orange-500 text-orange-500' 
                  : 'bg-[#1c1c1c] border-[#2d2d2d] text-gray-400 hover:text-white'
              }`}
            >
              {pos}
            </button>
          ))}
        </div>
      </div>

      {/* DANH SÁCH BANNER DẠNG THÈ (CARD) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredBanners.length > 0 ? (
          filteredBanners.map((banner) => (
            <div key={banner.id} className="bg-[#161616] border border-[#222222] rounded-2xl overflow-hidden flex flex-col justify-between transition-all hover:border-[#333333]">
              
              {/* Khung mô phỏng Banner thực tế */}
              <div className={`h-40 ${banner.bgPreview} p-5 flex flex-col justify-between relative overflow-hidden group`}>
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                
                <div className="relative z-10 flex justify-between items-start">
                  <span className="text-[10px] uppercase font-bold tracking-wider bg-black/40 text-white px-2 py-0.5 rounded backdrop-blur-sm">
                    {banner.position}
                  </span>
                  <span className="font-mono text-xs text-white/60 bg-black/30 px-1.5 py-0.5 rounded">
                    {banner.id}
                  </span>
                </div>

                <div className="relative z-10">
                  <h3 className="text-base font-bold text-white drop-shadow-md">{banner.title}</h3>
                  <p className="text-[11px] text-white/80 font-mono mt-0.5">Link: {banner.link}</p>
                </div>
              </div>

              {/* Phần quản lý thông số và hành động phía dưới */}
              <div className="p-4 bg-[#161616] flex justify-between items-center text-xs border-t border-[#222222]/60">
                {/* Đã ép locale 'vi-VN' để đồng bộ hiển thị Server và Client */}
                <div className="text-gray-400">
                  📈 Số lượt click: <span className="text-white font-bold">{banner.clicks.toLocaleString('vi-VN')}</span>
                </div>

                {/* Các nút điều khiển nhanh */}
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                    banner.status === 'Hiển thị' ? 'text-emerald-500 bg-emerald-500/10' : 'text-gray-500 bg-gray-500/10'
                  }`}>
                    {banner.status}
                  </span>

                  <div className="flex gap-1 border-l border-[#222222] pl-3">
                    <button className="p-1 text-blue-400 hover:text-blue-300" title="Chỉnh sửa Banner">
                      ✏️
                    </button>
                    <button 
                      onClick={() => toggleStatus(banner.id)}
                      className={`text-xs font-semibold px-2 py-1 rounded transition-colors ${
                        banner.status === 'Hiển thị' 
                          ? 'text-rose-400 hover:bg-rose-500/10' 
                          : 'text-emerald-400 hover:bg-emerald-500/10'
                      }`}
                    >
                      {banner.status === 'Hiển thị' ? '🙈 Ẩn' : '👀 Hiện'}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          ))
        ) : (
          <div className="col-span-2 bg-[#161616] border border-[#222222] p-8 rounded-2xl text-center text-gray-500">
            🔍 Không tìm thấy banner nào ở vị trí này.
          </div>
        )}
      </div>
    </div>
  );
}