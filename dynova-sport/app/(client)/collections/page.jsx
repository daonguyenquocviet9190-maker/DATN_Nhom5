'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Archivo, Inter } from 'next/font/google';
import {
  ArrowUpRight,
  ArrowLeft,
  Zap,
  Layers,
  Palette,
  Ruler,
  Sparkles,
  CalendarClock,
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

/* ====================================================================
   DỮ LIỆU THƯƠNG HIỆU (5 brand — dùng layout "Archive")
==================================================================== */
const BRAND_DATA = {
  nike: { name: 'Nike', slogan: 'Just Do It', heroImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1600&q=80' },
  adidas: { name: 'Adidas', slogan: 'Impossible Is Nothing', heroImage: 'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=1600&q=80' },
  puma: { name: 'Puma', slogan: 'Forever Faster', heroImage: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=1600&q=80' },
  'new-balance': { name: 'New Balance', slogan: 'We Got Now', heroImage: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=1600&q=80' },
  asics: { name: 'Asics', slogan: 'Sound Mind, Sound Body', heroImage: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=1600&q=80' },
};

const BRAND_TIMELINE = [
  { year: '2022', title: 'The Genesis', desc: 'Khởi đầu từ một phòng thí nghiệm dệt may độc lập, thử nghiệm các cấu trúc sợi bất đối xứng và chất liệu tái chế.' },
  { year: '2024', title: 'Brutal Shift', desc: 'Chính thức định hình ngôn ngữ thiết kế Neo-Brutalism. Ra mắt bộ sưu tập capsule đầu tiên gây ấn tượng mạnh.' },
  { year: '2026', title: 'Hyper-Function', desc: 'Tích hợp công nghệ techwear vào phom dáng may mặc thô mộc, định vị lại ranh giới giữa thời trang và hiệu năng.' },
];

const BRAND_LOOKBOOK = [
  { id: '01', tags: ['Oversized', 'Raw Cotton'], img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&q=80' },
  { id: '02', tags: ['Tech Jacket', 'Water Proof'], img: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1200&q=80' },
  { id: '03', tags: ['Deconstructed', 'Denim'], img: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&q=80' },
  { id: '04', tags: ['Minimalist', 'Mono Tone'], img: 'https://images.unsplash.com/photo-1554412933-514a83d2f3c8?w=1200&q=80' },
];

const BRAND_PRODUCTS = [
  { id: '01', name: 'Archive Shell Jacket', type: 'Outerwear', concept: 'Áo khoác phom hộp thô, sử dụng chất liệu canvas chống thấm xử lý nhiệt bề mặt.', img: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=1200&q=80' },
  { id: '02', name: 'Retro V1 Sneaker', type: 'Footwear', concept: 'Giày thể thao đế thô mộc bọc cao su lưu hóa, mô phỏng lại cấu trúc hình khối kiến trúc.', img: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=1200&q=80' },
];

/* ====================================================================
   DỮ LIỆU 4 BỘ SƯU TẬP THEO MÙA — dùng layout "Seasonal Drop"
==================================================================== */
const SEASON_DATA = {
  'xuan-he-2026': {
    title: 'Xuân/Hè 2026',
    tagline: 'Light Structure',
    dateRange: 'Tháng 03 — Tháng 08, 2026',
    dropType: 'Full Collection',
    limited: false,
    heroImage: 'https://images.unsplash.com/photo-1483721310020-03333e577078?w=1600&q=80',
    description: 'Bộ sưu tập tập trung vào chất liệu siêu nhẹ, khả năng thoát ẩm vượt trội và bảng màu tươi sáng lấy cảm hứng từ ánh nắng nhiệt đới.',
    highlights: [
      { icon: Layers, label: 'Chất liệu', value: 'Mesh tái chế & Cotton siêu nhẹ' },
      { icon: Palette, label: 'Bảng màu', value: 'Cam san hô, Trắng kem, Xanh biển nhạt' },
      { icon: Ruler, label: 'Phom dáng', value: 'Relaxed-fit, đường cắt thoáng khí' },
      { icon: Sparkles, label: 'Công nghệ', value: 'Pro-Dry thoát ẩm nhanh 40%' },
    ],
    lookbook: [
      { id: '01', tags: ['Mesh Tee', 'Coral'], img: 'https://images.unsplash.com/photo-1483721310020-03333e577078?w=1200&q=80' },
      { id: '02', tags: ['Light Shorts'], img: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=1200&q=80' },
      { id: '03', tags: ['Trail Runner'], img: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=1200&q=80' },
      { id: '04', tags: ['Sun Cap'], img: 'https://images.unsplash.com/photo-1517438476312-10d79c077509?w=1200&q=80' },
    ],
    products: [
      { id: '01', name: 'Coral Mesh Tee', type: 'Top', concept: 'Áo thun dệt mesh 3 lớp, tối ưu khả năng thoát ẩm khi vận động cường độ cao.', img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&q=80' },
      { id: '02', name: 'Light Trail Shorts', type: 'Bottom', concept: 'Quần short siêu nhẹ, lớp lót chống cọ xát, phù hợp chạy bộ ngày nắng.', img: 'https://images.unsplash.com/photo-1483721310020-03333e577078?w=1200&q=80' },
    ],
  },
  'thu-dong-2026': {
    title: 'Thu/Đông 2026',
    tagline: 'Heavy Layering',
    dateRange: 'Tháng 09, 2026 — Tháng 02, 2027',
    dropType: 'Full Collection',
    limited: false,
    heroImage: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1600&q=80',
    description: 'Layering ấm áp, tông trầm cùng chất liệu giữ nhiệt vượt trội — thiết kế cho những ngày nhiệt độ xuống thấp.',
    highlights: [
      { icon: Layers, label: 'Chất liệu', value: 'Fleece cách nhiệt & Wool blend' },
      { icon: Palette, label: 'Bảng màu', value: 'Than chì, Nâu đất, Đen tuyền' },
      { icon: Ruler, label: 'Phom dáng', value: 'Oversized, tối ưu để layering' },
      { icon: Sparkles, label: 'Công nghệ', value: 'Thermo-Loft giữ ấm tới -10°C' },
    ],
    lookbook: [
      { id: '01', tags: ['Thermo Parka'], img: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1200&q=80' },
      { id: '02', tags: ['Wool Joggers'], img: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=1200&q=80' },
      { id: '03', tags: ['Fleece Hoodie'], img: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&q=80' },
      { id: '04', tags: ['Beanie'], img: 'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=1200&q=80' },
    ],
    products: [
      { id: '01', name: 'Thermo Shell Parka', type: 'Outerwear', concept: 'Áo khoác 3 lớp cách nhiệt, lớp ngoài chống gió, giữ ấm sâu trong điều kiện khắc nghiệt.', img: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1200&q=80' },
      { id: '02', name: 'Wool-Blend Joggers', type: 'Bottom', concept: 'Quần jogger pha len, co giãn 2 chiều, giữ form dáng suốt mùa đông.', img: 'https://images.unsplash.com/photo-1554412933-514a83d2f3c8?w=1200&q=80' },
    ],
  },
  'le-hoi-cuoi-nam-2026': {
    title: 'Lễ Hội Cuối Năm 2026',
    tagline: 'Holiday Capsule',
    dateRange: '01/11 — 31/12, 2026',
    dropType: 'Limited Capsule',
    limited: true,
    heroImage: 'https://images.unsplash.com/photo-1511556820780-d912e42b4980?w=1600&q=80',
    description: 'Phiên bản giới hạn dịp lễ với chi tiết ánh kim nổi bật — chỉ phát hành trong khung thời gian ngắn.',
    highlights: [
      { icon: Layers, label: 'Chất liệu', value: 'Satin pha kim tuyến' },
      { icon: Palette, label: 'Bảng màu', value: 'Đen ánh kim, Đỏ rượu vang, Vàng đồng' },
      { icon: Ruler, label: 'Phom dáng', value: 'Form ôm, tôn dáng cơ thể' },
      { icon: Sparkles, label: 'Số lượng', value: 'Chỉ 500 set trên toàn quốc' },
    ],
    lookbook: [
      { id: '01', tags: ['Metallic Bomber'], img: 'https://images.unsplash.com/photo-1511556820780-d912e42b4980?w=1200&q=80' },
      { id: '02', tags: ['Satin Track Pants'], img: 'https://images.unsplash.com/photo-1483721310020-03333e577078?w=1200&q=80' },
      { id: '03', tags: ['Holiday Cap'], img: 'https://images.unsplash.com/photo-1517438476312-10d79c077509?w=1200&q=80' },
      { id: '04', tags: ['Gift Set'], img: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=1200&q=80' },
    ],
    products: [
      { id: '01', name: 'Metallic Trim Bomber', type: 'Outerwear', concept: 'Áo bomber phối chi tiết ánh kim, lớp lót satin sang trọng cho mùa lễ hội.', img: 'https://images.unsplash.com/photo-1511556820780-d912e42b4980?w=1200&q=80' },
      { id: '02', name: 'Wine Satin Track Pants', type: 'Bottom', concept: 'Quần track satin tông đỏ rượu vang, đường may laser-cut tinh xảo.', img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&q=80' },
    ],
  },
  'pre-fall-2026': {
    title: 'Pre-Fall 2026',
    tagline: 'Transitional Edit',
    dateRange: 'Tháng 08 — Tháng 09, 2026',
    dropType: 'Mini Drop',
    limited: false,
    heroImage: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=1600&q=80',
    description: 'Bộ sưu tập chuyển mùa, kết hợp linh hoạt giữa thể thao và đời thường — dễ phối lớp khi thời tiết giao mùa.',
    highlights: [
      { icon: Layers, label: 'Chất liệu', value: 'Cotton pha bố (canvas blend)' },
      { icon: Palette, label: 'Bảng màu', value: 'Be, Olive, Rêu xám' },
      { icon: Ruler, label: 'Phom dáng', value: 'Versatile, dễ phối lớp' },
      { icon: Sparkles, label: 'Công nghệ', value: 'Vải co giãn 4 chiều' },
    ],
    lookbook: [
      { id: '01', tags: ['Canvas Jacket'], img: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=1200&q=80' },
      { id: '02', tags: ['Utility Pants'], img: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&q=80' },
      { id: '03', tags: ['Layer Vest'], img: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=1200&q=80' },
      { id: '04', tags: ['Crossbody Bag'], img: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1200&q=80' },
    ],
    products: [
      { id: '01', name: 'Olive Canvas Jacket', type: 'Outerwear', concept: 'Áo khoác canvas form rộng, nhiều túi tiện dụng, dễ kết hợp đa phong cách.', img: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=1200&q=80' },
      { id: '02', name: 'Stone Utility Pants', type: 'Bottom', concept: 'Quần utility tông be, chất liệu bền bỉ, phù hợp cả ngày dài di chuyển.', img: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&q=80' },
    ],
  },
};

const SEASON_SLUGS = Object.keys(SEASON_DATA);

export default function CollectionDetailPage({ params }) {
  const resolvedParams = React.use(params);
  const slug = resolvedParams?.slug || 'nike';

  if (SEASON_SLUGS.includes(slug)) {
    return <SeasonDetailView data={SEASON_DATA[slug]} />;
  }
  return <BrandDetailView slug={slug} />;
}

/* ====================================================================
   SHELL DÙNG CHUNG: thanh utility trên cùng + footer
==================================================================== */
function PageShell({ utilityLabel, footerLabel, children }) {
  return (
    <div className={`${archivo.variable} ${inter.variable} min-h-screen bg-white text-[#0F0F0F] antialiased`} style={{ fontFamily: 'var(--font-inter)' }}>
      <div className="border-b border-neutral-100 px-6 md:px-10 py-3 flex items-center justify-between text-[11px] font-semibold tracking-[0.15em] uppercase">
        <Link href="/collections" className="flex items-center gap-2 hover:text-[#FF5A1F] transition-colors">
          <ArrowLeft size={13} /> All Collections
        </Link>
        <span className="text-neutral-400 hidden sm:block">{utilityLabel}</span>
      </div>

      {children}

      <footer className="px-6 md:px-10 py-5 text-center text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-400 border-t border-neutral-100">
        {footerLabel}
      </footer>
    </div>
  );
}

/* ====================================================================
   HERO DÙNG CHUNG: full-bleed ảnh thay cho khối chéo cũ
==================================================================== */
function HeroBlock({ tag, title, subtitleRow, image }) {
  return (
    <section className="relative bg-[#0F0F0F] text-white overflow-hidden h-[60vh] md:h-[72vh] min-h-[420px]">
      <img src={image} alt={title} className="absolute inset-0 w-full h-full object-cover opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F] via-[#0F0F0F]/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0F0F0F]/70 via-transparent to-transparent" />

      <div className="relative z-10 h-full flex flex-col justify-end px-6 md:px-10 pb-10 md:pb-14 max-w-4xl">
        <div className="flex items-center gap-2 mb-5">
          <Zap size={15} className="text-[#FF5A1F] fill-[#FF5A1F]" />
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#FF5A1F]">{tag}</span>
        </div>
        <h1
          className="uppercase leading-[0.9] tracking-tight"
          style={{ fontFamily: 'var(--font-archivo)', fontWeight: 900, fontSize: 'clamp(2.5rem, 8vw, 5.75rem)' }}
        >
          {title}
        </h1>
        <div className="mt-6">{subtitleRow}</div>
      </div>
    </section>
  );
}

/* ====================================================================
   LOOKBOOK DÙNG CHUNG
==================================================================== */
function LookbookSection({ items }) {
  return (
    <section className="px-6 md:px-10 py-16 md:py-20 border-b border-neutral-100 bg-neutral-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-10">
          <h2 className="uppercase font-extrabold text-2xl md:text-3xl" style={{ fontFamily: 'var(--font-archivo)' }}>
            Visual <span className="text-[#FF5A1F]">Lookbook</span>
          </h2>
          <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-neutral-400">{items.length} Looks</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6">
          {items.map((item) => (
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
  );
}

/* ====================================================================
   FEATURED PRODUCTS DÙNG CHUNG
==================================================================== */
function ProductsSection({ kicker, heading, headingAccent, namePrefix, products }) {
  return (
    <section className="border-b border-neutral-100 max-w-6xl mx-auto">
      <div className="px-6 md:px-10 pt-16 md:pt-20 pb-10">
        <span className="text-[11px] font-bold tracking-[0.25em] uppercase text-[#FF5A1F]">{kicker}</span>
        <h2
          className="uppercase mt-3 leading-[0.95]"
          style={{ fontFamily: 'var(--font-archivo)', fontWeight: 900, fontSize: 'clamp(1.75rem, 5vw, 3.25rem)' }}
        >
          {heading} <span className="text-[#FF5A1F]">{headingAccent}</span>
        </h2>
      </div>

      <div className="px-6 md:px-10 pb-16 md:pb-20 grid md:grid-cols-2 gap-6">
        {products.map((prod) => (
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
                {namePrefix} {prod.name}
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
  );
}

/* ====================================================================
   1) LAYOUT THƯƠNG HIỆU — "Archive"
==================================================================== */
function BrandDetailView({ slug }) {
  const brand = BRAND_DATA[slug] || BRAND_DATA.nike;
  const [activeEra, setActiveEra] = useState('2026');

  return (
    <PageShell utilityLabel="House Archive — Vol. 03" footerLabel={`${brand.name} Archive — Internal Ref. ID_v4.26 — 2026`}>
      <HeroBlock
        tag="Brand Dossier"
        title={brand.name}
        image={brand.heroImage}
        subtitleRow={
          <p className="max-w-md text-sm md:text-base text-neutral-300 leading-relaxed font-medium">
            “{brand.slogan}” — Không gian lưu trữ nhận diện cốt lõi của {brand.name}, nơi giao thoa giữa cấu trúc hình học thô mộc và tư duy tái định nghĩa thời trang đường phố đương đại.
          </p>
        }
      />

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
              <div className="text-3xl mb-4 text-[#FF5A1F]" style={{ fontFamily: 'var(--font-archivo)', fontWeight: 900 }}>
                {era.year}
              </div>
              <div className="text-[11px] font-bold tracking-[0.15em] uppercase mb-3 opacity-70">{era.title}</div>
              <p className="text-[13px] leading-relaxed opacity-80">{era.desc}</p>
            </button>
          ))}
        </div>
      </section>

      <LookbookSection items={BRAND_LOOKBOOK} />
      <ProductsSection
        kicker="Core Pieces"
        heading="Sản phẩm"
        headingAccent="biểu tượng"
        namePrefix={brand.name}
        products={BRAND_PRODUCTS}
      />

      {/* MANIFESTO + CONTACT */}
      <section className="grid md:grid-cols-2 bg-[#0F0F0F] text-white divide-y md:divide-y-0 md:divide-x divide-neutral-800">
        <div className="p-8 md:p-12 space-y-5">
          <span className="text-[11px] font-bold tracking-[0.25em] uppercase text-[#FF5A1F]">Manifesto</span>
          <h4 className="uppercase text-2xl md:text-3xl leading-snug" style={{ fontFamily: 'var(--font-archivo)', fontWeight: 800 }}>
            Không đại trà.<br />Không thỏa hiệp.
          </h4>
          <p className="text-[13px] leading-relaxed text-neutral-400 max-w-sm">
            Mỗi bộ phục trang gắn mác {brand.name} xuất xưởng không hướng đến số đông. Chúng là kết quả của quá trình nghiên cứu cấu trúc hình học nghiêm ngặt để giải phóng cái tôi độc bản.
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
    </PageShell>
  );
}

/* ====================================================================
   2) LAYOUT BỘ SƯU TẬP THEO MÙA — "Seasonal Drop"
==================================================================== */
function SeasonDetailView({ data }) {
  return (
    <PageShell utilityLabel={`Seasonal Drop — ${data.dateRange}`} footerLabel={`${data.title} — Seasonal Ref. ID_v4.26 — 2026`}>
      <HeroBlock
        tag={data.dropType}
        title={data.title}
        image={data.heroImage}
        subtitleRow={
          <div className="space-y-5">
            <p className="max-w-md text-sm md:text-base text-neutral-300 leading-relaxed font-medium">
              “{data.tagline}” — {data.description}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-sm text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1.5">
                <CalendarClock size={13} className="text-[#FF5A1F]" /> {data.dateRange}
              </span>
              {data.limited && (
                <span className="inline-flex items-center gap-2 bg-[#FF5A1F] text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1.5">
                  Số lượng giới hạn
                </span>
              )}
            </div>
          </div>
        }
      />

      {/* ĐẶC TRƯNG MÙA — thay cho Evolution Timeline */}
      <section className="px-6 md:px-10 py-16 md:py-20 border-b border-neutral-100 max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-12">
          <h2 className="uppercase font-extrabold text-2xl md:text-3xl" style={{ fontFamily: 'var(--font-archivo)' }}>
            Đặc trưng <span className="text-[#FF5A1F]">mùa</span>
          </h2>
          <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-neutral-400 hidden sm:block">{data.dropType}</span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {data.highlights.map((h) => {
            const Icon = h.icon;
            return (
              <div key={h.label} className="p-6 border-2 border-neutral-200 hover:border-[#FF5A1F] transition-colors">
                <Icon size={20} className="text-[#FF5A1F] mb-5" />
                <div className="text-[11px] font-bold tracking-[0.15em] uppercase mb-2 text-neutral-400">{h.label}</div>
                <p className="text-[13px] leading-relaxed font-semibold text-[#0F0F0F]">{h.value}</p>
              </div>
            );
          })}
        </div>
      </section>

      <LookbookSection items={data.lookbook} />
      <ProductsSection
        kicker="Capsule Pieces"
        heading="Sản phẩm"
        headingAccent="nổi bật"
        namePrefix=""
        products={data.products}
      />

      {/* THÔNG TIN DROP + CTA */}
      <section className="grid md:grid-cols-2 bg-[#0F0F0F] text-white divide-y md:divide-y-0 md:divide-x divide-neutral-800">
        <div className="p-8 md:p-12 space-y-5">
          <span className="text-[11px] font-bold tracking-[0.25em] uppercase text-[#FF5A1F]">Drop Notice</span>
          <h4 className="uppercase text-2xl md:text-3xl leading-snug" style={{ fontFamily: 'var(--font-archivo)', fontWeight: 800 }}>
            Phát hành trong<br />khung thời gian giới hạn.
          </h4>
          <p className="text-[13px] leading-relaxed text-neutral-400 max-w-sm">
            {data.title} mở bán từ {data.dateRange}. {data.limited ? 'Số lượng có hạn — sản phẩm có thể hết hàng sớm tại một số showroom.' : 'Sản phẩm có mặt tại toàn bộ hệ thống showroom và cửa hàng trực tuyến của Dynova.'}
          </p>
        </div>
        <div className="p-8 md:p-12 flex flex-col justify-between gap-10">
          <div className="space-y-3">
            <span className="text-[11px] font-bold tracking-[0.25em] uppercase text-[#FF5A1F]">Early Access</span>
            <h4 className="text-lg font-bold" style={{ fontFamily: 'var(--font-archivo)' }}>
              Đặt lịch nhận hàng sớm
            </h4>
            <p className="text-[13px] text-neutral-400 leading-relaxed max-w-sm">
              Đăng ký để nhận thông báo ưu tiên khi {data.title} chính thức lên kệ.
            </p>
          </div>
          <Link href="#top" className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#FF5A1F] hover:text-white transition-colors self-start">
            <ArrowUpRight size={14} /> Back to top
          </Link>
        </div>
      </section>
    </PageShell>
  );
}