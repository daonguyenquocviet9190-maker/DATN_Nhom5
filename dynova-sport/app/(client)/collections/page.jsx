'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Be_Vietnam_Pro } from 'next/font/google';
import { Search, ChevronRight, ArrowRight, ArrowUpRight } from 'lucide-react';

// Font hiển thị riêng cho tiêu đề — đồng bộ với trang chủ / about.
const display = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['700', '800', '900'],
  variable: '--font-display',
});

function SectionHeading({ eyebrow, title, align = 'center' }) {
  const isCenter = align === 'center';
  return (
    <div className={`space-y-3 ${isCenter ? 'text-center' : 'text-left'}`}>
      <div className="inline-flex items-center gap-2">
        <span className="w-5 h-[2px] bg-orange-500" />
        <span className="text-[11px] font-bold text-orange-500 uppercase tracking-[0.25em]">{eyebrow}</span>
        {isCenter && <span className="w-5 h-[2px] bg-orange-500" />}
      </div>
      <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-extrabold text-blue-950 uppercase tracking-tight">
        {title}
      </h2>
    </div>
  );
}

export default function AllBrandsPage() {
  const [query, setQuery] = useState('');

  // Thương hiệu nổi bật — hiển thị ở lưới lớn, ưu tiên các tên quen thuộc nhất
  const featuredBrands = [
    { id: 1, name: 'Nike', slug: 'nike' },
    { id: 2, name: 'Adidas', slug: 'adidas' },
    { id: 3, name: 'Puma', slug: 'puma' },
    { id: 4, name: 'Mizuno', slug: 'mizuno' },
    { id: 5, name: 'New Balance', slug: 'new-balance' },
    { id: 6, name: 'Under Armour', slug: 'under-armour' },
    { id: 7, name: 'Asics', slug: 'asics' },
    { id: 8, name: 'On Running', slug: 'on-running' },
  ];

  // Thương hiệu khác — danh sách dài hơn, hiển thị ở lưới nhỏ và gọn hơn
  const otherBrands = [
    { id: 9, name: 'HOKA', slug: 'hoka' },
    { id: 10, name: 'Wilson', slug: 'wilson' },
    { id: 11, name: 'Yonex', slug: 'yonex' },
    { id: 12, name: 'Joola', slug: 'joola' },
    { id: 13, name: 'Selkirk', slug: 'selkirk' },
    { id: 14, name: 'Speedo', slug: 'speedo' },
    { id: 15, name: 'Crocs', slug: 'crocs' },
    { id: 16, name: 'Columbia', slug: 'columbia' },
    { id: 17, name: 'Kelme', slug: 'kelme' },
    { id: 18, name: 'Diadora', slug: 'diadora' },
    { id: 19, name: 'Umbro', slug: 'umbro' },
    { id: 20, name: 'Molten', slug: 'molten' },
    { id: 21, name: 'Mikasa', slug: 'mikasa' },
    { id: 22, name: 'Li-Ning', slug: 'li-ning' },
    { id: 23, name: 'Head', slug: 'head' },
    { id: 24, name: 'Babolat', slug: 'babolat' },
  ];

  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const matches = (brand) => norm(brand.name).includes(norm(query));

  const filteredFeatured = featuredBrands.filter(matches);
  const filteredOther = otherBrands.filter(matches);
  const totalResults = filteredFeatured.length + filteredOther.length;

  // Tile thương hiệu dùng chung cho cả hai lưới — chỉ khác kích thước qua className truyền vào
  function BrandTile({ brand, size = 'lg' }) {
    const isLg = size === 'lg';
    return (
      <Link
        href={`/brands/${brand.slug}`}
        className={`group relative bg-white border border-gray-100 hover:border-orange-500/50 rounded-2xl flex items-center justify-center transition-all motion-safe:hover:-translate-y-1 hover:shadow-lg hover:shadow-orange-500/5 ${
          isLg ? 'aspect-[4/3]' : 'aspect-[3/2]'
        }`}
      >
        <span
          className={`font-[family-name:var(--font-display)] font-extrabold text-gray-800 group-hover:text-blue-950 uppercase tracking-tight transition-colors text-center px-4 ${
            isLg ? 'text-xl md:text-2xl' : 'text-sm md:text-base'
          }`}
        >
          {brand.name}
        </span>
        <ArrowUpRight
          size={isLg ? 16 : 13}
          className="absolute top-3 right-3 text-orange-500 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all"
        />
      </Link>
    );
  }

  return (
    <div className={`${display.variable} bg-white min-h-screen pb-24`}>

      {/* 1. HERO BANNER */}
      <section className="relative h-[34vh] md:h-[42vh] bg-blue-950 flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-overlay"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1530549387789-4c1017266635?w=1200&q=80')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/50 to-blue-950 z-10" />
        <div className="pointer-events-none absolute inset-0 opacity-20 z-10">
          <div className="absolute top-[20%] -left-10 w-[55%] h-[2px] bg-orange-500 -rotate-[8deg]" />
          <div className="absolute bottom-[25%] -right-10 w-[45%] h-[2px] bg-emerald-400 -rotate-[8deg]" />
        </div>

        <div className="relative z-20 text-center text-white space-y-4 px-4">
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">
            <Link href="/" className="hover:text-orange-400 transition-colors">Trang chủ</Link>
            <ChevronRight size={12} />
            <span className="text-orange-400">Thương hiệu</span>
          </div>

          <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-5xl font-black uppercase tracking-tight">
            Tất cả <span className="text-orange-500">thương hiệu</span>
          </h1>
          <p className="text-sm text-gray-300 max-w-lg mx-auto font-light leading-relaxed">
            Dynova phân phối chính hãng các thương hiệu thể thao hàng đầu thế giới. Chọn thương hiệu bạn yêu thích để khám phá toàn bộ sản phẩm.
          </p>
        </div>
      </section>

      {/* 2. Ô TÌM KIẾM THƯƠNG HIỆU */}
      <section className="container mx-auto px-4 max-w-2xl pt-10">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm thương hiệu, ví dụ: Nike, Adidas…"
            className="w-full bg-gray-50 border border-gray-200 rounded-full pl-11 pr-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-orange-500 focus:bg-white transition-colors"
          />
        </div>
        {query && (
          <p className="text-xs text-gray-400 font-light text-center pt-3">
            Tìm thấy <span className="font-bold text-gray-700">{totalResults}</span> thương hiệu cho "{query}"
          </p>
        )}
      </section>

      {/* 3. THƯƠNG HIỆU NỔI BẬT */}
      {filteredFeatured.length > 0 && (
        <section className="container mx-auto px-4 max-w-7xl pt-14 space-y-8">
          <SectionHeading eyebrow="Được tin dùng nhiều nhất" title="Thương hiệu nổi bật" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
            {filteredFeatured.map(brand => (
              <BrandTile key={brand.id} brand={brand} size="lg" />
            ))}
          </div>
        </section>
      )}

      {/* 4. THƯƠNG HIỆU KHÁC */}
      {filteredOther.length > 0 && (
        <section className="container mx-auto px-4 max-w-7xl pt-16 space-y-8">
          <SectionHeading eyebrow="Đa dạng lựa chọn" title="Thương hiệu khác" />
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {filteredOther.map(brand => (
              <BrandTile key={brand.id} brand={brand} size="sm" />
            ))}
          </div>
        </section>
      )}

      {/* 5. TRẠNG THÁI KHÔNG CÓ KẾT QUẢ */}
      {totalResults === 0 && (
        <section className="container mx-auto px-4 max-w-7xl pt-16">
          <div className="text-center py-16 space-y-3">
            <p className="text-sm text-gray-500 font-light">Không tìm thấy thương hiệu nào khớp với "{query}".</p>
            <button
              onClick={() => setQuery('')}
              className="text-xs font-bold text-orange-500 hover:underline"
            >
              Xoá tìm kiếm
            </button>
          </div>
        </section>
      )}

      {/* 6. CALL TO ACTION */}
      <section className="container mx-auto px-4 max-w-7xl pt-20">
        <div className="relative bg-blue-950 rounded-3xl overflow-hidden p-10 md:p-14 text-center text-white">
          <div className="pointer-events-none absolute inset-0 opacity-[0.07]">
            <div className="absolute top-[15%] -left-10 w-[60%] h-px bg-white -rotate-[10deg]" />
            <div className="absolute bottom-[25%] -right-10 w-[50%] h-px bg-white -rotate-[10deg]" />
          </div>
          <div className="absolute -right-14 -top-14 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl" />
          <div className="absolute -left-14 -bottom-14 w-48 h-48 bg-emerald-400/10 rounded-full blur-3xl" />

          <div className="relative z-10 max-w-xl mx-auto space-y-5">
            <p className="text-orange-400 text-[11px] font-bold uppercase tracking-[0.25em]">Chưa tìm thấy thương hiệu yêu thích?</p>
            <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-4xl font-black uppercase tracking-tight">
              Khám phá toàn bộ <span className="text-orange-500">cửa hàng</span>
            </h2>
            <p className="text-sm text-gray-300 font-light leading-relaxed">
              Hàng trăm sản phẩm quần áo, giày và phụ kiện thể thao chính hãng đang chờ bạn tại Dynova.
            </p>
            <Link
              href="/shop"
              className="group inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-widest pl-6 pr-5 py-3.5 transition-colors"
              style={{ clipPath: 'polygon(0 0, 100% 0, 92% 100%, 0% 100%)' }}
            >
              Đến cửa hàng ngay
              <ArrowRight size={14} className="motion-safe:group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}