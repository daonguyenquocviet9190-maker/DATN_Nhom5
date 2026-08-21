"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2, Scale, Trash2 } from "lucide-react";
import { getProductById } from "@/services/product.service";
import { getCompareIds, removeCompareId } from "@/utils/compareStorage";
import { getProductImage, PRODUCT_FALLBACK } from "@/utils/imageUrl";
import { formatCurrency } from "@/data/shop";

function bestPrice(product) {
  const active = (product?.variants || []).filter((v) => v?.is_active !== false);
  const prices = active.map((v) => Number(v?.discount_price || v?.price || 0)).filter((x) => x > 0);
  return prices.length ? Math.min(...prices) : Number(product?.price || 0);
}

function stock(product) {
  return (product?.variants || []).reduce((sum, v) => sum + Number(v?.stock || 0), 0);
}

export default function ComparePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    const ids = getCompareIds();
    if (!ids.length) { setProducts([]); setLoading(false); return; }
    try {
      setLoading(true);
      const rows = await Promise.all(ids.map((id) => getProductById(id)));
      setProducts(rows.filter(Boolean));
      setError("");
    } catch (err) {
      setError(err?.message || "Không tải được sản phẩm so sánh.");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const remove = (id) => { removeCompareId(id); setProducts((rows) => rows.filter((x) => Number(x.id) !== Number(id))); };

  return <main className="min-h-screen bg-slate-50 py-10"><div className="container-page">
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.22em] text-orange-500">Compare</p><h1 className="mt-2 text-4xl font-black text-slate-950">So sánh sản phẩm</h1><p className="mt-2 text-sm text-slate-500">So sánh tối đa 4 sản phẩm theo giá, thương hiệu và thông tin đang bán.</p></div><Link href="/shop" className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white">Thêm sản phẩm</Link></div>
    {error && <div className="mb-4 rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-600">{error}</div>}
    {loading ? <div className="grid h-72 place-items-center"><Loader2 className="animate-spin text-orange-500" size={34}/></div> : products.length === 0 ? <div className="rounded-[30px] border border-slate-200 bg-white p-12 text-center"><Scale className="mx-auto text-orange-500" size={42}/><h2 className="mt-4 text-2xl font-black">Chưa có sản phẩm để so sánh</h2><Link href="/shop" className="mt-5 inline-flex rounded-2xl bg-orange-500 px-6 py-3 font-black text-white">Đến cửa hàng</Link></div> : <div className="overflow-x-auto rounded-[30px] border border-slate-200 bg-white shadow-sm"><table className="min-w-[900px] w-full text-left"><tbody>
      <tr className="border-b border-slate-200"><th className="w-48 p-5 text-sm font-black text-slate-500">Sản phẩm</th>{products.map((p)=><td key={p.id} className="p-5 align-top"><div className="relative"><button onClick={()=>remove(p.id)} className="absolute right-0 top-0 grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-500"><Trash2 size={16}/></button><img src={getProductImage(p)} onError={(e)=>{e.currentTarget.src=PRODUCT_FALLBACK}} alt={p.name} className="h-40 w-full max-w-[220px] rounded-2xl object-cover"/><Link href={`/shop/product/${p.id}`} className="mt-3 block max-w-[220px] text-base font-black text-slate-950 hover:text-orange-600">{p.name}</Link></div></td>)}</tr>
      <Row label="Giá" products={products} render={(p)=><b className="text-orange-600">{formatCurrency(bestPrice(p))}</b>}/>
      <Row label="Thương hiệu" products={products} render={(p)=>p?.brand?.name || p?.brand_name || "—"}/>
      <Row label="Danh mục" products={products} render={(p)=>p?.category?.name || p?.category_name || "—"}/>
      <Row label="Tồn kho" products={products} render={(p)=>`${stock(p)} sản phẩm`}/>
      <Row label="Số biến thể" products={products} render={(p)=>String((p?.variants || []).length)}/>
      <Row label="Mô tả" products={products} render={(p)=><span className="line-clamp-5 text-sm leading-6 text-slate-500">{p?.short_description || p?.description || "—"}</span>}/>
    </tbody></table></div>}
  </div></main>;
}

function Row({ label, products, render }) {
  return <tr className="border-b border-slate-100 last:border-0"><th className="p-5 text-sm font-black text-slate-500">{label}</th>{products.map((p)=><td key={p.id} className="p-5 align-top text-sm font-bold text-slate-700">{render(p)}</td>)}</tr>;
}
