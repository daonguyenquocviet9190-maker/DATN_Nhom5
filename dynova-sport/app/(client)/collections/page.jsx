'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function CollectionsPage() {
    const [activeCategory, setActiveCategory] = useState('tatca');

    // Dữ liệu bộ sưu tập
    const collections = [
        {
            id: 1,
            brand: 'Nike',
            name: 'Mercurial',
            category: 'giay',
            img: 'https://images.unsplash.com/photo-1511886929837-354d827aae26?w=600&auto=format&fit=crop&q=80',
        },
        {
            id: 2,
            brand: 'Adidas',
            name: 'Predator',
            category: 'giay',
            img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
        },
        {
            id: 3,
            brand: 'Mizuno',
            name: 'Morelia',
            tagline: 'Japan',
            category: 'giay',
            img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&auto=format&fit=crop&q=80',
        },
        {
            id: 4,
            brand: 'Puma',
            name: 'Future',
            category: 'giay',
            img: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80',
        },
        {
            id: 5,
            brand: 'Nike',
            name: 'Phantom',
            category: 'giay',
            img: 'https://images.unsplash.com/photo-1511886929837-354d827aae26?w=600&auto=format&fit=crop&q=80',
        },
        {
            id: 6,
            brand: 'New Balance',
            name: 'Furon',
            category: 'giay',
            img: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&auto=format&fit=crop&q=80',
        },
        {
            id: 7,
            brand: 'Adidas',
            name: 'Tiro',
            category: 'ao',
            img: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&auto=format&fit=crop&q=80',
        },
        {
            id: 8,
            brand: 'Nike',
            name: 'Dri-FIT ADV',
            category: 'ao',
            img: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600&auto=format&fit=crop&q=80',
        },
        {
            id: 9,
            brand: 'Puma',
            name: 'King',
            tagline: 'Legacy',
            category: 'giay',
            img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
        },
        {
            id: 10,
            brand: 'Nike',
            name: 'Elite Gear Bag',
            category: 'phukien',
            img: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&auto=format&fit=crop&q=80',
        },
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
        <div className="bg-white min-h-screen pb-20">

            {/* 1. HERO BANNER */}
            <section className="relative h-[35vh] md:h-[45vh] bg-blue-950 flex items-center justify-center overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-overlay"
                    style={{ backgroundImage: `url('https://images.unsplash.com/photo-1530549387789-4c1017266635?w=1200&q=80')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-blue-950/50 to-blue-950 z-10" />

                <div className="relative z-20 text-center text-white space-y-4 px-4">
                    <p className="text-orange-500 font-extrabold text-xs uppercase tracking-widest">Khám phá</p>
                    <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight">
                        Bộ sưu tập <span className="text-orange-500">Dynova</span>
                    </h1>
                    <p className="text-sm text-gray-300 max-w-lg mx-auto font-light leading-relaxed">
                        Tổng hợp những dòng sản phẩm nổi bật nhất từ các thương hiệu thể thao hàng đầu, được tuyển chọn riêng cho chiến binh Dynova.
                    </p>
                </div>
            </section>

            {/* 2. FILTER TABS */}
            <section className="container mx-auto px-4 max-w-7xl pt-10">
                <div className="flex justify-center gap-2 text-xs font-bold uppercase tracking-wider flex-wrap">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveCategory(tab.id)}
                            className={`px-5 py-2.5 rounded-full border transition-all ${activeCategory === tab.id
                                    ? 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-500/10'
                                    : 'bg-transparent border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-300'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </section>

            {/* 3. LƯỚI BỘ SƯU TẬP */}
            <section className="container mx-auto px-4 max-w-7xl pt-10">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                    {filteredCollections.map(col => (
                        <Link
                            href={`/collections/${col.id}`}
                            key={col.id}
                            className="group relative bg-gray-100 hover:bg-gray-50 rounded-2xl overflow-hidden h-[340px] md:h-[380px] flex flex-col transition-colors"
                        >
                            <div className="pt-8 px-6 text-center z-10">
                                <p className="text-sm font-black text-gray-900 uppercase tracking-wider">{col.brand}</p>
                                <h3 className="text-lg md:text-2xl font-black text-gray-900 uppercase tracking-tight leading-tight">{col.name}</h3>
                                {col.tagline && (
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mt-1">{col.tagline}</p>
                                )}
                            </div>
                            <div className="absolute bottom-0 left-0 w-full h-48 md:h-56 flex items-end justify-center overflow-hidden">
                                <img
                                    src={col.img}
                                    alt={`${col.brand} ${col.name}`}
                                    className="w-[85%] object-contain group-hover:scale-105 group-hover:-translate-y-1 transition-transform duration-500 drop-shadow-xl"
                                />
                            </div>
                        </Link>
                    ))}
                </div>

                {filteredCollections.length === 0 && (
                    <p className="text-center text-sm text-gray-500 font-light py-16">
                        Chưa có bộ sưu tập nào trong danh mục này.
                    </p>
                )}
            </section>

            {/* 4. CALL TO ACTION */}
            <section className="py-16 bg-blue-950 text-white text-center rounded-3xl max-w-7xl mx-6 xl:mx-auto mt-20 p-8 md:p-12 relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl" />
                <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl" />

                <div className="relative z-10 max-w-2xl mx-auto space-y-6">
                    <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight">Chưa tìm thấy bộ sưu tập yêu thích?</h2>
                    <p className="text-sm text-gray-300 font-light">
                        Khám phá toàn bộ sản phẩm tại cửa hàng Dynova để tìm trang bị phù hợp nhất với phong cách của bạn.
                    </p>
                    <Link
                        href="/shop"
                        className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-8 py-3.5 rounded-sm uppercase tracking-wider transition-all group mx-auto"
                    >
                        Đến cửa hàng ngay <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </section>

        </div>
    );
}