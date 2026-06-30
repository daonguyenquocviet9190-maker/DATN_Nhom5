"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Flame, Heart, ShoppingBag, Star, Zap } from "lucide-react";
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

// Phần trăm "đã bán" giả lập nhưng ổn định theo id sản phẩm, dùng cho thanh tiến trình sắp cháy hàng
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

    // Sản phẩm Flash Sale = sản phẩm đang có giá gốc (oldPrice) cao hơn giá bán hiện tại
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
        setNotice("Đã thêm sản phẩm vào giỏ hàng.");
        setTimeout(() => setNotice(""), 1800);
    };

    const handleWishlist = (product) => {
        const next = toggleWishlist(product.id).map(Number);
        setWishlist(next);
    };

    return (
        <div className="min-h-screen bg-[#f7f8fb] py-10">
            {notice && <div className="fixed right-5 top-24 z-50 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-2xl">{notice}</div>}
            <div className="container-page">

                {/* HERO + ĐẾM NGƯỢC */}
                <div className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-rose-600 via-orange-600 to-amber-500 text-white">
                    <div className="grid gap-6 p-7 md:grid-cols-[1.2fr_1fr] md:p-10">
                        <div>
                            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-white/80">
                                <Flame size={14} className="fill-white" /> Ưu đãi giới hạn thời gian
                            </p>
                            <h1 className="mt-3 flex items-center gap-3 text-4xl font-black uppercase tracking-tight md:text-5xl">
                                <Zap size={34} className="fill-white text-white" /> Flash Sale
                            </h1>
                            <p className="mt-4 max-w-xl text-sm leading-6 text-white/85">
                                Săn deal sốc mỗi ngày với mức giảm giá cực sâu — số lượng có hạn, nhanh tay kẻo lỡ!
                            </p>
                        </div>

                        <div className="flex flex-col justify-center gap-3">
                            <span className="text-xs font-black uppercase tracking-wider text-white/80">Kết thúc trong</span>
                            <div className="flex gap-3">
                                {[
                                    { label: "Giờ", value: timeLeft.h },
                                    { label: "Phút", value: timeLeft.m },
                                    { label: "Giây", value: timeLeft.s },
                                ].map((unit) => (
                                    <div key={unit.label} className="flex-1 rounded-2xl bg-slate-950/80 px-3 py-3 text-center backdrop-blur">
                                        <div className="text-2xl font-black tabular-nums md:text-3xl">{pad(unit.value)}</div>
                                        <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/60">{unit.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* BỘ LỌC NHANH */}
                <div className="surface mb-5 flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap gap-2">
                        <button onClick={() => setCategory("all")} className={"rounded-full px-4 py-2 text-xs font-black uppercase tracking-wider " + (category === "all" ? "bg-orange-500 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100")}>Tất cả</button>
                        {categories.map((cat) => (
                            <button key={cat.id} onClick={() => setCategory(cat.id)} className={"rounded-full px-4 py-2 text-xs font-black uppercase tracking-wider " + (category === cat.id ? "bg-orange-500 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100")}>{cat.name}</button>
                        ))}
                    </div>
                    <select value={sort} onChange={(e) => setSort(e.target.value)} className="input-control max-w-xs">
                        <option value="discount">Giảm giá nhiều nhất</option>
                        <option value="ending-soon">Sắp cháy hàng</option>
                        <option value="price-asc">Giá thấp đến cao</option>
                        <option value="price-desc">Giá cao đến thấp</option>
                    </select>
                </div>

                <p className="mb-5 text-sm font-bold text-slate-600">Tìm thấy <span className="font-black text-orange-600">{filtered.length}</span> sản phẩm đang Flash Sale</p>

                {filtered.length === 0 ? (
                    <div className="surface rounded-3xl p-12 text-center">
                        <p className="font-black text-slate-950">Hiện chưa có sản phẩm Flash Sale ở danh mục này</p>
                        <p className="mt-2 text-sm text-slate-500">Hãy quay lại sau hoặc chọn danh mục khác.</p>
                    </div>
                ) : (
                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                        {filtered.map((product) => {
                            const liked = wishlist.includes(Number(product.id));
                            return (
                                <article key={product.id} className="product-card overflow-hidden rounded-3xl border border-slate-200 bg-white">
                                    <div className="relative overflow-hidden bg-slate-100">
                                        <Link href={"/shop/product/" + product.id}>
                                            <img src={product.image} alt={product.name} className="aspect-[4/4.35] w-full object-cover transition duration-500 hover:scale-105" />
                                        </Link>
                                        <span className="absolute left-3 top-3 rounded-full bg-rose-600 px-3 py-1 text-[11px] font-black uppercase text-white">-{product.discount}%</span>
                                        <button onClick={() => handleWishlist(product)} className={"absolute right-3 top-3 rounded-full p-3 shadow-lg " + (liked ? "bg-rose-500 text-white" : "bg-white text-slate-600")} aria-label="Yêu thích">
                                            <Heart size={17} className={liked ? "fill-current" : ""} />
                                        </button>
                                    </div>
                                    <div className="p-5">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-[11px] font-black uppercase tracking-wider text-orange-500">{product.category}</p>
                                            <p className="flex items-center gap-1 text-xs font-bold text-slate-500"><Star size={13} className="fill-amber-400 text-amber-400" /> {product.rating}</p>
                                        </div>
                                        <Link href={"/shop/product/" + product.id}>
                                            <h3 className="mt-2 line-clamp-2 min-h-11 text-base font-black text-slate-950 hover:text-orange-600">{product.name}</h3>
                                        </Link>
                                        <div className="mt-4 flex items-end gap-3">
                                            <p className="text-lg font-black text-rose-600">{formatCurrency(product.price)}</p>
                                            <p className="text-xs font-bold text-slate-400 line-through">{formatCurrency(product.oldPrice)}</p>
                                        </div>

                                        {/* THANH TIẾN TRÌNH ĐÃ BÁN */}
                                        <div className="mt-4">
                                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                                <div className="h-full rounded-full bg-gradient-to-r from-rose-500 to-orange-500" style={{ width: product.soldPercent + "%" }} />
                                            </div>
                                            <p className="mt-1.5 text-[11px] font-bold text-slate-500">Đã bán {product.soldPercent}%{product.soldPercent >= 80 ? " · Sắp hết hàng" : ""}</p>
                                        </div>

                                        <button onClick={() => handleAdd(product)} className="btn-primary mt-5 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-xs font-black uppercase tracking-wider">
                                            <ShoppingBag size={15} /> Thêm vào giỏ
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