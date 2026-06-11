'use client';
import React, { useState } from 'react';

export default function OrdersAdmin() {
  // 1. Giả lập danh sách đơn hàng thực tế của hệ thống Dynova Sport
  const [orders, setOrders] = useState([
    { id: 'ORD-4521', customer: 'Nguyễn Văn A', date: '10/06/2026', total: 1250000, payment: 'COD', status: 'Chờ xử lý', statusColor: 'text-amber-500 bg-amber-500/10' },
    { id: 'ORD-4520', customer: 'Lê Hoàng Nam', date: '10/06/2026', total: 350000, payment: 'Chuyển khoản', status: 'Đang giao', statusColor: 'text-blue-500 bg-blue-500/10' },
    { id: 'ORD-4519', customer: 'Trần Thị Bích', date: '09/06/2026', total: 2450000, payment: 'Chuyển khoản', status: 'Đã giao', statusColor: 'text-emerald-500 bg-emerald-500/10' },
    { id: 'ORD-4518', customer: 'Phạm Minh Tuấn', date: '08/06/2026', total: 680000, payment: 'COD', status: 'Đã hủy', statusColor: 'text-rose-500 bg-rose-500/10' },
    { id: 'ORD-4517', customer: 'Hoàng Thu Thảo', date: '08/06/2026', total: 1850000, payment: 'Chuyển khoản', status: 'Đã giao', statusColor: 'text-emerald-500 bg-emerald-500/10' },
  ]);

  // 2. State quản lý Tìm kiếm và Bộ lọc trạng thái đơn hàng nhanh
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tất cả');

  // 3. Hàm xử lý Cập nhật trạng thái đơn hàng nhanh (Duyệt đơn / Giao hàng)
  const handleUpdateStatus = (id, nextStatus) => {
    let color = 'text-amber-500 bg-amber-500/10';
    if (nextStatus === 'Đang giao') color = 'text-blue-500 bg-blue-500/10';
    if (nextStatus === 'Đã giao') color = 'text-emerald-500 bg-emerald-500/10';
    if (nextStatus === 'Đã hủy') color = 'text-rose-500 bg-rose-500/10';

    setOrders(orders.map(order => {
      if (order.id === id) {
        return { ...order, status: nextStatus, statusColor: color };
      }
      return order;
    }));
  };

  // 4. Lọc danh sách đơn hàng dựa trên từ khóa tìm kiếm và tab trạng thái được chọn
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
      order.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Tất cả' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 text-white">
      {/* TIÊU ĐỀ TRANG */}
      <div>
        <h2 className="text-xl font-bold">Quản lý đơn hàng</h2>
        <p className="text-xs text-gray-500 mt-0.5">Tiếp nhận, xử lý trạng thái đơn hàng và kiểm tra hình thức thanh toán</p>
      </div>

      {/* THANH BỘ LỌC TRẠNG THÁI NHANH (TABS) */}
      <div className="flex flex-wrap gap-2 border-b border-[#222222] pb-1">
        {['Tất cả', 'Chờ xử lý', 'Đang giao', 'Đã giao', 'Đã hủy'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`text-xs font-semibold px-4 py-2.5 rounded-t-xl transition-all ${
              statusFilter === status 
                ? 'bg-[#161616] border-t-2 border-t-orange-500 text-orange-500 font-bold' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {status} ({status === 'Tất cả' ? orders.length : orders.filter(o => o.status === status).length})
          </button>
        ))}
      </div>

      {/* THANH TÌM KIẾM ĐƠN HÀNG */}
      <div className="bg-[#161616] border border-[#222222] p-4 rounded-2xl">
        <input
          type="text"
          placeholder="Tìm kiếm theo mã đơn hàng (ORD-...) hoặc tên khách hàng..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#1c1c1c] border border-[#2d2d2d] focus:border-orange-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-all placeholder-gray-500 text-white"
        />
      </div>

      {/* BẢNG DANH SÁCH ĐƠN HÀNG */}
      <div className="bg-[#161616] border border-[#222222] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="text-xs uppercase bg-[#1c1c1c] text-gray-500 font-bold">
              <tr>
                <th className="p-4">Mã đơn</th>
                <th className="p-4">Khách hàng</th>
                <th className="p-4">Ngày đặt</th>
                <th className="p-4">Tổng tiền</th>
                <th className="p-4">Thanh toán</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-center">Xử lý đơn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222222]">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#1c1c1c]/40 transition-colors">
                    {/* Mã đơn hàng */}
                    <td className="p-4 font-bold text-orange-500 text-xs">{order.id}</td>
                    {/* Tên khách hàng */}
                    <td className="p-4 text-white font-medium">{order.customer}</td>
                    {/* Ngày đặt đơn */}
                    <td className="p-4 text-xs text-gray-400">{order.date}</td>
                    {/* Tổng tiền đơn hàng */}
                    <td className="p-4 text-white font-semibold">
                      {order.total.toLocaleString('vi-VN')}đ
                    </td>
                    {/* Phương thức thanh toán */}
                    <td className="p-4">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${
                        order.payment === 'Chuyển khoản' ? 'border-blue-500/30 text-blue-400 bg-blue-500/5' : 'border-gray-700 text-gray-400'
                      }`}>
                        {order.payment}
                      </span>
                    </td>
                    {/* Trạng thái vận đơn */}
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${order.statusColor}`}>
                        {order.status}
                      </span>
                    </td>
                    {/* Cột các hành động cập nhật trạng thái nhanh */}
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-1.5 text-xs">
                        {order.status === 'Chờ xử lý' && (
                          <>
                            <button onClick={() => handleUpdateStatus(order.id, 'Đang giao')} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-2.5 py-1 rounded transition-colors">
                              📦 Giao hàng
                            </button>
                            <button onClick={() => handleUpdateStatus(order.id, 'Đã hủy')} className="bg-[#222222] hover:bg-rose-950 hover:text-rose-400 text-gray-400 font-medium px-2.5 py-1 rounded transition-colors">
                              Hủy đơn
                            </button>
                          </>
                        )}
                        {order.status === 'Đang giao' && (
                          <button onClick={() => handleUpdateStatus(order.id, 'Đã giao')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-2.5 py-1 rounded transition-colors">
                            ✓ Hoàn tất giao
                          </button>
                        )}
                        {order.status === 'Đã giao' && (
                          <span className="text-emerald-500/70 text-xs font-medium">✨ Đơn đã hoàn thành</span>
                        )}
                        {order.status === 'Đã hủy' && (
                          <span className="text-rose-500/50 text-xs line-through">Đơn bị hủy</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                /* Thông báo khi không tìm thấy đơn hàng */
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-500">
                    🔍 Không tìm thấy đơn hàng nào ở bộ lọc này.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* FOOTER PHÂN TRANG */}
        <div className="p-4 bg-[#1c1c1c] border-t border-[#222222] flex justify-between items-center text-xs text-gray-500">
          <p>Hiển thị {filteredOrders.length} trên tổng số {orders.length} vận đơn</p>
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