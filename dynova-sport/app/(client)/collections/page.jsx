'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Be_Vietnam_Pro } from 'next/font/google';
import { ArrowRight, ChevronRight } from 'lucide-react';

// Font hiển thị riêng cho tiêu đề — đồng bộ với trang chủ.
const display = Be_Vietnam_Pro({
    subsets: ['latin', 'vietnamese'],
    weight: ['700', '800', '900'],
    variable: '--font-display',
});

// Khối tiêu đề dùng chung — y hệt SectionHeading ở trang chủ để giữ đồng bộ
// trên toàn site. Nên trích thành component riêng (ví dụ components/SectionHeading.jsx)
// để dùng lại ở mọi trang thay vì khai báo lặp lại như thế này.
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

export default function CollectionsPage() {
    const [activeCategory, setActiveCategory] = useState('tatca');

    // Dữ liệu bộ sưu tập
    const collections = [
        { id: 1, brand: 'Nike', name: 'Mercurial', category: 'giay', desc: 'Tốc độ bùng nổ trên từng bước chạy.', img: 'https://images.unsplash.com/photo-1511886929837-354d827aae26?w=600&auto=format&fit=crop&q=80' },
        { id: 2, brand: 'Adidas', name: 'Predator', category: 'giay', desc: 'Kiểm soát bóng tuyệt đối mọi tình huống.', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80' },
        { id: 3, brand: 'Mizuno', name: 'Morelia', tagline: 'Japan', category: 'giay', desc: 'Tinh hoa thủ công da thật từ Nhật Bản.', img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&auto=format&fit=crop&q=80' },
        { id: 4, brand: 'Puma', name: 'Future', category: 'giay', desc: 'Linh hoạt đổi hướng, bứt tốc bất ngờ.', img: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80' },
        { id: 5, brand: 'Nike', name: 'Phantom', category: 'giay', desc: 'Cảm giác bóng tinh tế, dứt điểm chuẩn xác.', img: 'https://images.unsplash.com/photo-1511886929837-354d827aae26?w=600&auto=format&fit=crop&q=80' },
        { id: 6, brand: 'New Balance', name: 'Furon', category: 'giay', desc: 'Nhẹ, ôm chân, sẵn sàng cho mọi pha nước rút.', img: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&auto=format&fit=crop&q=80' },
        { id: 7, brand: 'Adidas', name: 'Tiro', category: 'ao', desc: 'Phong cách sân cỏ, thoải mái cả ngày dài.', img: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&auto=format&fit=crop&q=80' },
        { id: 8, brand: 'Nike', name: 'Dri-FIT ADV', category: 'ao', desc: 'Công nghệ thấm hút mồ hôi đỉnh cao.', img: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600&auto=format&fit=crop&q=80' },
        { id: 9, brand: 'Puma', name: 'King', tagline: 'Legacy', category: 'giay', desc: 'Di sản huyền thoại được tái sinh.', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80' },
        { id: 10, brand: 'Nike', name: 'Elite Gear Bag', category: 'phukien', desc: 'Gọn gàng, bền chắc cho mọi buổi tập.', img: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&auto=format&fit=crop&q=80' },
    ];

    const tabs = [
        { id: 'tatca', label: 'Tất cả' },
        { id: 'giay', label: 'Giày' },
        { id: 'ao', label: 'Áo' },
        { id: 'phukien', label: 'Phụ kiện' },
    ];

    const filteredCollections =
        activeCategory === 'tatca'
            ? collections
            : collections.filter(col => col.category === activeCategory);

    return (
        <div className={`${display.variable} bg-white min-h-screen pb-24`}>

            {/* 1. HERO BANNER */}
            <section className="relative h-[38vh] md:h-[46vh] bg-blue-950 flex items-center justify-center overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-overlay"
                    style={{ backgroundImage: `url('https://images.unsplash.com/photo-1530549387789-4c1017266635?w=1200&q=80')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-blue-950/50 to-blue-950 z-10" />

                {/* Vệt tốc độ trang trí — đồng bộ với hero trang chủ */}
                <div className="pointer-events-none absolute inset-0 opacity-20 z-10">
                    <div className="absolute top-[20%] -left-10 w-[55%] h-[2px] bg-orange-500 -rotate-[8deg]" />
                    <div className="absolute bottom-[25%] -right-10 w-[45%] h-[2px] bg-emerald-400 -rotate-[8deg]" />
                </div>

                <div className="relative z-20 text-center text-white space-y-4 px-4">
                    {/* Breadcrumb */}
                    <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                        <Link href="/" className="hover:text-orange-400 transition-colors">Trang chủ</Link>
                        <ChevronRight size={12} />
                        <span className="text-orange-400">Bộ sưu tập</span>
                    </div>

                    <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-5xl font-black uppercase tracking-tight">
                        Bộ sưu tập <span className="text-orange-500">Dynova</span>
                    </h1>
                    <p className="text-sm text-gray-300 max-w-lg mx-auto font-light leading-relaxed">
                        Tổng hợp những dòng sản phẩm nổi bật nhất từ các thương hiệu thể thao hàng đầu, được tuyển chọn riêng cho chiến binh Dynova.
                    </p>
                </div>
            </section>

            {/* 2. FILTER TABS */}
            <section className="container mx-auto px-4 max-w-7xl pt-12">
                <div className="flex flex-col items-center gap-6">
                    <div className="flex justify-center gap-2 text-xs font-bold uppercase tracking-wider flex-wrap">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveCategory(tab.id)}
                                className={`px-5 py-2.5 rounded-full border transition-all ${activeCategory === tab.id
                                        ? 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-500/20'
                                        : 'bg-transparent border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-300'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-gray-400 font-light">
                        Đang hiển thị <span className="font-bold text-gray-700">{filteredCollections.length}</span> bộ sưu tập
                    </p>
                </div>
            </section>

            {/* 3. LƯỚI BỘ SƯU TẬP */}
            <section className="container mx-auto px-4 max-w-7xl pt-10">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                    {filteredCollections.map(col => (
                        <Link
                            href={`/collections/${col.id}`}
                            key={col.id}
                            className="group relative bg-gradient-to-b from-gray-50 to-gray-100 hover:from-white hover:to-gray-50 border border-transparent hover:border-orange-500/30 rounded-2xl overflow-hidden h-[360px] md:h-[400px] flex flex-col transition-all motion-safe:hover:-translate-y-1 hover:shadow-xl"
                        >
                            <span className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-blue-950 text-white text-[11px] font-black flex items-center justify-center">
                                {col.brand.charAt(0)}
                            </span>

                            <div className="pt-8 px-5 text-center z-10 space-y-1">
                                <p className="text-sm font-black text-gray-900 uppercase tracking-wider">{col.brand}</p>
                                <h3 className="font-[family-name:var(--font-display)] text-lg md:text-2xl font-extrabold text-gray-900 uppercase tracking-tight leading-tight">{col.name}</h3>
                                {col.tagline && (
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">{col.tagline}</p>
                                )}
                                <p className="text-[11px] text-gray-500 font-light leading-relaxed pt-1 line-clamp-2 px-2">{col.desc}</p>
                            </div>

                            <div className="absolute bottom-0 left-0 w-full h-44 md:h-52 flex items-end justify-center overflow-hidden">
                                <img
                                    src={col.img}
                                    alt={`${col.brand} ${col.name}`}
                                    className="w-[85%] object-contain motion-safe:group-hover:scale-105 motion-safe:group-hover:-translate-y-1 transition-transform duration-500 drop-shadow-xl"
                                />
                            </div>

                            <span className="absolute bottom-4 left-4 z-10 inline-flex items-center gap-1 text-[11px] font-bold text-orange-500 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all">
                                Xem bộ sưu tập <ArrowRight size={11} />
                            </span>
                        </Link>
                    ))}
                </div>

                {filteredCollections.length === 0 && (
                    <div className="text-center py-20 space-y-2">
                        <p className="text-sm text-gray-500 font-light">Chưa có bộ sưu tập nào trong danh mục này.</p>
                        <button
                            onClick={() => setActiveCategory('tatca')}
                            className="text-xs font-bold text-orange-500 hover:underline"
                        >
                            Xem tất cả bộ sưu tập
                        </button>
                    </div>
                )}
            </section>

            {/* 4. CALL TO ACTION */}
            <section className="container mx-auto px-4 max-w-7xl pt-20">
                <div className="relative bg-blue-950 rounded-3xl overflow-hidden p-10 md:p-14 text-center text-white">
                    <div className="pointer-events-none absolute inset-0 opacity-[0.07]">
                        <div className="absolute top-[15%] -left-10 w-[60%] h-px bg-white -rotate-[10deg]" />
                        <div className="absolute bottom-[25%] -right-10 w-[50%] h-px bg-white -rotate-[10deg]" />
                    </div>
                    <div className="absolute -right-14 -top-14 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl" />
                    <div className="absolute -left-14 -bottom-14 w-48 h-48 bg-emerald-400/10 rounded-full blur-3xl" />

                    <div className="relative z-10 max-w-xl mx-auto space-y-5">
                        <p className="text-orange-400 text-[11px] font-bold uppercase tracking-[0.25em]">Chưa tìm thấy bộ sưu tập yêu thích?</p>
                        <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-4xl font-black uppercase tracking-tight">
                            Khám phá toàn bộ <span className="text-orange-500">cửa hàng</span>
                        </h2>
                        <p className="text-sm text-gray-300 font-light leading-relaxed">
                            Hàng trăm sản phẩm quần áo, giày và phụ kiện thể thao cao cấp đang chờ bạn tại Dynova.
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