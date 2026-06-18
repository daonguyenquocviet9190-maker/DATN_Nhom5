'use client';

import './shop.css';
import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, ChevronDown, Eye, ShoppingBag, Heart } from 'lucide-react';

const DUMMY_PRODUCTS = [
  { id: 1, name: 'Áo Thun Thể Thao Dynova Pro Dry', category: 'Áo', price: 350000, oldPrice: 450000, image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500&q=80', isNew: true },
  { id: 2, name: 'Quần Short Tập Gym Ultra-Light', category: 'Quần', price: 280000, image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=500&q=80', tag: '-15%' },
  { id: 3, name: 'Giày Chạy Bộ Dynova SpeedRun v1', category: 'Giày', price: 1250000, oldPrice: 1500000, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80', isNew: false },
  { id: 4, name: 'Balo Thể Thao Chống Nước Pro', category: 'Phụ kiện', price: 450000, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80' },
  { id: 5, name: 'Áo Khoác Gió Thể Thao WindBreaker', category: 'Áo', price: 590000, image: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=500&q=80' },
  { id: 6, name: 'Dép Clog Thể Thao Recovery Soft', category: 'Dép', price: 190000, oldPrice: 250000, image: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?w=500&q=80' },
  { id: 7, name: 'Quần Dài Thể Thao Jogger Premium', category: 'Quần', price: 420000, image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=500&q=80', isNew: true },
  { id: 8, name: 'Bình Nước Giữ Nhiệt Dynova 1L', category: 'Phụ kiện', price: 220000, image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&q=80' }
];

const CATEGORIES = ['Tất cả', 'Áo', 'Quần', 'Giày', 'Dép', 'Phụ kiện'];

export default function ShopPage() {
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState(2000000);

  // 1. ĐƯA PHẦN LỌC SẢN PHẨM LÊN TRÊN ĐỂ KHÔNG BỊ LỖI LACK INITIALIZATION
  const filteredProducts = DUMMY_PRODUCTS.filter(product => {
    const matchCategory = selectedCategory === 'Tất cả' || product.category === selectedCategory;
    const matchPrice = product.price <= priceRange;
    return matchCategory && matchPrice;
  });

  // 2. KÍCH HOẠT BỘ QUÉT MÀN HÌNH (SCROLL REVEAL)
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.08, // Kích hoạt sớm khi cạnh khối lọt vào màn hình 8%
    };

    const handleIntersect = (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
          observer.unobserve(entry.target); // Hiện xong dừng quét phần tử đó để mượt hiệu năng
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);
    const hiddenElements = document.querySelectorAll('.reveal-hidden');
    hiddenElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [selectedCategory, priceRange]); // Chạy lại bộ quét mỗi khi thay đổi bộ lọc

  return (
    <div className="shop-wrapper min-h-screen py-16 px-4 md:px-12 selection:bg-orange-500 selection:text-white overflow-hidden">
      
      {/* Header (Hiện mượt ngay khi vào trang) */}
      <div className="mb-12 max-w-[1400px] mx-auto reveal-hidden">
        <p className="text-xs text-gray-400 tracking-widest uppercase">Trang chủ / <span className="text-orange-500 font-semibold">Sản phẩm</span></p>
        <h1 className="text-3xl md:text-4xl font-black text-blue-950 mt-2 uppercase tracking-wider">Danh mục cửa hàng</h1>
        <div className="w-12 h-0.5 bg-orange-500 mt-3 rounded-full"></div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 max-w-[1400px] mx-auto">
        
        
        <div className="w-full lg:w-1/4 filter-sidebar-premium p-6 rounded-2xl h-fit lg:sticky lg:top-6 reveal-hidden">
          <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-gray-100">
            <SlidersHorizontal className="w-4 h-4 text-orange-500" />
            <h2 className="font-bold text-base text-blue-950 tracking-wide">Bộ lọc tìm kiếm</h2>
          </div>

          {/* Lọc danh mục */}
          <div className="mb-8">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3.5">Danh mục</h3>
            <div className="space-y-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider category-btn-premium ${
                    selectedCategory === cat 
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Lọc giá */}
          <div className="mb-2">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-4">Khoảng giá</h3>
            <input 
              type="range" 
              min="100000" 
              max="2000000" 
              step="50000"
              value={priceRange}
              onChange={(e) => setPriceRange(Number(e.target.value))}
              style={{ backgroundImage: `linear-gradient(#f97316, #f97316), linear-gradient(#f3f4f6, #f3f4f6)`, backgroundSize: `${((priceRange - 100000) * 100) / (2000000 - 100000)}% 100%` }}
              className="custom-slider w-full cursor-pointer animate-none"
            />
            <div className="flex justify-between items-center text-xs text-gray-400 mt-4">
              <span>100.000đ</span>
              <span className="text-orange-600 bg-orange-50/70 px-3 py-1 rounded-md font-bold border border-orange-100/50">
                Dưới {priceRange.toLocaleString('vi-VN')}đ
              </span>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: LƯỚI SẢN PHẨM */}
        <div className="w-full lg:w-3/4 space-y-6">
          
          {/* TOPBAR ĐIỀU HƯỚNG (Kính mờ Glassmorphism) */}
          <div className="shop-topbar-glass p-4 rounded-2xl flex flex-wrap justify-between items-center gap-4 reveal-hidden">
            <p className="text-xs font-medium text-gray-500 tracking-wide">
              Tìm thấy <span className="text-orange-500 font-bold text-sm">{filteredProducts.length}</span> sản phẩm phù hợp
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
              <span>SẮP XẾP:</span>
              <div className="relative">
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-white/50 border border-gray-200 rounded-xl px-4 py-2 pr-8 font-bold text-gray-700 focus:outline-none focus:border-orange-500 cursor-pointer text-[11px] tracking-wide transition-colors"
                >
                  <option value="newest">MỚI NHẤT</option>
                  <option value="price-asc">GIÁ: THẤP ĐẾN CAO</option>
                  <option value="price-desc">GIÁ: CAO ĐẾN THẤP</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* HIỂN THỊ LƯỚI SẢN PHẨM KẾT QUẢ */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-20 text-center text-xs font-bold text-gray-400 uppercase tracking-widest reveal-hidden">
              Không tìm thấy sản phẩm nào phù hợp.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filteredProducts.map((product, index) => (
                <div 
                  key={product.id} 
                  className="product-card-premium rounded-2xl overflow-hidden flex flex-col justify-between group reveal-hidden"
                  style={{ transitionDelay: `${(index % 3) * 100}ms` }} // Trễ so le mượt mà theo hàng ngang
                >
                  {/* Khung ảnh */}
                  <div className="relative aspect-[10/11] bg-gray-50/30 overflow-hidden m-2 rounded-xl">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover transform scale-100 group-hover:scale-106 transition-transform duration-[700ms] cubic-bezier(0.16, 1, 0.3, 1)"
                    />
                    
                    {/* Các loại nhãn mác (Badges) */}
                    {product.isNew && (
                      <span className="absolute top-3 left-3 bg-blue-950 text-white text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest shadow-sm z-10">
                        New
                      </span>
                    )}
                    {product.tag && (
                      <span className="absolute top-3 left-3 bg-orange-500 text-white text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest shadow-sm z-10">
                        {product.tag}
                      </span>
                    )}

                    {/* Quick Action Buttons (Glassmorphism trồi lên) */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center gap-2.5 z-20">
                      <button className="action-button-premium p-3 rounded-xl shadow-md" title="Xem nhanh">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="action-button-premium p-3 rounded-xl shadow-md" title="Thêm vào giỏ hàng">
                        <ShoppingBag className="w-4 h-4" />
                      </button>
                      <button className="action-button-premium p-3 rounded-xl shadow-md" title="Yêu thích">
                        <Heart className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Chi tiết sản phẩm */}
                  <div className="p-5 pt-2 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] text-orange-500 uppercase font-black tracking-widest mb-1.5">{product.category}</p>
                      <h3 className="font-bold text-gray-800 group-hover:text-orange-500 transition-colors duration-300 line-clamp-2 text-xs md:text-sm leading-snug min-h-[2.5rem]">
                        {product.name}
                      </h3>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                      <div className="flex items-baseline gap-2">
                        <span className="text-blue-950 font-black text-sm md:text-base tracking-tight">
                          {product.price.toLocaleString('vi-VN')}đ
                        </span>
                        {product.oldPrice && (
                          <span className="text-gray-400 line-through text-[11px] font-normal">
                            {product.oldPrice.toLocaleString('vi-VN')}đ
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}