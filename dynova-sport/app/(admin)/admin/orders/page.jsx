'use client';

import { useEffect, useState } from "react";
import { Search, ShoppingBag, Eye, CheckCircle, X, User, Phone, MapPin, CreditCard, Calendar } from "lucide-react";
import { orderService } from "../../../../services/order.service";

export default function OrdersAdmin() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "---";
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderService.getAll();
      
      console.log("Dữ liệu gốc từ API đơn hàng trả về:", res); // Bạn F12 xem log này để debug

      // BỘ LỌC ĐA TẦNG: Đảm bảo bất kể Laravel bọc kiểu gì thì Frontend vẫn lấy được mảng đơn hàng
      if (Array.isArray(res)) {
        setOrders(res);
      } else if (res && Array.isArray(res.data)) {
        setOrders(res.data);
      } else if (res && res.data && Array.isArray(res.data.data)) {
        setOrders(res.data.data);
      } else if (res && Array.isArray(res.orders)) {
        setOrders(res.orders);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách đơn hàng:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Tìm kiếm thông minh khớp theo cấu trúc dữ liệu thực tế trong DB
  const filteredOrders = orders.filter((o) => {
    const code = o.order_code || o.id?.toString() || "";
    const customer = o.customer_name || "";
    const phone = o.customer_phone || "";
    const searchTarget = `${code} ${customer} ${phone}`.toLowerCase();
    return searchTarget.includes(query.toLowerCase());
  });

  const handleUpdateStatus = async (id, nextStatus) => {
    if (!confirm(`Xác nhận chuyển trạng thái đơn hàng sang trạng thái mới?`)) return;
    try {
      await orderService.update(id, { status: nextStatus });
      alert("Cập nhật trạng thái thành công!");
      fetchOrders();
    } catch (error) {
      alert("Cập nhật thất bại, vui lòng kiểm tra lại API!");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'complete': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'shipping': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'confirmed': return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
      case 'pending': default: return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    }
  };

  const getStatusLabel = (status) => {
    const labels = { pending: 'Chờ xử lý', confirmed: 'Đã xác nhận', shipping: 'Đang giao', complete: 'Hoàn thành' };
    return labels[status] || 'Chờ xử lý';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500 mb-2"></div>
        <p className="text-xs uppercase tracking-widest text-slate-500">Đang đồng bộ dữ liệu đơn hàng...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 text-white">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-orange-400">Hệ thống quản trị</p>
        <h2 className="text-2xl font-black uppercase mt-1">Quản lý đơn hàng</h2>
      </div>

      <div className="bg-[#161616] border border-[#222222] rounded-2xl p-5">
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-3 text-slate-500" size={16} />
          <input 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            className="w-full pl-10 bg-[#1c1c1c] border border-[#2d2d2d] rounded-xl py-2 text-sm text-white outline-none focus:border-orange-500" 
            placeholder="Tìm theo mã đơn (DHV...), tên khách, SĐT..." 
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="text-xs uppercase text-slate-500 bg-[#1c1c1c]">
              <tr>
                <th className="p-3">Mã đơn</th>
                <th className="p-3">Khách hàng</th>
                <th className="p-3">Ngày đặt</th>
                <th className="p-3">Tổng tiền</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-3 font-mono font-bold text-orange-400">{o.order_code || `#${o.id}`}</td>
                    <td className="p-3">
                      <div className="text-white font-bold">{o.customer_name}</div>
                      <div className="text-xs text-slate-500">{o.customer_phone}</div>
                    </td>
                    <td className="p-3 text-xs">{formatDate(o.created_at)}</td>
                    <td className="p-3 font-mono text-white font-semibold">{formatCurrency(o.total_price)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(o.status)}`}>
                        {getStatusLabel(o.status)}
                      </span>
                    </td>
                    <td className="p-3 text-right flex justify-end gap-2">
                      <select 
                        value={o.status || 'pending'} 
                        onChange={(e) => handleUpdateStatus(o.id, e.target.value)}
                        className="bg-[#1c1c1c] border border-[#2d2d2d] text-xs text-slate-300 rounded px-2 py-1 outline-none"
                      >
                        <option value="pending">Chờ xử lý</option>
                        <option value="confirmed">Xác nhận</option>
                        <option value="shipping">Đang giao</option>
                        <option value="complete">Hoàn thành</option>
                      </select>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-slate-500">
                    <ShoppingBag className="mx-auto mb-2 opacity-30" size={32} /> 
                    Không có đơn hàng nào được hiển thị. Vui lòng kiểm tra lại log API Backend!
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