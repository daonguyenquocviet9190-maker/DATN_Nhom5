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

  // 4 bộ sưu tập theo mùa hiển thị bên dưới phần accordion thương hiệu
  const seasonalCollections = [
    {
      slug: 'xuan-he-2026',
      tag: 'SPRING/SUMMER',
      title: 'Xuân/Hè 2026',
      description: 'Chất liệu thoáng nhẹ, bảng màu tươi sáng cho những ngày nắng ấm.',
      image: 'https://images.unsplash.com/photo-1483721310020-03333e577078?w=800&q=80',
    },
    {
      slug: 'thu-dong-2026',
      tag: 'FALL/WINTER',
      title: 'Thu/Đông 2026',
      description: 'Layering ấm áp, tông trầm cùng chất liệu giữ nhiệt vượt trội.',
      image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&q=80',
    },
    {
      slug: 'le-hoi-cuoi-nam-2026',
      tag: 'HOLIDAY DROP',
      title: 'Lễ Hội Cuối Năm 2026',
      description: 'Phiên bản giới hạn dịp lễ với chi tiết ánh kim nổi bật.',
      image: 'https://images.unsplash.com/photo-1511556820780-d912e42b4980?w=800&q=80',
    },
    {
      slug: 'pre-fall-2026',
      tag: 'PRE-FALL',
      title: 'Pre-Fall 2026',
      description: 'Bộ sưu tập chuyển mùa, kết hợp linh hoạt giữa thể thao và đời thường.',
      image: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800&q=80',
    },
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

      {/* 3. BỘ SƯU TẬP THEO MÙA */}
      <section className="px-6 md:px-10 py-12 md:py-16 bg-white border-t border-gray-100">
        <div className="flex items-end justify-between mb-8 md:mb-10">
          <div className="space-y-1">
            <span className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">Theo dòng thời gian</span>
            <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-black uppercase tracking-tight text-gray-900">
              Bộ sưu tập <span className="text-orange-500">theo mùa</span>
            </h2>
          </div>
          <Link href="/collections" className="hidden sm:flex text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-black transition-colors items-center gap-1">
            Xem tất cả mùa <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {seasonalCollections.map((season) => (
            <Link
              key={season.slug}
              href={`/collections/${season.slug}`}
              className="group relative h-[340px] md:h-[400px] overflow-hidden bg-gray-100"
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-110"
                style={{ backgroundImage: `url('${season.image}')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

              <div className="relative z-10 h-full flex flex-col justify-between p-5">
                <span className="self-start text-[10px] font-bold uppercase tracking-widest text-white/80 bg-white/10 backdrop-blur-sm px-2.5 py-1 border border-white/20">
                  {season.tag}
                </span>

                <div className="space-y-3 text-white">
                  <h3 className="font-[family-name:var(--font-display)] text-xl md:text-2xl font-black uppercase leading-tight tracking-tight">
                    {season.title}
                  </h3>
                  <p className="text-xs text-white/70 font-light leading-relaxed">
                    {season.description}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white group-hover:text-orange-400 transition-colors">
                    Khám phá <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. THANH FOOTER */}
      <footer className="p-6 md:p-8 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center text-[11px] text-gray-400 tracking-wider">
        <p>© 2026 DYNOVA STUDIO. PREMIUM EXPERIENCE.</p>
        <p className="font-medium text-gray-600 hidden sm:block">RÊ CHUỘT VÀO TÊN THƯƠNG HIỆU ĐỂ MỞ RỘNG BỘ SƯU TẬP</p>
      </footer>

    </div>
  );
}