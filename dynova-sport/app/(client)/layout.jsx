"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  BadgeCheck,
  ChevronDown,
  ClipboardList,
  CreditCard,
  Flame,
  Headphones,
  Heart,
  LogOut,
  Mail,
  MapPin,
  Menu,
  PackageCheck,
  Phone,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  User,
  X,
} from "lucide-react";

import { getCart } from "@/utils/shopStorage";
import {
  getAuthToken,
  getStoredAuthUser,
  logoutWithApi,
} from "@/services/auth.service";
import { getWishlist as getWishlistApi } from "@/services/wishlist.service";
import { getDefaultPublicSettings, getPublicSettings } from "@/services/settings.service";
import HeaderSearchPopup from "@/components/header/HeaderSearchPopup";

const BRAND_LOGO = "/images/dynova-logo.jpg";

function BrandLogo({ mode = "header" }) {
  const isFooter = mode === "footer";
  const isMobile = mode === "mobile";

  return (
    <Link
      href="/"
      className={
        "group inline-flex shrink-0 items-center gap-3 " +
        (isFooter ? "text-white" : "text-slate-950")
      }
    >
      <div
        className={
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border transition duration-300 group-hover:-translate-y-0.5 " +
          (isFooter
            ? "h-20 w-20 border-white/10 bg-white shadow-lg shadow-black/20"
            : isMobile
              ? "h-16 w-16 border-slate-200 bg-white shadow-lg shadow-slate-950/10"
              : "h-16 w-16 border-slate-200 bg-white shadow-lg shadow-slate-950/10")
        }
      >
        <img
          src={BRAND_LOGO}
          alt="Dynova Sport Logo"
          className="h-full w-full object-cover p-1"
          onError={(event) => {
            event.currentTarget.style.display = "none";
            event.currentTarget.parentElement.innerHTML =
              '<span class="text-sm font-black text-slate-950">DNV</span>';
          }}
        />
      </div>

      <div className="leading-tight">
        <p
          className={
            "font-black uppercase tracking-[-0.04em] " +
            (isFooter
              ? "text-2xl text-white"
              : isMobile
                ? "text-lg text-slate-950"
                : "text-[20px] text-slate-950")
          }
        >
          Dynova
        </p>

        <p
          className={
            "text-[11px] font-extrabold uppercase tracking-[0.24em] " +
            (isFooter ? "text-orange-400" : "text-orange-500")
          }
        >
          Sport Shop
        </p>
      </div>
    </Link>
  );
}

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
  const [settings, setSettings] = useState(getDefaultPublicSettings());
  const [showBackTop, setShowBackTop] = useState(false);

  const menuItems = [
    { name: "Trang chủ", href: "/" },
    { name: "Flash Sale", href: "/sale", hot: true },
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
        { name: "Flash Sale", href: "/sale" },
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
      title: "CSKH",
      links: [
        { name: "Chat với chúng tôi", href: "/chat" },
        { name: "FAQ (Câu hỏi thường gặp)", href: "/faq" },
      ],
    },
  ];




  const loadWishlistCount = async () => {
    try {
      const data = await getWishlistApi();

      const total =
        data?.total ??
        data?.items?.length ??
        0;

      setWishlistCount(Number(total) || 0);
    } catch (error) {
      setWishlistCount(0);
    }
  };

  const syncState = () => {
    const token = getAuthToken();
    setUser(token ? getStoredAuthUser() : null);

    setCartCount(
      getCart().reduce((sum, item) => sum + Number(item.quantity || 0), 0)
    );

    loadWishlistCount();
  };

  useEffect(() => {
    syncState();

    const handleFocus = () => {
      syncState();
    };

    window.addEventListener("storage", syncState);
    window.addEventListener("dynova:storage", syncState);
    window.addEventListener("dynova:wishlist", syncState);
    window.addEventListener("dynova:auth", syncState);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("storage", syncState);
      window.removeEventListener("dynova:storage", syncState);
      window.removeEventListener("dynova:wishlist", syncState);
      window.removeEventListener("dynova:auth", syncState);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  useEffect(() => {
    getPublicSettings()
      .then((response) => setSettings(response.settings || getDefaultPublicSettings()))
      .catch(() => setSettings(getDefaultPublicSettings()));
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackTop(window.scrollY > 500);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
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


  const handleLogout = async () => {
    setUser(null);
    setCartCount(0);
    setWishlistCount(0);
    setOpenUser(false);

    try {
      await logoutWithApi();
    } catch {
      // logoutWithApi luôn xóa phiên local trong finally.
    } finally {
      router.replace("/");
      router.refresh();
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
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
                {settings?.email || "cskhdynova@gmail.com"}
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

        <div className="container-page flex h-[76px] items-center justify-between gap-3">
          <BrandLogo />

          <nav className="hidden items-center gap-0.5 rounded-2xl bg-slate-50 p-1 xl:flex">
            {menuItems.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    "relative flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-[12.5px] font-extrabold transition-all duration-300 " +
                    (item.hot
                      ? active
                        ? "bg-white text-rose-600 shadow-sm shadow-slate-200"
                        : "text-rose-600 hover:bg-white"
                      : active
                        ? "bg-white text-orange-600 shadow-sm shadow-slate-200"
                        : "text-slate-600 hover:bg-white hover:text-slate-950")
                  }
                >
                  {item.hot && (
                    <Flame size={13} className="fill-rose-500 text-rose-500" />
                  )}
                  {item.name}

                  {active && (
                    <span
                      className={
                        "absolute inset-x-4 -bottom-1 h-[3px] rounded-full " +
                        (item.hot ? "bg-rose-500" : "bg-orange-500")
                      }
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setOpenSearch(true)}
              className="btn-ghost flex h-10 w-10 items-center justify-center rounded-2xl sm:h-11 sm:w-11"
              aria-label="Tìm kiếm"
            >
              <Search size={18} />
            </button>

            <Link
              href="/wishlist"
              className="btn-ghost relative hidden h-10 w-10 items-center justify-center rounded-2xl sm:flex sm:h-11 sm:w-11"
              aria-label="Yêu thích"
            >
              <Heart
                size={18}
                className={
                  wishlistCount > 0
                    ? ""
                    : ""
                }
              />

              {wishlistCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-black text-white ring-2 ring-white">
                  {wishlistCount > 99 ? "99+" : wishlistCount}
                </span>
              )}
            </Link>

            <Link
              href="/cart"
              className="btn-ghost relative flex h-10 w-10 items-center justify-center rounded-2xl sm:h-11 sm:w-11"
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
                className="hidden h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-slate-700 shadow-sm transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 md:flex sm:h-11"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100">
                  <User size={16} />
                </span>

                <span className="max-w-24 truncate text-[13px] font-extrabold lg:max-w-28">
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
                className="btn-ghost flex h-10 w-10 items-center justify-center rounded-2xl sm:h-11 sm:w-11 md:hidden"
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
              className="btn-ghost flex h-10 w-10 items-center justify-center rounded-2xl sm:h-11 sm:w-11 xl:hidden"
              aria-label="Mở menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {openMobile && (
        <div className="fixed inset-0 z-[70] bg-slate-950/50 backdrop-blur-sm xl:hidden">
          <div className="float-in ml-auto flex h-full w-[86%] max-w-sm flex-col bg-white shadow-2xl">
            <div className="border-b border-slate-100 p-5">
              <div className="flex items-center justify-between">
                <BrandLogo mode="mobile" />

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
                        "flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-extrabold transition " +
                        (item.hot
                          ? active
                            ? "bg-rose-50 text-rose-600"
                            : "text-rose-600 hover:bg-rose-50"
                          : active
                            ? "bg-orange-50 text-orange-600"
                            : "text-slate-700 hover:bg-slate-50")
                      }
                    >
                      {item.hot && (
                        <Flame size={15} className="fill-rose-500 text-rose-500" />
                      )}
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

      <HeaderSearchPopup
        open={openSearch}
        onClose={() => setOpenSearch(false)}
      />

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
              <BrandLogo mode="footer" />

              <p className="mt-5 max-w-md text-sm leading-7 text-slate-400">
                Dynova Sport cung cấp sản phẩm thể thao hiện đại, phù hợp cho
                luyện tập, thi đấu và phong cách sống năng động. Website được
                xây dựng với trải nghiệm mua sắm nhanh, rõ ràng và thân thiện.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs font-bold text-slate-300">
                  <BadgeCheck size={14} className="text-orange-400" />
                  Cam kết chính hãng
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
                  {settings?.email || "cskhdynova@gmail.com"}
                </p>

                <p className="flex items-start gap-3">  
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-orange-400">
                    <MapPin size={16} />
                  </span>
                  <span>{settings?.address || "TP. Hồ Chí Minh"}</span>
                </p>
              </div>

              <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm font-black">Ưu đãi dành cho bạn</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Khám phá chương trình khuyến mãi và sản phẩm đang được ưu đãi.
                </p>
                <Link
                  href="/sale"
                  className="mt-4 inline-flex h-11 items-center justify-center rounded-2xl bg-orange-500 px-5 text-xs font-black uppercase tracking-wider text-white transition hover:bg-orange-600"
                >
                  Xem ưu đãi
                </Link>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-white/10 py-6 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
            <p>
              © {new Date().getFullYear()} Dynova Sport. All rights reserved.
            </p>

            <Link
              href="/contact"
              className="font-semibold text-slate-400 transition hover:text-orange-400"
            >
              Liên hệ hỗ trợ
            </Link>
          </div>
        </div>
      </footer>

      {showBackTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 right-5 z-[60] flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-xl shadow-slate-950/10 transition hover:-translate-y-1 hover:border-orange-200 hover:bg-orange-500 hover:text-white"
          aria-label="Lên đầu trang"
        >
          <ArrowUp size={20} />
        </button>
      )}

      <Link
        href="/contact"
        className="btn-primary fixed bottom-5 right-5 z-[60] flex h-14 w-14 items-center justify-center rounded-2xl shadow-xl shadow-orange-500/25"
        aria-label="Liên hệ hỗ trợ"
      >
        <Headphones size={22} />
      </Link>
    </>
  );
}