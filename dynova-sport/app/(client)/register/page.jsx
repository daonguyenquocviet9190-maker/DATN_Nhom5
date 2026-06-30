"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Lock, Mail, Phone, User } from "lucide-react";
import { registerUser } from "@/utils/shopStorage";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const submit = (event) => {
    event.preventDefault();
    setError("");
    if (form.password.length < 6) return setError("Mật khẩu cần tối thiểu 6 ký tự.");
    if (form.password !== form.confirmPassword) return setError("Mật khẩu xác nhận không khớp.");
    const result = registerUser(form);
    if (!result.ok) return setError(result.message);
    setMessage("Đăng ký thành công. Bạn có thể đăng nhập ngay.");
    setTimeout(() => router.push("/login"), 900);
  };

  return (
    <div className="min-h-screen bg-[#f7f8fb] py-12">
      <div className="container-page grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div><p className="text-xs font-black uppercase tracking-[0.25em] text-orange-500">Thành viên Dynova</p><h1 className="mt-3 text-4xl font-black text-slate-950 md:text-5xl">Tạo tài khoản để mua nhanh hơn</h1><p className="mt-4 text-sm leading-7 text-slate-500">Lưu hồ sơ giao hàng, theo dõi đơn, quản lý wishlist và nhận ưu đãi thành viên.</p><img src="https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf?w=1200&auto=format&fit=crop&q=80" alt="Register" className="mt-8 h-72 w-full rounded-3xl object-cover" /></div>
        <div className="surface rounded-3xl p-7 md:p-8"><h2 className="text-2xl font-black text-slate-950">Đăng ký tài khoản</h2>{error && <div className="mt-4 rounded-2xl bg-rose-50 p-3 text-sm font-bold text-rose-600">{error}</div>}{message && <div className="mt-4 rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-600">{message}</div>}<form onSubmit={submit} className="mt-6 grid gap-4 md:grid-cols-2"><label className="block md:col-span-2"><span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">Họ tên</span><div className="relative"><User className="absolute left-3 top-3.5 text-slate-400" size={16} /><input required value={form.fullName} onChange={(e) => update("fullName", e.target.value)} className="input-control pl-10" /></div></label><label className="block"><span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">Email</span><div className="relative"><Mail className="absolute left-3 top-3.5 text-slate-400" size={16} /><input required type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="input-control pl-10" /></div></label><label className="block"><span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">Số điện thoại</span><div className="relative"><Phone className="absolute left-3 top-3.5 text-slate-400" size={16} /><input required value={form.phone} onChange={(e) => update("phone", e.target.value)} className="input-control pl-10" /></div></label><label className="block"><span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">Mật khẩu</span><div className="relative"><Lock className="absolute left-3 top-3.5 text-slate-400" size={16} /><input required type="password" value={form.password} onChange={(e) => update("password", e.target.value)} className="input-control pl-10" /></div></label><label className="block"><span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">Xác nhận</span><div className="relative"><Lock className="absolute left-3 top-3.5 text-slate-400" size={16} /><input required type="password" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} className="input-control pl-10" /></div></label><button className="btn-primary flex items-center justify-center gap-2 rounded-2xl py-4 text-xs font-black uppercase tracking-wider md:col-span-2">Đăng ký <ArrowRight size={15} /></button></form><p className="mt-5 text-center text-sm text-slate-500">Đã có tài khoản? <Link href="/login" className="font-black text-orange-600">Đăng nhập</Link></p></div>
      </div>
    </div>
  );
}
