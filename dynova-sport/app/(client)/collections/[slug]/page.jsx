'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Syne, DM_Mono } from 'next/font/google';
import {
    ArrowUpRight,
    CornerDownRight,
    History,
    Layers,
    Sparkles,
    Maximize2
} from 'lucide-react';

const syne = Syne({
    subsets: ['latin'],
    weight: ['700', '800'],
    variable: '--font-syne',
});

const dmMono = DM_Mono({
    subsets: ['latin'],
    weight: ['400', '500'],
    variable: '--font-mono',
});

// --- MOCK DATA: LỊCH SỬ PHÁT TRIỂN ---
const BRAND_TIMELINE = [
    { year: '2022', title: 'THE GENESIS', desc: 'Khởi đầu từ một phòng thí nghiệm dệt may độc lập, thử nghiệm các cấu trúc sợi bất đối xứng và chất liệu tái chế.' },
    { year: '2024', title: 'BRUTAL SHIFT', desc: 'Chính thức định hình ngôn ngữ thiết kế Neo-Brutalism. Ra mắt bộ sưu tập capsule đầu tiên gây ấn tượng mạnh.' },
    { year: '2026', title: 'HYPER-FUNCTION', desc: 'Tích hợp công nghệ techwear vào phom dáng may mặc thô mộc, định vị lại ranh giới giữa thời trang và hiệu năng.' },
];

