"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Minus, Plus, ShieldCheck, ShoppingBag, Ticket, Trash2, Truck } from "lucide-react";
import { formatCurrency } from "@/data/shop";
import { calculateOrder, getCart, removeCartItem, updateCartItem } from "@/utils/shopStorage";

export default function CartPage() {
  const [items, setItems] = useState([]);
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");

  const sync = () => setItems(getCart());
  useEffect(() => { sync(); }, []);

  const totals = useMemo(() => calculateOrder(items, appliedCoupon), [items, appliedCoupon]);
  const progress = Math.min(100, (totals.subtotal / 799000) * 100);

  const updateQty = (key, qty) => {
    updateCartItem(key, qty);
    sync();
  };

  const remove = (key) => {
    removeCartItem(key);
    sync();
  };

  return (
    <div className="min-h-screen bg-[#f7f8fb] py-10">
      <div className="container-page">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-black uppercase tracking-[0.25em] text-orange-500">Shopping cart</p><h1 className="mt-2 text-4xl font-black text-slate-950">Giỏ hàng của bạn</h1></div>
          <Link href="/shop" className="btn-ghost inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black"><ArrowLeft size={16} /> Tiếp tục mua sắm</Link>
        </div>

        {items.length === 0 ? (
          <div className="surface mx-auto max-w-xl rounded-3xl p-10 text-center"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-50 text-orange-500"><ShoppingBag size={34} /></div><h2 className="mt-5 text-2xl font-black text-slate-950">Giỏ hàng đang trống</h2><p className="mt-2 text-sm leading-6 text-slate-500">Bạn có thể quay lại cửa hàng để thêm sản phẩm và thử luồng checkout đầy đủ.</p><Link href="/shop" className="btn-primary mt-6 inline-flex rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-wider">Khám phá sản phẩm</Link></div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <section className="space-y-4">
              <div className="surface rounded-2xl p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700"><Truck size={17} className="text-orange-500" /> {totals.shipping === 0 ? "Đơn hàng đã được miễn phí vận chuyển." : "Mua thêm " + formatCurrency(799000 - totals.subtotal) + " để miễn phí vận chuyển."}</div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-orange-500 transition-all" style={{ width: progress + "%" }} /></div>
              </div>

              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
                {items.map((item) => (
                  <div key={item.key} className="grid gap-4 border-b border-slate-100 p-5 last:border-b-0 sm:grid-cols-[96px_1fr_auto] sm:items-center">
                    <img src={item.image} alt={item.name} className="h-24 w-24 rounded-2xl object-cover" />
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-wider text-orange-500">{item.category}</p>
                      <h3 className="mt-1 font-black text-slate-950">{item.name}</h3>
                      <p className="mt-1 text-sm font-semibold text-slate-500">{item.color} / Size {item.size}</p>
                      <p className="mt-2 font-black text-orange-600">{formatCurrency(item.price)}</p>
                    </div>
                    <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                      <div className="flex items-center overflow-hidden rounded-xl border border-slate-200"><button onClick={() => updateQty(item.key, item.quantity - 1)} className="p-3 hover:bg-slate-50"><Minus size={13} /></button><span className="w-10 text-center text-sm font-black">{item.quantity}</span><button onClick={() => updateQty(item.key, item.quantity + 1)} className="p-3 hover:bg-slate-50"><Plus size={13} /></button></div>
                      <p className="font-black text-slate-950">{formatCurrency(item.price * item.quantity)}</p>
                      <button onClick={() => remove(item.key)} className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500" aria-label="Xóa"><Trash2 size={17} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <aside className="surface h-fit rounded-3xl p-6 lg:sticky lg:top-24">
              <h2 className="text-lg font-black text-slate-950">Tóm tắt đơn hàng</h2>
              <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-700"><Ticket size={16} className="text-orange-500" /> Mã giảm giá</div>
                <div className="flex gap-2"><input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} className="input-control" placeholder="DYNOVANEW" /><button onClick={() => setAppliedCoupon(coupon)} className="btn-primary rounded-xl px-4 text-xs font-black uppercase">Áp dụng</button></div>
                {totals.message && <p className="mt-2 text-xs font-bold text-slate-500">{totals.message}</p>}
              </div>
              <div className="mt-5 space-y-3 text-sm font-bold text-slate-600"><div className="flex justify-between"><span>Tạm tính</span><span className="text-slate-950">{formatCurrency(totals.subtotal)}</span></div><div className="flex justify-between"><span>Vận chuyển</span><span className="text-slate-950">{totals.shipping === 0 ? "Miễn phí" : formatCurrency(totals.shipping)}</span></div>{totals.discount > 0 && <div className="flex justify-between text-rose-600"><span>Giảm giá</span><span>-{formatCurrency(totals.discount)}</span></div>}</div>
              <div className="mt-5 border-t border-dashed border-slate-200 pt-5"><div className="flex items-end justify-between"><span className="font-black text-slate-950">Tổng cộng</span><span className="text-3xl font-black text-orange-600">{formatCurrency(totals.total)}</span></div></div>
              <Link href="/checkout" className="btn-primary mt-6 block rounded-2xl py-4 text-center text-xs font-black uppercase tracking-wider">Tiến hành thanh toán</Link>
              <p className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-slate-500"><ShieldCheck size={15} className="text-emerald-500" /> Dữ liệu thanh toán được xử lý bảo mật</p>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
