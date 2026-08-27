'use client';
import React, { useState } from 'react';
import Link from 'next/link'; // Import Link từ next/link để chuyển trang hiệu quả
import { Calendar, ArrowRight, Search, Clock } from 'lucide-react';

const ALL_NEWS = [
  {
    id: 1,
    title: 'HYROX Là Gì? Hướng Dẫn Trang Bị Tập HYROX Cho Người Mới Bắt Đầu',
    excerpt: 'Hyrox đang trở thành làn sóng thể thao mới càn quét khắp thế giới. Để chuẩn bị tốt nhất cho các bài tập cường độ cao này, việc lựa chọn đúng trang phục co giãn và giày có độ bám tốt là yếu tố sống còn...',
    category: 'Xu hướng',
    date: '15/06/2026',
    author: 'Admin Dynova',
    readTime: '5 phút đọc',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&q=80',
    featured: true // Bài viết nổi bật to ở đầu trang
  },
  {
    id: 2,
    title: 'Giày Chạy Đua UA Velociti Elite: Bí Quyết Chinh Phục Kỷ Lục Marathon',
    excerpt: 'Khám phá công nghệ đệm carbon siêu nhẹ giúp các runner tăng tốc tối đa và bảo vệ cổ chân tuyệt đối trên những cung đường chạy dài.',
    category: 'Kiến thức chuyên môn',
    date: '12/06/2026',
    author: 'Minh Trí',
    readTime: '4 phút đọc',
    image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=500&q=80'
  },
  {
    id: 3,
    title: 'Quần Bó Cơ Là Gì? 5 Lợi Ích Không Thể Bỏ Qua Của Quần Bó Cơ Trong Tập Luyện',
    excerpt: 'Không chỉ là món đồ thời trang, quần bó cơ (Compression) giúp tăng cường lưu thông máu, giảm rách cơ và tăng tốc độ hồi phục sau những buổi squat căng thẳng.',
    category: 'Mẹo thời trang',
    date: '10/06/2026',
    author: 'Hoàng Anh',
    readTime: '6 phút đọc',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500&q=80'
  },
  {
    id: 4,
    title: 'TOP 5 Giày Đá Bóng Đáng Mua Nhất Dành Cho Sân Cỏ Nhân Tạo',
    excerpt: 'Điểm mặt những chiến binh sân cỏ có thiết kế đinh TF bám sân cực tốt, hỗ trợ kiểm soát bóng và dứt điểm chuẩn xác đang làm mưa làm gió hiện nay.',
    category: 'Xu hướng',
    date: '08/06/2026',
    author: 'Khánh Nam',
    readTime: '4 phút đọc',
    image: 'https://motstore.vn/wp-content/uploads/2026/02/mau-giay-da-bong-san-co-nhan-tao-eda63d.webp'
  },
  {
    id: 5,
    title: 'Dynova Đồng Hành Cùng Giải Chạy Marathon Quốc Tế TP.HCM 2026',
    excerpt: 'Là nhà tài trợ trang phục độc quyền, Dynova Sport cam kết mang lại những chiếc áo chạy mát lạnh sử dụng công nghệ Pro-Dry thế hệ mới nhất.',
    category: 'Khuyến mãi',
    date: '05/06/2026',
    author: 'Tin Tức Dynova',
    readTime: '3 phút đọc',
    image: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=500&q=80'
  },
  {
    id: 6,
    title: 'Bí Quyết Phối Đồ Tập Gym Vừa Đẹp Vừa Khỏe Khoắn Cho Cả Nam Và Nữ',
    excerpt: 'Bỏ túi ngay các mẹo mix-match màu sắc và lựa chọn chất liệu vải thông minh giúp bạn luôn nổi bật và tràn đầy năng lượng tự tin tại phòng tập.',
    category: 'Mẹo thời trang',
    date: '01/06/2026',
    author: 'Thùy Linh',
    readTime: '4 phút đọc',
    image: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=500&q=80'
  }
];

const TABS = ['Tất cả', 'Xu hướng', 'Khuyến mãi', 'Mẹo thời trang', 'Kiến thức chuyên môn'];