// --- MOCK DATA: Ô ẢNH QUẦN ÁO (LOOKBOOK ARCHIVE) ---
const LOOKBOOK_IMAGES = [
    { id: 'LK-01', tags: ['OVERSIZED', 'RAW_COTTON'], img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&q=80' },
    { id: 'LK-02', tags: ['TECH_JACKET', 'WATER_PROOF'], img: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1200&q=80' },
    { id: 'LK-03', tags: ['DECONSTRUCTED', 'DENIM'], img: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&q=80' },
    { id: 'LK-04', tags: ['MINIMALIST', 'MONO_TONE'], img: 'https://images.unsplash.com/photo-1554412933-514a83d2f3c8?w=1200&q=80' },
];

// --- MOCK DATA: SẢN PHẨM BIỂU TƯỢNG (FEATURED PRODUCTS) ---
const FEATURED_PRODUCTS = [
    {
        id: 'CORE-01',
        name: 'ARCHIVE SHELL JACKET / 01',
        type: 'OUTERWEAR',
        concept: 'Áo khoác phom hộp thô, sử dụng chất liệu canvas chống thấm xử lý nhiệt bề mặt.',
        img: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=1200&q=80',
    },
    {
        id: 'CORE-02',
        name: 'RETRO V1 / SNEAKER',
        type: 'FOOTWEAR',
        concept: 'Giày thể thao đế thô mộc bọc cao su lưu hóa, mô phỏng lại cấu trúc hình khối kiến trúc.',
        img: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=1200&q=80',
    },
];

export default function CollectionDetailPage({ params }) {
    // Unwraps params theo chuẩn Next.js 15+ 
    const resolvedParams = React.use(params);
    const brandSlug = resolvedParams?.slug || 'nike';
    const brandName = brandSlug.replace(/-/g, ' ').toUpperCase();

    const [activeEra, setActiveEra] = useState('2026');

    return (
        <div className={`${syne.variable} ${dmMono.variable} min-h-screen bg-[#f3f3f1] font-mono text-black antialiased p-4 md:p-8`}>

            {/* KHUNG VIỀN ĐEN ĐẶC TRƯNG BRUTALISM */}
            <div className="max-w-7xl mx-auto border-[3px] border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">

                {/* HEADER */}
                <header className="border-b-[3px] border-black flex items-center justify-between p-6 bg-yellow-300">
                    <Link href="/collections" className="font-bold uppercase tracking-tighter flex items-center gap-2 text-sm hover:underline">
                        [← BACK TO ALL COLLECTIONS]
                    </Link>
                    <div className="text-xs font-bold uppercase tracking-widest hidden sm:block">
                        COLLECTIONS // {brandName} // IDENTITY HUB
                    </div>
                </header>

                {/* HERO: TÊN THƯƠNG HIỆU & ĐỊNH HƯỚNG */}
                <section className="border-b-[3px] border-black p-6 md:p-12 bg-white relative overflow-hidden">
                    <div className="absolute right-0 top-0 text-[18vw] font-black leading-none opacity-[0.03] select-none pointer-events-none font-sans">
                        {brandName}
                    </div>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                        <div>
                            <span className="text-xs font-bold bg-black text-white px-2 py-1 uppercase">BRAND DNA & ARCHIVE</span>
                            <h1 className="font-sans font-extrabold text-5xl md:text-8xl tracking-tight uppercase leading-none mt-4">
                                {brandName}™
                            </h1>
                        </div>
                        <p className="max-w-md text-sm leading-relaxed font-medium text-neutral-700">
                            <CornerDownRight size={16} className="inline mr-2" />
                            Không gian lưu trữ nhận diện cốt lõi của {brandName}. Nơi giao thoa giữa cấu trúc hình học thô mộc và tư duy tái định nghĩa thời trang đường phố đương đại.
                        </p>
                    </div>
                </section>

                {/* MỤC 1: LỊCH SỬ THƯƠNG HIỆU INTERACTIVE */}
                <section className="border-b-[3px] border-black bg-black text-white p-6 md:p-12">
                    <div className="flex items-center gap-3 mb-8">
                        <History size={20} className="text-yellow-300" />
                        <h2 className="font-sans font-black text-2xl md:text-4xl uppercase tracking-tight">BRAND EVOLUTION TIMELINE</h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {BRAND_TIMELINE.map((era) => (
                            <div
                                key={era.year}
                                onClick={() => setActiveEra(era.year)}
                                className={`border-2 p-6 transition-all cursor-pointer ${activeEra === era.year
                                        ? 'bg-yellow-300 text-black border-yellow-300 shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]'
                                        : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-500'
                                    }`}
                            >
                                <div className="text-3xl font-black mb-2">/{era.year}</div>
                                <div className={`text-xs font-bold uppercase tracking-wider mb-3 ${activeEra === era.year ? 'text-neutral-800' : 'text-yellow-300'}`}>
                                    {era.title}
                                </div>
                                <p className="text-xs leading-relaxed font-medium">
                                    {era.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* MỤC 2: Ô ẢNH QUẦN ÁO (LOOKBOOK IMAGE GRID) */}
                <section className="border-b-[3px] border-black bg-[#f3f3f1]">
                    <div className="p-6 bg-white border-b-[3px] border-black flex justify-between items-center">
                        <div className="flex items-center gap-2 font-bold text-sm uppercase">
                            <Layers size={16} /> VISUAL LOOKBOOK CHRONICLES
                        </div>
                        <span className="text-xs font-bold text-neutral-400">[GRID_MODE: ASYMMETRIC]</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 divide-x-0 divide-y-[3px] md:divide-y-0 md:divide-x-[3px] divide-black border-b-[3px] border-black last:border-b-0">
                        {LOOKBOOK_IMAGES.map((item) => (
                            <div key={item.id} className="bg-white group relative flex flex-col justify-between overflow-hidden">
                                <div className="aspect-[3/4] relative overflow-hidden bg-neutral-200 border-b-[3px] border-black">
                                    <img
                                        src={item.img}
                                        alt={item.id}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    <div className="absolute bottom-2 right-2 bg-black text-white p-1 cursor-pointer hover:bg-yellow-300 hover:text-black transition-colors">
                                        <Maximize2 size={12} />
                                    </div>
                                </div>
                                <div className="p-4 bg-neutral-50 flex flex-col gap-1.5">
                                    <div className="text-[10px] font-bold text-neutral-400">{item.id} // ARCHIVE_LOOK</div>
                                    <div className="flex flex-wrap gap-1">
                                        {item.tags.map(tag => (
                                            <span key={tag} className="text-[9px] font-bold border border-black bg-white px-1">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* MỤC 3: CÁC SẢN PHẨM NỔI BẬT (FEATURED ICONICS) */}
                <section className="bg-white">
                    <div className="p-6 md:p-12 border-b-[3px] border-black bg-yellow-300 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <div className="flex items-center gap-2 text-xs font-bold uppercase text-neutral-900 mb-1">
                                <Sparkles size={14} /> CORE PIECES
                            </div>
                            <h2 className="font-sans font-black text-3xl md:text-5xl uppercase tracking-tight">SẢN PHẨM BIỂU TƯỢNG</h2>
                        </div>
                        <p className="max-w-xs text-xs font-bold text-neutral-800 leading-normal">
                            Những thiết kế cốt lõi mang tính nền tảng, định hình rõ rệt nhất phom dáng và ngôn ngữ thiết kế của {brandName}.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 divide-y-[3px] md:divide-y-0 md:divide-x-[3px] divide-black">
                        {FEATURED_PRODUCTS.map((prod) => (
                            <div key={prod.id} className="p-6 md:p-12 flex flex-col md:flex-row gap-8 items-center bg-white group hover:bg-neutral-50 transition-colors">
                                <div className="w-full md:w-48 h-64 shrink-0 border-[3px] border-black bg-neutral-100 overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    <img
                                        src={prod.img}
                                        alt={prod.name}
                                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                                    />
                                </div>
                                <div className="flex flex-col justify-between h-full space-y-4">
                                    <div>
                                        <span className="text-[10px] font-bold bg-black text-white px-2 py-0.5 tracking-wider uppercase">
                                            {prod.type} // {prod.id}
                                        </span>
                                        <h3 className="font-sans font-black text-xl uppercase tracking-tight mt-2 leading-tight group-hover:text-yellow-600 transition-colors">
                                            {brandName} {prod.name}
                                        </h3>
                                        <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
                                            {prod.concept}
                                        </p>
                                    </div>
                                    <div>
                                        <button className="flex items-center gap-2 text-xs font-bold uppercase underline tracking-wider hover:text-yellow-500">
                                            VIEW LAB SPECIFICATIONS <ArrowUpRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* TRIẾT LÝ VÀ LIÊN HỆ */}
                <section className="border-t-[3px] border-black grid md:grid-cols-2 bg-black text-white divide-y-[3px] md:divide-y-0 md:divide-x-[3px] divide-black">
                    <div className="p-8 space-y-4">
                        <span className="text-xs bg-yellow-300 text-black px-2 py-0.5 font-bold">MANIFESTO</span>
                        <h4 className="font-sans font-extrabold text-2xl uppercase tracking-tight">KHÔNG ĐẠI TRÀ. KHÔNG THỎA HIỆP.</h4>
                        <p className="text-xs text-neutral-400 leading-relaxed">
                            Mỗi bộ phục trang gắn mác {brandName} xuất xưởng không hướng đến số đông. Chúng là kết quả của quá trình nghiên cứu cấu trúc hình học nghiêm ngặt để giải phóng cái tôi độc bản.
                        </p>
                    </div>
                    <div className="p-8 flex flex-col justify-between items-start gap-6 bg-neutral-900">
                        <div className="space-y-2">
                            <span className="text-xs bg-white text-black px-2 py-0.5 font-bold">CONTACT & ATELIER</span>
                            <h4 className="font-sans font-extrabold text-lg uppercase">GHE THĂM PHÒNG THỬ NGHIỆM</h4>
                            <p className="text-xs text-neutral-400">Đặt lịch hẹn trước để trải nghiệm không gian lưu trữ BST mới nhất trực tiếp cùng đội ngũ thiết kế.</p>
                        </div>
                        <Link href="#top" className="text-xs font-bold uppercase underline hover:text-yellow-300">
                            [↑ BACK TO TOP OF CONSOLE]
                        </Link>
                    </div>
                </section>

                {/* FOOTER */}
                <footer className="border-t-[3px] border-black p-6 bg-yellow-300 text-center font-bold text-xs uppercase tracking-wider">
                    {brandName} CORE STATIONS // INTERNAL_ID: ID_v4.26 // CURRENT_YEAR: 2026
                </footer>
            </div>
        </div>
    );
}