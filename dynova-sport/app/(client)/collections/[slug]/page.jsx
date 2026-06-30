'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Archivo, Inter } from 'next/font/google';
import {
    ArrowUpRight,
    ArrowLeft,
    Zap,
} from 'lucide-react';

const archivo = Archivo({
    subsets: ['latin'],
    weight: ['700', '800', '900'],
    variable: '--font-archivo',
});

const inter = Inter({
    subsets: ['latin'],
    weight: ['400', '500', '600'],
    variable: '--font-inter',
});

// --- MOCK DATA: LỊCH SỬ PHÁT TRIỂN ---
const BRAND_TIMELINE = [
    { year: '2022', title: 'The Genesis', desc: 'Khởi đầu từ một phòng thí nghiệm dệt may độc lập, thử nghiệm các cấu trúc sợi bất đối xứng và chất liệu tái chế.' },
    { year: '2024', title: 'Brutal Shift', desc: 'Chính thức định hình ngôn ngữ thiết kế Neo-Brutalism. Ra mắt bộ sưu tập capsule đầu tiên gây ấn tượng mạnh.' },
    { year: '2026', title: 'Hyper-Function', desc: 'Tích hợp công nghệ techwear vào phom dáng may mặc thô mộc, định vị lại ranh giới giữa thời trang và hiệu năng.' },
];