export default function NewsPage() {
  const [activeTab, setActiveTab] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');

  const featuredPost = ALL_NEWS.find(post => post.featured);

  const filteredNews = ALL_NEWS.filter(post => {
    const matchesTab = activeTab === 'Tất cả' || post.category === activeTab;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch && !post.featured;
  });

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4 md:px-12">
<div className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <p className="text-sm text-gray-500">Trang chủ / <span className="text-orange-500 font-medium">Tin tức</span></p>
          <h1 className="text-3xl font-black text-blue-950 mt-2 uppercase tracking-wide">TIN TỨC THỜI TRANG & THỂ THAO</h1>
        </div>
<div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Tìm kiếm bài viết..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-full py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-orange-500 transition-colors shadow-sm"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>
      </div>
<div className="max-w-7xl mx-auto mb-12 flex items-center gap-3 overflow-x-auto pb-3 scrollbar-none">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider border transition-all ${activeTab === tab
                ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="max-w-7xl mx-auto space-y-16">
{featuredPost && (activeTab === 'Tất cả' || featuredPost.category === activeTab) && searchQuery === '' && (
          <Link
            href={`/news/${featuredPost.id}`}
            className="block bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 grid grid-cols-1 lg:grid-cols-12 group cursor-pointer"
          >
            <div className="lg:col-span-7 h-[300px] md:h-[450px] overflow-hidden bg-gray-100 relative">
              <img
                src={featuredPost.image}
                alt={featuredPost.title}
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700"
              />
              <span className="absolute top-4 left-4 bg-orange-500 text-white font-extrabold text-[10px] uppercase tracking-widest px-3 py-1 rounded-sm">
                Bài viết nổi bật
              </span>
            </div>

            <div className="lg:col-span-5 p-8 md:p-12 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase text-orange-500 tracking-wider bg-orange-50 px-2.5 py-1 rounded-md">{featuredPost.category}</span>
                <h2 className="text-xl md:text-2xl font-black text-blue-950 group-hover:text-orange-500 transition-colors leading-tight">
                  {featuredPost.title}
                </h2>
                <p className="text-sm text-gray-500 font-light leading-relaxed line-clamp-4">
                  {featuredPost.excerpt}
                </p>
              </div>
<div className="flex items-center justify-between pt-6 border-t border-gray-100 text-xs text-gray-400 font-medium">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1"><Calendar size={14} /> {featuredPost.date}</span>
                  <span className="flex items-center gap-1"><Clock size={14} /> {featuredPost.readTime}</span>
                </div>
                <span className="text-gray-900 font-bold flex items-center gap-1 group-hover:text-orange-500 transition-colors">
                  Đọc ngay <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </div>
          </Link>
        )}
<div>
          {searchQuery !== '' && <h3 className="text-gray-600 font-semibold mb-6">Kết quả tìm kiếm cho: "{searchQuery}"</h3>}

          {filteredNews.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center text-gray-500">
              Không tìm thấy bài viết nào phù hợp với bộ lọc hiện tại.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredNews.map((post) => (
                <Link
                  key={post.id}
                  href={`/news/${post.id}`}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 group cursor-pointer flex flex-col justify-between"
                >
<div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute bottom-3 left-3 bg-blue-950/80 text-white backdrop-blur-sm text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                      {post.category}
                    </span>
                  </div>
<div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-bold text-gray-800 text-base line-clamp-2 group-hover:text-orange-500 transition-colors leading-snug min-h-[2.75rem]">
                        {post.title}
                      </h3>
                      <p className="text-xs text-gray-400 font-light line-clamp-3 leading-relaxed">
                        {post.excerpt}
                      </p>
                    </div>
<div className="flex items-center justify-between pt-4 border-t border-gray-50 text-[11px] text-gray-400 font-medium">
                      <span className="flex items-center gap-1"><Calendar size={12} /> {post.date}</span>
                      <span className="text-gray-900 font-bold flex items-center gap-1 group-hover:text-orange-500 transition-colors">
                        Xem chi tiết <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}