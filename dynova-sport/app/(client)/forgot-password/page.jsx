"use client";

import { useState } from "react";
import { KeyRound, Lock, Mail, ShieldCheck } from "lucide-react";
import { changePassword, getCurrentUser } from "@/utils/shopStorage";

export default function ForgotPasswordPage() {
  const current = getCurrentUser();
  const [mode, setMode] = useState("forgot");
  const [email, setEmail] = useState(current?.email || "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    if (newPassword.length < 6) return setError("Mật khẩu mới cần tối thiểu 6 ký tự.");
    const result = changePassword(email, mode === "change" ? oldPassword : "", newPassword);
    if (!result.ok) return setError(result.message);
    setMessage(mode === "forgot" ? "Đã đặt lại mật khẩu demo. Bạn có thể đăng nhập bằng mật khẩu mới." : "Đổi mật khẩu thành công.");
  };

  return (
    <div className="min-h-screen bg-[#f7f8fb] py-12"><div className="container-page"><div className="surface mx-auto max-w-lg rounded-3xl p-7 md:p-8"><div className="text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-600"><KeyRound size={26} /></div><h1 className="mt-4 text-2xl font-black text-slate-950">Quên / Đổi mật khẩu</h1><p className="mt-2 text-sm leading-6 text-slate-500">Trong bản demo, hệ thống cập nhật mật khẩu trực tiếp trên dữ liệu trình duyệt.</p></div><div className="mt-6 grid grid-cols-2 rounded-2xl bg-slate-100 p-1"><button onClick={() => setMode("forgot")} className={"rounded-xl py-3 text-sm font-black " + (mode === "forgot" ? "bg-white text-orange-600 shadow-sm" : "text-slate-500")}>Quên mật khẩu</button><button onClick={() => setMode("change")} className={"rounded-xl py-3 text-sm font-black " + (mode === "change" ? "bg-white text-orange-600 shadow-sm" : "text-slate-500")}>Đổi mật khẩu</button></div>{error && <div className="mt-4 rounded-2xl bg-rose-50 p-3 text-sm font-bold text-rose-600">{error}</div>}{message && <div className="mt-4 rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-600">{message}</div>}<form onSubmit={submit} className="mt-5 space-y-4"><label className="block"><span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">Email tài khoản</span><div className="relative"><Mail className="absolute left-3 top-3.5 text-slate-400" size={16} /><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-control pl-10" /></div></label>{mode === "change" && <label className="block"><span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">Mật khẩu hiện tại</span><div className="relative"><Lock className="absolute left-3 top-3.5 text-slate-400" size={16} /><input required type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className="input-control pl-10" /></div></label>}<label className="block"><span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">Mật khẩu mới</span><div className="relative"><ShieldCheck className="absolute left-3 top-3.5 text-slate-400" size={16} /><input required type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input-control pl-10" /></div></label><button className="btn-primary w-full rounded-2xl py-4 text-xs font-black uppercase tracking-wider">Cập nhật mật khẩu</button></form></div></div></div>
  );
}
