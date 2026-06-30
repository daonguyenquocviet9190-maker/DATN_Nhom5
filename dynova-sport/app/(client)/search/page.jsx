"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search, ShoppingBag, Star } from "lucide-react";
import { formatCurrency } from "@/data/shop";
import { addToCart, getProducts } from "@/utils/shopStorage";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  useEffect(() => { const params = new URLSearchParams(window.location.search); setQuery(params.get("q") || ""); setProducts(getProducts()); }, []);
  const results = useMemo(() => products.filter((product) => (product.name + " " + product.category + " " + product.brand + " " + product.tags.join(" ")).toLowerCase().includes(query.toLowerCase())), [products, query]);
  return <div className="min-h-screen bg-[#f7f8fb] py-10"><div className="container-page"><div className="surface mb-8 rounded-3xl p-6"><p className="text-xs font-black uppercase tracking-[0.25em] text-orange-500">Search</p><h1 className="mt-2 text-4xl font-black text-slate-950">Tìm kiếm sản phẩm</h1><div className="relative mt-5"><Search className="absolute left-4 top-4 text-slate-400" size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} className="input-control pl-12" placeholder="Nhập tên sản phẩm hoặc danh mục" /></div></div><p className="mb-5 text-sm font-bold text-slate-500">Có <span className="text-orange-600">{results.length}</span> kết quả phù hợp.</p><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{results.map((product) => <article key={product.id} className="product-card rounded-3xl border border-slate-200 bg-white p-3"><Link href={"/shop/product/" + product.id}><img src={product.image} alt={product.name} className="aspect-square rounded-2xl object-cover" /></Link><div className="p-2"><p className="mt-1 text-[11px] font-black uppercase tracking-wider text-orange-500">{product.category}</p><h2 className="mt-1 line-clamp-2 min-h-10 text-sm font-black text-slate-950">{product.name}</h2><div className="mt-2 flex items-center justify-between"><p className="font-black text-orange-600">{formatCurrency(product.price)}</p><span className="flex items-center gap-1 text-xs font-bold text-slate-500"><Star size={13} className="fill-amber-400 text-amber-400" /> {product.rating}</span></div><button onClick={() => addToCart(product)} className="btn-primary mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-black uppercase"><ShoppingBag size={14} /> Thêm giỏ</button></div></article>)}</div></div></div>;
}
