'use client'; // Bật chế độ Client Component để tương tác dữ liệu
import React, { useState } from 'react';

export default function AdminDashboard() {
  // Giả lập danh sách đơn hàng thực tế từ cơ sở dữ liệu
  const [orders] = useState([
    { id: '#4521', customer: 'Nguyễn Văn A', product: 'Giày Chạy Bộ Dynova X', price: '1,250,000đ', status: 'Chờ xử lý', statusColor: 'text-amber-500 bg-amber-500/10' },
    { id: '#4520', customer: 'Lê Hoàng Nam', product: 'Áo Thể Thao Pro-Dry', price: '350,000đ', status: 'Đang giao', statusColor: 'text-blue-500 bg-blue-500/10' },
    { id: '#4519', customer: 'Trần Thị B', product: 'Thảm Tập Yoga TPE', price: '450,000đ', status: 'Đã giao', statusColor: 'text-emerald-500 bg-emerald-500/10' },
    { id: '#4518', customer: 'Phạm Minh Tuấn', product: 'Tạ Tay IronMax 5kg', price: '680,000đ', status: 'Đã hủy', statusColor: 'text-rose-500 bg-rose-500/10' },
  ]);

  return (
    <div className="space-y-6">
      {/* BANNER CHÀO MỪNG */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-5 flex items-center justify-between shadow-lg shadow-orange-500/10">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            Chào mừng trở lại, Admin! 👋
          </h3>
          <p className="text-orange-100 text-sm mt-1">
            Hôm nay hệ thống có {orders.filter(o => o.status === 'Chờ xử lý').length} đơn hàng mới cần xử lý gấp.
          </p>
        </div>
        <button className="bg-white text-orange-600 hover:bg-orange-50 text-sm font-semibold px-4 py-2 rounded-xl flex items-center gap-2 transition-all">
          Xem chi tiết <span>➔</span>
        </button>
      </div>

      {/* THẺ THỐNG KÊ (STAT CARDS) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-[#161616] border border-[#222222] rounded-2xl p-5 relative overflow-hidden">
          <p className="text-[11px] uppercase tracking-wider text-gray-500 font-bold">Doanh thu tháng</p>
          <p className="text-2xl font-bold mt-2">42.8M</p>
          <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1">🗠 12.5% <span className="text-gray-500">tháng trước</span></p>
          <span className="absolute top-4 right-4 bg-orange-500/10 text-orange-500 p-2 rounded-xl text-lg">💵</span>
        </div>

        <div className="bg-[#161616] border border-[#222222] rounded-2xl p-5 relative overflow-hidden">
          <p className="text-[11px] uppercase tracking-wider text-gray-500 font-bold">Số đơn hàng</p>
          <p className="text-2xl font-bold mt-2">184</p>
          <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1">🗠 8.2% <span className="text-gray-500">tháng trước</span></p>
          <span className="absolute top-4 right-4 bg-blue-500/10 text-blue-500 p-2 rounded-xl text-lg">🛍️</span>
        </div>

        <div className="bg-[#161616] border border-[#222222] rounded-2xl p-5 relative overflow-hidden">
          <p className="text-[11px] uppercase tracking-wider text-gray-500 font-bold">Khách hàng mới</p>
          <p className="text-2xl font-bold mt-2">67</p>
          <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1">🗠 5.1% <span className="text-gray-500">tháng trước</span></p>
          <span className="absolute top-4 right-4 bg-emerald-500/10 text-emerald-500 p-2 rounded-xl text-lg">👥</span>
        </div>

        <div className="bg-[#161616] border border-[#222222] rounded-2xl p-5 relative overflow-hidden">
          <p className="text-[11px] uppercase tracking-wider text-gray-500 font-bold">Lịch hẹn</p>
          <p className="text-2xl font-bold mt-2">29</p>
          <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">🗠 2.3% <span className="text-gray-500">tháng trước</span></p>
          <span className="absolute top-4 right-4 bg-purple-500/10 text-purple-500 p-2 rounded-xl text-lg">📅</span>
        </div>
      </div>

      {/* BIỂU ĐỒ & HOẠT ĐỘNG */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Khung vẽ cột biểu đồ đồ họa mượt bằng CSS Tailwind */}
        <div className="bg-[#161616] border border-[#222222] rounded-2xl p-6 lg:col-span-2 flex flex-col justify-between min-h-[350px]">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-base font-bold">Doanh thu theo tháng</h4>
              <p className="text-xs text-gray-500 mt-0.5">Năm 2026 — triệu VND</p>
            </div>
            <button className="bg-[#222222] text-xs text-gray-300 hover:text-white px-3 py-1.5 rounded-lg border border-[#333333]">Xuất báo cáo</button>
          </div>
          
          {/* Giả lập các thanh biểu đồ tăng trưởng bằng CSS */}
          <div className="flex items-end justify-between h-40 px-2 gap-2">
            {[40, 55, 45, 60, 75, 50, 65, 80, 70, 85, 90, 100].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                <div style={{ height: `${height}%` }} className={`w-full rounded-t-md transition-all duration-300 ${i === 11 ? 'bg-orange-500' : 'bg-[#2a2a2a] group-hover:bg-gray-600'}`}></div>
              </div>
            ))}
          </div>

          <div className="flex justify-between text-xs text-gray-500 pt-4 border-t border-[#222222]/50 px-2">
            {['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'].map((month, idx) => (
              <span key={idx} className={month === 'T12' ? 'text-white font-bold' : ''}>{month}</span>
            ))}
          </div>
        </div>

        {/* Hoạt động gần đây */}
        <div className="bg-[#161616] border border-[#222222] rounded-2xl p-6 flex flex-col">
          <h4 className="text-base font-bold mb-5">Hoạt động gần đây</h4>
          <div className="space-y-4 flex-1 overflow-y-auto">
            <div className="flex gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">🛍️</div>
              <div>
                <p className="text-gray-300"><span className="text-white font-semibold">Nguyễn Văn A</span> vừa đặt đơn hàng <span className="text-orange-400">#4521</span></p>
                <span className="text-[11px] text-gray-500">2 phút trước</span>
              </div>
            </div>
            <div className="flex gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">✓</div>
              <div>
                <p className="text-gray-300">Đơn hàng <span className="text-orange-400">#4519</span> đã giao thành công</p>
                <span className="text-[11px] text-gray-500">15 phút trước</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BẢNG ĐƠN HÀNG GẦN ĐÂY THỰC TẾ */}
      <div className="bg-[#161616] border border-[#222222] rounded-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h4 className="text-base font-bold">Đơn hàng mới tiếp nhận</h4>
            <p className="text-xs text-gray-500">Danh sách cập nhật theo thời gian thực</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="text-xs uppercase bg-[#1c1c1c] text-gray-500 rounded-lg">
              <tr>
                <th className="p-3 rounded-l-lg">Mã đơn</th>
                <th className="p-3">Khách hàng</th>
                <th className="p-3">Sản phẩm</th>
                <th className="p-3">Giá trị</th>
                <th className="p-3 rounded-r-lg">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222222]">
              {orders.map((order, idx) => (
                <tr key={idx} className="hover:bg-[#1c1c1c]/50 transition-colors">
                  <td className="p-3 font-semibold text-orange-500">{order.id}</td>
                  <td className="p-3 text-white font-medium">{order.customer}</td>
                  <td className="p-3">{order.product}</td>
                  <td className="p-3 text-white">{order.price}</td>
                  <td className="p-3">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${order.statusColor}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}