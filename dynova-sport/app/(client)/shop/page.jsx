'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { SlidersHorizontal, ChevronDown, Eye, ShoppingBag, Heart } from 'lucide-react';

// Mảng dữ liệu dùng chung (Đồng bộ với trang chi tiết)
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

  // Bộ lọc logic sản phẩm
  const filteredProducts = DUMMY_PRODUCTS.filter(product => {
    const matchCategory = selectedCategory === 'Tất cả' || product.category === selectedCategory;
    const matchPrice = product.price <= priceRange;
    return matchCategory && matchPrice;
  });

  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4 md:px-12">
      {/* Breadcrumb & Header */}
      <div className="mb-8">
        <p className="text-sm text-gray-500">Trang chủ / <span className="text-orange-500 font-medium">Sản phẩm</span></p>
        <h1 className="text-3xl font-bold text-gray-900 mt-2 uppercase tracking-wide">Danh sách sản phẩm</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* SIDEBAR: BỘ LỌC (FILTER) */}
        <div className="w-full lg:w-1/4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
          <div className="flex items-center gap-2 pb-4 mb-6 border-b border-gray-100">
            <SlidersHorizontal className="w-5 h-5 text-orange-500" />
            <h2 className="font-bold text-lg text-gray-800">Bộ lọc tìm kiếm</h2>
          </div>

          {/* Lọc theo danh mục */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-3">Danh mục</h3>
            <div className="space-y-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${selectedCategory === cat
                      ? 'bg-orange-500 text-white font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Lọc theo giá */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-3">Khoảng giá (VND)</h3>
            <input
              type="range"
              min="100000"
              max="2000000"
              step="50000"
              value={priceRange}
              onChange={(e) => setPriceRange(Number(e.target.value))}
              className="w-full accent-orange-500 cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2 font-medium">
              <span>100.000đ</span>
              <span className="text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">Dưới {priceRange.toLocaleString('vi-VN')}đ</span>
            </div>
          </div>
        </div>

        {/* CONTAINER CHÍNH: DANH SÁCH SẢN PHẨM */}
        <div className="w-full lg:w-3/4">
          {/* Thanh công cụ sắp xếp trên đầu */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap justify-between items-center gap-4 mb-6">
            <p className="text-sm text-gray-600 font-medium">
              Hiển thị <span className="text-orange-500 font-bold">{filteredProducts.length}</span> sản phẩm
            </p>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Sắp xếp:</span>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 pr-8 font-medium text-gray-700 focus:outline-none focus:border-orange-500 cursor-pointer text-sm"
                  >
                    <option value="newest">Mới nhất</option>
                    <option value="price-asc">Giá: Thấp đến Cao</option>
                    <option value="price-desc">Giá: Cao đến Thấp</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Lưới hiển thị sản phẩm */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center text-gray-500">
              Không tìm thấy sản phẩm nào phù hợp với bộ lọc hiện tại.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 group relative flex flex-col justify-between"
                >
                  {/* Ảnh sản phẩm + Liên kết sang trang chi tiết bằng ID */}
                  <Link href={`/shop/product/${product.id}`} className="relative aspect-square bg-gray-100 overflow-hidden block">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Badges */}
                    {product.isNew && (
                      <span className="absolute top-3 left-3 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm z-10">
                        New
                      </span>
                    )}
                    {product.tag && (
                      <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm z-10">
                        {product.tag}
                      </span>
                    )}

                    {/* Lớp phủ chức năng khi hover */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 z-20">
                      <button className="p-3 bg-white hover:bg-orange-500 hover:text-white text-gray-700 rounded-full shadow-lg transition-colors duration-200" title="Xem nhanh">
                        <Eye className="w-5 h-5" />
                      </button>
                      <button className="p-3 bg-white hover:bg-orange-500 hover:text-white text-gray-700 rounded-full shadow-lg transition-colors duration-200" title="Thêm vào giỏ hàng">
                        <ShoppingBag className="w-5 h-5" />
                      </button>
                      <button className="p-3 bg-white hover:bg-orange-500 hover:text-white text-gray-700 rounded-full shadow-lg transition-colors duration-200" title="Yêu thích">
                        <Heart className="w-5 h-5" />
                      </button>
                    </div>
                  </Link>

                  {/* Thông tin sản phẩm */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-xs text-orange-500 uppercase font-semibold tracking-wider mb-1">{product.category}</p>
                      <Link href={`/shop/product/${product.id}`}>
                        <h3 className="font-semibold text-gray-800 group-hover:text-orange-500 transition-colors line-clamp-2 text-sm md:text-base min-h-[3rem] cursor-pointer">
                          {product.name}
                        </h3>
                      </Link>
                    </div>

                    {/* Giá tiền */}
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-50">
                      <span className="text-orange-600 font-bold text-lg">
                        {product.price.toLocaleString('vi-VN')}đ
                      </span>
                      {product.oldPrice && (
                        <span className="text-gray-400 line-through text-xs">
                          {product.oldPrice.toLocaleString('vi-VN')}đ
                        </span>
                      )}
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