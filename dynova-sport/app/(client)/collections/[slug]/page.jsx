'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Fraunces, DM_Mono } from 'next/font/google';
import {
    ArrowUpRight,
    ArrowLeft,
    Plus,
} from 'lucide-react';

const fraunces = Fraunces({
    subsets: ['latin'],
    weight: ['400', '500', '600'],
    style: ['normal', 'italic'],
    variable: '--font-fraunces',
});

const dmMono = DM_Mono({
    subsets: ['latin'],
    weight: ['400', '500'],
    variable: '--font-mono',
});

// --- MOCK DATA: LỊCH SỬ PHÁT TRIỂN ---
const BRAND_TIMELINE = [
    { year: '2022', title: 'The Genesis', desc: 'Khởi đầu từ một phòng thí nghiệm dệt may độc lập, thử nghiệm các cấu trúc sợi bất đối xứng và chất liệu tái chế.' },
    { year: '2024', title: 'Brutal Shift', desc: 'Chính thức định hình ngôn ngữ thiết kế Neo-Brutalism. Ra mắt bộ sưu tập capsule đầu tiên gây ấn tượng mạnh.' },
    { year: '2026', title: 'Hyper-Function', desc: 'Tích hợp công nghệ techwear vào phom dáng may mặc thô mộc, định vị lại ranh giới giữa thời trang và hiệu năng.' },
];

