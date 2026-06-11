'use client';
import React, { useState } from 'react';

export default function PromotionsAdmin() {
  // 1. Giả lập danh sách mã khuyến mãi của Dynova Sport
  const [promotions, setPromotions] = useState([
    { id: 'PM-001', code: 'DYNOVANEW', type: 'Phần trăm', value: '10%', minOrder: '0đ', qty: 100, used: 45, expiry: '30/06/2026', status: 'Đang chạy' },
    { id: 'PM-002', code: 'SPORTVIP', type: 'Số tiền', value: '200,000đ', minOrder: '1,500,000đ', qty: 50, used: 50, expiry: '10/06/2026', status: 'Hết lượt' },
    { id: 'PM-003', code: 'CHAYBO2026', type: 'Phần trăm', value: '15%', minOrder: '500,000đ', qty: 200, used: 12, expiry: '15/07/2026', status: 'Đang chạy' },
    { id: 'PM-004', code: 'FREESHIPMAX', type: 'Số tiền', value: '30,000đ', minOrder: '300,000đ', qty: 500, used: 340, expiry: '31/12/2026', status: 'Đang chạy' },
    { id: 'PM-005', code: 'HE2026', type: 'Phần trăm', value: '20%', minOrder: '800,000đ', qty: 100, used: 0, expiry: '01/06/2026', status: 'Hết hạn' },
  ]);

  // 2. State quản lý tìm kiếm và bộ lọc trạng thái mã
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tất cả');

  // 3. Hàm xóa hoặc dừng chương trình khuyến mãi sớm
  const handleStopPromotion = (id) => {
    if (confirm('Bạn có chắc chắn muốn dừng hoặc xóa mã khuyến mãi này không?')) {
      setPromotions(promotions.map(promo => {
        if (promo.id === id) {
          return { ...promo, status: 'Hết hạn' };
        }
        return promo;
      }));
    }
  };

  // 4. Lọc dữ liệu dựa trên thanh tìm kiếm và select filter
  const filteredPromotions = promotions.filter(promo => {
    const matchesSearch = promo.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Tất cả' || promo.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 text-white">
      {/* TIÊU ĐỀ TRANG & NÚT TẠO MỚI */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Quản lý khuyến mãi</h2>
          <p className="text-xs text-gray-500 mt-0.5">Tạo mã giảm giá, thiết lập hạn mức và theo dõi hiệu suất chương trình</p>
        </div>
        <button className="bg-orange-500 hover:bg-orange-600 text-sm font-semibold px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-orange-500/10">
          <span>+</span> Tạo mã giảm giá mới
        </button>
      </div>

      {/* THANH TÌM KIẾM & BỘ LỌC TRẠNG THÁI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#161616] border border-[#222222] p-4 rounded-2xl">
        {/* Tìm theo Code */}
        <div className="relative md:col-span-2">
          <input
            type="text"
            placeholder="Tìm kiếm theo mã giảm giá (e.g. DYNOVA...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1c1c1c] border border-[#2d2d2d] focus:border-orange-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-all placeholder-gray-500 text-white"
          />
        </div>
        
        {/* Lọc trạng thái mã */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-[#1c1c1c] border border-[#2d2d2d] focus:border-orange-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-all text-white cursor-pointer"
          >
            <option value="Tất cả">Tất cả trạng thái</option>
            <option value="Đang chạy">Đang áp dụng</option>
            <option value="Hết lượt">Đã hết lượt dùng</option>
            <option value="Hết hạn">Đã hết hạn / Đã dừng</option>
          </select>
        </div>
      </div>

      {/* BẢNG DANH SÁCH MÃ KHUYẾN MÃI */}
      <div className="bg-[#161616] border border-[#222222] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="text-xs uppercase bg-[#1c1c1c] text-gray-500 font-bold">
              <tr>
                <th className="p-4">Mã khuyến mãi</th>
                <th className="p-4">Loại giảm</th>
                <th className="p-4">Mức giảm</th>
                <th className="p-4">Đơn tối thiểu</th>
                <th className="p-4 text-center">Đã dùng / Tổng số</th>
                <th className="p-4">Ngày hết hạn</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222222]">
              {filteredPromotions.length > 0 ? (
                filteredPromotions.map((promo) => (
                  <tr key={promo.id} className="hover:bg-[#1c1c1c]/40 transition-colors">
                    {/* Mã Code nổi bật */}
                    <td className="p-4">
                      <span className="font-mono font-bold text-sm text-orange-500 bg-orange-500/5 border border-orange-500/20 px-2.5 py-1 rounded-lg">
                        {promo.code}
                      </span>
                    </td>
                    {/* Loại giảm giá */}
                    <td className="p-4 text-gray-400 text-xs">{promo.type}</td>
                    {/* Mức giảm */}
                    <td className="p-4 text-white font-bold">{promo.value}</td>
                    {/* Đơn hàng tối thiểu */}
                    <td className="p-4 text-gray-300">{promo.minOrder}</td>
                    {/* Tiến độ sử dụng */}
                    <td className="p-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-white font-medium">{promo.used}/{promo.qty}</span>
                        {/* Thanh progress bar nhỏ mô phỏng tỉ lệ dùng */}
                        <div className="w-20 bg-[#222222] h-1.5 rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${(promo.used / promo.qty) * 100}%` }} 
                            className={`h-full ${promo.status === 'Đang chạy' ? 'bg-orange-500' : 'bg-gray-600'}`}
                          ></div>
                        </div>
                      </div>
                    </td>
                    {/* Ngày hết hạn */}
                    <td className="p-4 text-xs text-gray-400">{promo.expiry}</td>
                    {/* Trạng thái tag */}
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                        promo.status === 'Đang chạy' ? 'text-emerald-500 bg-emerald-500/10' :
                        promo.status === 'Hết lượt' ? 'text-amber-500 bg-amber-500/10' :
                        'text-rose-500 bg-rose-500/10'
                      }`}>
                        {promo.status}
                      </span>
                    </td>
                    {/* Hành động dừng nhanh */}
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors" title="Sửa cấu hình">
                          ✏️
                        </button>
                        <button
                          onClick={() => handleStopPromotion(promo.id)}
                          disabled={promo.status !== 'Đang chạy'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            promo.status === 'Đang chạy' 
                              ? 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10' 
                              : 'text-gray-600 cursor-not-allowed'
                          }`}
                          title="Dừng chương trình"
                        >
                          🛑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                /* Kết quả trống */
                <tr>
                  <td colSpan="8" className="p-8 text-center text-gray-500">
                    🔍 Không tìm thấy mã giảm giá nào khớp với bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}