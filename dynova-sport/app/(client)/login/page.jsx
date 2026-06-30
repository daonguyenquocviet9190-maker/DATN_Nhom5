"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Lock, Mail, ShieldCheck } from "lucide-react";
import { loginUser } from "@/utils/shopStorage";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "demo@dynova.vn", password: "123456" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    setTimeout(() => {
      const result = loginUser(form.email, form.password);
      setLoading(false);
      if (!result.ok) return setError(result.message);
      router.push(result.user.role === "admin" ? "/admin" : "/profile");
    }, 650);
  };

  return (
    <div className="min-h-screen bg-[#f7f8fb] py-12">
      <div className="container-page grid items-center gap-8 lg:grid-cols-2">
        <div className="overflow-hidden rounded-3xl bg-slate-950 text-white"><img src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&auto=format&fit=crop&q=80" alt="Dynova login" className="h-80 w-full object-cover opacity-75 lg:h-[620px]" /></div>
        <div className="surface mx-auto w-full max-w-md rounded-3xl p-7 md:p-8">
          <div className="mb-7 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-xs font-black text-white">DNV</div><h1 className="mt-4 text-2xl font-black text-slate-950">Đăng nhập</h1><p className="mt-2 text-sm text-slate-500">Tài khoản demo: demo@dynova.vn / 123456. Admin: admin@dynova.vn / 123456.</p></div>
          {error && <div className="mb-4 rounded-2xl bg-rose-50 p-3 text-sm font-bold text-rose-600">{error}</div>}
          <form onSubmit={submit} className="space-y-4"><label className="block"><span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">Email</span><div className="relative"><Mail className="absolute left-3 top-3.5 text-slate-400" size={16} /><input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-control pl-10" /></div></label><label className="block"><div className="mb-2 flex items-center justify-between"><span className="text-xs font-black uppercase tracking-wider text-slate-500">Mật khẩu</span><Link href="/forgot-password" className="text-xs font-bold text-orange-600">Quên mật khẩu?</Link></div><div className="relative"><Lock className="absolute left-3 top-3.5 text-slate-400" size={16} /><input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input-control pl-10" /></div></label><button disabled={loading} className="btn-primary flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-xs font-black uppercase tracking-wider disabled:bg-slate-300">{loading ? "Đang kiểm tra..." : "Đăng nhập"}<ArrowRight size={15} /></button></form>
          <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-xs font-bold leading-5 text-slate-500"><ShieldCheck className="mr-2 inline text-emerald-500" size={15} /> Đăng nhập lưu phiên dùng thử trong trình duyệt để test profile, wishlist, đơn hàng và admin.</div>
          <p className="mt-5 text-center text-sm text-slate-500">Chưa có tài khoản? <Link href="/register" className="font-black text-orange-600">Đăng ký ngay</Link></p>
        </div>
      </div>
    </div>
  );
}
