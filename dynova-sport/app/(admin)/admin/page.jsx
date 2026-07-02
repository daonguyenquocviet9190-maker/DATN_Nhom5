'use client';

import { useEffect, useState } from "react";
import { DollarSign, ShoppingBag, Users, ClipboardList, TrendingUp, ArrowUpRight, Package, UserPlus } from "lucide-react";
import { productService } from "../../../services/product.service";
import { orderService } from "../../../services/order.service";
import { userService } from "../../../services/user.service";

export default function DashboardAdmin() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Gọi đồng thời các API để tối ưu tốc độ tải trang
        const [products, orders, users] = await Promise.allSettled([
          productService.getAll(),
          orderService.getAll(),
          userService.getAll()
        ]);

        const productsData = products.status === 'fulfilled' && Array.isArray(products.value) ? products.value : [];
        const ordersData = orders.status === 'fulfilled' && Array.isArray(orders.value) ? orders.value : [];
        const usersData = users.status === 'fulfilled' && Array.isArray(users.value) ? users.value : [];

        // Tính toán tổng doanh thu từ các đơn hàng thành công hoặc đã hoàn thành
        const revenue = ordersData.reduce((sum, order) => {
          if (order.status === 'Đã hoàn thành' || !order.status) {
            return sum + (Number(order.total_price || order.total) || 0);
          }
          return sum;
        }, 0);

        setStats({
          totalRevenue: revenue,
          totalOrders: ordersData.length,
          totalProducts: productsData.length,
          totalCustomers: usersData.length
        });

        // Lấy 5 đơn hàng mới nhất hiển thị lên bảng điều khiển
        setRecentOrders(ordersData.slice(0, 5));

      } catch (error) {
        console.error("Lỗi tải dữ liệu Dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="text-center text-gray-400 py-10">Đang khởi tạo bảng điều khiển tổng quan...</div>;
  }

  // Danh sách thẻ cấu trúc vòng lặp hiển thị Grid thống kê nhanh
  const statCards = [
    { title: "Tổng doanh thu", value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-500/10", desc: "Đơn hàng hoàn thành" },
    { title: "Đơn hàng mới", value: `${stats.totalOrders} đơn`, icon: ClipboardList, color: "text-blue-400", bg: "bg-blue-500/10", desc: "Cần xử lý vận chuyển" },
    { title: "Tổng sản phẩm", value: `${stats.totalProducts} mặt hàng`, icon: Package, color: "text-orange-400", bg: "bg-orange-500/10", desc: "Đang hiển thị công khai" },
    { title: "Thành viên hệ thống", value: `${stats.totalCustomers} tài khoản`, icon: Users, color: "text-amber-400", bg: "bg-amber-500/10", desc: "Tương tác trong tháng" },
  ];

  return (
    <div className="space-y-8 p-2">
      {/* TIÊU ĐỀ KHỐI CHÍNH */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-300">Overview</p>
          <h2 className="mt-2 text-3xl font-black uppercase text-white tracking-wide">Tổng quan kinh doanh</h2>
        </div>
        <div className="flex items-center gap-2 bg-[#161616] border border-[#222222] px-4 py-2 rounded-xl text-xs font-mono text-slate-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Dữ liệu thời gian thực
        </div>
      </div>

      {/* 4 THẺ GRID THỐNG KÊ NHANH */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="admin-card rounded-2xl p-5 bg-[#161616] border border-[#222222] flex items-center justify-between hover:border-neutral-700 transition-all duration-300">
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{card.title}</p>
                <h3 className="text-xl font-black text-white tracking-tight">{card.value}</h3>
                <p className="text-[11px] text-slate-400 font-light font-sans">{card.desc}</p>
              </div>
              <div className={`p-3 rounded-xl ${card.bg} ${card.color}`}>
                <Icon size={20} />
              </div>
            </div>
          );
        })}
      </div>

      {/* KHỐI BIỂU ĐỒ & ĐƠN HÀNG MỚI */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* CỘT TRÁI: DANH SÁCH ĐƠN HÀNG VỪA ĐẶT */}
        <div className="lg:col-span-2 admin-card rounded-2xl p-5 bg-[#161616] border border-[#222222] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-300">Đơn hàng vừa đặt</h3>
              <span className="text-xs text-orange-400 hover:underline cursor-pointer flex items-center gap-1 font-medium">
                Xem tất cả <ArrowUpRight size={14} />
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-400">
                <thead className="uppercase text-slate-500 bg-[#1c1c1c]">
                  <tr>
                    <th className="p-3">Mã đơn</th>
                    <th className="p-3">Khách hàng</th>
                    <th className="p-3">Giá trị</th>
                    <th className="p-3 text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentOrders.length > 0 ? (
                    recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-white/5">
                        <td className="p-3 font-mono font-bold text-orange-300">#{order.order_code || order.id}</td>
                        <td className="p-3 text-white font-semibold">{order.customer_name || "Khách vãng lai"}</td>
                        <td className="p-3 font-mono text-slate-300">{formatCurrency(order.total_price || order.total || 0)}</td>
                        <td className="p-3 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                            order.status === 'Đã hoàn thành' ? 'bg-emerald-500/10 text-emerald-400' : 
                            order.status === 'Đang giao' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'
                          }`}>
                            {order.status || 'Chờ xử lý'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="p-6 text-center text-slate-600 italic">Hiện tại hệ thống chưa phát sinh đơn hàng mới nào.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: BÁO CÁO TĂNG TRƯỞNG & TỶ LỆ */}
        <div className="admin-card rounded-2xl p-5 bg-[#161616] border border-[#222222] space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-300">Hiệu suất sàn</h3>
            <TrendingUp size={16} className="text-orange-400" />
          </div>

          {/* Biểu đồ giả lập tăng trưởng bằng CSS thanh bar */}
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-medium">Tỷ lệ chuyển đổi đơn hàng</span>
                <span className="font-mono text-white">74%</span>
              </div>
              <div className="w-full h-1.5 bg-[#1c1c1c] rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: '74%' }}></div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-medium">Mục tiêu doanh số năm</span>
                <span className="font-mono text-white">42%</span>
              </div>
              <div className="w-full h-1.5 bg-[#1c1c1c] rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '42%' }}></div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-medium">Tốc độ xuất kho hàng</span>
                <span className="font-mono text-white">88%</span>
              </div>
              <div className="w-full h-1.5 bg-[#1c1c1c] rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '88%' }}></div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500">
            <span>Dữ liệu chốt: Cuối tháng</span>
            <span className="text-slate-400 font-medium">Dynova Engine v1.0</span>
          </div>
        </div>

      </div>
    </div>
  );
}