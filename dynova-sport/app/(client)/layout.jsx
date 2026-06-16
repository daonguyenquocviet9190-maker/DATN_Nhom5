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
                className={`transition-all pb-1 uppercase tracking-wider text-xs ${
                  isActive
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
          <button className="hover:text-orange-500 transition-colors relative">
            <ShoppingBag size={20} />
            <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">0</span>
          </button>

          {/* KHỐI DROPDOWN USER */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={`transition-colors p-1 rounded-full border ${
                isLoggedIn 
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
      <footer className="bg-[#1a1a1a] text-white pt-16 pb-8 border-t-4 border-orange-500 mt-20">
        <div className="container mx-auto px-6 max-w-7xl grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-gray-800">
          <div className="md:col-span-5 space-y-4">
            <h4 className="text-sm font-black uppercase tracking-wider">ĐĂNG KÝ NHẬN THÔNG TIN TỪ DYNOVA</h4>
            <div className="flex max-w-sm rounded-sm overflow-hidden bg-white p-1">
              <input type="email" placeholder="Nhập Email" className="w-full bg-transparent px-3 text-sm text-gray-800 focus:outline-none" />
              <button className="bg-orange-500 hover:bg-orange-600 text-white p-2.5 rounded-sm flex items-center justify-center"><ArrowRight size={16} /></button>
            </div>
          </div>
          <div className="md:col-span-4 space-y-3 text-xs text-gray-400 font-light">
            <div className="flex items-center gap-2 text-white font-bold text-sm"><Phone size={16} className="text-orange-500" /> 1900 9201</div>
            <div className="flex items-center gap-2"><Mail size={16} className="text-orange-500" /> cskh@dynova.vn</div>
          </div>
        </div>
        <div className="container mx-auto px-6 max-w-7xl grid grid-cols-2 md:grid-cols-5 gap-8 py-12 text-xs text-gray-400 font-light">
          <div className="space-y-3">
            <h5 className="font-bold text-white text-sm uppercase">MUA SẮM</h5>
            <p className="hover:text-white cursor-pointer">Hỏi đáp - FAQs</p>
            <p className="hover:text-white cursor-pointer">Hướng dẫn chọn size</p>
          </div>
          <div className="space-y-3">
            <h5 className="font-bold text-white text-sm uppercase">CHÍNH SÁCH</h5>
            <p className="hover:text-white cursor-pointer">Chính sách đổi trả & bảo hành</p>
            <p className="hover:text-white cursor-pointer">Chính sách bảo mật</p>
          </div>
          <div className="space-y-3 col-span-2 md:col-span-1">
            <h5 className="font-bold text-white text-sm uppercase">ĐỊA CHỈ LIÊN HỆ</h5>
            <p className="flex items-start gap-1"><MapPin size={12} className="mt-0.5 shrink-0 text-orange-500" /> Chi nhánh HCM: số 1, Đường B, Khu ADC, Phường Trung Mỹ Tây, Quận 12, Thành phố Hồ Chí Minh.</p>
          </div>
        </div>
      </footer>
    </>
  );
}