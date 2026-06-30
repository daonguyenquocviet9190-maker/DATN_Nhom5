"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Check, Heart, Search, ShoppingBag, SlidersHorizontal, Star } from "lucide-react";
import { categories, formatCurrency } from "@/data/shop";
import { addToCart, getProducts, getWishlist, toggleWishlist } from "@/utils/shopStorage";

export default function ShopPage() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [brand, setBrand] = useState("all");
  const [maxPrice, setMaxPrice] = useState(2000000);
  const [sort, setSort] = useState("featured");
  const [wishlist, setWishlist] = useState([]);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setItems(getProducts());
    setWishlist(getWishlist().map(Number));
    const params = new URLSearchParams(window.location.search);
    const categoryParam = params.get("category");
    const q = params.get("q");
    if (categoryParam) setCategory(categoryParam);
    if (q) setQuery(q);
  }, []);

  const brands = useMemo(() => Array.from(new Set(items.map((item) => item.brand))), [items]);

  const filtered = useMemo(() => {
    const result = items
      .filter((product) => category === "all" || product.categoryId === category)
      .filter((product) => brand === "all" || product.brand === brand)
      .filter((product) => product.price <= maxPrice)
      .filter((product) => {
        const text = (product.name + " " + product.category + " " + product.brand + " " + product.tags.join(" ")).toLowerCase();
        return text.includes(query.toLowerCase());
      });
    if (sort === "price-asc") return [...result].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") return [...result].sort((a, b) => b.price - a.price);
    if (sort === "rating") return [...result].sort((a, b) => b.rating - a.rating);
    return [...result].sort((a, b) => b.sold - a.sold);
  }, [items, query, category, brand, maxPrice, sort]);

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
        <div className="mb-8 overflow-hidden rounded-3xl bg-slate-950 text-white">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-7 md:p-10">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-300">Cửa hàng</p>
              <h1 className="mt-3 text-4xl font-black uppercase tracking-tight md:text-5xl">Danh mục sản phẩm</h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">Lọc theo môn thể thao, thương hiệu, khoảng giá và sắp xếp để chọn đúng sản phẩm cho mục tiêu tập luyện.</p>
            </div>
            <img src="https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&auto=format&fit=crop&q=80" alt="Shop Dynova" className="h-64 w-full object-cover lg:h-full" />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <aside className="surface h-fit rounded-3xl p-5 lg:sticky lg:top-24">
            <div className="mb-5 flex items-center gap-2"><SlidersHorizontal className="text-orange-500" size={18} /><h2 className="font-black text-slate-950">Bộ lọc</h2></div>
            <div className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">Tìm kiếm</span>
                <div className="relative"><Search className="absolute left-3 top-3.5 text-slate-400" size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} className="input-control pl-10" placeholder="Tên, môn thể thao..." /></div>
              </label>
              <div>
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">Danh mục</span>
                <div className="grid gap-2">
                  <button onClick={() => setCategory("all")} className={"rounded-xl px-3 py-2 text-left text-sm font-bold " + (category === "all" ? "bg-orange-500 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100")}>Tất cả</button>
                  {categories.map((cat) => <button key={cat.id} onClick={() => setCategory(cat.id)} className={"rounded-xl px-3 py-2 text-left text-sm font-bold " + (category === cat.id ? "bg-orange-500 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100")}>{cat.name}</button>)}
                </div>
              </div>
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">Thương hiệu</span>
                <select value={brand} onChange={(e) => setBrand(e.target.value)} className="input-control"><option value="all">Tất cả thương hiệu</option>{brands.map((item) => <option key={item} value={item}>{item}</option>)}</select>
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">Giá tối đa</span>
                <input type="range" min="200000" max="2000000" step="50000" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full accent-orange-500" />
                <div className="mt-2 text-sm font-black text-orange-600">Dưới {formatCurrency(maxPrice)}</div>
              </label>
            </div>
          </aside>

          <section>
            <div className="surface mb-5 flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-bold text-slate-600">Tìm thấy <span className="font-black text-orange-600">{filtered.length}</span> sản phẩm phù hợp</p>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="input-control max-w-xs"><option value="featured">Bán chạy</option><option value="rating">Đánh giá cao</option><option value="price-asc">Giá thấp đến cao</option><option value="price-desc">Giá cao đến thấp</option></select>
            </div>

            {filtered.length === 0 ? (
              <div className="surface rounded-3xl p-12 text-center"><p className="font-black text-slate-950">Không tìm thấy sản phẩm phù hợp</p><p className="mt-2 text-sm text-slate-500">Hãy thử bỏ bớt bộ lọc hoặc đổi từ khóa.</p></div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((product) => {
                  const liked = wishlist.includes(Number(product.id));
                  return (
                    <article key={product.id} className="product-card overflow-hidden rounded-3xl border border-slate-200 bg-white">
                      <div className="relative overflow-hidden bg-slate-100">
                        <Link href={"/shop/product/" + product.id}><img src={product.image} alt={product.name} className="aspect-[4/4.35] w-full object-cover transition duration-500 hover:scale-105" /></Link>
                        {product.badge && <span className="absolute left-3 top-3 rounded-full bg-slate-950 px-3 py-1 text-[11px] font-black uppercase text-white">{product.badge}</span>}
                        <button onClick={() => handleWishlist(product)} className={"absolute right-3 top-3 rounded-full p-3 shadow-lg " + (liked ? "bg-rose-500 text-white" : "bg-white text-slate-600")} aria-label="Yêu thích"><Heart size={17} className={liked ? "fill-current" : ""} /></button>
                      </div>
                      <div className="p-5">
                        <div className="flex items-center justify-between gap-2"><p className="text-[11px] font-black uppercase tracking-wider text-orange-500">{product.category}</p><p className="flex items-center gap-1 text-xs font-bold text-slate-500"><Star size={13} className="fill-amber-400 text-amber-400" /> {product.rating}</p></div>
                        <Link href={"/shop/product/" + product.id}><h3 className="mt-2 line-clamp-2 min-h-11 text-base font-black text-slate-950 hover:text-orange-600">{product.name}</h3></Link>
                        <div className="mt-4 flex items-end justify-between gap-3"><div><p className="text-lg font-black text-slate-950">{formatCurrency(product.price)}</p>{product.oldPrice && <p className="text-xs font-bold text-slate-400 line-through">{formatCurrency(product.oldPrice)}</p>}</div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-600"><Check size={12} className="mr-1 inline" /> Còn hàng</span></div>
                        <button onClick={() => handleAdd(product)} className="btn-primary mt-5 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-xs font-black uppercase tracking-wider"><ShoppingBag size={15} /> Thêm vào giỏ</button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
