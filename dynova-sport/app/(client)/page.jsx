'use client';
import './home.css';
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('khuyenmai');
  const collectionsRef = useRef(null);

  // Kích hoạt bộ quét màn hình để tạo hiệu ứng lướt tới đâu hiện tới đó
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.12, // Kích hoạt khi cấu trúc lộ diện được 12% trên màn hình
    };

    const handleIntersect = (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
          // Sau khi hiện rồi thì không quét lại nữa để mượt hiệu ứng
          observer.unobserve(entry.target);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);
    const hiddenElements = document.querySelectorAll('.reveal-hidden');
    hiddenElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const scrollCollections = (direction) => {
    if (collectionsRef.current) {
      const container = collectionsRef.current;
      const firstCard = container.firstElementChild;
      if (firstCard) {
        const cardWidth = firstCard.offsetWidth + 24; 
        container.scrollBy({ left: direction * cardWidth, behavior: 'smooth' });
      }
    }
  };

  const categories = [
    { id: 1, name: 'Áo Bóng Đá', icon: '👕' },
    { id: 2, name: 'Giày Thể Thao', icon: '👟' },
    { id: 3, name: 'Vợt Pickleball', icon: '🏓' },
    { id: 4, name: 'Quần Thể Thao', icon: '🩳' },
    { id: 5, name: 'Balo - Túi Xách', icon: '🎒' },
  ];

  const collections = [
    { id: 1, brand: 'Nike', name: 'Mercurial', img: 'https://images.unsplash.com/photo-1511886929837-354d827aae26?w=600&auto=format&fit=crop&q=80' },
    { id: 2, brand: 'Adidas', name: 'Predator', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80' },
    { id: 3, brand: 'Mizuno', name: 'Morelia', tagline: 'Japan', img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&auto=format&fit=crop&q=80' },
    { id: 4, brand: 'Puma', name: 'Future', img: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80' },
    { id: 5, brand: 'Nike', name: 'Phantom', img: 'https://images.unsplash.com/photo-1511886929837-354d827aae26?w=600&auto=format&fit=crop&q=80' },
    { id: 6, brand: 'Adidas', name: 'X Crazyfast', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80' },
    { id: 7, brand: 'Puma', name: 'King', tagline: 'Legacy', img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&auto=format&fit=crop&q=80' },
    { id: 8, brand: 'New Balance', name: 'Furon', img: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80' },
  ];

  const products = [
    { id: 1, name: 'Áo Polo Nam Adidas Mercedes - Amg Petronas Formula 1 Team Engineers - Trắng', price: '2.300.000đ', sale: '-20%', img: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500&auto=format&fit=crop&q=60' },
    { id: 2, name: 'Áo Polo Nam Adidas Mercedes - Amg Petronas Formula 1 Team Engineers - Trắng', price: '2.300.000đ', sale: '-20%', img: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500&auto=format&fit=crop&q=60' },
    { id: 3, name: 'Áo Polo Nam Adidas Mercedes - Amg Petronas Formula 1 Team Engineers - Trắng', price: '2.300.000đ', sale: '-20%', img: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500&auto=format&fit=crop&q=60' },
    { id: 4, name: 'Áo Polo Nam Adidas Mercedes - Amg Petronas Formula 1 Team Engineers - Trắng', price: '2.300.000đ', sale: '-20%', img: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500&auto=format&fit=crop&q=60' },
  ];

  const newsItems = [
    { id: 1, title: 'HYROX Là Gì? Hướng Dẫn Trang Bị Tập HYROX Cho Người Mới', img: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&auto=format&fit=crop&q=60' },
    { id: 2, title: 'Giày Chạy Đua UA Velociti Elite: Bí Quyết Chinh Phục Kỷ Lục Marathon', img: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=500&auto=format&fit=crop&q=60' },
    { id: 3, title: 'Quần bó cơ là gì? 5 lợi ích "không thể bỏ qua" của quần bó cơ giúp bạn...', img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500&auto=format&fit=crop&q=60' },
    { id: 4, title: 'TOP 5 Giày Đá Bóng Adidas Dành Cho Sân Cỏ Nhân Tạo - Chính Hãng - Giá Tốt', img: 'https://images.unsplash.com/photo-1511886929837-354d827aae26?w=500&auto=format&fit=crop&q=60' },
  ];

  return (
    <div className="home-wrapper space-y-24 pb-24 overflow-hidden">

      {/* 1. HERO BANNER (Luôn hiện đầu tiên, không cần cuộn) */}
      <div className="relative w-full h-[88vh] bg-cover bg-center flex items-center px-6 md:px-20" style={{ backgroundImage: "linear-gradient(to right, rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.3)), url('https://images.unsplash.com/photo-1530549387789-4c1017266635?w=1600&auto=format&fit=crop&q=80')" }}>
        <div className="max-w-2xl space-y-6 text-white z-10">
          <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-md">Bứt phá mọi giới hạn</span>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tight leading-none text-white">
            TỐC ĐỘ <br />
            <span className="text-orange-500">CHÍNH XÁC</span> <br />
            KIỂM SOÁT <br />
            <span className="text-emerald-400">CHIẾN THẮNG</span>
          </h1>
          <p className="text-sm text-gray-300 font-light max-w-md leading-relaxed">Dynova đồng hành cùng các chiến binh kiên cường trên hành trình chinh phục những đỉnh cao thể thao mới.</p>
          <button className="btn-hero-premium bg-orange-500 text-white font-bold text-xs uppercase tracking-widest px-7 py-4 rounded-xl flex items-center gap-2 shadow-lg">
            Khám phá ngay <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* 2. DANH MỤC */}
      <section className="container mx-auto px-4 max-w-7xl space-y-8 reveal-hidden">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-black text-blue-950 uppercase tracking-wider">Danh mục sản phẩm</h2>
          <div className="w-12 h-0.5 bg-orange-500 mx-auto rounded-full"></div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5">
          {categories.map((cat, index) => (
            <div 
              key={cat.id} 
              className={`category-card-premium rounded-2xl p-6 text-center cursor-pointer group reveal-hidden delay-${(index + 1) * 100}`}
            >
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">{cat.icon}</div>
              <p className="text-xs font-black text-gray-800 uppercase tracking-wider">{cat.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 2.5 BỘ SƯU TẬP */}
      <section className="container mx-auto px-4 max-w-7xl space-y-10 reveal-hidden">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-black text-blue-950 uppercase tracking-wider">Bộ sưu tập nổi bật</h2>
          <div className="w-12 h-0.5 bg-orange-500 mx-auto rounded-full"></div>
        </div>

        <div className="relative group/nav">
          <button
            onClick={() => scrollCollections(-1)}
            aria-label="Cuộn sang trái"
            className="btn-nav-glass absolute -left-5 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-xl shadow-lg flex items-center justify-center text-gray-700 opacity-0 group-hover/nav:opacity-100 transition-opacity duration-300"
          >
            <ChevronLeft size={20} />
          </button>

          <div
            ref={collectionsRef}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-6 [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {collections.map((col, index) => (
              <Link
                href={`/collections/${col.id}`}
                key={col.id}
                className={`group relative collection-card-premium bg-white rounded-2xl overflow-hidden h-[390px] w-[260px] flex-shrink-0 snap-start flex flex-col reveal-hidden delay-${((index % 4) + 1) * 100}`}
              >
                <div className="pt-8 px-6 text-center z-10 space-y-0.5">
                  <p className="text-[11px] font-bold text-orange-500 uppercase tracking-widest">{col.brand}</p>
                  <h3 className="text-xl font-black text-blue-950 uppercase tracking-tight leading-tight group-hover:text-orange-600 transition-colors">{col.name}</h3>
                  {col.tagline && (
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.25em] pt-1">{col.tagline}</p>
                  )}
                </div>
                <div className="absolute bottom-0 left-0 w-full h-56 flex items-end justify-center overflow-hidden mb-6">
                  <img
                    src={col.img}
                    alt={`${col.brand} ${col.name}`}
                    className="w-[85%] object-contain group-hover:scale-108 group-hover:-translate-y-3 transition-transform duration-500 drop-shadow-2xl"
                  />
                </div>
              </Link>
            ))}
          </div>

          <button
            onClick={() => scrollCollections(1)}
            aria-label="Cuộn sang phải"
            className="btn-nav-glass absolute -right-5 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-xl shadow-lg flex items-center justify-center text-gray-700 opacity-0 group-hover/nav:opacity-100 transition-opacity duration-300"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </section>

      {/* 3. KHỐI HAI CỘT TIN TỨC LỚN & SẢN PHẨM MỚI */}
      <section className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Cột trái: Tin tức lớn */}
          <div className="lg:col-span-7 space-y-8 reveal-hidden">
            <h2 className="text-xl font-black text-blue-950 uppercase tracking-wider border-b border-gray-100 pb-3">Tin tức mới nhất</h2>

            <div className="space-y-4 group cursor-pointer news-card-premium p-4 rounded-2xl reveal-hidden">
              <div className="overflow-hidden rounded-xl relative">
                <img src="https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=60" alt="In áo bóng đá" className="w-full h-72 object-cover group-hover:scale-103 transition-transform duration-500" />
                <span className="absolute top-4 left-4 bg-orange-500 text-white font-black text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-md shadow-sm">Thiết kế ngay</span>
              </div>
              <div className="space-y-2 px-1">
                <h3 className="text-lg font-black text-blue-950 group-hover:text-orange-500 transition-colors uppercase leading-tight">Dịch Vụ In Áo Bóng Đá Chính Hãng Theo Yêu Cầu Tại Dynova Chuẩn Fan</h3>
                <p className="text-xs text-gray-400 font-light leading-relaxed">In tên & số theo yêu cầu cho áo đá bóng chính hãng tại Dynova. Khám phá ngay!</p>
                <Link href="/news/5" className="text-xs font-bold text-orange-500 hover:text-orange-600 inline-flex items-center gap-1 pt-1">Xem chi tiết bài viết →</Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="news-card-premium p-3 rounded-2xl space-y-3 group cursor-pointer reveal-hidden delay-100">
                <div className="overflow-hidden rounded-xl h-40">
                  <img src="https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400&auto=format&fit=crop&q=60" alt="Pickleball" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <h4 className="text-xs font-bold text-blue-950 group-hover:text-orange-500 transition-colors line-clamp-2 leading-snug px-1">Mới Chơi Pickleball Nên Bắt Đầu Từ Đâu? Cách Chọn Vợt, Giày Và Gear Phù Hợp</h4>
                <Link href="/news/6" className="text-[10px] font-bold text-gray-400 group-hover:text-orange-500 block px-1">Xem thêm →</Link>
              </div>
              <div className="news-card-premium p-3 rounded-2xl space-y-3 group cursor-pointer reveal-hidden delay-200">
                <div className="overflow-hidden rounded-xl h-40">
                  <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop&q=60" alt="Nike Air Max" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <h4 className="text-xs font-bold text-blue-950 group-hover:text-orange-500 transition-colors line-clamp-2 leading-snug px-1">Nike Air Max Day 2026 Tại Supersports Crescent Mall – Sự Kiện Toàn Cầu Không Thể Bỏ Lỡ!</h4>
                <Link href="/news/7" className="text-[10px] font-bold text-gray-400 group-hover:text-orange-500 block px-1">Xem thêm →</Link>
              </div>
            </div>
          </div>

          {/* Cột phải: Sản phẩm mới */}
          <div className="lg:col-span-5 space-y-8 reveal-hidden">
            <h2 className="text-xl font-black text-blue-950 uppercase tracking-wider border-b border-gray-100 pb-3">Sản phẩm mới</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {products.map((prod, index) => (
                <div key={prod.id} className={`product-card-premium rounded-2xl p-4 space-y-3 relative group reveal-hidden delay-${(index + 1) * 100}`}>
                  <span className="absolute top-3 left-3 bg-orange-500 text-white font-black text-[9px] px-2.5 py-1 rounded-md z-10 shadow-sm">{prod.sale}</span>
                  <div className="overflow-hidden rounded-xl bg-gray-50 h-48 flex items-center justify-center">
                    <img src={prod.img} alt={prod.name} className="object-cover h-full w-full group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-orange-500 uppercase tracking-widest">Adidas</p>
                    <h3 className="text-xs font-bold text-gray-800 line-clamp-2 leading-snug min-h-[32px] group-hover:text-orange-500 transition-colors">{prod.name}</h3>
                    <p className="text-sm font-black text-blue-950 pt-1">{prod.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* 4. SECTION PHÂN LOẠI TIN TỨC THEO TAB */}
      <section className="bg-gray-50/50 py-20 border-y border-gray-100 reveal-hidden">
        <div className="container mx-auto px-4 max-w-7xl space-y-12">

          <div className="text-center space-y-4">
            <h2 className="text-xl font-black text-blue-950 uppercase tracking-wider">Tin tức thời trang & Thể thao</h2>
            <div className="flex justify-center gap-3 text-[11px] font-bold uppercase tracking-wider">
              <button onClick={() => setActiveTab('noibat')} className={`tab-btn-premium px-6 py-3 rounded-xl border ${activeTab === 'noibat' ? 'bg-white border-gray-200 text-gray-800 shadow-sm' : 'bg-transparent border-transparent text-gray-400 hover:text-gray-600'}`}>Tin nổi bật</button>
              <button onClick={() => setActiveTab('khuyenmai')} className={`tab-btn-premium px-6 py-3 rounded-xl border ${activeTab === 'khuyenmai' ? 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-500/10' : 'bg-transparent border-transparent text-gray-400 hover:text-gray-600'}`}>Tin Khuyến mãi</button>
              <button onClick={() => setActiveTab('meo')} className={`tab-btn-premium px-6 py-3 rounded-xl border ${activeTab === 'meo' ? 'bg-white border-gray-200 text-gray-800 shadow-sm' : 'bg-transparent border-transparent text-gray-400 hover:text-gray-600'}`}>Mẹo thời trang</button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {newsItems.map((item, index) => (
              <div key={item.id} className={`news-card-premium rounded-2xl overflow-hidden flex flex-col h-full group reveal-hidden delay-${(index + 1) * 100}`}>
                <div className="h-44 overflow-hidden">
                  <img src={item.img} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-4 flex flex-col justify-between flex-grow space-y-4">
                  <h3 className="text-xs font-bold text-gray-800 line-clamp-3 leading-snug group-hover:text-orange-500 transition-colors">{item.title}</h3>
                  <Link
                    href={`/news/${item.id}`}
                    className="text-[10px] font-bold text-gray-400 group-hover:text-orange-500 inline-flex items-center gap-1 mt-auto transition-colors"
                  >
                    Xem thêm →
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="w-full flex justify-center pt-4 reveal-hidden">
            <Link href="/news" className="btn-view-all-premium border-2 border-orange-500 text-orange-500 font-bold text-xs uppercase tracking-widest px-9 py-4 rounded-xl shadow-sm">
              Xem tất cả tin tức
            </Link>
          </div>

        </div>
      </section>

    </div>
  );
}