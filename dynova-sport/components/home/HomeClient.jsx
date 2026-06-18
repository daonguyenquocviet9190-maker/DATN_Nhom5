'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Eye, ShoppingBag } from 'lucide-react';

export default function HomeClient({ 
products =[]
}) {
  const [activeTab, setActiveTab] = useState('khuyenmai');

  // Danh mục sản phẩm
  const categories = [
    { id: 1, name: 'Áo Bóng Đá', icon: '👕' },
    { id: 2, name: 'Giày Thể Thao', icon: '👟' },
    { id: 3, name: 'Vợt Pickleball', icon: '🏓' },
    { id: 4, name: 'Quần Thể Thao', icon: '🩳' },
    { id: 5, name: 'Balo - Túi Xách', icon: '🎒' },
  ];

//   // Sản phẩm mới
//   const products = [
//     { id: 1, name: 'Áo Polo Nam Adidas Mercedes - Amg Petronas Formula 1 Team Engineers - Trắng', price: '2.300.000đ', sale: '-20%', img: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500&auto=format&fit=crop&q=60' },
//     { id: 2, name: 'Áo Polo Nam Adidas Mercedes - Amg Petronas Formula 1 Team Engineers - Trắng', price: '2.300.000đ', sale: '-20%', img: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500&auto=format&fit=crop&q=60' },
//     { id: 3, name: 'Áo Polo Nam Adidas Mercedes - Amg Petronas Formula 1 Team Engineers - Trắng', price: '2.300.000đ', sale: '-20%', img: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500&auto=format&fit=crop&q=60' },
//     { id: 4, name: 'Áo Polo Nam Adidas Mercedes - Amg Petronas Formula 1 Team Engineers - Trắng', price: '2.300.000đ', sale: '-20%', img: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500&auto=format&fit=crop&q=60' },
//   ];

  // Danh sách tin tức ở phần cuối trang chủ (Mỗi bài có ID riêng từ 1 đến 4)
  const newsItems = [
    { id: 1, title: 'HYROX Là Gì? Hướng Dẫn Trang Bị Tập HYROX Cho Người Mới', img: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&auto=format&fit=crop&q=60' },
    { id: 2, title: 'Giày Chạy Đua UA Velociti Elite: Bí Quyết Chinh Phục Kỷ Lục Marathon', img: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=500&auto=format&fit=crop&q=60' },
    { id: 3, title: 'Quần bó cơ là gì? 5 lợi ích "không thể bỏ qua" của quần bó cơ giúp bạn...', img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500&auto=format&fit=crop&q=60' },
    { id: 4, title: 'TOP 5 Giày Đá Bóng Adidas Dành Cho Sân Cỏ Nhân Tạo - Chính Hãng - Giá Tốt', img: 'https://images.unsplash.com/photo-1511886929837-354d827aae26?w=500&auto=format&fit=crop&q=60' },
  ];


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

      {/* 2. DANH MỤC */}
      <section className="container mx-auto px-4 max-w-7xl space-y-6">
        <h2 className="text-xl font-black text-blue-950 uppercase tracking-wide text-center">Danh mục sản phẩm</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {categories.map(cat => (
            <div key={cat.id} className="bg-gray-50 hover:bg-white border border-gray-100 hover:border-orange-500 rounded-2xl p-6 text-center cursor-pointer transition-all hover:shadow-md group">
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{cat.icon}</div>
              <p className="text-xs font-bold text-gray-800 uppercase tracking-wider">{cat.name}</p>
            </div>
          ))}
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

            {/* Tin phụ: Gán ID = 6 và ID = 7 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="space-y-2 group cursor-pointer">
                <img src="https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400&auto=format&fit=crop&q=60" alt="Pickleball" className="w-full h-40 object-cover rounded-xl" />
                <h4 className="text-sm font-bold text-gray-900 group-hover:text-orange-500 transition-colors line-clamp-2">Mới Chơi Pickleball Nên Bắt Đầu Từ Đâu? Cách Chọn Vợt, Giày Và Gear Phù Hợp</h4>
                <Link href="/news/6" className="text-[11px] font-bold text-gray-400 hover:text-orange-500 block">Xem thêm →</Link>
              </div>
              <div className="space-y-2 group cursor-pointer">
                <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop&q=60" alt="Nike Air Max" className="w-full h-40 object-cover rounded-xl" />
                <h4 className="text-sm font-bold text-orange-500 line-clamp-2">Nike Air Max Day 2026 Tại Supersports Crescent Mall – Sự Kiện Toàn Cầu Không Thể Bỏ Lỡ!</h4>
                <Link href="/news/7" className="text-[11px] font-bold text-gray-400 hover:text-orange-500 block">Xem thêm →</Link>
              </div>
            </div>
          </div>

          {/* Sản phẩm bên phải */}
          <div className="lg:col-span-5 space-y-8">
            <h2 className="text-2xl font-black text-blue-950 uppercase tracking-wide border-b-2 border-gray-100 pb-3">Sản phẩm mới</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {products.map(prod => (
                <div key={prod.id} className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3 relative shadow-sm hover:shadow-md transition-shadow group">
                  <span className="absolute top-3 left-3 bg-orange-500 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-sm z-10">{prod.sale_price}</span>
                  <div className="overflow-hidden rounded-xl bg-gray-50 relative h-48 flex items-center justify-center">
                    <img src={prod.thumbnail} alt={prod.name} className="object-cover h-full w-full group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Adidas</p>
                    <h3 className="text-xs font-bold text-gray-800 line-clamp-2 leading-snug min-h-[32px] group-hover:text-orange-500 transition-colors">{prod.name}</h3>
                    <p className="text-sm font-black text-blue-950 pt-1">{Number(prod.price).toLocaleString("vi-VN")}đ</p>
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