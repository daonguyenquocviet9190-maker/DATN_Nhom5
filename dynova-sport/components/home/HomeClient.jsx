"use client";

import Link from "next/link";
import { ArrowRight, Heart, ShieldCheck, ShoppingBag, Sparkles, Star, Truck } from "lucide-react";
import { categories, formatCurrency, heroSlides } from "@/data/shop";
import { addToCart, toggleWishlist } from "@/utils/shopStorage";
import { useState } from "react";

export default function HomeClient({ products = [] }) {
  const [notice, setNotice] = useState("");
  const featured = products.slice(0, 4);
  const best = products.slice(4, 8);

  const handleAdd = (product) => {
    addToCart(product, { quantity: 1 });
    setNotice("Đã thêm " + product.name + " vào giỏ hàng.");
    setTimeout(() => setNotice(""), 2200);
  };

  const handleWishlist = (product) => {
    toggleWishlist(product.id);
    setNotice("Đã cập nhật danh sách yêu thích.");
    setTimeout(() => setNotice(""), 1800);
  };

  return (
    <div className="bg-[#f7f8fb]">
      {notice && <div className="fixed right-5 top-24 z-50 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-2xl">{notice}</div>}

      <section className="relative min-h-[calc(100vh-80px)] overflow-hidden bg-slate-950 text-white">
        <img src={heroSlides[0].image} alt="Dynova Sport" className="absolute inset-0 h-full w-full object-cover opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/75 to-transparent" />
        <div className="container-page relative flex min-h-[calc(100vh-80px)] items-center py-16">
          <div className="max-w-2xl reveal-up">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-orange-200">
              <Sparkles size={14} /> Bộ sưu tập 2026
            </div>
            <h1 className="text-5xl font-black uppercase leading-[0.95] tracking-tight md:text-7xl">Dynova Sport</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-200 md:text-lg">Website mua sắm đồ thể thao với trải nghiệm như cửa hàng thật: lọc sản phẩm, chọn biến thể, giỏ hàng, checkout, thanh toán COD, chuyển khoản và online demo.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="btn-primary inline-flex items-center gap-2 rounded-2xl px-6 py-4 text-sm font-black uppercase tracking-wider">Mua sắm ngay <ArrowRight size={16} /></Link>
              <Link href="/checkout" className="rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-sm font-black uppercase tracking-wider text-white backdrop-blur transition hover:bg-white/20">Thanh toán nhanh</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page -mt-10 grid gap-4 md:grid-cols-3">
        {[{ icon: Truck, title: "Giao hàng linh hoạt", text: "COD, chuyển khoản, online gateway demo." }, { icon: ShieldCheck, title: "Đổi trả 30 ngày", text: "Theo dõi đơn hàng rõ từng trạng thái." }, { icon: Star, title: "Sản phẩm chọn lọc", text: "Biến thể size, màu, tồn kho và đánh giá." }].map((item) => {
          const Icon = item.icon;
          return <div key={item.title} className="surface relative rounded-2xl p-5"><Icon className="text-orange-500" size={24} /><h3 className="mt-3 font-black text-slate-950">{item.title}</h3><p className="mt-1 text-sm leading-6 text-slate-500">{item.text}</p></div>;
        })}
      </section>

      <section className="container-page py-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-500">Danh mục</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">Mua theo nhu cầu tập luyện</h2>
          </div>
          <Link href="/shop" className="hidden text-sm font-black text-orange-600 hover:text-orange-700 md:block">Xem tất cả</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-5">
          {categories.map((category) => (
            <Link key={category.id} href={"/shop?category=" + category.id} className="product-card group overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="h-40 overflow-hidden"><img src={category.image} alt={category.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /></div>
              <div className="p-4"><h3 className="font-black text-slate-950">{category.name}</h3><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{category.description}</p></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container-page">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div><p className="text-xs font-black uppercase tracking-[0.25em] text-orange-500">Sản phẩm nổi bật</p><h2 className="mt-2 text-3xl font-black text-slate-950">Được chọn nhiều tuần này</h2></div>
            <Link href="/shop" className="text-sm font-black text-orange-600 hover:text-orange-700">Vào cửa hàng</Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((product) => (
              <article key={product.id} className="product-card rounded-2xl border border-slate-200 bg-white p-3">
                <Link href={"/shop/product/" + product.id} className="block overflow-hidden rounded-xl bg-slate-100"><img src={product.image} alt={product.name} className="aspect-[4/4.5] w-full object-cover transition duration-500 hover:scale-105" /></Link>
                <div className="p-2">
                  <p className="mt-2 text-[11px] font-black uppercase tracking-wider text-orange-500">{product.category}</p>
                  <Link href={"/shop/product/" + product.id}><h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-black text-slate-950 hover:text-orange-600">{product.name}</h3></Link>
                  <div className="mt-3 flex items-center justify-between"><p className="font-black text-slate-950">{formatCurrency(product.price)}</p><span className="text-xs font-bold text-slate-400">{product.rating} sao</span></div>
                  <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
                    <button onClick={() => handleAdd(product)} className="btn-primary rounded-xl px-3 py-3 text-xs font-black uppercase">Thêm giỏ</button>
                    <button onClick={() => handleWishlist(product)} className="btn-ghost rounded-xl px-3" aria-label="Yêu thích"><Heart size={16} /></button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page grid gap-6 py-16 lg:grid-cols-2">
        <div className="overflow-hidden rounded-3xl bg-slate-950 text-white">
          <img src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1200&auto=format&fit=crop&q=80" alt="Training" className="h-72 w-full object-cover opacity-80" />
          <div className="p-7"><p className="text-xs font-black uppercase tracking-[0.25em] text-orange-300">Ưu đãi thành viên</p><h2 className="mt-2 text-3xl font-black">Nhập DYNOVANEW giảm ngay 100.000đ</h2><p className="mt-3 text-sm leading-6 text-slate-300">Mã áp dụng trong giỏ hàng và checkout cho đơn từ 500.000đ.</p></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {best.map((product) => (
            <Link key={product.id} href={"/shop/product/" + product.id} className="soft-card product-card flex gap-3 rounded-2xl p-3">
              <img src={product.image} alt={product.name} className="h-24 w-24 rounded-xl object-cover" />
              <div><p className="text-[11px] font-black uppercase text-orange-500">{product.category}</p><h3 className="mt-1 line-clamp-2 text-sm font-black text-slate-950">{product.name}</h3><p className="mt-2 text-sm font-black text-slate-900">{formatCurrency(product.price)}</p></div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
