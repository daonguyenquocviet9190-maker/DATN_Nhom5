"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  Boxes,
  ChevronRight,
  ClipboardList,
  Home,
  Image,
  LayoutDashboard,
  LogOut,
  Menu,
  Percent,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tags,
  Users,
  X,
} from "lucide-react";

import {
  clearAuthSession,
  getAuthToken,
  getStoredAuthUser,
  normalizeAuthRole,
} from "@/services/auth.service";

const sections = [
  {
    title: "Tổng quan",
    items: [
      {
        name: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "Bán hàng",
    items: [
      {
        name: "Sản phẩm",
        href: "/admin/products",
        icon: ShoppingBag,
      },
      {
        name: "Danh mục",
        href: "/admin/categories",
        icon: Tags,
      },
      {
        name: "Thương hiệu",
        href: "/admin/brands",
        icon: Sparkles,
      },
      {
        name: "Đơn hàng",
        href: "/admin/orders",
        icon: ClipboardList,
      },
      {
        name: "Mã giảm giá",
        href: "/admin/promotions",
        icon: Percent,
      },
      // {
      //   name: "Tồn kho",
      //   href: "/admin/inventory",
      //   icon: Boxes,
      // },
    ],
  },
  {
    title: "Khách hàng",
    items: [
      {
        name: "Người dùng",
        href: "/admin/customers",
        icon: Users,
      },
      {
        name: "Đánh giá",
        href: "/admin/ratings",
        icon: BarChart3,
      },
    ],
  },
  // {
  //   title: "Nội dung",
  //   items: [
  //     {
  //       name: "Banner",
  //       href: "/admin/banners",
  //       icon: Image,
  //     },
  //   ],
  // },
  {
    title: "Hệ thống",
    items: [
      {
        name: "Cấu hình",
        href: "/admin/settings",
        icon: Settings,
      },
    ],
  },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    const user = getStoredAuthUser();
    const role = normalizeAuthRole(user);

    if (!token || !user) {
      setAllowed(false);
      setChecking(false);
      router.replace("/login?redirect=/admin");
      return;
    }

    if (role !== "admin") {
      setAllowed(false);
      setChecking(false);
      router.replace("/");
      return;
    }

    setAdminUser(user);
    setAllowed(true);
    setChecking(false);
  }, [router]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const currentPage = useMemo(() => {
    const items = sections.flatMap((section) => section.items);

    const found = [...items]
      .sort((a, b) => b.href.length - a.href.length)
      .find((item) => {
        if (item.href === "/admin") return pathname === "/admin";
        return pathname.startsWith(item.href);
      });

    return found || items[0];
  }, [pathname]);

  const handleLogout = () => {
    clearAuthSession();
    router.replace("/login");
  };

  const SidebarContent = () => (
    <>
      <div className="relative z-10 flex h-[78px] shrink-0 items-center justify-between border-b border-white/10 bg-slate-950/80 px-5 backdrop-blur-2xl">
        <Link href="/admin" className="flex min-w-0 items-center gap-3">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-orange-500 text-xs font-black text-white shadow-lg shadow-orange-500/25">
            <span className="relative z-10">DNV</span>
            <span className="absolute inset-x-0 bottom-0 h-1/2 bg-white/15" />
          </div>

          <div className="min-w-0">
            <p className="truncate font-black uppercase tracking-[-0.03em] text-white">
              Dynova Admin
            </p>
            <p className="truncate text-[11px] font-extrabold uppercase tracking-[0.2em] text-orange-300">
              Commerce Console
            </p>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="rounded-2xl p-2 text-slate-400 transition hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Đóng menu"
        >
          <X size={20} />
        </button>
      </div>

      <div className="admin-scroll admin-sidebar-scroll flex-1 overflow-y-auto overflow-x-hidden scroll-smooth px-4 py-5">
        <div className="mb-6 rounded-[26px] border border-white/10 bg-white/[0.06] p-4 shadow-sm shadow-black/10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-black text-orange-300 ring-1 ring-white/10">
              {adminUser?.fullName?.charAt(0)?.toUpperCase() ||
                adminUser?.name?.charAt(0)?.toUpperCase() ||
                adminUser?.email?.charAt(0)?.toUpperCase() ||
                "A"}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-black text-white">
                {adminUser?.fullName || adminUser?.name || "Admin"}
              </p>
              <p className="truncate text-xs font-semibold text-slate-400">
                {adminUser?.email || "admin@dynova.vn"}
              </p>
            </div>
          </div>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-orange-500/15 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-orange-300 ring-1 ring-orange-400/10">
            <ShieldCheck size={13} />
            Quản trị viên
          </div>
        </div>

        <nav className="space-y-6 pb-2">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="mb-2 px-3 text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
                {section.title}
              </p>

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;

                  const active =
                    item.href === "/admin"
                      ? pathname === "/admin"
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={
                        "group relative flex items-center gap-3 overflow-hidden rounded-2xl px-3 py-3 text-sm font-bold transition-all duration-300 " +
                        (active
                          ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25"
                          : "text-slate-400 hover:bg-white/[0.06] hover:text-white")
                      }
                    >
                      {active && (
                        <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-white/80" />
                      )}

                      <span
                        className={
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition " +
                          (active
                            ? "bg-white/15 text-white"
                            : "bg-white/[0.05] text-slate-400 group-hover:bg-white/10 group-hover:text-orange-300")
                        }
                      >
                        <Icon size={18} />
                      </span>

                      <span className="flex-1 truncate">{item.name}</span>

                      {active && <ChevronRight size={16} className="shrink-0" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className="relative z-10 shrink-0 border-t border-white/10 bg-slate-950/85 p-4 backdrop-blur-2xl">
        <Link
          href="/"
          className="mb-2 flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-slate-400 transition hover:bg-white/[0.06] hover:text-orange-300"
        >
          {/* <Home size={18} />
          Về website */}
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-bold text-rose-300 transition hover:bg-rose-500/10 hover:text-rose-200"
        >
          <LogOut size={18} />
          Đăng xuất
        </button>
      </div>
    </>
  );

  if (checking) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-white/15 border-t-orange-500" />
          <p className="text-lg font-black">Đang kiểm tra quyền truy cập...</p>
          <p className="mt-2 text-sm font-semibold text-slate-400">
            Chỉ tài khoản admin mới được vào trang quản trị.
          </p>
        </div>
      </div>
    );
  }

  if (!allowed) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <style jsx global>{`
        .admin-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(249, 115, 22, 0.72) transparent;
          scrollbar-gutter: stable;
        }

        .admin-scroll::-webkit-scrollbar {
          width: 10px;
        }

        .admin-scroll::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 999px;
        }

        .admin-scroll::-webkit-scrollbar-thumb {
          min-height: 56px;
          border: 3px solid transparent;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.1);
          background-clip: padding-box;
        }

        .admin-scroll:hover::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #fb923c, #f97316);
          background-clip: padding-box;
        }

        .admin-scroll::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #fdba74, #ea580c);
          background-clip: padding-box;
        }

        .admin-scroll::-webkit-scrollbar-corner {
          background: transparent;
        }

        .admin-sidebar-scroll {
          mask-image: linear-gradient(
            to bottom,
            transparent 0,
            black 18px,
            black calc(100% - 18px),
            transparent 100%
          );
          -webkit-mask-image: linear-gradient(
            to bottom,
            transparent 0,
            black 18px,
            black calc(100% - 18px),
            transparent 100%
          );
        }
      `}</style>

      <div className="fixed inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(249,115,22,0.16),transparent_30%),radial-gradient(circle_at_90%_20%,rgba(59,130,246,0.08),transparent_28%)]" />

      {sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-[80] bg-slate-950/70 backdrop-blur-sm lg:hidden"
          aria-label="Đóng menu admin"
        />
      )}

      <aside
        className={
          "fixed inset-y-0 left-0 z-[90] flex w-72 flex-col border-r border-white/10 bg-slate-950/92 shadow-2xl shadow-black/30 backdrop-blur-2xl transition-transform duration-300 lg:translate-x-0 " +
          (sidebarOpen ? "translate-x-0" : "-translate-x-full")
        }
      >
        <SidebarContent />
      </aside>

      <div className="relative z-10 lg:pl-72">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur-2xl">
          <div className="flex min-h-[78px] items-center justify-between gap-4 px-4 py-3 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-white transition hover:bg-orange-500 lg:hidden"
                aria-label="Mở menu"
              >
                <Menu size={20} />
              </button>

              {/* <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-300">
                  Dynova Sport
                </p>
                <h1 className="truncate text-xl font-black tracking-[-0.03em] text-white md:text-2xl">
                  {currentPage?.name || "Bảng quản trị"}
                </h1>
              </div> */}
            </div>

            {/* <div className="hidden max-w-md flex-1 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-slate-400 md:flex">
              <Search size={17} />
              <input
                className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-500"
                placeholder="Tìm nhanh đơn hàng, sản phẩm, người dùng..."
              />
            </div> */}

            <div className="flex items-center gap-2">
              {/* <Link
                href="/"
                className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-black text-slate-200 transition hover:border-orange-400/40 hover:bg-orange-500 hover:text-white sm:flex"
              >
                <ArrowLeft size={16} />
                Website
              </Link> */}

              {/* <button
                type="button"
                onClick={handleLogout}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/20 transition hover:bg-rose-500"
                aria-label="Đăng xuất"
              >
                <LogOut size={18} />
              </button> */}
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-78px)] p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}