import React from 'react';

export default function AdminLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-[#111111] text-white font-sans">
      {/* SIDEBAR BÊN TRÁI */}
      <aside className="w-64 bg-[#161616] border-r border-[#222222] flex flex-col justify-between p-4 fixed h-full left-0 top-0">
        <div>
          {/* Brand Logo */}
          <div className="flex items-center gap-3 mb-8 px-2 py-4 border-b border-[#222222]">
            <div className="w-10 h-10 bg-gradient-to-tr from-orange-500 to-blue-500 rounded-full flex items-center justify-center font-bold text-sm tracking-tighter">
      
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wider">DYNOVA SPORT</h1>
            </div>
          </div>

          {/* Danh sách Menu điều hướng */}
          <nav className="space-y-6">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-3 px-2">Tổng quan</p>
              <ul className="space-y-1">
                <li>
                  <a href="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#f97316] text-white font-medium text-sm transition-all">
                    <span>📊</span> Dashboard
                  </a>
                </li>
                {/* <li>
                  <a href="/admin/thong-ke" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-[#222222] hover:text-white text-sm transition-all">
                    <span>📈</span> Thống kê
                  </a>
                </li> */}
              </ul>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-3 px-2">Quản lý</p>
              <ul className="space-y-1">
                {[
                  { name: 'Sản phẩm', icon: '📦', href: '/admin/products' },
                  { name: 'Khách hàng', icon: '👥', href: '/admin/customers' },
                  { name: 'Đơn hàng', icon: '🛒', href: '/admin/orders' },
                  { name: 'Đánh giá', icon: '📝', href: '/admin/ratings' },
                  { name: 'Khuyến mãi', icon: '🏷️', href: '/admin/promotions' },
                  { name: 'Thương hiệu', icon: '🛡️', href: '/admin/brands' },
                  { name: 'Tồn kho', icon: '🪵', href: '/admin/inventory' },
                  { name: 'Banner', icon: '🖼️', href: '/admin/banners' },
                ].map((item, idx) => (
                  <li key={idx}>
                    <a href={item.href} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-[#222222] hover:text-white text-sm transition-all">
                      <span>{item.icon}</span> {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </div>
      </aside>

      {/* VÙNG CHỨA NỘI DUNG CHÍNH (BÊN PHẢI) */}
      <div className="flex-1 pl-64 flex flex-col">
        {/* HEADER PHÍA TRÊN */}
        <header className="h-20 bg-[#111111] border-b border-[#222222] flex items-center justify-between px-8 sticky top-0 z-50">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              Dashboard <span className="text-xs text-gray-500 font-normal">/ Tổng quan</span>
            </h2>
          </div>

          {/* Thanh tìm kiếm & Thông tin tài khoản */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className="bg-[#1c1c1c] text-sm text-white pl-9 pr-4 py-2 rounded-lg w-64 border border-[#2d2d2d] focus:outline-none focus:border-orange-500 transition-all"
              />
            </div>

            <div className="flex items-center gap-4">
              <button className="p-2 bg-[#1c1c1c] rounded-lg text-gray-400 hover:text-white relative">
                <span>🔔</span>
                <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full"></span>
              </button>
              <button className="p-2 bg-[#1c1c1c] rounded-lg text-gray-400 hover:text-white">
                <span>💬</span>
              </button>
              <div className="w-9 h-9 bg-orange-500 text-white font-bold rounded-lg flex items-center justify-center text-sm cursor-pointer shadow-md shadow-orange-500/20">
                A
              </div>
            </div>
          </div>
        </header>

        {/* PHẦN HIỂN THỊ NỘI DUNG THAY ĐỔI CỦA TỪNG TRANG */}
        <main className="p-8 bg-[#111111] flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}