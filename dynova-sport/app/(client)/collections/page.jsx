'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Be_Vietnam_Pro } from 'next/font/google';
import { ArrowRight, ArrowUpRight } from 'lucide-react';

const display = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['700', '800', '900'],
  variable: '--font-display',
});

export default function PremiumAccordionBrands() {
  // Cố định đúng 5 thương hiệu hàng đầu với hình ảnh lookbook chất lượng cao
  const brands = [
    { id: 1, name: 'Nike', slug: 'nike', slogan: 'Just Do It', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80' },
    { id: 2, name: 'Adidas', slug: 'adidas', slogan: 'Impossible Is Nothing', image: 'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=800&q=80' },
    { id: 3, name: 'Puma', slug: 'puma', slogan: 'Forever Faster', image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=80' },
    { id: 4, name: 'New Balance', slug: 'new-balance', slogan: 'We Got Now', image: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&q=80' },
    { id: 5, name: 'Asics', slug: 'asics', slogan: 'Sound Mind, Sound Body', image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80' },
  ];

  // Mặc định khi chưa hover vào đâu, cột đầu tiên (Nike) sẽ mở rộng
  const [hoveredIndex, setHoveredIndex] = useState(0);

  return (
    <div className={`${display.variable} bg-white min-h-screen text-gray-900 font-sans flex flex-col justify-between`}>

      {/* 1. THANH HEADER TỐI GIẢN */}
      <header className="p-6 md:p-10 flex justify-between items-center bg-white border-b border-gray-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] text-gray-400 uppercase tracking-widest">
            <Link href="/" className="hover:text-black transition-colors">Dynova</Link>
            <span>/</span>
            <span className="text-orange-500 font-medium">Bộ sưu tập</span>
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-black uppercase tracking-tight text-gray-900">
            Năm bộ sưu tập <span className="text-orange-500">tinh hoa</span>
          </h1>
        </div>
        <Link href="/shop" className="text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-black transition-colors flex items-center gap-1">
          Xem tất cả sản phẩm <ArrowUpRight size={14} />
        </Link>
      </header>

      {/* 2. KHÔNG GIAN TƯƠNG TÁC ACCORDION (CHIA ĐỀU 5 CỘT) */}
      <main className="flex-grow flex flex-col md:flex-row w-full h-[65vh] md:h-[70vh] overflow-hidden bg-gray-50">
        {brands.map((brand, index) => {
          const isHovered = hoveredIndex === index;

          return (
            <div
              key={brand.id}
              onMouseEnter={() => setHoveredIndex(index)}
              className="relative h-full border-b md:border-b-0 md:border-r border-gray-200/60 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col justify-between overflow-hidden"
              style={{
                // Trên màn hình máy tính: cột được hover chiếm nhiều diện tích hơn, các cột còn lại thu nhỏ
                flexGrow: isHovered ? 4 : 1.2,
                flexBasis: '0%'
              }}
            >
              {/* Ảnh nền xuất hiện khi active */}
              <div
                className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-out ${isHovered ? 'opacity-100 scale-100 grayscale-0' : 'opacity-0 scale-105 grayscale'
                  }`}
                style={{ backgroundImage: `url('${brand.image}')` }}
              />

              {/* Lớp phủ gradient làm dịu ảnh */}
              <div className={`absolute inset-0 transition-colors duration-500 ${isHovered ? 'bg-gradient-to-t from-white via-white/20 to-transparent' : 'bg-white'
                }`} />

              {/* KHU VỰC NỘI DUNG TRÊN CỘT */}
              <div className="relative z-10 p-6 md:p-10 h-full flex flex-row md:flex-col justify-between items-center md:items-start pointer-events-none">

                {/* Số thứ tự lớn */}
                <span className={`text-xs font-mono font-bold ${isHovered ? 'text-orange-500' : 'text-gray-300'} transition-colors`}>
                  {(index + 1).toString().padStart(2, '0')}
                </span>

                {/* Phần giữa: Tên thương hiệu chuyển hướng xoay dọc/ngang linh hoạt */}
                <div className="md:my-auto transition-transform duration-500">
                  <h2 className={`font-[family-name:var(--font-display)] font-black uppercase tracking-tighter text-gray-900 transition-all ${isHovered ? 'text-3xl md:text-5xl mb-2' : 'text-lg md:text-2xl md:-rotate-90 md:my-12 block whitespace-nowrap opacity-60'
                    }`}>
                    {brand.name}
                  </h2>

                  {/* Slogan */}
                  <p className={`text-xs text-gray-500 font-light tracking-wide transition-opacity duration-500 ${isHovered ? 'opacity-100 hidden md:block' : 'opacity-0 hidden'
                    }`}>
                    {brand.slogan}
                  </p>
                </div>

                {/* ĐƯỜNG DẪN ĐÃ ĐỔI: Chuyển hướng chính xác tới trang /collections/[slug] */}
                <div className={`pointer-events-auto transition-all duration-500 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 md:pointer-events-none'
                  }`}>
                  <Link
                    href={`/collections/${brand.slug}`}
                    className="w-10 h-10 md:w-12 md:h-12 bg-gray-900 text-white rounded-full flex items-center justify-center hover:bg-orange-500 transition-colors shadow-lg shadow-gray-900/10"
                  >
                    <ArrowRight size={16} />
                  </Link>
                </div>

              </div>
            </div>
          );
        })}
      </main>

      {/* 3. THANH FOOTER */}
      <footer className="p-6 md:p-8 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center text-[11px] text-gray-400 tracking-wider">
        <p>© 2026 DYNOVA STUDIO. PREMIUM EXPERIENCE.</p>
        <p className="font-medium text-gray-600 hidden sm:block">RÊ CHUỘT VÀO TÊN THƯƠNG HIỆU ĐỂ MỞ RỘNG BỘ SƯU TẬP</p>
      </footer>

    </div>
  );
}