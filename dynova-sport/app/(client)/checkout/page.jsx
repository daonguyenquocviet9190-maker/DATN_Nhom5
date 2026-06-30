"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Banknote, CheckCircle2, CreditCard, Landmark, PackageCheck, ShieldCheck, Smartphone, Truck } from "lucide-react";
import { bankAccount, formatCurrency } from "@/data/shop";
import { calculateOrder, clearCart, createOrder, getCart, getCurrentUser } from "@/utils/shopStorage";

const paymentMethods = [
  { id: "COD", name: "Thanh toán khi nhận hàng", icon: Banknote, desc: "Khách trả tiền sau khi kiểm tra kiện hàng." },
  { id: "BANK", name: "Chuyển khoản ngân hàng", icon: Landmark, desc: "Hiển thị thông tin tài khoản và nội dung chuyển khoản." },
  { id: "VNPAY", name: "VNPAY demo", icon: CreditCard, desc: "Mô phỏng luồng thanh toán online và trả kết quả thành công." },
  { id: "MOMO", name: "MoMo demo", icon: Smartphone, desc: "Sẵn giao diện để thay bằng API merchant thật." },
];

export default function CheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [coupon, setCoupon] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [isPaying, setIsPaying] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", address: "", note: "" });

  useEffect(() => {
    const cart = getCart();
    setItems(cart);
    const user = getCurrentUser();
    if (user) setForm((prev) => ({ ...prev, fullName: user.fullName || "", email: user.email || "", phone: user.phone || "", address: user.address || "" }));
  }, []);

  const totals = useMemo(() => calculateOrder(items, coupon), [items, coupon]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!items.length) return;
    const online = ["VNPAY", "MOMO", "ZALOPAY"].includes(paymentMethod);
    const payload = {
      customerName: form.fullName,
      email: form.email,
      phone: form.phone,
      address: form.address,
      note: form.note,
      items,
      coupon,
      paymentMethod,
      paymentStatus: online ? "Đang xử lý online" : paymentMethod === "BANK" ? "Chờ chuyển khoản" : "Chờ thanh toán",
      subtotal: totals.subtotal,
      shipping: totals.shipping,
      discount: totals.discount,
      total: totals.total,
    };

    if (online) {
      setIsPaying(true);
      setTimeout(() => {
        const order = createOrder({ ...payload, paymentStatus: "Đã thanh toán", status: "Đã thanh toán", timeline: ["Đã tiếp nhận", "Đã thanh toán online"] });
        clearCart();
        setItems([]);
        setIsPaying(false);
        setSuccessOrder(order);
      }, 1600);
    } else {
      const order = createOrder(payload);
      clearCart();
      setItems([]);
      setSuccessOrder(order);
    }
  };

  if (successOrder) {
    return (
      <div className="min-h-screen bg-[#f7f8fb] py-14">
        <div className="container-page">
          <div className="surface mx-auto max-w-2xl rounded-3xl p-8 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600"><CheckCircle2 size={38} /></div>
            <h1 className="mt-5 text-3xl font-black text-slate-950">Đặt hàng thành công</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">Mã đơn <b>{successOrder.id}</b> đã được tạo. Bạn có thể theo dõi trạng thái xử lý trong lịch sử mua hàng.</p>
            <div className="mt-6 rounded-2xl bg-slate-50 p-5 text-left text-sm font-bold text-slate-600"><div className="flex justify-between"><span>Thanh toán</span><span>{successOrder.paymentMethod}</span></div><div className="mt-2 flex justify-between"><span>Trạng thái</span><span>{successOrder.paymentStatus}</span></div><div className="mt-2 flex justify-between"><span>Tổng tiền</span><span className="text-orange-600">{formatCurrency(successOrder.total)}</span></div></div>
            <div className="mt-6 flex flex-wrap justify-center gap-3"><button onClick={() => router.push("/orders")} className="btn-primary rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-wider">Theo dõi đơn hàng</button><Link href="/shop" className="btn-ghost rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-wider">Tiếp tục mua</Link></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fb] py-10">
      {isPaying && <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/65 p-4 backdrop-blur-sm"><div className="float-in max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl"><div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-orange-500" /><h2 className="text-xl font-black text-slate-950">Đang xử lý thanh toán</h2><p className="mt-2 text-sm leading-6 text-slate-500">Đây là cổng online demo. Khi có merchant key thật, bước này sẽ gọi API thanh toán và nhận callback.</p></div></div>}
      <div className="container-page">
        <div className="mb-8"><p className="text-xs font-black uppercase tracking-[0.25em] text-orange-500">Checkout</p><h1 className="mt-2 text-4xl font-black text-slate-950">Đặt hàng & thanh toán</h1></div>
        {items.length === 0 ? (
          <div className="surface rounded-3xl p-10 text-center"><PackageCheck className="mx-auto text-orange-500" size={42} /><h2 className="mt-4 text-2xl font-black text-slate-950">Không có sản phẩm để thanh toán</h2><Link href="/shop" className="btn-primary mt-6 inline-block rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-wider">Quay lại cửa hàng</Link></div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_390px]">
            <section className="space-y-6">
              <div className="surface rounded-3xl p-6"><h2 className="mb-5 text-xl font-black text-slate-950">Thông tin nhận hàng</h2><div className="grid gap-4 md:grid-cols-2"><input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="input-control" placeholder="Họ và tên" /><input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-control" placeholder="Số điện thoại" /><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-control" placeholder="Email" /><input required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input-control" placeholder="Địa chỉ giao hàng" /></div><textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="input-control mt-4 min-h-24" placeholder="Ghi chú cho cửa hàng hoặc đơn vị vận chuyển" /></div>

              <div className="surface rounded-3xl p-6"><h2 className="mb-5 text-xl font-black text-slate-950">Phương thức thanh toán</h2><div className="grid gap-3 md:grid-cols-2">{paymentMethods.map((method) => { const Icon = method.icon; return <button key={method.id} type="button" onClick={() => setPaymentMethod(method.id)} className={"rounded-2xl border p-4 text-left transition " + (paymentMethod === method.id ? "border-orange-500 bg-orange-50" : "border-slate-200 bg-white hover:border-slate-300")}><Icon className="text-orange-500" size={22} /><p className="mt-3 font-black text-slate-950">{method.name}</p><p className="mt-1 text-xs leading-5 text-slate-500">{method.desc}</p></button>; })}</div>{paymentMethod === "BANK" && <div className="mt-5 rounded-2xl bg-slate-950 p-5 text-white"><p className="font-black">Thông tin chuyển khoản</p><div className="mt-3 grid gap-2 text-sm text-slate-300"><p>Ngân hàng: <b className="text-white">{bankAccount.bank}</b></p><p>Số tài khoản: <b className="text-white">{bankAccount.accountNumber}</b></p><p>Chủ tài khoản: <b className="text-white">{bankAccount.accountName}</b></p><p>Nội dung: <b className="text-orange-300">DYNOVA + số điện thoại</b></p></div></div>}</div>
            </section>

            <aside className="surface h-fit rounded-3xl p-6 lg:sticky lg:top-24"><h2 className="text-xl font-black text-slate-950">Đơn hàng</h2><div className="mt-5 max-h-72 space-y-3 overflow-y-auto pr-1">{items.map((item) => <div key={item.key} className="flex gap-3"><img src={item.image} alt={item.name} className="h-16 w-16 rounded-xl object-cover" /><div className="min-w-0 flex-1"><p className="line-clamp-2 text-sm font-black text-slate-950">{item.name}</p><p className="text-xs font-semibold text-slate-500">{item.quantity} x {item.size} / {item.color}</p></div><p className="text-sm font-black text-slate-900">{formatCurrency(item.price * item.quantity)}</p></div>)}</div><div className="mt-5 flex gap-2"><input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} className="input-control" placeholder="Mã giảm giá" /></div>{totals.message && <p className="mt-2 text-xs font-bold text-slate-500">{totals.message}</p>}<div className="mt-5 space-y-3 text-sm font-bold text-slate-600"><div className="flex justify-between"><span>Tạm tính</span><span>{formatCurrency(totals.subtotal)}</span></div><div className="flex justify-between"><span>Vận chuyển</span><span>{totals.shipping === 0 ? "Miễn phí" : formatCurrency(totals.shipping)}</span></div>{totals.discount > 0 && <div className="flex justify-between text-rose-600"><span>Giảm giá</span><span>-{formatCurrency(totals.discount)}</span></div>}</div><div className="mt-5 border-t border-dashed border-slate-200 pt-5"><div className="flex items-end justify-between"><span className="font-black text-slate-950">Tổng thanh toán</span><span className="text-3xl font-black text-orange-600">{formatCurrency(totals.total)}</span></div></div><button className="btn-primary mt-6 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-xs font-black uppercase tracking-wider"><Truck size={16} /> Tạo đơn hàng</button><p className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-slate-500"><ShieldCheck size={15} className="text-emerald-500" /> Hỗ trợ COD, chuyển khoản và online</p></aside>
          </form>
        )}
      </div>
    </div>
  );
}
