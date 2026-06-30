"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Heart, Lock, Mail, MapPin, Package, Phone, Save, ShieldCheck, ShoppingBag, Star, User } from "lucide-react";
import { formatCurrency } from "@/data/shop";
import { changePassword, getCurrentUser, getOrders, getWishlistProducts, updateCurrentUser } from "@/utils/shopStorage";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", address: "" });
  const [password, setPassword] = useState({ old: "", next: "" });
  const [message, setMessage] = useState("");
  const [wishlist, setWishlist] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const current = getCurrentUser();
    setUser(current);
    if (current) setForm({ fullName: current.fullName || "", email: current.email || "", phone: current.phone || "", address: current.address || "" });
    setWishlist(getWishlistProducts());
    setOrders(getOrders());
  }, []);

  const completion = useMemo(() => [form.fullName, form.email, form.phone, form.address].filter(Boolean).length * 25, [form]);
  const userOrders = orders.filter((order) => !user || order.email === user.email || order.phone === user.phone).slice(0, 4);

  const saveProfile = (event) => {
    event.preventDefault();
    const next = updateCurrentUser(form);
    setUser(next);
    setMessage("Đã lưu thông tin cá nhân.");
    setTimeout(() => setMessage(""), 2200);
  };

  const savePassword = (event) => {
    event.preventDefault();
    const result = changePassword(form.email, password.old, password.next);
    setMessage(result.message);
    if (result.ok) setPassword({ old: "", next: "" });
    setTimeout(() => setMessage(""), 2200);
  };

  if (!user) {
    return <div className="min-h-screen bg-[#f7f8fb] py-14"><div className="container-page"><div className="surface mx-auto max-w-lg rounded-3xl p-8 text-center"><User className="mx-auto text-orange-500" size={42} /><h1 className="mt-4 text-2xl font-black text-slate-950">Bạn cần đăng nhập</h1><p className="mt-2 text-sm text-slate-500">Đăng nhập để quản lý hồ sơ, đơn hàng và danh sách yêu thích.</p><Link href="/login" className="btn-primary mt-6 inline-block rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-wider">Đăng nhập</Link></div></div></div>;
  }

  return (
    <div className="min-h-screen bg-[#f7f8fb] py-10">
      <div className="container-page">
        {message && <div className="fixed right-5 top-24 z-50 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-2xl">{message}</div>}
        <section className="overflow-hidden rounded-3xl bg-slate-950 text-white"><div className="grid lg:grid-cols-[1fr_420px]"><div className="p-7 md:p-10"><p className="text-xs font-black uppercase tracking-[0.25em] text-orange-300">Profile</p><h1 className="mt-3 text-4xl font-black">{form.fullName}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">Quản lý thông tin cá nhân, bảo mật, wishlist và lịch sử mua hàng tại Dynova Sport.</p><div className="mt-6 h-3 max-w-sm overflow-hidden rounded-full bg-white/10"><div className="h-full bg-orange-500" style={{ width: completion + "%" }} /></div><p className="mt-2 text-xs font-bold text-slate-300">Hồ sơ hoàn thiện {completion}%</p></div><img src="https://images.unsplash.com/photo-1571019613914-85f342c6a11e?w=900&auto=format&fit=crop&q=80" alt="Profile" className="h-72 w-full object-cover lg:h-full" /></div></section>

        <section className="mt-6 grid gap-4 md:grid-cols-4">{[{ icon: Package, label: "Đơn hàng", value: orders.length }, { icon: Heart, label: "Yêu thích", value: wishlist.length }, { icon: Star, label: "Điểm thưởng", value: 2540 }, { icon: ShoppingBag, label: "Đang xử lý", value: orders.filter((item) => item.status !== "Hoàn thành").length }].map((stat) => { const Icon = stat.icon; return <div key={stat.label} className="surface rounded-2xl p-5"><Icon className="text-orange-500" size={22} /><p className="mt-3 text-2xl font-black text-slate-950">{stat.value}</p><p className="text-sm font-bold text-slate-500">{stat.label}</p></div>; })}</section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <form onSubmit={saveProfile} className="surface rounded-3xl p-6"><h2 className="mb-5 text-xl font-black text-slate-950">Thông tin cá nhân</h2><div className="grid gap-4 md:grid-cols-2"><label><span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">Họ tên</span><div className="relative"><User className="absolute left-3 top-3.5 text-slate-400" size={16} /><input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="input-control pl-10" /></div></label><label><span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">Email</span><div className="relative"><Mail className="absolute left-3 top-3.5 text-slate-400" size={16} /><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-control pl-10" /></div></label><label><span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">Số điện thoại</span><div className="relative"><Phone className="absolute left-3 top-3.5 text-slate-400" size={16} /><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-control pl-10" /></div></label><label><span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">Địa chỉ</span><div className="relative"><MapPin className="absolute left-3 top-3.5 text-slate-400" size={16} /><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input-control pl-10" /></div></label></div><button className="btn-primary mt-5 inline-flex items-center gap-2 rounded-2xl px-5 py-4 text-xs font-black uppercase tracking-wider"><Save size={16} /> Lưu thay đổi</button></form>
            <form onSubmit={savePassword} className="surface rounded-3xl p-6"><h2 className="mb-5 text-xl font-black text-slate-950">Bảo mật tài khoản</h2><div className="grid gap-4 md:grid-cols-2"><input required type="password" value={password.old} onChange={(e) => setPassword({ ...password, old: e.target.value })} className="input-control" placeholder="Mật khẩu hiện tại" /><input required type="password" value={password.next} onChange={(e) => setPassword({ ...password, next: e.target.value })} className="input-control" placeholder="Mật khẩu mới" /></div><button className="btn-ghost mt-5 inline-flex items-center gap-2 rounded-2xl px-5 py-4 text-xs font-black uppercase tracking-wider"><Lock size={16} /> Đổi mật khẩu</button><p className="mt-3 flex items-center gap-2 text-xs font-bold text-emerald-600"><ShieldCheck size={15} /> Email và số điện thoại đã xác thực trong bản demo.</p></form>
          </div>
          <aside className="space-y-6"><div className="surface rounded-3xl p-6"><div className="mb-4 flex items-center justify-between"><h2 className="font-black text-slate-950">Đơn gần đây</h2><Link href="/orders" className="text-xs font-black text-orange-600">Xem tất cả</Link></div><div className="space-y-3">{userOrders.length ? userOrders.map((order) => <div key={order.id} className="rounded-2xl bg-slate-50 p-4"><div className="flex justify-between"><p className="font-black text-slate-950">#{order.id}</p><span className="text-xs font-black text-orange-600">{order.status}</span></div><p className="mt-2 text-sm font-bold text-slate-500">{formatCurrency(order.total)}</p></div>) : <p className="text-sm text-slate-500">Chưa có đơn hàng cá nhân.</p>}</div></div><div className="surface rounded-3xl p-6"><div className="mb-4 flex items-center justify-between"><h2 className="font-black text-slate-950">Wishlist</h2><Link href="/wishlist" className="text-xs font-black text-orange-600">Quản lý</Link></div><div className="space-y-3">{wishlist.slice(0, 3).map((product) => <Link href={"/shop/product/" + product.id} key={product.id} className="flex gap-3 rounded-2xl bg-slate-50 p-3"><img src={product.image} alt={product.name} className="h-14 w-14 rounded-xl object-cover" /><div><p className="line-clamp-2 text-sm font-black text-slate-950">{product.name}</p><p className="text-xs font-bold text-orange-600">{formatCurrency(product.price)}</p></div></Link>)}{wishlist.length === 0 && <p className="text-sm text-slate-500">Bạn chưa lưu sản phẩm nào.</p>}</div></div></aside>
        </div>
      </div>
    </div>
  );
}
