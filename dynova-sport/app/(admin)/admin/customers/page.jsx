"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, UserRound, Users } from "lucide-react";
import { extractItems, getAdminCustomers, updateAdminCustomerStatus } from "@/services/admin.service";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getAdminCustomers({ per_page: 200 });
      setCustomers(extractItems(response, ["customers", "users"]));
    } catch (err) {
      setError(err?.message || "Không thể tải danh sách khách hàng. Vui lòng thử lại.");
      setCustomers([]);
    } finally { setLoading(false); }
  };

  useEffect(()=>{loadData();},[]);

  const filtered = useMemo(()=>{const k=query.trim().toLowerCase(); return customers.filter(u=>!k || [u.name,u.fullName,u.email,u.phone,u.role].filter(Boolean).join(" ").toLowerCase().includes(k));},[customers,query]);
  const showNotice = m => {setNotice(m); setTimeout(()=>setNotice(""),1800)};
  const toggleStatus = async (user) => {try{setUpdatingId(user.id); await updateAdminCustomerStatus(user.id, !(user.is_active !== false && user.is_active !== 0)); showNotice("Đã cập nhật trạng thái khách hàng."); await loadData();}catch(err){setError(err?.message||"Không thể cập nhật khách hàng.")}finally{setUpdatingId(null)}};

  return <div className="space-y-6">{notice && <div className="fixed right-5 top-24 z-[120] rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black text-white">{notice}</div>}<section className="rounded-[32px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl"><p className="text-xs font-black uppercase tracking-[0.22em] text-orange-300">Customers</p><h2 className="mt-2 text-2xl font-black text-white">Quản lý khách hàng</h2>
<div className="mt-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-slate-400"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-500" placeholder="Tìm khách hàng..."/></div></section>{error && <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm font-bold text-rose-200">{error}</div>}<section className="rounded-[32px] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl">{loading ? <div className="grid h-72 place-items-center"><Loader2 className="animate-spin text-orange-300" size={34}/></div> : filtered.length===0 ? <div className="grid h-72 place-items-center text-center"><div><Users className="mx-auto text-orange-300" size={42}/><p className="mt-4 font-black text-white">Chưa có khách hàng</p></div></div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map(user=><div key={user.id} className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5"><div className="flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 text-lg font-black text-white"><UserRound size={24}/></div><div className="min-w-0"><p className="truncate font-black text-white">{user.fullName||user.name||"Khách hàng"}</p><p className="truncate text-sm text-slate-500">{user.email}</p></div></div><div className="mt-4 grid gap-2 text-sm text-slate-400"><p>Điện thoại: <b className="text-slate-200">{user.phone || "--"}</b></p><p>Vai trò: <b className="text-orange-300">{user.role?.name || user.role || user.role_name || "customer"}</b></p></div><button disabled={updatingId===user.id} onClick={()=>toggleStatus(user)} className={(user.is_active === false || user.is_active === 0 ? "bg-emerald-500 hover:bg-emerald-600" : "bg-rose-500 hover:bg-rose-600") + " mt-5 w-full rounded-2xl px-4 py-3 text-sm font-black text-white disabled:opacity-50"}>{user.is_active === false || user.is_active === 0 ? "Mở tài khoản" : "Khóa tài khoản"}</button></div>)}</div>}</section></div>;
}
