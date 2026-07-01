"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { formatCurrency } from "@/data/shop";
import { addToCart, getWishlistProducts, toggleWishlist } from "@/utils/shopStorage";

export default function WishlistPage() {
  const [items, setItems] = useState([]);
  const sync = () => setItems(getWishlistProducts());
  useEffect(() => { sync(); }, []);
  const remove = (id) => { toggleWishlist(id); sync(); };
  return <div className="min-h-screen bg-[#f7f8fb] py-10"><div className="container-page"><div className="mb-8"><p className="text-xs font-black uppercase tracking-[0.25em] text-orange-500">Wishlist</p><h1 className="mt-2 text-4xl font-black text-slate-950">Danh sách yêu thích</h1></div>{items.length === 0 ? <div className="surface rounded-3xl p-10 text-center"><Heart className="mx-auto text-orange-500" size={42} /><h2 className="mt-4 text-2xl font-black text-slate-950">Chưa có sản phẩm yêu thích</h2><Link href="/shop" className="btn-primary mt-6 inline-block rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-wider">Tìm sản phẩm</Link></div> : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{items.map((product) => <article key={product.id} className="product-card rounded-3xl border border-slate-200 bg-white p-3"><Link href={"/shop/product/" + product.id}><img src={product.image} alt={product.name} className="aspect-square rounded-2xl object-cover" /></Link><div className="p-2"><p className="text-[11px] font-black uppercase tracking-wider text-orange-500">{product.category}</p><h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-black text-slate-950">{product.name}</h3><p className="mt-2 font-black text-orange-600">{formatCurrency(product.price)}</p><div className="mt-4 grid grid-cols-[1fr_auto] gap-2"><button onClick={() => addToCart(product)} className="btn-primary flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-black uppercase"><ShoppingBag size={14} /> Giỏ</button><button onClick={() => remove(product.id)} className="btn-ghost rounded-xl px-3 text-rose-600"><Trash2 size={15} /></button></div></div></article>)}</div>}</div></div>;
}
