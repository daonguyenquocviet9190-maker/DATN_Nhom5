"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BadgeCheck,
  ChevronDown,
  ClipboardList,
  CreditCard,
  Headphones,
  Heart,
  LogOut,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  PackageCheck,
  Phone,
  RotateCcw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  User,
  X,
} from "lucide-react";

import {
  getCart,
  getCurrentUser,
  getProducts,
  getSettings,
  getWishlistProducts,
  logoutUser,
} from "@/utils/shopStorage";

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef(null);

  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [openUser, setOpenUser] = useState(false);
  const [openMobile, setOpenMobile] = useState(false);
  const [openSearch, setOpenSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [settings, setSettings] = useState(null);

  const [messages, setMessages] = useState([
    {
      role: "shop",
      text: "Dynova xin chào. Bạn cần tư vấn size, đơn hàng hay thanh toán?",
    },
  ]);

  const menuItems = [
    { name: "Trang chủ", href: "/" },
    { name: "Sản phẩm", href: "/shop" },
    { name: "Bộ sưu tập", href: "/collections" },
    { name: "Tin tức", href: "/news" },
    { name: "Giới thiệu", href: "/about" },
    { name: "Liên hệ", href: "/contact" },
  ];

  const footerLinks = [
    {
      title: "Mua sắm",
      links: [
        { name: "Sản phẩm mới", href: "/shop" },
        { name: "Bộ sưu tập", href: "/collections" },
        { name: "Sản phẩm yêu thích", href: "/wishlist" },
        { name: "Tin tức thể thao", href: "/news" },
      ],
    },
    {
      title: "Hỗ trợ",
      links: [
        { name: "Theo dõi đơn hàng", href: "/orders" },
        { name: "Chính sách đổi trả", href: "/contact" },
        { name: "Hướng dẫn thanh toán", href: "/checkout" },
        { name: "Liên hệ tư vấn", href: "/contact" },
      ],
    },
    {
      title: "Tài khoản",
      links: [
        { name: "Hồ sơ cá nhân", href: "/profile" },
        { name: "Đăng nhập", href: "/login" },
        { name: "Đăng ký", href: "/register" },
        { name: "Dashboard quản trị", href: "/admin" },
      ],
    },
  ];

  const syncState = () => {
    setUser(getCurrentUser());
    setCartCount(
      getCart().reduce((sum, item) => sum + Number(item.quantity || 0), 0)
    );
    setWishlistCount(getWishlistProducts().length);
    setSettings(getSettings());
  };

  useEffect(() => {
    syncState();

    window.addEventListener("storage", syncState);
    window.addEventListener("dynova:storage", syncState);

    return () => {
      window.removeEventListener("storage", syncState);
      window.removeEventListener("dynova:storage", syncState);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenUser(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const products = useMemo(() => getProducts(), [openSearch, searchTerm]);

  const searchResults = products
    .filter((product) => {
      const keyword = searchTerm.toLowerCase();

      return (
        product.name.toLowerCase().includes(keyword) ||
        product.category.toLowerCase().includes(keyword)
      );
    })
    .slice(0, 5);

  const handleSearch = (event) => {
    event.preventDefault();

    const query = searchTerm.trim();
    if (!query) return;

    setOpenSearch(false);
    router.push("/search?q=" + encodeURIComponent(query));
  };

  const handleLogout = () => {
    logoutUser();
    setOpenUser(false);
    syncState();
    router.push("/");
  };

  const sendChat = (preset) => {
    const text = (preset || chatInput).trim();
    if (!text) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", text },
      {
        role: "shop",
        text: "Mình đã nhận thông tin. Nhân viên Dynova sẽ phản hồi trong ít phút. Bạn có thể để lại số điện thoại nếu cần gọi lại.",
      },
    ]);

    setChatInput("");
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 font-sans backdrop-blur-2xl">
        <div className="hidden border-b border-slate-100 bg-slate-950 text-white lg:block">
          <div className="container-page flex h-9 items-center justify-between text-[12px] font-semibold">
            <div className="flex items-center gap-5 text-slate-300">
              <span className="flex items-center gap-2">
                <Phone size={13} className="text-orange-400" />
                {settings?.hotline || "0866 347 730"}
              </span>

              <span className="flex items-center gap-2">
                <Mail size={13} className="text-orange-400" />
                {settings?.email || "cskh@dynova.vn"}
              </span>
            </div>

            <div className="flex items-center gap-5 text-slate-300">
  <span className="flex items-center gap-2">
    <Truck size={14} className="text-orange-400" />
    Miễn phí giao hàng cho đơn từ 500K
  </span>

  <span className="flex items-center gap-2">
    <ShieldCheck size={14} className="text-orange-400" />
    Đổi trả 30 ngày
  </span>
</div>
          </div>
        </div>

        <div className="container-page flex h-[76px] items-center justify-between gap-4">
          <Link href="/" className="group flex items-center gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-slate-950 text-[12px] font-black tracking-tight text-white shadow-lg shadow-slate-950/15 transition group-hover:-translate-y-0.5">
              <span className="relative z-10">DNV</span>
              <span className="absolute inset-x-0 bottom-0 h-1/2 bg-orange-500/90" />
            </div>

            <div className="leading-tight">
              <p className="text-[20px] font-black uppercase tracking-[-0.03em] text-slate-950">
                Dynova
              </p>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-orange-500">
                Sport Shop
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 rounded-2xl bg-slate-50 p-1 lg:flex">
            {menuItems.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    "relative rounded-xl px-4 py-2.5 text-[13px] font-extrabold transition-all duration-300 " +
                    (active
                      ? "bg-white text-orange-600 shadow-sm shadow-slate-200"
                      : "text-slate-600 hover:bg-white hover:text-slate-950")
                  }
                >
                  {item.name}

                  {active && (
                    <span className="absolute inset-x-4 -bottom-1 h-[3px] rounded-full bg-orange-500" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setOpenSearch(true)}
              className="btn-ghost flex h-11 w-11 items-center justify-center rounded-2xl"
              aria-label="Tìm kiếm"
            >
              <Search size={18} />
            </button>

            <Link
              href="/wishlist"
              className="btn-ghost relative hidden h-11 w-11 items-center justify-center rounded-2xl sm:flex"
              aria-label="Yêu thích"
            >
              <Heart size={18} />

              {wishlistCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-950 px-1 text-[10px] font-black text-white ring-2 ring-white">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link
              href="/cart"
              className="btn-ghost relative flex h-11 w-11 items-center justify-center rounded-2xl"
              aria-label="Giỏ hàng"
            >
              <ShoppingBag size={18} />

              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-black text-white ring-2 ring-white">
                  {cartCount}
                </span>
              )}
            </Link>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setOpenUser(!openUser)}
                className="hidden h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-slate-700 shadow-sm transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 md:flex"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100">
                  <User size={16} />
                </span>

                <span className="max-w-28 truncate text-[13px] font-extrabold">
                  {user?.fullName || "Tài khoản"}
                </span>

                <ChevronDown
                  size={14}
                  className={
                    "transition " + (openUser ? "rotate-180" : "rotate-0")
                  }
                />
              </button>

              <button
                onClick={() => setOpenUser(!openUser)}
                className="btn-ghost flex h-11 w-11 items-center justify-center rounded-2xl md:hidden"
                aria-label="Tài khoản"
              >
                <User size={18} />
              </button>

              {openUser && (
                <div className="float-in absolute right-0 mt-3 w-72 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/15">
                  {user ? (
                    <>
                      <div className="bg-slate-950 p-4 text-white">
                        <p className="text-[12px] font-semibold text-slate-300">
                          Xin chào,
                        </p>
                        <p className="mt-1 truncate text-base font-black">
                          {user.fullName}
                        </p>
                      </div>

                      <div className="p-2">
                        <Link
                          href="/profile"
                          onClick={() => setOpenUser(false)}
                          className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 hover:text-orange-600"
                        >
                          <Settings size={17} />
                          Hồ sơ cá nhân
                        </Link>

                        <Link
                          href="/orders"
                          onClick={() => setOpenUser(false)}
                          className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 hover:text-orange-600"
                        >
                          <ClipboardList size={17} />
                          Lịch sử mua hàng
                        </Link>

                        {user.role === "admin" && (
                          <Link
                            href="/admin"
                            onClick={() => setOpenUser(false)}
                            className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-orange-600 transition hover:bg-orange-50"
                          >
                            <ShieldCheck size={17} />
                            Vào quản trị
                          </Link>
                        )}

                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-bold text-rose-600 transition hover:bg-rose-50"
                        >
                          <LogOut size={17} />
                          Đăng xuất
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="p-4">
                      <div className="mb-4 rounded-2xl bg-slate-50 p-4">
                        <p className="text-sm font-black text-slate-950">
                          Chào mừng đến Dynova
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Đăng nhập để theo dõi đơn hàng, lưu sản phẩm yêu thích
                          và nhận ưu đãi riêng.
                        </p>
                      </div>

                      <div className="grid gap-2">
                        <Link
                          href="/login"
                          onClick={() => setOpenUser(false)}
                          className="btn-primary block rounded-2xl px-4 py-3 text-center text-xs font-black uppercase tracking-wider"
                        >
                          Đăng nhập
                        </Link>

                        <Link
                          href="/register"
                          onClick={() => setOpenUser(false)}
                          className="btn-ghost block rounded-2xl px-4 py-3 text-center text-xs font-black uppercase tracking-wider"
                        >
                          Đăng ký
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => setOpenMobile(true)}
              className="btn-ghost flex h-11 w-11 items-center justify-center rounded-2xl lg:hidden"
              aria-label="Mở menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {openMobile && (
        <div className="fixed inset-0 z-[70] bg-slate-950/50 backdrop-blur-sm lg:hidden">
          <div className="float-in ml-auto flex h-full w-[86%] max-w-sm flex-col bg-white shadow-2xl">
            <div className="border-b border-slate-100 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-black uppercase tracking-[-0.03em] text-slate-950">
                    Dynova
                  </p>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-orange-500">
                    Sport Shop
                  </p>
                </div>

                <button
                  onClick={() => setOpenMobile(false)}
                  className="btn-ghost rounded-2xl p-2"
                >
                  <X size={19} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid gap-2">
                {menuItems.map((item) => {
                  const active =
                    pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpenMobile(false)}
                      className={
                        "rounded-2xl px-4 py-3 text-sm font-extrabold transition " +
                        (active
                          ? "bg-orange-50 text-orange-600"
                          : "text-slate-700 hover:bg-slate-50")
                      }
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </div>

              <div className="mt-5 rounded-3xl bg-slate-50 p-3">
                <Link
                  href="/wishlist"
                  onClick={() => setOpenMobile(false)}
                  className="flex items-center justify-between rounded-2xl px-3 py-3 text-sm font-bold text-slate-700"
                >
                  Danh sách yêu thích
                  <span className="rounded-full bg-white px-2 py-1 text-xs font-black text-slate-900">
                    {wishlistCount}
                  </span>
                </Link>

                <Link
                  href="/orders"
                  onClick={() => setOpenMobile(false)}
                  className="block rounded-2xl px-3 py-3 text-sm font-bold text-slate-700"
                >
                  Theo dõi đơn hàng
                </Link>

                <Link
                  href="/cart"
                  onClick={() => setOpenMobile(false)}
                  className="flex items-center justify-between rounded-2xl px-3 py-3 text-sm font-bold text-slate-700"
                >
                  Giỏ hàng
                  <span className="rounded-full bg-white px-2 py-1 text-xs font-black text-orange-600">
                    {cartCount}
                  </span>
                </Link>
              </div>
            </div>

            <div className="border-t border-slate-100 p-4">
              <div className="rounded-3xl bg-slate-950 p-4 text-white">
                <p className="text-sm font-black">Cần hỗ trợ nhanh?</p>
                <p className="mt-1 text-xs leading-5 text-slate-300">
                  Liên hệ hotline để được tư vấn size, thanh toán và đơn hàng.
                </p>
                <p className="mt-3 text-sm font-black text-orange-400">
                  {settings?.hotline || "0866 347 730"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {openSearch && (
        <div className="fixed inset-0 z-[80] bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="float-in mx-auto mt-14 max-w-2xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-sm font-black uppercase tracking-wider text-slate-950">
                  Tìm kiếm sản phẩm
                </p>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  Nhập tên sản phẩm, danh mục hoặc thương hiệu.
                </p>
              </div>

              <button
                onClick={() => setOpenSearch(false)}
                className="rounded-2xl p-2 text-slate-500 transition hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>

            <div className="p-4">
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                  className="input-control"
                  placeholder="Ví dụ: giày chạy bộ, áo thể thao..."
                />

                <button
                  className="btn-primary rounded-2xl px-5"
                  aria-label="Tìm"
                >
                  <Search size={18} />
                </button>
              </form>

              <div className="mt-4 space-y-2">
                {searchResults.map((product) => (
                  <Link
                    key={product.id}
                    href={"/shop/product/" + product.id}
                    onClick={() => setOpenSearch(false)}
                    className="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-slate-50"
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-14 w-14 rounded-2xl object-cover"
                    />

                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-900">
                        {product.name}
                      </p>
                      <p className="text-xs font-semibold text-slate-500">
                        {product.category}
                      </p>
                    </div>
                  </Link>
                ))}

                {searchTerm && searchResults.length === 0 && (
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                    Chưa tìm thấy sản phẩm phù hợp.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="min-h-screen bg-white">{children}</main>

      <footer className="relative mt-20 overflow-hidden bg-slate-950 font-sans text-white">
        <div className="absolute left-0 top-0 h-64 w-64 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="container-page relative">
          <div className="-mt-px grid gap-4 border-b border-white/10 py-8 md:grid-cols-4">
            <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <Truck className="text-orange-400" size={24} />
              <div>
                <p className="text-sm font-black">Giao hàng nhanh</p>
                <p className="mt-1 text-xs text-slate-400">
                  Hỗ trợ toàn quốc
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <RotateCcw className="text-orange-400" size={24} />
              <div>
                <p className="text-sm font-black">Đổi trả 30 ngày</p>
                <p className="mt-1 text-xs text-slate-400">
                  Linh hoạt, rõ ràng
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <CreditCard className="text-orange-400" size={24} />
              <div>
                <p className="text-sm font-black">Thanh toán linh hoạt</p>
                <p className="mt-1 text-xs text-slate-400">
                  COD / chuyển khoản
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <Headphones className="text-orange-400" size={24} />
              <div>
                <p className="text-sm font-black">Tư vấn tận tâm</p>
                <p className="mt-1 text-xs text-slate-400">
                  Size, đơn hàng, bảo hành
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-10 py-14 lg:grid-cols-[1.35fr_2fr_1.1fr]">
            <div>
              <Link href="/" className="inline-flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[12px] font-black text-slate-950">
                  DNV
                </div>

                <div>
                  <p className="text-2xl font-black uppercase tracking-[-0.04em]">
                    Dynova Sport
                  </p>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-orange-400">
                    Premium Sport Shop
                  </p>
                </div>
              </Link>

              <p className="mt-5 max-w-md text-sm leading-7 text-slate-400">
                Dynova Sport cung cấp sản phẩm thể thao hiện đại, phù hợp cho
                luyện tập, thi đấu và phong cách sống năng động. Website được
                xây dựng với trải nghiệm mua sắm nhanh, rõ ràng và thân thiện.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs font-bold text-slate-300">
                  <BadgeCheck size={14} className="text-orange-400" />
                  Chính hãng demo
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs font-bold text-slate-300">
                  <PackageCheck size={14} className="text-orange-400" />
                  Kiểm tra đơn dễ dàng
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs font-bold text-slate-300">
                  <Sparkles size={14} className="text-orange-400" />
                  UI mượt, hiện đại
                </span>
              </div>
            </div>

            <div className="grid gap-8 sm:grid-cols-3">
              {footerLinks.map((group) => (
                <div key={group.title}>
                  <p className="text-sm font-black uppercase tracking-[0.16em] text-white">
                    {group.title}
                  </p>

                  <div className="mt-4 grid gap-3">
                    {group.links.map((item) => (
                      <Link
                        key={item.href + item.name}
                        href={item.href}
                        className="text-sm font-semibold text-slate-400 transition hover:translate-x-1 hover:text-orange-400"
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <p className="text-sm font-black uppercase tracking-[0.16em]">
                Liên hệ
              </p>

              <div className="mt-4 grid gap-3 text-sm text-slate-400">
                <p className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/5 text-orange-400">
                    <Phone size={16} />
                  </span>
                  {settings?.hotline || "0866 347 730"}
                </p>

                <p className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/5 text-orange-400">
                    <Mail size={16} />
                  </span>
                  {settings?.email || "cskh@dynova.vn"}
                </p>

                <p className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-orange-400">
                    <MapPin size={16} />
                  </span>
                  <span>{settings?.address || "TP. Hồ Chí Minh"}</span>
                </p>
              </div>

              <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm font-black">Nhận ưu đãi mới</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Theo dõi Dynova để cập nhật sản phẩm mới, khuyến mãi và mẹo
                  chọn đồ thể thao.
                </p>

                <div className="mt-4 flex gap-2">
                  <input
                    className="h-11 min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-orange-400"
                    placeholder="Email của bạn"
                  />

                  <button className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 text-white transition hover:bg-orange-600">
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-white/10 py-6 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
            <p>
              © {new Date().getFullYear()} Dynova Sport. All rights reserved.
            </p>

            <div className="flex items-center gap-3">
              <span className="font-semibold">Social</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-xs font-black text-slate-300 transition hover:border-orange-400 hover:text-orange-400">
                FB
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-xs font-black text-slate-300 transition hover:border-orange-400 hover:text-orange-400">
                IG
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-xs font-black text-slate-300 transition hover:border-orange-400 hover:text-orange-400">
                TT
              </span>
            </div>
          </div>
        </div>
      </footer>

      <div className="fixed bottom-5 right-5 z-[60]">
        {chatOpen && (
          <div className="chat-panel float-in mb-3 w-[calc(100vw-40px)] max-w-sm overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="bg-slate-950 p-4 text-white">
              <p className="text-sm font-black uppercase tracking-wider">
                Chat Dynova
              </p>
              <p className="mt-1 text-xs text-slate-300">
                Hỗ trợ tư vấn size, đơn hàng và thanh toán.
              </p>
            </div>

            <div className="max-h-72 space-y-3 overflow-y-auto p-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={
                    "rounded-2xl px-3 py-2 text-sm leading-6 " +
                    (message.role === "user"
                      ? "ml-8 bg-orange-500 text-white"
                      : "mr-8 bg-slate-100 text-slate-700")
                  }
                >
                  {message.text}
                </div>
              ))}

              <div className="flex flex-wrap gap-2">
                {["Tư vấn size", "Kiểm tra đơn", "Hỗ trợ thanh toán"].map(
                  (item) => (
                    <button
                      key={item}
                      onClick={() => sendChat(item)}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 transition hover:bg-slate-200"
                    >
                      {item}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="flex gap-2 border-t border-slate-100 p-3">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendChat()}
                className="input-control py-2 text-sm"
                placeholder="Nhập tin nhắn..."
              />

              <button
                onClick={() => sendChat()}
                className="btn-primary rounded-xl px-3"
                aria-label="Gửi"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="btn-primary flex h-14 w-14 items-center justify-center rounded-2xl shadow-xl shadow-orange-500/25"
          aria-label="Chat trực tuyến"
        >
          {chatOpen ? <X size={22} /> : <MessageCircle size={22} />}
        </button>
      </div>
    </>
  );
}