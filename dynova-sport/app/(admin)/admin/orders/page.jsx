"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardList, Loader2, Search } from "lucide-react";
import { formatCurrency } from "@/data/shop";
import { extractItems, getAdminOrders, updateAdminOrderStatus } from "@/services/admin.service";

const STATUS_OPTIONS = ["pending", "processing", "shipping", "completed", "cancelled"];

function getCustomer(order) {
  return order?.customerName || order?.customer_name || order?.user?.name || order?.name || "Khách hàng";
}

function getTotal(order) {
  return Number(order?.total || order?.total_price || order?.grand_total || 0);
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getAdminOrders({ per_page: 200 });
      setOrders(extractItems(response, ["orders"]));
    } catch (err) {
      setError(err?.message || "Không thể tải đơn hàng. Cần có API /api/admin/orders.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return orders.filter((order) => {
      const orderStatus = String(order?.status || "pending").toLowerCase();
      const text = [order.id, getCustomer(order), order.email, order.phone, order.payment_method, orderStatus].filter(Boolean).join(" ").toLowerCase();
      return (status === "all" || orderStatus === status) && (!keyword || text.includes(keyword));
    });
  }, [orders, query, status]);

  const showNotice = (message) => { setNotice(message); setTimeout(() => setNotice(""), 1800); };

  const changeStatus = async (order, nextStatus) => {
    try {
      setUpdatingId(order.id);
      await updateAdminOrderStatus(order.id, nextStatus);
      showNotice("Đã cập nhật trạng thái đơn hàng.");
      await loadData();
    } catch (err) {
      setError(err?.message || "Không thể cập nhật trạng thái đơn hàng.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {notice && <div className="fixed right-5 top-24 z-[120] rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black text-white">{notice}</div>}
      <section className="rounded-[32px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-300">Orders</p>
        <h2 className="mt-2 text-2xl font-black text-white">Quản lý đơn hàng</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">Theo dõi và cập nhật trạng thái đơn hàng.</p>
        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_220px]">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-slate-400"><Search size={18}/><input value={query} onChange={(e)=>setQuery(e.target.value)} className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-500" placeholder="Tìm mã đơn, khách hàng, số điện thoại..." /></div>
          <select value={status} onChange={(e)=>setStatus(e.target.value)} className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm font-black text-white outline-none"><option value="all">Tất cả trạng thái</option>{STATUS_OPTIONS.map(s=><option key={s} value={s}>{s}</option>)}</select>
        </div>
      </section>
      {error && <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm font-bold text-rose-200">{error}</div>}
      <section className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.06] backdrop-blur-xl">
        {loading ? <div className="grid h-72 place-items-center"><Loader2 className="animate-spin text-orange-300" size={34}/></div> : filtered.length === 0 ? <div className="grid h-72 place-items-center text-center"><div><ClipboardList className="mx-auto text-orange-300" size={42}/><p className="mt-4 font-black text-white">Chưa có đơn hàng</p></div></div> : <div className="overflow-x-auto"><table className="min-w-[980px] w-full text-left"><thead className="border-b border-white/10 bg-white/[0.04] text-xs font-black uppercase tracking-wider text-slate-400"><tr><th className="px-5 py-4">Mã đơn</th><th className="px-5 py-4">Khách hàng</th><th className="px-5 py-4">Thanh toán</th><th className="px-5 py-4">Tổng tiền</th><th className="px-5 py-4">Trạng thái</th><th className="px-5 py-4">Ngày tạo</th></tr></thead><tbody className="divide-y divide-white/10">{filtered.map(order=><tr key={order.id} className="hover:bg-white/[0.04]"><td className="px-5 py-4 font-black text-orange-300">#{order.id}</td><td className="px-5 py-4"><p className="font-black text-white">{getCustomer(order)}</p><p className="text-xs text-slate-500">{order.email || order.phone || "Không có thông tin"}</p></td><td className="px-5 py-4 text-sm font-bold text-slate-300">{order.payment_method || order.paymentMethod || "COD"}</td><td className="px-5 py-4 font-black text-white">{formatCurrency(getTotal(order))}</td><td className="px-5 py-4"><select disabled={updatingId === order.id} value={order.status || "pending"} onChange={(e)=>changeStatus(order,e.target.value)} className="rounded-2xl border border-white/10 bg-slate-950 px-3 py-2 text-xs font-black text-white outline-none disabled:opacity-50">{STATUS_OPTIONS.map(s=><option key={s} value={s}>{s}</option>)}</select></td><td className="px-5 py-4 text-sm text-slate-500">{order.created_at || order.date || "--"}</td></tr>)}</tbody></table></div>}
      </section>
    </div>
  );
}
