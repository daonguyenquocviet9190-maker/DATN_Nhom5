'use client';
import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, Eye, Phone, Mail, MapPin, ArrowRight, User, LogOut, Settings, ClipboardList } from 'lucide-react';
import "../globals.css";

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const dropdownRef = useRef(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [displayName, setDisplayName] = useState('Khách hàng');

  const menuItems = [
    { name: 'Trang chủ', href: '/' },
    { name: 'Giới thiệu', href: '/about' },
    { name: 'Sản phẩm', href: '/shop' },
    { name: 'Tin tức', href: '/news' },
    { name: 'Bộ sưu tập', href: '/collections' },
    { name: 'Liên hệ', href: '/contact' },
  ];

  useEffect(() => {
    const savedStatus = localStorage.getItem('isLoggedIn');
    const savedName = localStorage.getItem('userDisplayName');

    if (savedStatus === 'true') {
      setIsLoggedIn(true);
      if (savedName) {
        setDisplayName(savedName);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    setIsLoggedIn(false);
    setShowUserMenu(false);
    window.location.reload();
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* ================= HEADER CHUNG TRÀN VIỀN ================= */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 md:px-12 py-4 flex items-center justify-between w-full">
        {/* Logo Brand */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-900 to-orange-500 rounded-full flex items-center justify-center text-white font-black text-xs tracking-tighter">DYNOVA</div>
          <span className="font-black text-xl tracking-wider text-blue-950">DYNOVA<span className="text-orange-500 text-xs font-bold block -mt-1 tracking-widest">SPORT SHOP</span></span>
        </div>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`transition-all pb-1 uppercase tracking-wider text-xs ${isActive
                    ? 'text-orange-500 border-b-2 border-orange-500 font-bold scale-105'
                    : 'text-gray-600 hover:text-orange-500 font-medium'
                  }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Icons Controls */}
        <div className="flex items-center gap-5 text-gray-600">
          <button className="hover:text-orange-500 transition-colors"><Eye size={20} /></button>

          {/* ICON GIỎ HÀNG */}
          <Link href="/cart" className="hover:text-orange-500 transition-colors relative block">
            <ShoppingBag size={20} />
            <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              2
            </span>
          </Link>

          {/* KHỐI DROPDOWN USER */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={`transition-colors p-1 rounded-full border ${isLoggedIn
                  ? 'text-orange-500 border-orange-200 bg-orange-50'
                  : 'text-gray-600 border-gray-200 hover:text-orange-500 hover:border-orange-500'
                }`}
            >
              <User size={20} />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-3 w-56 bg-white border border-gray-100 rounded-xl shadow-xl py-2 z-50 animate-fadeIn">
                {!isLoggedIn ? (
                  <div className="px-2 space-y-1">
                    <p className="text-[11px] font-bold text-gray-400 px-3 py-1 uppercase tracking-wider">Tài khoản Dynova</p>
                    <Link
                      href="/login"
                      onClick={() => setShowUserMenu(false)}
                      className="w-full text-xs font-bold uppercase tracking-wide bg-orange-500 hover:bg-orange-600 text-white px-3 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-center block"
                    >
                      Đăng nhập
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setShowUserMenu(false)}
                      className="w-full text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 px-3 py-2.5 rounded-lg transition-colors text-center border border-gray-100 mt-1 block"
                    >
                      Tạo tài khoản mới
                    </Link>
                  </div>
                ) : (
                  <div>
                    <div className="px-4 py-2 border-b border-gray-50 pb-3 mb-1">
                      <p className="text-xs text-gray-400 font-medium">Xin chào,</p>
                      <p className="text-sm font-black text-blue-950 truncate">{displayName}</p>
                    </div>
                    <div className="px-1.5 space-y-0.5">
                      <Link
                        href="/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2.5 text-xs text-gray-700 font-semibold hover:bg-gray-50 px-3 py-2.5 rounded-lg transition-colors"
                      >
                        <Settings size={15} className="text-gray-400" /> Hồ sơ cá nhân
                      </Link>
                      <Link
                        href="#/orders"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2.5 text-xs text-gray-700 font-semibold hover:bg-gray-50 px-3 py-2.5 rounded-lg transition-colors"
                      >
                        <ClipboardList size={15} className="text-gray-400" /> Quản lý đơn hàng
                      </Link>
                      <div className="border-t border-gray-100 my-1" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 text-xs text-rose-600 font-bold hover:bg-rose-50 px-3 py-2.5 rounded-lg transition-colors"
                      >
                        <LogOut size={15} /> Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <a href="tel:0866347730" className="hidden lg:flex items-center gap-2 bg-orange-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-md shadow-orange-500/20 hover:bg-orange-600 transition-colors">
            <Phone size={12} /> (+84) 0866347730
          </a>
        </div>
      </header>

      {/* ================= NỘI DUNG THAY ĐỔI ================= */}
      <main className="min-h-screen">
        {children}
      </main>

      {/* ================= FOOTER HỆ THỐNG TRÀN VIỀN ================= */}
      <footer className="bg-[#232220] text-white pt-16 pb-8 border-t-4 border-orange-500 mt-20 font-sans">
        <div className="container mx-auto px-6 max-w-7xl grid grid-cols-1 md:grid-cols-12 gap-10 pb-8 border-b border-zinc-700 items-start">
          <div className="md:col-span-5 space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-200">ĐĂNG KÝ NHẬN THÔNG TIN TỪ DYNOVA</h4>
            <p className="text-xs text-gray-400">Đừng bỏ lỡ các chương trình khuyến mãi mới, hấp dẫn</p>
            <div className="flex max-w-md rounded-md overflow-hidden bg-white p-1.5 items-center justify-between shadow-sm">
              <input type="email" placeholder="Nhập Email" className="w-full bg-transparent px-3 text-sm text-gray-800 focus:outline-none placeholder-gray-400" />
              <button className="text-orange-500 hover:text-orange-600 px-2 flex items-center justify-center transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.475.553-.717.07L11 13 1.946 9.315Z" />
                </svg>
              </button>
            </div>
          </div>

          <div className="md:col-span-4 space-y-3 text-sm text-gray-300 pt-2">
            <div className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-500">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              <span className="font-medium">19009201</span>
            </div>
            <div className="flex items-center gap-3 border-t border-zinc-700/50 pt-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-500">
                <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
              </svg>
              <span className="text-gray-300">cskh@DYNOVA.vn</span>
            </div>
          </div>

          <div className="md:col-span-3 flex md:justify-end gap-4 pt-2">
            <a href="#" className="text-gray-300 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" /></svg>
            </a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.914 1.448 5.518 3.717 7.158V22l3.417-1.875c.91.253 1.871.392 2.866.392 5.523 0 10-4.146 10-9.259S17.523 2 12 2zm1.036 12.332l-2.56-2.739-5 2.739 5.5-5.842 2.56 2.739 5-2.739-5.5 5.842z" /></svg>
            </a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.032 2.61.1 3.86.39.08.77.41 1.49.94 2.04.6.61 1.42.99 2.3 1.05v3.66c-.95-.08-1.88-.41-2.67-.97-.58-.41-1.07-.94-1.42-1.57v7.41c.07 1.8-.57 3.57-1.79 4.87-1.42 1.51-3.5 2.31-5.61 2.13-2.35-.19-4.43-1.63-5.36-3.81-.97-2.27-.45-4.94 1.29-6.66 1.42-1.4 3.49-2.03 5.46-1.65v3.73c-1.03-.31-2.16-.04-2.95.7-.75.71-1.08 1.77-.87 2.78.21 1.02.99 1.83 1.98 2.07.99.24 2.05-.13 2.65-.96.38-.54.55-1.19.5-1.85V0h1.79z" /></svg>
            </a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>
            </a>
          </div>
        </div>

        <div className="container mx-auto px-6 max-w-7xl grid grid-cols-2 md:grid-cols-5 gap-8 py-12 text-xs text-gray-400 font-light border-b border-zinc-700/50">
          <div className="space-y-3">
            <h5 className="font-bold text-white text-sm uppercase">DYNOVA</h5>
            <p className="hover:text-white cursor-pointer transition-colors">Đăng ký thành viên</p>
            <p className="hover:text-white cursor-pointer transition-colors">Ưu đãi & Đặc quyền</p>
          </div>

          <div className="space-y-3">
            <h5 className="font-bold text-white text-sm uppercase">MUA SẮM</h5>
            <p className="hover:text-white cursor-pointer transition-colors">Hỏi đáp- FAQs</p>
            <p className="hover:text-white cursor-pointer transition-colors">Hướng dẫn mua hàng</p>
            <p className="hover:text-white cursor-pointer transition-colors">Hướng dẫn chọn size</p>
            <p className="hover:text-white cursor-pointer transition-colors">Hướng dẫn thanh toán VNPAY</p>
            <p className="hover:text-white cursor-pointer transition-colors">In ấn đội nhóm TEAMPRINT</p>
          </div>

          <div className="space-y-3">
            <h5 className="font-bold text-white text-sm uppercase">CHÍNH SÁCH</h5>
            <p className="hover:text-white cursor-pointer transition-colors">Chính sách đổi trả & bảo hành</p>
            <p className="hover:text-white cursor-pointer transition-colors">Chính sách giao hàng</p>
            <p className="hover:text-white cursor-pointer transition-colors">Chính sách khuyến mãi</p>
            <p className="hover:text-white cursor-pointer transition-colors">Chính sách bảo mật</p>
          </div>

          <div className="space-y-3">
            <h5 className="font-bold text-white text-sm uppercase">VỀ DYNOVA</h5>
            <p className="hover:text-white cursor-pointer transition-colors">Giới Thiệu</p>
            <p className="hover:text-white cursor-pointer transition-colors">Cam kết thương hiệu</p>
            <p className="hover:text-white cursor-pointer transition-colors">Hệ thống cửa hàng</p>
            <p className="hover:text-white cursor-pointer transition-colors">Tuyển dụng</p>
          </div>

          <div className="space-y-4 col-span-2 md:col-span-1 text-[11px] leading-relaxed">
            <h5 className="font-bold text-white text-sm uppercase">ĐỊA CHỈ LIÊN HỆ</h5>
            <p>Chi nhánh HCM: số 1, Đường B, Khu ADC Phường Trung Mỹ Tây, Quận 12, thành phố Hồ Chí Minh, Việt Nam.</p>
            <p>Head Office: Tỉnh lộ 510, Thị Trấn Bút Sơn Huyện Hoằng Hóa, Tỉnh Tỉnh Thanh Hóa.</p>
          </div>
        </div>

        <div className="container mx-auto px-6 max-w-7xl pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-400 font-light relative">
          <div>
            Số ĐKKD: 4828007025 do sở Kế Hoạch và Đầu Tư TP HCM cấp lần đầu ngày 05/08/2002
          </div>
          <div>
            <img src="https://images.dmca.com/Badges/logo-bo-cong-thuong.png" alt="Đã thông báo bộ công thương" className="h-10 object-contain brightness-90 contrast-125" style={{ maxWidth: '150px' }} />
          </div>

          <button className="absolute bottom-4 right-6 md:right-0 bg-[#fbb03b] hover:bg-orange-500 text-white p-2.5 rounded-md shadow-lg transition-colors hidden md:block">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="m18 15-6-6-6 6"></path>
            </svg>
          </button>
        </div>
      </footer>
    </>
  );
}