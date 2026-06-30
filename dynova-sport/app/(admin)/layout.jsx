"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Boxes, ClipboardList, LayoutDashboard, Percent, Search, Settings, ShoppingBag, Tags, Users } from "lucide-react";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const sections = [
    { title: "Tổng quan", items: [{ name: "Dashboard", href: "/admin", icon: LayoutDashboard }] },
    { title: "Bán hàng", items: [{ name: "Sản phẩm", href: "/admin/products", icon: ShoppingBag }, { name: "Danh mục", href: "/admin/categories", icon: Tags }, { name: "Đơn hàng", href: "/admin/orders", icon: ClipboardList }, { name: "Mã giảm giá", href: "/admin/promotions", icon: Percent }, { name: "Người dùng", href: "/admin/customers", icon: Users }, { name: "Tồn kho", href: "/admin/inventory", icon: Boxes }] },
    { title: "Hệ thống", items: [{ name: "Cấu hình", href: "/admin/settings", icon: Settings }] },
  ];
  return (
    <div className="admin-shell min-h-screen text-white">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-white/10 bg-slate-950/70 p-5 backdrop-blur-xl lg:block">
        <Link href="/" className="mb-8 flex items-center gap-3 rounded-2xl border border-white/10 p-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500 text-xs font-black">DNV</div><div><p className="font-black uppercase tracking-wide">Dynova Admin</p><p className="text-xs text-slate-400">Commerce Console</p></div></Link>
        <nav className="space-y-6">{sections.map((section) => <div key={section.title}><p className="mb-2 px-3 text-[11px] font-black uppercase tracking-[0.25em] text-slate-500">{section.title}</p><div className="space-y-1">{section.items.map((item) => { const Icon = item.icon; const active = pathname === item.href; return <Link key={item.href} href={item.href} className={"flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition " + (active ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "text-slate-400 hover:bg-white/5 hover:text-white")}><Icon size={18} /> {item.name}</Link>; })}</div></div>)}</nav>
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/65 px-5 py-4 backdrop-blur-xl lg:px-8"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.25em] text-orange-300">Dynova Sport</p><h1 className="text-xl font-black">Bảng quản trị</h1></div><div className="hidden max-w-md flex-1 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-400 md:flex"><Search size={17} /><input className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500" placeholder="Tìm nhanh đơn hàng, sản phẩm, người dùng..." /></div><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 font-black">A</div></div></header>
        <main className="p-5 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
