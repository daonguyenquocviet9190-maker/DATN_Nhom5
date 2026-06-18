import HomeClient from "@/components/home/HomeClient";
import { getProducts } from "@/services/product.service";
'use client';
import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, Eye, ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('khuyenmai');
  const collectionsRef = useRef(null);

  const scrollCollections = (direction) => {
    if (collectionsRef.current) {
      collectionsRef.current.scrollBy({ left: direction * 280, behavior: 'smooth' });
    }
  };
export default async function HomePage() {
const products = await getProducts();
  // Bộ sưu tập theo dòng sản phẩm nổi bật
  const collections = [
    {
      id: 1,
      brand: 'Nike',
      name: 'Mercurial',
      img: 'https://images.unsplash.com/photo-1511886929837-354d827aae26?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 2,
      brand: 'Adidas',
      name: 'Predator',
      img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 3,
      brand: 'Mizuno',
      name: 'Morelia',
      tagline: 'Japan',
      img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 4,
      brand: 'Puma',
      name: 'Future',
      img: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 5,
      brand: 'Nike',
      name: 'Phantom',
      img: 'https://images.unsplash.com/photo-1511886929837-354d827aae26?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 6,
      brand: 'Adidas',
      name: 'X Crazyfast',
      img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 7,
      brand: 'Puma',
      name: 'King',
      tagline: 'Legacy',
      img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 8,
      brand: 'New Balance',
      name: 'Furon',
      img: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80',
    },
  ];

  // Sản phẩm mới
  const products = [
    { id: 1, name: 'Áo Polo Nam Adidas Mercedes - Amg Petronas Formula 1 Team Engineers - Trắng', price: '2.300.000đ', sale: '-20%', img: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500&auto=format&fit=crop&q=60' },
    { id: 2, name: 'Áo Polo Nam Adidas Mercedes - Amg Petronas Formula 1 Team Engineers - Trắng', price: '2.300.000đ', sale: '-20%', img: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500&auto=format&fit=crop&q=60' },
    { id: 3, name: 'Áo Polo Nam Adidas Mercedes - Amg Petronas Formula 1 Team Engineers - Trắng', price: '2.300.000đ', sale: '-20%', img: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500&auto=format&fit=crop&q=60' },
    { id: 4, name: 'Áo Polo Nam Adidas Mercedes - Amg Petronas Formula 1 Team Engineers - Trắng', price: '2.300.000đ', sale: '-20%', img: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500&auto=format&fit=crop&q=60' },
  ];

    return (
        <HomeClient
  return (
    <div className="space-y-20 pb-20">

      {/* 1. HERO BANNER */}
      <div className="relative w-full h-[85vh] bg-cover bg-center flex items-center px-6 md:px-20" style={{ backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.5)), url('https://images.unsplash.com/photo-1530549387789-4c1017266635?w=1600&auto=format&fit=crop&q=80')" }}>
        <div className="max-w-xl space-y-6 text-white z-10">
          <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-sm">Bứt phá mọi giới hạn</span>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight leading-none text-white">
            TỐC ĐỘ <br />
            <span className="text-orange-500">CHÍNH XÁC</span> <br />
            KIỂM SOÁT <br />
            <span className="text-emerald-400">CHIẾN THẮNG</span>
          </h1>
          <p className="text-sm text-gray-300 font-light max-w-md">Dynova đồng hành cùng các chiến binh kiên cường trên hành trình chinh phục những đỉnh cao thể thao mới.</p>
          <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-widest px-6 py-3.5 rounded-sm flex items-center gap-2 transition-all">Khám phá ngay <ArrowRight size={14} /></button>
        </div>
      </div>

            products={products}
        />
      {/* 2.5 BỘ SƯU TẬP */}
      <section className="container mx-auto px-4 max-w-7xl space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-black text-orange-500 uppercase tracking-widest">Bộ sưu tập</h2>
          <div className="w-20 h-0.5 bg-orange-500 mx-auto rounded-full"></div>
        </div>

        <div className="relative">
          <button
            onClick={() => scrollCollections(-1)}
            aria-label="Cuộn sang trái"
            className="hidden md:flex absolute -left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-md items-center justify-center text-gray-700 hover:text-orange-500 hover:border-orange-500 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>

          <div
            ref={collectionsRef}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {collections.map(col => (
              <Link
                href={`/collections/${col.id}`}
                key={col.id}
                className="group relative bg-gray-100 hover:bg-gray-50 rounded-2xl overflow-hidden h-[380px] w-[240px] sm:w-[260px] flex-shrink-0 snap-start flex flex-col transition-colors"
              >
                <div className="pt-8 px-6 text-center z-10">
                  <p className="text-sm font-black text-gray-900 uppercase tracking-wider">{col.brand}</p>
                  <h3 className="text-xl md:text-2xl font-black text-gray-900 uppercase tracking-tight leading-tight">{col.name}</h3>
                  {col.tagline && (
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mt-1">{col.tagline}</p>
                  )}
                </div>
                <div className="absolute bottom-0 left-0 w-full h-56 flex items-end justify-center overflow-hidden">
                  <img
                    src={col.img}
                    alt={`${col.brand} ${col.name}`}
                    className="w-[85%] object-contain group-hover:scale-105 group-hover:-translate-y-1 transition-transform duration-500 drop-shadow-xl"
                  />
                </div>
              </Link>
            ))}
          </div>

          <button
            onClick={() => scrollCollections(1)}
            aria-label="Cuộn sang phải"
            className="hidden md:flex absolute -right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-md items-center justify-center text-gray-700 hover:text-orange-500 hover:border-orange-500 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </section>

      {/* 3. KHỐI HAI CỘT TIN TỨC LỚN & SẢN PHẨM MỚI */}
      <section className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          <div className="lg:col-span-7 space-y-8">
            <h2 className="text-2xl font-black text-blue-950 uppercase tracking-wide border-b-2 border-gray-100 pb-3">Tin tức mới nhất</h2>

            {/* Tin nổi bật lớn: Gán ID = 5 */}
            <div className="space-y-4 group cursor-pointer">
              <div className="overflow-hidden rounded-2xl border border-gray-100 relative shadow-md">
                <img src="https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=60" alt="In áo bóng đá" className="w-full h-72 object-cover group-hover:scale-105 transition-transform duration-500" />
                <span className="absolute top-4 left-4 bg-orange-500 text-white font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-sm">Thiết kế ngay</span>
              </div>
              <h3 className="text-lg font-black text-gray-900 group-hover:text-orange-500 transition-colors uppercase leading-tight">Dịch Vụ In Áo Bóng Đá Chính Hãng Theo Yêu Cầu Tại Dynova Chuẩn Fan</h3>
              <p className="text-xs text-gray-500 font-light leading-relaxed">In tên & số theo yêu cầu cho áo đá bóng chính hãng tại Dynova. Khám phá ngay!</p>
              <Link href="/news/5" className="text-xs font-bold text-orange-500 hover:underline inline-flex items-center gap-1">Xem chi tiết bài viết →</Link>
            </div>

    );
{/* Sản phẩm bên phải */}
          <div className="lg:col-span-5 space-y-8">
            <h2 className="text-2xl font-black text-blue-950 uppercase tracking-wide border-b-2 border-gray-100 pb-3">Sản phẩm mới</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {products.map(prod => (
                <div key={prod.id} className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3 relative shadow-sm hover:shadow-md transition-shadow group">
                  <span className="absolute top-3 left-3 bg-orange-500 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-sm z-10">{prod.sale}</span>
                  <div className="overflow-hidden rounded-xl bg-gray-50 relative h-48 flex items-center justify-center">
                    <img src={prod.img} alt={prod.name} className="object-cover h-full w-full group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Adidas</p>
                    <h3 className="text-xs font-bold text-gray-800 line-clamp-2 leading-snug min-h-[32px] group-hover:text-orange-500 transition-colors">{prod.name}</h3>
                    <p className="text-sm font-black text-blue-950 pt-1">{prod.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* 4. SECTION ĐỒNG BỘ TIN TỨC THEO ID BÀI VIẾT (Giao diện ảnh image_3b97c5.jpg) */}
      <section className="bg-gray-50/60 py-16 border-y border-gray-100">
        <div className="container mx-auto px-4 max-w-7xl space-y-10">

          <div className="text-center space-y-4">
            <h2 className="text-2xl font-black text-blue-950 uppercase tracking-widest">Tin tức thời trang & Thể thao</h2>
            <div className="flex justify-center gap-2 text-xs font-bold uppercase tracking-wider">
              <button onClick={() => setActiveTab('noibat')} className={`px-5 py-2.5 rounded-full border transition-all ${activeTab === 'noibat' ? 'bg-white border-gray-200 text-gray-800 shadow-sm' : 'bg-transparent border-transparent text-gray-400 hover:text-gray-600'}`}>Tin nổi bật</button>
              <button onClick={() => setActiveTab('khuyenmai')} className={`px-5 py-2.5 rounded-full border transition-all ${activeTab === 'khuyenmai' ? 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-500/10' : 'bg-transparent border-transparent text-gray-400 hover:text-gray-600'}`}>Tin Khuyến mãi</button>
              <button onClick={() => setActiveTab('meo')} className={`px-5 py-2.5 rounded-full border transition-all ${activeTab === 'meo' ? 'bg-white border-gray-200 text-gray-800 shadow-sm' : 'bg-transparent border-transparent text-gray-400 hover:text-gray-600'}`}>Mẹo thời trang</button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {newsItems.map(item => (
              <div key={item.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm flex flex-col h-full group">
                <div className="h-44 overflow-hidden bg-gray-100">
                  <img src={item.img} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-4 flex flex-col justify-between flex-grow space-y-4">
                  <h3 className="text-xs font-bold text-gray-800 line-clamp-3 leading-snug group-hover:text-orange-500 transition-colors">{item.title}</h3>

                  {/* ĐỒNG BỘ: Đường dẫn động truyền id chính xác của bài viết */}
                  <Link
                    href={`/news/${item.id}`}
                    className="text-[11px] font-bold text-gray-400 hover:text-orange-500 inline-flex items-center gap-1 mt-auto transition-colors"
                  >
                    Xem thêm →
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="w-full flex justify-center pt-4">
            <Link href="/news" className="border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white font-bold text-xs uppercase tracking-widest px-8 py-3.5 rounded-xl transition-all duration-300 shadow-sm">
              Xem tất cả tin tức
            </Link>
          </div>

        </div>
      </section>

    </div>
  );
}