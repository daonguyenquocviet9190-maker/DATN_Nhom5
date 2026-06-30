'use client';

import { useEffect, useState } from "react";
import { Search, ShoppingBag, Eye, CheckCircle } from "lucide-react";
import { orderService } from "../../../../services/order.service";

export default function OrdersAdmin() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await orderService.getAll();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Lỗi lấy danh sách đơn hàng:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter((o) => {
    const code = o.order_code || o.id?.toString() || "";
    const customer = o.customer_name || "";
    return code.toLowerCase().includes(query.toLowerCase()) || customer.toLowerCase().includes(query.toLowerCase());
  });

  const handleUpdateStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === "Chờ xử lý" ? "Đang giao" : "Đã hoàn thành";
    if (!confirm(`Xác nhận chuyển trạng thái đơn hàng sang: ${nextStatus}?`)) return;
    
    try {
      await orderService.update(id, { status: nextStatus });
      alert("Cập nhật trạng thái đơn hàng thành công!");
      fetchOrders();
    } catch (error) {
      alert("Cập nhật trạng thái thất bại!");
    }
  };

  if (loading) {
    return <div className="text-center text-gray-400 py-10">Đang tải danh sách đơn hàng...</div>;
  }

  return (
    <div className="space-y-6 p-2">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-300">Sales</p>
        <h2 className="mt-2 text-3xl font-black uppercase text-white">Quản lý đơn hàng</h2>
      </div>

      <div className="admin-card rounded-3xl p-5 bg-[#161616] border border-[#222222]">
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-3.5 text-slate-500" size={16} />
          <input 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            className="w-full pl-10 bg-[#1c1c1c] border border-[#2d2d2d] rounded-xl py-2.5 text-sm text-white outline-none focus:border-orange-500" 
            placeholder="Tìm kiếm mã đơn hàng hoặc tên khách hàng..." 
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="text-xs uppercase text-slate-500 bg-[#1c1c1c]">
              <tr>
                <th className="p-3">Mã đơn</th>
                <th className="p-3">Khách hàng</th>
                <th className="p-3">Tổng tiền</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-3 font-mono font-bold text-orange-300">#{o.order_code || o.id}</td>
                    <td className="p-3 text-white font-bold">{o.customer_name || "Khách vãng lai"}</td>
                    <td className="p-3 font-mono text-white">{formatCurrency(o.total_price || o.total || 0)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        o.status === 'Đã hoàn thành' ? 'bg-emerald-500/10 text-emerald-400' : 
                        o.status === 'Đang giao' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'
                      }`}>
                        {o.status || 'Chờ xử lý'}
                      </span>
                    </td>
                    <td className="p-3 text-right flex justify-end gap-2">
                      <button className="text-slate-400 p-2 hover:bg-white/5 rounded-xl" title="Xem chi tiết">
                        <Eye size={16} />
                      </button>
                      {o.status !== 'Đã hoàn thành' && (
                        <button 
                          onClick={() => handleUpdateStatus(o.id, o.status || 'Chờ xử lý')}
                          className="text-emerald-400 p-2 hover:bg-emerald-500/10 rounded-xl" 
                          title="Duyệt đơn / Chuyển trạng thái"
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500">
                    <ShoppingBag className="mx-auto mb-2 opacity-30" size={24} /> Không có đơn hàng nào.
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