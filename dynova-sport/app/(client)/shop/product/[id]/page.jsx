"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useMemo, useState, use } from "react";
import { ArrowLeft, CheckCircle, Heart, Minus, Plus, ShieldCheck, ShoppingBag, Star, Truck, User } from "lucide-react";
import { formatCurrency } from "@/data/shop";
import { addToCart, getProducts, getWishlist, toggleWishlist } from "@/utils/shopStorage";

export default function ProductDetailPage({ params }) {
  const router = useRouter();
  const resolvedParams = typeof params?.then === "function" ? use(params) : params;
  const productId = Number(resolvedParams?.id);
  const product = useMemo(() => getProducts().find((item) => Number(item.id) === productId) || getProducts()[0], [productId]);
  const [mainImage, setMainImage] = useState(product.image);
  const [size, setSize] = useState(product.sizes?.[0] || "Freesize");
  const [color, setColor] = useState(product.colors?.[0] || "Mặc định");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [notice, setNotice] = useState("");
  const [wishlist, setWishlist] = useState(getWishlist().map(Number));
  const [reviews, setReviews] = useState([
    { id: 1, name: "Nguyễn Hoàng", rating: 5, content: "Sản phẩm đẹp, đóng gói chỉn chu và đúng size tư vấn." },
    { id: 2, name: "Minh Anh", rating: 4, content: "Chất liệu tốt, giao nhanh. Mình sẽ mua thêm màu khác." },
  ]);
  const [reviewForm, setReviewForm] = useState({ name: "", rating: 5, content: "" });

  const related = getProducts().filter((item) => item.categoryId === product.categoryId && item.id !== product.id).slice(0, 4);
  const liked = wishlist.includes(Number(product.id));

  const showNotice = (text) => {
    setNotice(text);
    setTimeout(() => setNotice(""), 2000);
  };

  const handleAdd = (buyNow = false) => {
    addToCart(product, { size, color, quantity });
    if (buyNow) router.push("/checkout");
    else showNotice("Đã thêm sản phẩm vào giỏ hàng.");
  };

  const handleWishlist = () => {
    setWishlist(toggleWishlist(product.id).map(Number));
  };

  const submitReview = (event) => {
    event.preventDefault();
    if (!reviewForm.name.trim() || !reviewForm.content.trim()) return;
    setReviews([{ id: Date.now(), ...reviewForm }, ...reviews]);
    setReviewForm({ name: "", rating: 5, content: "" });
  };

  return (
    <div className="min-h-screen bg-[#f7f8fb] py-10">
      {notice && <div className="fixed right-5 top-24 z-50 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-2xl">{notice}</div>}
      <div className="container-page">
        <Link href="/shop" className="mb-6 inline-flex items-center gap-2 text-sm font-black text-slate-500 hover:text-orange-600"><ArrowLeft size={16} /> Quay lại cửa hàng</Link>
        <div className="grid gap-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-2 lg:p-8">
          <div>
            <div className="overflow-hidden rounded-3xl bg-slate-100"><img src={mainImage} alt={product.name} className="aspect-square w-full object-cover" /></div>
            <div className="mt-4 flex gap-3 overflow-x-auto no-scrollbar">
              {product.gallery.map((image) => <button key={image} onClick={() => setMainImage(image)} className={"h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 " + (mainImage === image ? "border-orange-500" : "border-slate-200")}><img src={image} alt="Ảnh sản phẩm" className="h-full w-full object-cover" /></button>)}
            </div>
          </div>

          <div className="flex flex-col justify-between gap-7">
            <div>
              <div className="flex items-start justify-between gap-4">
                <div><p className="text-xs font-black uppercase tracking-[0.25em] text-orange-500">{product.category}</p><h1 className="mt-3 text-3xl font-black leading-tight text-slate-950 md:text-4xl">{product.name}</h1></div>
                <button onClick={handleWishlist} className={"rounded-2xl p-3 shadow-sm " + (liked ? "bg-rose-500 text-white" : "bg-slate-100 text-slate-600")} aria-label="Yêu thích"><Heart size={20} className={liked ? "fill-current" : ""} /></button>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-bold text-slate-500"><span className="flex items-center gap-1 text-amber-500"><Star size={16} className="fill-current" /> {product.rating}</span><span>Đã bán {product.sold}</span><span>SKU {product.sku}</span></div>
              <div className="mt-6 rounded-2xl bg-slate-50 p-5"><span className="text-3xl font-black text-orange-600">{formatCurrency(product.price)}</span>{product.oldPrice && <span className="ml-3 text-sm font-bold text-slate-400 line-through">{formatCurrency(product.oldPrice)}</span>}</div>
            </div>

            <div className="space-y-5">
              <div><p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">Màu sắc: <span className="text-slate-950">{color}</span></p><div className="flex flex-wrap gap-2">{product.colors.map((item) => <button key={item} onClick={() => setColor(item)} className={"rounded-xl border px-4 py-2 text-sm font-bold " + (color === item ? "border-orange-500 bg-orange-50 text-orange-600" : "border-slate-200 text-slate-600 hover:border-slate-400")}>{item}</button>)}</div></div>
              <div><p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">Kích thước</p><div className="flex flex-wrap gap-2">{product.sizes.map((item) => <button key={item} onClick={() => setSize(item)} className={"flex h-12 min-w-12 items-center justify-center rounded-xl border px-4 text-sm font-black " + (size === item ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 text-slate-700 hover:border-orange-500")}>{item}</button>)}</div></div>
              <div className="flex items-center gap-4"><p className="text-xs font-black uppercase tracking-wider text-slate-500">Số lượng</p><div className="flex items-center overflow-hidden rounded-xl border border-slate-200"><button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 hover:bg-slate-50"><Minus size={14} /></button><span className="w-10 text-center text-sm font-black">{quantity}</span><button onClick={() => setQuantity(quantity + 1)} className="p-3 hover:bg-slate-50"><Plus size={14} /></button></div></div>
              <div className="grid gap-3 sm:grid-cols-2"><button onClick={() => handleAdd(true)} className="btn-primary rounded-2xl px-5 py-4 text-xs font-black uppercase tracking-wider">Mua ngay</button><button onClick={() => handleAdd(false)} className="btn-ghost flex items-center justify-center gap-2 rounded-2xl px-5 py-4 text-xs font-black uppercase tracking-wider"><ShoppingBag size={16} /> Thêm giỏ</button></div>
              <div className="grid gap-3 text-sm font-bold text-slate-600 sm:grid-cols-3"><p className="flex items-center gap-2"><Truck size={16} className="text-orange-500" /> Giao nhanh</p><p className="flex items-center gap-2"><ShieldCheck size={16} className="text-orange-500" /> Bảo mật</p><p className="flex items-center gap-2"><CheckCircle size={16} className="text-orange-500" /> Đổi trả 30 ngày</p></div>
            </div>
          </div>
        </div>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 md:p-8">
          <div className="mb-6 flex gap-3 border-b border-slate-200">
            <button onClick={() => setActiveTab("description")} className={"pb-4 text-sm font-black uppercase tracking-wider " + (activeTab === "description" ? "border-b-2 border-orange-500 text-orange-600" : "text-slate-400")}>Mô tả</button>
            <button onClick={() => setActiveTab("reviews")} className={"pb-4 text-sm font-black uppercase tracking-wider " + (activeTab === "reviews" ? "border-b-2 border-orange-500 text-orange-600" : "text-slate-400")}>Đánh giá ({reviews.length})</button>
          </div>
          {activeTab === "description" ? (
            <div className="max-w-3xl space-y-4 text-sm leading-7 text-slate-600"><h2 className="text-xl font-black text-slate-950">Thông tin sản phẩm</h2><p>{product.description}</p><div className="grid gap-3 rounded-2xl bg-slate-50 p-5 sm:grid-cols-3"><p><b>Thương hiệu:</b><br />{product.brand}</p><p><b>Tồn kho:</b><br />{product.stock} sản phẩm</p><p><b>Phù hợp:</b><br />{product.tags.join(", ")}</p></div></div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
              <form onSubmit={submitReview} className="rounded-2xl bg-slate-50 p-5">
                <h3 className="font-black text-slate-950">Gửi đánh giá</h3>
                <input value={reviewForm.name} onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })} className="input-control mt-4" placeholder="Họ tên" />
                <select value={reviewForm.rating} onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })} className="input-control mt-3"><option value="5">5 sao</option><option value="4">4 sao</option><option value="3">3 sao</option><option value="2">2 sao</option><option value="1">1 sao</option></select>
                <textarea value={reviewForm.content} onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })} className="input-control mt-3 min-h-28" placeholder="Nội dung đánh giá" />
                <button className="btn-primary mt-3 w-full rounded-xl py-3 text-xs font-black uppercase">Gửi đánh giá</button>
              </form>
              <div className="space-y-3">{reviews.map((review) => <div key={review.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-center justify-between"><p className="flex items-center gap-2 font-black text-slate-950"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-50 text-orange-600"><User size={16} /></span>{review.name}</p><p className="text-sm font-black text-amber-500">{review.rating} sao</p></div><p className="mt-3 text-sm leading-6 text-slate-600">{review.content}</p></div>)}</div>
            </div>
          )}
        </section>

        {related.length > 0 && <section className="mt-10"><h2 className="mb-5 text-2xl font-black text-slate-950">Sản phẩm liên quan</h2><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{related.map((item) => <Link key={item.id} href={"/shop/product/" + item.id} className="product-card rounded-2xl border border-slate-200 bg-white p-3"><img src={item.image} alt={item.name} className="aspect-square rounded-xl object-cover" /><h3 className="mt-3 line-clamp-2 text-sm font-black text-slate-950">{item.name}</h3><p className="mt-2 font-black text-orange-600">{formatCurrency(item.price)}</p></Link>)}</div></section>}
      </div>
    </div>
  );
}