// --- MOCK DATA: Ô ẢNH QUẦN ÁO (LOOKBOOK ARCHIVE) ---
const LOOKBOOK_IMAGES = [
    { id: 'I', tags: ['Oversized', 'Raw Cotton'], img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&q=80' },
    { id: 'II', tags: ['Tech Jacket', 'Water Proof'], img: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1200&q=80' },
    { id: 'III', tags: ['Deconstructed', 'Denim'], img: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&q=80' },
    { id: 'IV', tags: ['Minimalist', 'Mono Tone'], img: 'https://images.unsplash.com/photo-1554412933-514a83d2f3c8?w=1200&q=80' },
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
        <div className={`${fraunces.variable} ${dmMono.variable} min-h-screen bg-white text-[#1B1B16] antialiased`} style={{ fontFamily: 'var(--font-mono)' }}>

            {/* TOP UTILITY BAR */}
            <div className="border-b border-[#E5E2D9] px-6 md:px-10 py-3 flex items-center justify-between text-[11px] tracking-[0.15em] uppercase">
                <Link href="/collections" className="flex items-center gap-2 hover:text-[#9C7C3C] transition-colors">
                    <ArrowLeft size={13} /> All Collections
                </Link>
                <span className="text-[#9C988A] hidden sm:block">House Archive — Vol. 03</span>
            </div>

            {/* HERO */}
            <section className="relative px-6 md:px-10 pt-16 pb-20 md:pt-24 md:pb-28 border-b border-[#E5E2D9] overflow-hidden">
                {/* vertical signature mark */}
                <div className="hidden lg:flex absolute right-10 top-24 bottom-10 items-center">
                    <span
                        className="text-[11px] tracking-[0.3em] uppercase text-[#9C7C3C]"
                        style={{ writingMode: 'vertical-rl' }}
                    >
                        Archive No. {brandSlug.slice(0, 2).toUpperCase()}—26
                    </span>
                </div>

                <div className="max-w-4xl">
                    <span className="text-[11px] tracking-[0.25em] uppercase text-[#9C7C3C]">Brand Dossier</span>
                    <h1
                        className="mt-6 leading-[0.92] tracking-tight"
                        style={{ fontFamily: 'var(--font-fraunces)', fontWeight: 500, fontSize: 'clamp(3rem, 9vw, 7rem)' }}
                    >
                        {brandName}
                    </h1>
                    <p
                        className="mt-8 max-w-lg text-[15px] leading-relaxed italic text-[#5C5C50]"
                        style={{ fontFamily: 'var(--font-fraunces)' }}
                    >
                        Không gian lưu trữ nhận diện cốt lõi của {brandName} — nơi giao thoa giữa cấu trúc hình học thô mộc và tư duy tái định nghĩa thời trang đường phố đương đại.
                    </p>
                </div>
            </section>

            {/* TIMELINE */}
            <section className="px-6 md:px-10 py-16 md:py-20 border-b border-[#E5E2D9]">
                <div className="flex items-baseline justify-between mb-12">
                    <h2 style={{ fontFamily: 'var(--font-fraunces)', fontStyle: 'italic', fontWeight: 500 }} className="text-2xl md:text-3xl">
                        Evolution Timeline
                    </h2>
                    <span className="text-[11px] tracking-[0.2em] uppercase text-[#9C988A]">2022 — 2026</span>
                </div>

                <div className="grid md:grid-cols-3 border-t border-[#E5E2D9]">
                    {BRAND_TIMELINE.map((era) => (
                        <button
                            key={era.year}
                            onClick={() => setActiveEra(era.year)}
                            className={`text-left p-6 md:p-8 border-b md:border-b-0 md:border-r last:border-r-0 border-[#E5E2D9] transition-colors ${activeEra === era.year ? 'bg-[#1B1B16] text-white' : 'hover:bg-[#FAF9F6]'
                                }`}
                        >
                            <div
                                className={`text-4xl mb-4 ${activeEra === era.year ? 'text-[#C9A24B]' : 'text-[#9C7C3C]'}`}
                                style={{ fontFamily: 'var(--font-fraunces)', fontStyle: 'italic' }}
                            >
                                {era.year}
                            </div>
                            <div className="text-[11px] tracking-[0.2em] uppercase mb-3 opacity-70">{era.title}</div>
                            <p className="text-[13px] leading-relaxed opacity-80">{era.desc}</p>
                        </button>
                    ))}
                </div>
            </section>

            {/* LOOKBOOK */}
            <section className="px-6 md:px-10 py-16 md:py-20 border-b border-[#E5E2D9]">
                <div className="flex items-baseline justify-between mb-10">
                    <h2 style={{ fontFamily: 'var(--font-fraunces)', fontStyle: 'italic', fontWeight: 500 }} className="text-2xl md:text-3xl">
                        Visual Lookbook
                    </h2>
                    <span className="text-[11px] tracking-[0.2em] uppercase text-[#9C988A]">{LOOKBOOK_IMAGES.length} Plates</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                    {LOOKBOOK_IMAGES.map((item, i) => (
                        <figure key={item.id} className={`group ${i % 2 === 1 ? 'md:mt-10' : ''}`}>
                            <div className="aspect-[3/4] overflow-hidden bg-[#F2F0EA]">
                                <img
                                    src={item.img}
                                    alt={`Plate ${item.id}`}
                                    className="w-full h-full object-cover grayscale-[15%] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-[1.03]"
                                />
                            </div>
                            <figcaption className="mt-3 flex items-start justify-between gap-2">
                                <span
                                    className="text-sm italic text-[#9C7C3C]"
                                    style={{ fontFamily: 'var(--font-fraunces)' }}
                                >
                                    Plate {item.id}
                                </span>
                                <span className="text-[10px] tracking-wider uppercase text-[#9C988A] text-right">
                                    {item.tags.join(' / ')}
                                </span>
                            </figcaption>
                        </figure>
                    ))}
                </div>
            </section>

            {/* FEATURED PRODUCTS */}
            <section className="border-b border-[#E5E2D9]">
                <div className="px-6 md:px-10 pt-16 md:pt-20 pb-10">
                    <span className="text-[11px] tracking-[0.25em] uppercase text-[#9C7C3C]">Core Pieces</span>
                    <h2
                        className="mt-3 leading-[0.95]"
                        style={{ fontFamily: 'var(--font-fraunces)', fontWeight: 500, fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
                    >
                        Sản phẩm biểu tượng
                    </h2>
                </div>

                <div className="border-t border-[#E5E2D9]">
                    {FEATURED_PRODUCTS.map((prod, idx) => (
                        <div
                            key={prod.id}
                            className={`flex flex-col md:flex-row gap-10 md:gap-16 items-center px-6 md:px-10 py-12 md:py-16 ${idx !== FEATURED_PRODUCTS.length - 1 ? 'border-b border-[#E5E2D9]' : ''
                                } ${idx % 2 === 1 ? 'md:flex-row-reverse' : ''}`}
                        >
                            <div className="w-full md:w-72 h-80 shrink-0 overflow-hidden bg-[#F2F0EA]">
                                <img
                                    src={prod.img}
                                    alt={prod.name}
                                    className="w-full h-full object-cover hover:scale-[1.04] transition-transform duration-700"
                                />
                            </div>
                            <div className="flex-1 space-y-5">
                                <div className="flex items-center gap-3 text-[11px] tracking-[0.2em] uppercase text-[#9C988A]">
                                    <span style={{ fontFamily: 'var(--font-fraunces)', fontStyle: 'italic' }} className="text-2xl text-[#9C7C3C] mr-1">
                                        {prod.id}
                                    </span>
                                    {prod.type}
                                </div>
                                <h3
                                    className="text-3xl md:text-4xl leading-tight"
                                    style={{ fontFamily: 'var(--font-fraunces)', fontWeight: 500 }}
                                >
                                    {brandName} <span className="italic text-[#9C7C3C]">{prod.name}</span>
                                </h3>
                                <p className="text-[14px] leading-relaxed text-[#5C5C50] max-w-md">
                                    {prod.concept}
                                </p>
                                <button className="flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase border-b border-[#1B1B16] pb-1 hover:text-[#9C7C3C] hover:border-[#9C7C3C] transition-colors">
                                    View Lab Specifications <ArrowUpRight size={13} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* MANIFESTO + CONTACT */}
            <section className="grid md:grid-cols-2 bg-[#1B1B16] text-[#F2EEE6]">
                <div className="p-8 md:p-12 space-y-5 md:border-r border-[#3A3A30]">
                    <span className="text-[11px] tracking-[0.25em] uppercase text-[#C9A24B]">Manifesto</span>
                    <h4
                        className="text-2xl md:text-3xl leading-snug"
                        style={{ fontFamily: 'var(--font-fraunces)', fontStyle: 'italic', fontWeight: 500 }}
                    >
                        Không đại trà.<br />Không thỏa hiệp.
                    </h4>
                    <p className="text-[13px] leading-relaxed text-[#A8A496] max-w-sm">
                        Mỗi bộ phục trang gắn mác {brandName} xuất xưởng không hướng đến số đông. Chúng là kết quả của quá trình nghiên cứu cấu trúc hình học nghiêm ngặt để giải phóng cái tôi độc bản.
                    </p>
                </div>
                <div className="p-8 md:p-12 flex flex-col justify-between gap-10">
                    <div className="space-y-3">
                        <span className="text-[11px] tracking-[0.25em] uppercase text-[#C9A24B]">Atelier Visit</span>
                        <h4 className="text-lg" style={{ fontFamily: 'var(--font-fraunces)', fontWeight: 500 }}>
                            Ghé thăm phòng thử nghiệm
                        </h4>
                        <p className="text-[13px] text-[#A8A496] leading-relaxed max-w-sm">
                            Đặt lịch hẹn trước để trải nghiệm không gian lưu trữ BST mới nhất trực tiếp cùng đội ngũ thiết kế.
                        </p>
                    </div>
                    <Link href="#top" className="inline-flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase hover:text-[#C9A24B] transition-colors self-start">
                        <Plus size={13} /> Back to top
                    </Link>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="px-6 md:px-10 py-5 text-center text-[10px] tracking-[0.2em] uppercase text-[#9C988A] border-t border-[#E5E2D9]">
                {brandName} Archive — Internal Ref. ID_v4.26 — 2026
            </footer>
        </div>
    );
}