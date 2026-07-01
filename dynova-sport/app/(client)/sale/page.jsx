"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Flame, Heart, ShoppingBag, Star, Zap, CheckCircle, ShoppingCart } from "lucide-react";
import { categories, formatCurrency } from "@/data/shop";
import { addToCart, getProducts, getWishlist, toggleWishlist } from "@/utils/shopStorage";

// Tính mốc kết thúc Flash Sale: 23:59:59 hôm nay (nếu đã qua mốc này thì tự lùi sang ngày mai)
function getSaleEndTime() {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 0);
    if (end.getTime() <= now.getTime()) {
        end.setDate(end.getDate() + 1);
    }
    return end.getTime();
}

function pad(n) {
    return String(n).padStart(2, "0");
}

// Phần trăm "đã bán" giả lập nhưng ổn định theo id sản phẩm
function soldPercentFromId(id) {
    const n = Number(id) || 0;
    const seed = (n * 37 + 13) % 100;
    return 35 + (seed % 60); // dao động 35% - 94%
}

export default function FlashSalePage() {
    const [items, setItems] = useState([]);
    const [category, setCategory] = useState("all");
    const [sort, setSort] = useState("discount");
    const [wishlist, setWishlist] = useState([]);
    const [notice, setNotice] = useState("");
    const [endTime, setEndTime] = useState(null);
    const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });

    useEffect(() => {
        setItems(getProducts());
        setWishlist(getWishlist().map(Number));
        setEndTime(getSaleEndTime());
    }, []);

    useEffect(() => {
        if (!endTime) return;
        const tick = () => {
            const diff = Math.max(0, endTime - Date.now());
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setTimeLeft({ h, m, s });
            if (diff <= 0) setEndTime(getSaleEndTime());
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [endTime]);

    const saleItems = useMemo(
        () =>
            items
                .filter((p) => p.oldPrice && p.oldPrice > p.price)
                .map((p) => ({
                    ...p,
                    discount: Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100),
                    soldPercent: soldPercentFromId(p.id),
                })),
        [items]
    );

    const filtered = useMemo(() => {
        const result = saleItems.filter((p) => category === "all" || p.categoryId === category);
        if (sort === "price-asc") return [...result].sort((a, b) => a.price - b.price);
        if (sort === "price-desc") return [...result].sort((a, b) => b.price - a.price);
        if (sort === "ending-soon") return [...result].sort((a, b) => b.soldPercent - a.soldPercent);
        return [...result].sort((a, b) => b.discount - a.discount);
    }, [saleItems, category, sort]);

    const handleAdd = (product) => {
        addToCart(product, { quantity: 1 });
        setNotice(`Đã thêm "${product.name}" vào giỏ hàng thành công!`);
        setTimeout(() => setNotice(""), 2500);
    };

    const handleWishlist = (product) => {
        const next = toggleWishlist(product.id).map(Number);
        setWishlist(next);
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] py-12 selection:bg-orange-500 selection:text-white">
            
            {/* TOAST NOTICE MƯỢT MÀ HƠN */}
            {notice && (
                <div className="fixed right-5 top-24 z-50 flex items-center gap-3 animate-fade-in-down rounded-xl bg-slate-900 px-5 py-4 text-sm font-semibold text-white shadow-2xl backdrop-blur-md border border-slate-800">
                    <CheckCircle size={18} className="text-emerald-400 shrink-0" />
                    <span>{notice}</span>
                </div>
            )}

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

                {/* HERO BANNER CAO CẤP */}
                <div className="relative mb-10 overflow-hidden rounded-2xl bg-gradient-to-br from-rose-600 via-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/10">
                    <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                    <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-black/10 blur-2xl pointer-events-none" />
                    
                    <div className="grid gap-8 p-8 md:grid-cols-[1.2fr_1fr] md:p-12 items-center">
                        <div>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                                <Flame size={12} className="fill-white text-orange-200 animate-pulse" /> Giới hạn thời gian
                            </span>
                            <h1 className="mt-4 flex items-center gap-3 text-4xl font-black uppercase tracking-tight md:text-5xl lg:text-6xl">
                                Flash Sale
                            </h1>
                            <p className="mt-4 max-w-lg text-sm md:text-base leading-relaxed text-orange-50/90 font-medium">
                                Săn ngay các deal chấn động mỗi ngày với mức giảm giá chạm sàn. Số lượng có hạn, thanh toán ngay kẻo lỡ!
                            </p>
                        </div>

                        {/* ĐẾM NGƯỢC STYLE HIỆN ĐẠI */}
                        <div className="flex flex-col rounded-xl bg-slate-950/30 p-6 backdrop-blur-md border border-white/10">
                            <span className="text-xs font-bold uppercase tracking-widest text-orange-200/80 mb-3 text-center md:text-left">Chương trình kết thúc sau</span>
                            <div className="flex gap-3 justify-center md:justify-start">
                                {[
                                    { label: "Giờ", value: timeLeft.h },
                                    { label: "Phút", value: timeLeft.m },
                                    { label: "Giây", value: timeLeft.s },
                                ].map((unit) => (
                                    <div key={unit.label} className="flex-1 min-w-[70px] rounded-lg bg-slate-950/60 px-2 py-3 text-center transition-all hover:bg-slate-950/80">
                                        <div className="text-2xl font-black tabular-nums md:text-3xl text-amber-400">{pad(unit.value)}</div>
                                        <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-300">{unit.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* THANH BỘ LỌC TINH TẾ */}
                <div className="mb-6 flex flex-col gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap gap-1.5">
                        <button 
                            onClick={() => setCategory("all")} 
                            className={`rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${category === "all" ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}
                        >
                            Tất cả
                        </button>
                        {categories.map((cat) => (
                            <button 
                                key={cat.id} 
                                onClick={() => setCategory(cat.id)} 
                                className={`rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${category === cat.id ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap hidden sm:inline">Sắp xếp:</span>
                        <select 
                            value={sort} 
                            onChange={(e) => setSort(e.target.value)} 
                            className="w-full sm:w-48 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 outline-none transition focus:border-orange-500 focus:bg-white"
                        >
                            <option value="discount">🔥 Giảm giá nhiều nhất</option>
                            <option value="ending-soon">⚡ Sắp cháy hàng</option>
                            <option value="price-asc">📈 Giá thấp đến cao</option>
                            <option value="price-desc">📉 Giá cao đến thấp</option>
                        </select>
                    </div>
                </div>

                {/* SỐ LƯỢNG KẾT QUẢ */}
                <p className="mb-6 text-sm text-slate-500 font-medium">
                    Tìm thấy <span className="font-bold text-slate-800">{filtered.length}</span> sản phẩm đang diễn ra ưu đãi.
                </p>

                {/* KHÔNG CÓ SẢN PHẨM */}
                {filtered.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-16 text-center shadow-sm">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400">
                            <ShoppingCart size={24} />
                        </div>
                        <h3 className="text-base font-bold text-slate-800">Danh mục này hiện đã hết sản phẩm Flash Sale</h3>
                        <p className="mt-1 text-sm text-slate-400">Vui lòng quay lại sau hoặc khám phá các danh mục hấp dẫn khác.</p>
                    </div>
                ) : (
                    /* LƯỚI SẢN PHẨM CẢI TIẾN */
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {filtered.map((product) => {
                            const liked = wishlist.includes(Number(product.id));
                            const isHot = product.soldPercent >= 80;

                            return (
                                <article 
                                    key={product.id} 
                                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-slate-200"
                                >
                                    {/* PHẦN ẢNH SẢN PHẨM */}
                                    <div className="relative aspect-square w-full overflow-hidden bg-slate-50">
                                        <Link href={`/shop/product/${product.id}`} className="block h-full w-full">
                                            <img 
                                                src={product.image} 
                                                alt={product.name} 
                                                className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" 
                                                loading="lazy"
                                            />
                                        </Link>
                                        
                                        {/* BADGE GIẢM GIÁ THIẾT KẾ LẠI */}
                                        <div className="absolute left-3 top-3 z-10 drop-shadow-md">
                                            <span className="inline-flex items-center gap-0.5 rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-black text-white">
                                                -{product.discount}%
                                            </span>
                                        </div>

                                        {/* NÚT YÊU THÍCH BLUR-GLASS EFFECT */}
                                        <button 
                                            onClick={() => handleWishlist(product)} 
                                            className={`absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border shadow-sm transition-all active:scale-95 ${
                                                liked 
                                                    ? "bg-rose-500 border-rose-500 text-white" 
                                                    : "bg-white/80 border-slate-100 text-slate-600 backdrop-blur-sm hover:bg-white hover:text-rose-500"
                                            }`}
                                            aria-label="Thêm vào danh sách yêu thích"
                                        >
                                            <Heart size={16} className={liked ? "fill-current" : "transition-transform group-hover:scale-110"} />
                                        </button>
                                    </div>

                                    {/* THÔNG TIN SẢN PHẨM */}
                                    <div className="flex flex-1 flex-col p-5">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-orange-500">{product.category}</span>
                                            <div className="flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-bold text-amber-700">
                                                <Star size={11} className="fill-amber-500 text-amber-500" /> 
                                                {product.rating}
                                            </div>
                                        </div>

                                        <Link href={`/shop/product/${product.id}`} className="mt-2 block flex-1">
                                            <h3 className="line-clamp-2 text-sm font-bold text-slate-800 transition-colors duration-200 group-hover:text-orange-500">
                                                {product.name}
                                            </h3>
                                        </Link>

                                        {/* KHU VỰC GIÁ CẢ */}
                                        <div className="mt-3 flex items-baseline gap-2">
                                            <span className="text-lg font-black tracking-tight text-rose-600">{formatCurrency(product.price)}</span>
                                            <span className="text-xs font-semibold text-slate-400 line-through">{formatCurrency(product.oldPrice)}</span>
                                        </div>

                                        {/* THANH TIẾN TRÌNH ĐÃ BÁN MẠCH ĐẬP */}
                                        <div className="mt-4">
                                            <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                                <div 
                                                    className={`h-full rounded-full bg-gradient-to-r ${isHot ? "from-orange-500 to-rose-600 animate-pulse" : "from-amber-400 to-orange-500"}`} 
                                                    style={{ width: `${product.soldPercent}%` }} 
                                                />
                                            </div>
                                            <div className="mt-1.5 flex items-center justify-between text-[11px] font-bold text-slate-500">
                                                <span>Đã bán {product.soldPercent}%</span>
                                                {isHot && (
                                                    <span className="flex items-center gap-0.5 text-rose-600 animate-pulse">
                                                        <Flame size={10} className="fill-current" /> Sắp hết hàng
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* NÚT THÊM VÀO GIỎ TỐI GIẢN & SANG TRỌNG */}
                                        <button 
                                            onClick={() => handleAdd(product)} 
                                            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all duration-200 hover:bg-orange-500 hover:shadow-lg hover:shadow-orange-500/20 active:scale-[0.98]"
                                        >
                                            <ShoppingBag size={14} /> Thêm vào giỏ
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}