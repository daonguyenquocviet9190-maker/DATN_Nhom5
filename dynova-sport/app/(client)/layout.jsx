"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ClipboardList,
  Heart,
  LogOut,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  Search,
  Send,
  Settings,
  ShieldCheck,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import { getCart, getCurrentUser, getProducts, getSettings, getWishlistProducts, logoutUser } from "@/utils/shopStorage";

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
  const [messages, setMessages] = useState([
    { role: "shop", text: "Dynova xin chào. Bạn cần tư vấn size, đơn hàng hay thanh toán?" },
  ]);
  const [settings, setSettings] = useState(null);

  const menuItems = [
    { name: "Trang chủ", href: "/" },
    { name: "Sản phẩm", href: "/shop" },
    { name: "Bộ sưu tập", href: "/collections" },
    { name: "Tin tức", href: "/news" },
    { name: "Giới thiệu", href: "/about" },
    { name: "Liên hệ", href: "/contact" },
  ];

  const syncState = () => {
    setUser(getCurrentUser());
    setCartCount(getCart().reduce((sum, item) => sum + Number(item.quantity || 0), 0));
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
      if (menuRef.current && !menuRef.current.contains(event.target)) setOpenUser(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const products = useMemo(() => getProducts(), [openSearch, searchTerm]);
  const searchResults = products
    .filter((product) => product.name.toLowerCase().includes(searchTerm.toLowerCase()) || product.category.toLowerCase().includes(searchTerm.toLowerCase()))
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
      { role: "shop", text: "Mình đã nhận thông tin. Nhân viên Dynova sẽ phản hồi trong ít phút. Bạn có thể để lại số điện thoại nếu cần gọi lại." },
    ]);
    setChatInput("");
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/92 backdrop-blur-xl">
        <div className="container-page flex h-20 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-[11px] font-black tracking-tight text-white">DNV</div>
            <div className="leading-tight">
              <p className="text-lg font-black uppercase tracking-wide text-slate-950">Dynova</p>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-orange-500">Sport Shop</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            {menuItems.map((item) => {
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href} className={"text-xs font-black uppercase tracking-wider transition " + (active ? "text-orange-500" : "text-slate-600 hover:text-orange-500")}>
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={() => setOpenSearch(true)} className="btn-ghost flex h-11 w-11 items-center justify-center rounded-xl" aria-label="Tìm kiếm">
              <Search size={18} />
            </button>
            <Link href="/wishlist" className="btn-ghost relative hidden h-11 w-11 items-center justify-center rounded-xl sm:flex" aria-label="Yêu thích">
              <Heart size={18} />
              {wishlistCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-950 px-1 text-[10px] font-black text-white">{wishlistCount}</span>}
            </Link>
            <Link href="/cart" className="btn-ghost relative flex h-11 w-11 items-center justify-center rounded-xl" aria-label="Giỏ hàng">
              <ShoppingBag size={18} />
              {cartCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-black text-white">{cartCount}</span>}
            </Link>

            <div className="relative" ref={menuRef}>
              <button onClick={() => setOpenUser(!openUser)} className="btn-ghost flex h-11 items-center gap-2 rounded-xl px-3">
                <User size={17} />
                <span className="hidden max-w-24 truncate text-xs font-bold md:block">{user?.fullName || "Tài khoản"}</span>
                <ChevronDown size={14} />
              </button>
              {openUser && (
                <div className="float-in absolute right-0 mt-3 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
                  {user ? (
                    <>
                      <div className="border-b border-slate-100 px-3 py-3">
                        <p className="text-xs text-slate-500">Xin chào</p>
                        <p className="truncate text-sm font-black text-slate-950">{user.fullName}</p>
                      </div>
                      <Link href="/profile" onClick={() => setOpenUser(false)} className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"><Settings size={16} /> Hồ sơ cá nhân</Link>
                      <Link href="/orders" onClick={() => setOpenUser(false)} className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"><ClipboardList size={16} /> Lịch sử mua hàng</Link>
                      {user.role === "admin" && <Link href="/admin" className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-bold text-orange-600 hover:bg-orange-50"><ShieldCheck size={16} /> Vào quản trị</Link>}
                      <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-bold text-rose-600 hover:bg-rose-50"><LogOut size={16} /> Đăng xuất</button>
                    </>
                  ) : (
                    <div className="space-y-2 p-2">
                      <Link href="/login" onClick={() => setOpenUser(false)} className="btn-primary block rounded-xl px-4 py-3 text-center text-xs font-black uppercase tracking-wider">Đăng nhập</Link>
                      <Link href="/register" onClick={() => setOpenUser(false)} className="btn-ghost block rounded-xl px-4 py-3 text-center text-xs font-black uppercase tracking-wider">Đăng ký</Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button onClick={() => setOpenMobile(true)} className="btn-ghost flex h-11 w-11 items-center justify-center rounded-xl lg:hidden" aria-label="Mở menu">
              <Menu size={19} />
            </button>
          </div>
        </div>
      </header>

      {openMobile && (
        <div className="fixed inset-0 z-[70] bg-slate-950/45 lg:hidden">
          <div className="float-in ml-auto h-full w-[84%] max-w-sm bg-white p-5 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm font-black uppercase tracking-wider text-slate-950">Dynova Menu</p>
              <button onClick={() => setOpenMobile(false)} className="btn-ghost rounded-xl p-2"><X size={18} /></button>
            </div>
            <div className="space-y-2">
              {menuItems.map((item) => <Link key={item.href} href={item.href} onClick={() => setOpenMobile(false)} className="block rounded-xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">{item.name}</Link>)}
              <Link href="/wishlist" onClick={() => setOpenMobile(false)} className="block rounded-xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">Danh sách yêu thích</Link>
              <Link href="/orders" onClick={() => setOpenMobile(false)} className="block rounded-xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">Theo dõi đơn hàng</Link>
            </div>
          </div>
        </div>
      )}

      {openSearch && (
        <div className="fixed inset-0 z-[80] bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="float-in mx-auto mt-16 max-w-2xl rounded-3xl bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between px-2">
              <p className="text-sm font-black uppercase tracking-wider text-slate-950">Tìm kiếm sản phẩm</p>
              <button onClick={() => setOpenSearch(false)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} autoFocus className="input-control" placeholder="Nhập tên sản phẩm, danh mục hoặc thương hiệu..." />
              <button className="btn-primary rounded-xl px-5" aria-label="Tìm"><Search size={18} /></button>
            </form>
            <div className="mt-4 space-y-2">
              {searchResults.map((product) => (
                <Link key={product.id} href={"/shop/product/" + product.id} onClick={() => setOpenSearch(false)} className="flex items-center gap-3 rounded-2xl p-2 hover:bg-slate-50">
                  <img src={product.image} alt={product.name} className="h-14 w-14 rounded-xl object-cover" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-900">{product.name}</p>
                    <p className="text-xs font-semibold text-slate-500">{product.category}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="min-h-screen">{children}</main>

      <footer className="mt-16 border-t border-slate-200 bg-slate-950 text-white">
        <div className="container-page grid gap-10 py-14 md:grid-cols-4">
          <div className="md:col-span-2">
            <p className="text-2xl font-black uppercase tracking-wide">Dynova Sport</p>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-300">Cửa hàng đồ thể thao dành cho người tập luyện nghiêm túc: sản phẩm rõ thông tin, thanh toán linh hoạt và hỗ trợ nhanh.</p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-slate-300">
              <span className="rounded-full border border-white/10 px-3 py-2">Đổi trả 30 ngày</span>
              <span className="rounded-full border border-white/10 px-3 py-2">COD và chuyển khoản</span>
              <span className="rounded-full border border-white/10 px-3 py-2">Online gateway demo</span>
            </div>
          </div>
          <div>
            <p className="font-black uppercase tracking-wider">Liên hệ</p>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <p className="flex items-center gap-2"><Phone size={15} /> {settings?.hotline || "0866 347 730"}</p>
              <p className="flex items-center gap-2"><Mail size={15} /> {settings?.email || "cskh@dynova.vn"}</p>
              <p className="flex items-start gap-2"><MapPin size={15} className="mt-1" /> {settings?.address || "TP. Hồ Chí Minh"}</p>
            </div>
          </div>
          <div>
            <p className="font-black uppercase tracking-wider">Tài khoản</p>
            <div className="mt-4 grid gap-3 text-sm text-slate-300">
              <Link href="/profile" className="hover:text-white">Hồ sơ cá nhân</Link>
              <Link href="/orders" className="hover:text-white">Theo dõi đơn hàng</Link>
              <Link href="/wishlist" className="hover:text-white">Wishlist</Link>
              <Link href="/admin" className="hover:text-white">Dashboard quản trị</Link>
            </div>
          </div>
        </div>
      </footer>

      <div className="fixed bottom-5 right-5 z-[60]">
        {chatOpen && (
          <div className="chat-panel float-in mb-3 w-[calc(100vw-40px)] max-w-sm overflow-hidden rounded-3xl border border-slate-200 bg-white">
            <div className="bg-slate-950 p-4 text-white">
              <p className="text-sm font-black uppercase tracking-wider">Chat Dynova</p>
              <p className="mt-1 text-xs text-slate-300">Hỗ trợ tư vấn size, đơn hàng và thanh toán.</p>
            </div>
            <div className="max-h-72 space-y-3 overflow-y-auto p-4">
              {messages.map((message, index) => (
                <div key={index} className={"rounded-2xl px-3 py-2 text-sm " + (message.role === "user" ? "ml-8 bg-orange-500 text-white" : "mr-8 bg-slate-100 text-slate-700")}>
                  {message.text}
                </div>
              ))}
              <div className="flex flex-wrap gap-2">
                {["Tư vấn size", "Kiểm tra đơn", "Hỗ trợ thanh toán"].map((item) => <button key={item} onClick={() => sendChat(item)} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-200">{item}</button>)}
              </div>
            </div>
            <div className="flex gap-2 border-t border-slate-100 p-3">
              <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendChat()} className="input-control py-2 text-sm" placeholder="Nhập tin nhắn..." />
              <button onClick={() => sendChat()} className="btn-primary rounded-xl px-3" aria-label="Gửi"><Send size={16} /></button>
            </div>
          </div>
        )}
        <button onClick={() => setChatOpen(!chatOpen)} className="btn-primary flex h-14 w-14 items-center justify-center rounded-2xl" aria-label="Chat trực tuyến">
          {chatOpen ? <X size={22} /> : <MessageCircle size={22} />}
        </button>
      </div>
    </>
  );
}