// --- MOCK DATA: Ô ẢNH QUẦN ÁO (LOOKBOOK ARCHIVE) ---
const LOOKBOOK_IMAGES = [
    { id: '01', tags: ['Oversized', 'Raw Cotton'], img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&q=80' },
    { id: '02', tags: ['Tech Jacket', 'Water Proof'], img: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1200&q=80' },
    { id: '03', tags: ['Deconstructed', 'Denim'], img: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&q=80' },
    { id: '04', tags: ['Minimalist', 'Mono Tone'], img: 'https://images.unsplash.com/photo-1554412933-514a83d2f3c8?w=1200&q=80' },
];

// --- MOCK DATA: SẢN PHẨM BIỂU TƯỢNG (FEATURED PRODUCTS) ---
const FEATURED_PRODUCTS = [
    {
        id: '01',
        name: 'Archive Shell Jacket',
        type: 'Outerwear',
        concept: 'Áo khoác phom hộp thô, sử dụng chất liệu canvas chống thấm xử lý nhiệt bề mặt.',
        img: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=1200&q=80',
    },
    {
        id: '02',
        name: 'Retro V1 Sneaker',
        type: 'Footwear',
        concept: 'Giày thể thao đế thô mộc bọc cao su lưu hóa, mô phỏng lại cấu trúc hình khối kiến trúc.',
        img: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=1200&q=80',
    },
];

export default function CollectionDetailPage({ params }) {
    const resolvedParams = React.use(params);
    const brandSlug = resolvedParams?.slug || 'nike';
    const brandName = brandSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    const [activeEra, setActiveEra] = useState('2026');

    return (
        <div className={`${archivo.variable} ${inter.variable} min-h-screen bg-white text-[#0F0F0F] antialiased`} style={{ fontFamily: 'var(--font-inter)' }}>

            {/* TOP UTILITY BAR */}
            <div className="border-b border-neutral-100 px-6 md:px-10 py-3 flex items-center justify-between text-[11px] font-semibold tracking-[0.15em] uppercase">
                <Link href="/collections" className="flex items-center gap-2 hover:text-[#FF5A1F] transition-colors">
                    <ArrowLeft size={13} /> All Collections
                </Link>
                <span className="text-neutral-400 hidden sm:block">House Archive — Vol. 03</span>
            </div>

            {/* HERO — DIAGONAL ENERGY BLOCK */}
            <section className="relative bg-[#0F0F0F] text-white overflow-hidden">
                <div
                    className="absolute -right-32 -top-32 w-[55%] h-[160%] bg-[#FF5A1F]"
                    style={{ transform: 'skewX(-12deg)' }}
                />
                <div
                    className="absolute -right-14 -top-32 w-[7%] h-[160%] bg-[#FFB088]"
                    style={{ transform: 'skewX(-12deg)' }}
                />

                <div className="relative z-10 px-6 md:px-10 pt-16 pb-20 md:pt-24 md:pb-28 max-w-4xl">
                    <div className="flex items-center gap-2 mb-6">
                        <Zap size={15} className="text-[#FF5A1F] fill-[#FF5A1F]" />
                        <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#FF5A1F]">Brand Dossier</span>
                    </div>
                    <h1
                        className="uppercase leading-[0.88] tracking-tight"
                        style={{ fontFamily: 'var(--font-archivo)', fontWeight: 900, fontSize: 'clamp(2.75rem, 9vw, 6.5rem)' }}
                    >
                        {brandName}
                    </h1>
                    <p className="mt-7 max-w-md text-sm md:text-base text-neutral-300 leading-relaxed font-medium">
                        Không gian lưu trữ nhận diện cốt lõi của {brandName} — nơi giao thoa giữa cấu trúc hình học thô mộc và tư duy tái định nghĩa thời trang đường phố đương đại.
                    </p>
                </div>
            </section>

            {/* TIMELINE */}
            <section className="px-6 md:px-10 py-16 md:py-20 border-b border-neutral-100 max-w-6xl mx-auto">
                <div className="flex items-end justify-between mb-12">
                    <h2 className="uppercase font-extrabold text-2xl md:text-3xl" style={{ fontFamily: 'var(--font-archivo)' }}>
                        Evolution <span className="text-[#FF5A1F]">Timeline</span>
                    </h2>
                    <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-neutral-400 hidden sm:block">2022 — 2026</span>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {BRAND_TIMELINE.map((era) => (
                        <button
                            key={era.year}
                            onClick={() => setActiveEra(era.year)}
                            className={`text-left p-6 md:p-7 border-2 transition-colors ${activeEra === era.year
                                ? 'bg-[#0F0F0F] text-white border-[#0F0F0F]'
                                : 'border-neutral-200 hover:border-[#FF5A1F]'
                                }`}
                        >
                            <div
                                className={`text-3xl mb-4 ${activeEra === era.year ? 'text-[#FF5A1F]' : 'text-[#FF5A1F]'}`}
                                style={{ fontFamily: 'var(--font-archivo)', fontWeight: 900 }}
                            >
                                {era.year}
                            </div>
                            <div className="text-[11px] font-bold tracking-[0.15em] uppercase mb-3 opacity-70">{era.title}</div>
                            <p className="text-[13px] leading-relaxed opacity-80">{era.desc}</p>
                        </button>
                    ))}
                </div>
            </section>

            {/* LOOKBOOK */}
            <section className="px-6 md:px-10 py-16 md:py-20 border-b border-neutral-100 bg-neutral-50 max-w-full">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-end justify-between mb-10">
                        <h2 className="uppercase font-extrabold text-2xl md:text-3xl" style={{ fontFamily: 'var(--font-archivo)' }}>
                            Visual <span className="text-[#FF5A1F]">Lookbook</span>
                        </h2>
                        <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-neutral-400">{LOOKBOOK_IMAGES.length} Looks</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6">
                        {LOOKBOOK_IMAGES.map((item) => (
                            <figure key={item.id} className="group bg-white">
                                <div className="aspect-[3/4] overflow-hidden bg-neutral-200 relative">
                                    <img
                                        src={item.img}
                                        alt={`Look ${item.id}`}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                                    />
                                    <span
                                        className="absolute top-3 left-3 bg-[#FF5A1F] text-white text-[11px] font-extrabold px-2.5 py-1"
                                        style={{ fontFamily: 'var(--font-archivo)' }}
                                    >
                                        {item.id}
                                    </span>
                                </div>
                                <figcaption className="p-3">
                                    <span className="text-[10px] font-bold tracking-wider uppercase text-neutral-500">
                                        {item.tags.join(' / ')}
                                    </span>
                                </figcaption>
                            </figure>
                        ))}
                    </div>
                </div>
            </section>

            {/* FEATURED PRODUCTS */}
            <section className="border-b border-neutral-100 max-w-6xl mx-auto">
                <div className="px-6 md:px-10 pt-16 md:pt-20 pb-10">
                    <span className="text-[11px] font-bold tracking-[0.25em] uppercase text-[#FF5A1F]">Core Pieces</span>
                    <h2
                        className="uppercase mt-3 leading-[0.95]"
                        style={{ fontFamily: 'var(--font-archivo)', fontWeight: 900, fontSize: 'clamp(1.75rem, 5vw, 3.25rem)' }}
                    >
                        Sản phẩm <span className="text-[#FF5A1F]">biểu tượng</span>
                    </h2>
                </div>

                <div className="px-6 md:px-10 pb-16 md:pb-20 grid md:grid-cols-2 gap-6">
                    {FEATURED_PRODUCTS.map((prod) => (
                        <div
                            key={prod.id}
                            className="border-2 border-neutral-200 hover:border-[#0F0F0F] transition-colors p-6 md:p-7 flex flex-col gap-6"
                        >
                            <div className="w-full h-72 overflow-hidden bg-neutral-100 relative">
                                <img
                                    src={prod.img}
                                    alt={prod.name}
                                    className="w-full h-full object-cover hover:scale-[1.05] transition-transform duration-500"
                                />
                                <span
                                    className="absolute top-3 left-3 bg-[#0F0F0F] text-[#FF5A1F] text-[11px] font-extrabold px-2.5 py-1"
                                    style={{ fontFamily: 'var(--font-archivo)' }}
                                >
                                    {prod.id}
                                </span>
                            </div>
                            <div className="space-y-3">
                                <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-neutral-400">{prod.type}</span>
                                <h3
                                    className="uppercase text-xl md:text-2xl leading-tight"
                                    style={{ fontFamily: 'var(--font-archivo)', fontWeight: 800 }}
                                >
                                    {brandName} {prod.name}
                                </h3>
                                <p className="text-[13px] leading-relaxed text-neutral-600">
                                    {prod.concept}
                                </p>
                                <button className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-[#FF5A1F] hover:gap-3 transition-all">
                                    View Lab Specifications <ArrowUpRight size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* MANIFESTO + CONTACT */}
            <section className="grid md:grid-cols-2 bg-[#0F0F0F] text-white divide-y md:divide-y-0 md:divide-x divide-neutral-800">
                <div className="p-8 md:p-12 space-y-5">
                    <span className="text-[11px] font-bold tracking-[0.25em] uppercase text-[#FF5A1F]">Manifesto</span>
                    <h4
                        className="uppercase text-2xl md:text-3xl leading-snug"
                        style={{ fontFamily: 'var(--font-archivo)', fontWeight: 800 }}
                    >
                        Không đại trà.<br />Không thỏa hiệp.
                    </h4>
                    <p className="text-[13px] leading-relaxed text-neutral-400 max-w-sm">
                        Mỗi bộ phục trang gắn mác {brandName} xuất xưởng không hướng đến số đông. Chúng là kết quả của quá trình nghiên cứu cấu trúc hình học nghiêm ngặt để giải phóng cái tôi độc bản.
                    </p>
                </div>
                <div className="p-8 md:p-12 flex flex-col justify-between gap-10">
                    <div className="space-y-3">
                        <span className="text-[11px] font-bold tracking-[0.25em] uppercase text-[#FF5A1F]">Atelier Visit</span>
                        <h4 className="text-lg font-bold" style={{ fontFamily: 'var(--font-archivo)' }}>
                            Ghé thăm phòng thử nghiệm
                        </h4>
                        <p className="text-[13px] text-neutral-400 leading-relaxed max-w-sm">
                            Đặt lịch hẹn trước để trải nghiệm không gian lưu trữ BST mới nhất trực tiếp cùng đội ngũ thiết kế.
                        </p>
                    </div>
                    <Link href="#top" className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#FF5A1F] hover:text-white transition-colors self-start">
                        <ArrowUpRight size={14} /> Back to top
                    </Link>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="px-6 md:px-10 py-5 text-center text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-400 border-t border-neutral-100">
                {brandName} Archive — Internal Ref. ID_v4.26 — 2026
            </footer>
        </div>
    );
}