"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Ticket,
  Trash2,
  Truck,
  X,
  ChevronRight,
  Loader2,
} from "lucide-react";

import { formatCurrency } from "@/data/shop";
import {
  getCart,
  removeCartItem,
  updateCartItem,
} from "@/utils/shopStorage";

const FREE_SHIPPING_TARGET = 799000;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

// Danh sách voucher dự phòng nếu API backend chưa trả về dữ liệu
const DEFAULT_VOUCHERS = [
  { code: "DYNOVA10", discount_percent: 10, min_subtotal: 0, description: "Giảm 10% cho mọi đơn hàng" },
  { code: "DYNOVA20", discount_percent: 20, min_subtotal: 500000, description: "Giảm 20% cho đơn từ 500k" },
  { code: "SUMMER50K", discount_amount: 50000, min_subtotal: 300000, description: "Giảm 50.000đ cho đơn từ 300k" },
];

export default function CartPage() {
  const [items, setItems] = useState([]);
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponMessage, setCouponMessage] = useState("");
  const [isErrorCoupon, setIsErrorCoupon] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // States quản lý Modal Mã Giảm Giá
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vouchers, setVouchers] = useState(DEFAULT_VOUCHERS);
  const [isLoadingVouchers, setIsLoadingVouchers] = useState(false);

  const [notice, setNotice] = useState("");

  const syncCart = () => {
    setItems(getCart());
    window.dispatchEvent(new Event("dynova:storage"));
  };

  useEffect(() => {
    syncCart();
    fetchAvailableVouchers();
  }, []);

  // Lấy danh sách Voucher từ Backend API
  const fetchAvailableVouchers = async () => {
    setIsLoadingVouchers(true);
    try {
      const res = await fetch(`${API_BASE_URL}/vouchers`);
      const data = await res.json();
      if (res.ok && data.data && Array.isArray(data.data)) {
        setVouchers(data.data);
      }
    } catch (error) {
      console.warn("Không thể tải danh sách voucher từ server, sử dụng danh sách mặc định.", error);
    } finally {
      setIsLoadingVouchers(false);
    }
  };

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [items]);

  const shipping = subtotal >= FREE_SHIPPING_TARGET || subtotal === 0 ? 0 : 30000;

  const finalTotal = useMemo(() => {
    const totalAfterDiscount = subtotal - discountAmount;
    return Math.max(0, totalAfterDiscount) + shipping;
  }, [subtotal, discountAmount, shipping]);

  const progress = Math.min(
    100,
    Math.round((subtotal / FREE_SHIPPING_TARGET) * 100)
  );

  const missingFreeShip = Math.max(0, FREE_SHIPPING_TARGET - subtotal);

  const showNotice = (text) => {
    setNotice(text);
    setTimeout(() => setNotice(""), 2000);
  };

  // Cập nhật số lượng và re-validate lại mã giảm giá dựa trên subtotal mới
  const updateQty = (key, qty) => {
    const updatedQty = Math.max(1, qty);
    updateCartItem(key, updatedQty);
    
    // Lấy lại danh sách giỏ hàng mới nhất để tính chính xác newSubtotal
    const updatedCart = getCart();
    setItems(updatedCart);
    window.dispatchEvent(new Event("dynova:storage"));

    const newSubtotal = updatedCart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    if (appliedCoupon) {
      reValidateCoupon(appliedCoupon, newSubtotal);
    }
  };

  const remove = (key) => {
    removeCartItem(key);
    const updatedCart = getCart();
    setItems(updatedCart);
    window.dispatchEvent(new Event("dynova:storage"));
    
    const newSubtotal = updatedCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    showNotice("Đã xóa sản phẩm khỏi giỏ hàng.");

    if (appliedCoupon) {
      reValidateCoupon(appliedCoupon, newSubtotal);
    }
  };

  const handleApplyCoupon = async (codeToApply) => {
    const cleanCoupon = codeToApply.trim().toUpperCase();

    if (!cleanCoupon) {
      removeAppliedCoupon();
      setCouponMessage("Vui lòng nhập mã giảm giá.");
      setIsErrorCoupon(true);
      return;
    }

    setIsApplying(true);
    setCouponMessage("");

    try {
      const res = await fetch(`${API_BASE_URL}/vouchers/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          code: cleanCoupon,
          cart_total: subtotal,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setAppliedCoupon(data.data.code);
        setCoupon(data.data.code);
        setDiscountAmount(data.data.discount_amount);
        setCouponMessage(data.message || "Áp dụng mã giảm giá thành công!");
        setIsErrorCoupon(false);
        showNotice("Đã áp dụng mã giảm giá!");
      } else {
        setDiscountAmount(0);
        setCouponMessage(data.message || "Mã giảm giá không hợp lệ.");
        setIsErrorCoupon(true);
      }
    } catch (error) {
      console.error("Không thể áp dụng mã giảm giá:", error);
      setDiscountAmount(0);
      setCouponMessage("Không thể kết nối đến máy chủ.");
      setIsErrorCoupon(true);
    } finally {
      setIsApplying(false);
    }
  };

  const reValidateCoupon = (code, currentSubtotal) => {
    fetch(`${API_BASE_URL}/vouchers/apply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        code: code,
        cart_total: currentSubtotal,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDiscountAmount(data.data.discount_amount);
        } else {
          removeAppliedCoupon();
          setCouponMessage(data.message || "Đơn hàng không còn đủ điều kiện dùng mã.");
          setIsErrorCoupon(true);
        }
      })
      .catch(() => {});
  };

  const removeAppliedCoupon = () => {
    setAppliedCoupon("");
    setCoupon("");
    setDiscountAmount(0);
    setCouponMessage("");
    setIsErrorCoupon(false);
  };

  const handleSelectVoucherFromModal = (code) => {
    setCoupon(code);
    setIsModalOpen(false);
    handleApplyCoupon(code);
  };

  return (
    <div className="min-h-screen bg-[#f7f8fb] py-10">
      {notice && (
        <div className="fixed right-5 top-24 z-[90] rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-2xl">
          <div className="flex items-center gap-3">
            <CheckCircle size={17} className="text-orange-300" />
            {notice}
          </div>
        </div>
      )}

      <div className="container-page">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-500">
              Shopping cart
            </p>

            <h1 className="mt-2 text-4xl font-black tracking-[-0.03em] text-slate-950">
              Giỏ hàng của bạn
            </h1>

            <p className="mt-2 text-sm leading-7 text-slate-500">
              Kiểm tra sản phẩm, số lượng và chọn mã giảm giá trước khi thanh toán.
            </p>
          </div>

          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:-translate-x-1 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
          >
            <ArrowLeft size={16} />
            Tiếp tục mua sắm
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="mx-auto max-w-xl rounded-[34px] border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-50 text-orange-500">
              <ShoppingBag size={34} />
            </div>

            <h2 className="mt-5 text-2xl font-black text-slate-950">
              Giỏ hàng đang trống
            </h2>

            <p className="mt-2 text-sm leading-7 text-slate-500">
              Bạn có thể quay lại cửa hàng để thêm sản phẩm và trải nghiệm luồng checkout đầy đủ.
            </p>

            <Link
              href="/shop"
              className="mt-6 inline-flex rounded-2xl bg-orange-500 px-6 py-4 text-xs font-black uppercase tracking-wider text-white transition hover:bg-orange-600"
            >
              Khám phá sản phẩm
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_390px]">
            <section className="space-y-4">
              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                      <Truck size={20} />
                    </div>

                    <div>
                      <p className="text-sm font-black text-slate-950">
                        {missingFreeShip === 0
                          ? "Bạn đã được miễn phí vận chuyển."
                          : "Mua thêm " +
                            formatCurrency(missingFreeShip) +
                            " để miễn phí vận chuyển."}
                      </p>

                      <p className="mt-1 text-xs font-bold text-slate-400">
                        Mốc miễn phí vận chuyển:{" "}
                        {formatCurrency(FREE_SHIPPING_TARGET)}
                      </p>
                    </div>
                  </div>

                  <span className="text-sm font-black text-orange-600">
                    {progress}%
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-orange-500 transition-all duration-700"
                    style={{ width: progress + "%" }}
                  />
                </div>
              </div>

              <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
                {items.map((item) => (
                  <div
                    key={item.key}
                    className="grid gap-4 border-b border-slate-100 p-5 last:border-b-0 sm:grid-cols-[96px_1fr_auto] sm:items-center"
                  >
                    <Link
                      href={"/shop/product/" + item.id}
                      className="block overflow-hidden rounded-2xl bg-slate-100"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-24 w-24 object-cover transition duration-500 hover:scale-105"
                      />
                    </Link>

                    <div>
                      <p className="text-[11px] font-black uppercase tracking-wider text-orange-500">
                        {item.category || "Dynova Sport"}
                      </p>

                      <Link href={"/shop/product/" + item.id}>
                        <h3 className="mt-1 line-clamp-2 font-black text-slate-950 transition hover:text-orange-600">
                          {item.name}
                        </h3>
                      </Link>

                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        {item.color || "Mặc định"} / Size{" "}
                        {item.size || "Freesize"}
                      </p>

                      <p className="mt-2 font-black text-orange-600">
                        {formatCurrency(item.price)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                      <div className="flex items-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        <button
                          onClick={() => updateQty(item.key, item.quantity - 1)}
                          className="p-3 text-slate-500 transition hover:bg-slate-50 hover:text-orange-600"
                        >
                          <Minus size={13} />
                        </button>

                        <span className="w-10 text-center text-sm font-black text-slate-950">
                          {item.quantity}
                        </span>

                        <button
                          onClick={() => updateQty(item.key, item.quantity + 1)}
                          className="p-3 text-slate-500 transition hover:bg-slate-50 hover:text-orange-600"
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      <p className="font-black text-slate-950">
                        {formatCurrency(item.price * item.quantity)}
                      </p>

                      <button
                        onClick={() => remove(item.key)}
                        className="rounded-xl p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500"
                        aria-label="Xóa sản phẩm"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <aside className="h-fit rounded-[30px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 lg:sticky lg:top-24">
              <h2 className="text-xl font-black text-slate-950">
                Tóm tắt đơn hàng
              </h2>

              <div className="mt-5 rounded-3xl bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-black text-slate-700">
                    <Ticket size={16} className="text-orange-500" />
                    Mã giảm giá
                  </div>

                  {/* Nút mở Pop-up Chọn Mã Giảm Giá */}
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-1 text-xs font-black text-orange-600 transition hover:text-orange-700 hover:underline"
                  >
                    Chọn mã có sẵn
                    <ChevronRight size={14} />
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                    onClick={() => setIsModalOpen(true)}
                    readOnly
                    className="h-[46px] min-w-0 flex-1 cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black uppercase text-slate-950 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
                    placeholder="Bấm để chọn mã..."
                  />

                  <button
                    onClick={() => handleApplyCoupon(coupon)}
                    disabled={isApplying || !coupon}
                    className="rounded-2xl bg-slate-950 px-4 text-xs font-black uppercase text-white transition hover:bg-orange-500 disabled:opacity-50"
                  >
                    {isApplying ? <Loader2 size={16} className="animate-spin" /> : "Áp dụng"}
                  </button>
                </div>

                {appliedCoupon && (
                  <div className="mt-3 flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
                    <span>Đang áp dụng: {appliedCoupon}</span>
                    <button
                      onClick={removeAppliedCoupon}
                      className="text-emerald-500 hover:text-rose-500"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {couponMessage && (
                  <p
                    className={`mt-2 flex items-center gap-1.5 text-xs font-bold ${
                      isErrorCoupon ? "text-rose-500" : "text-emerald-600"
                    }`}
                  >
                    {isErrorCoupon && <AlertCircle size={14} />}
                    {couponMessage}
                  </p>
                )}
              </div>

              <div className="mt-5 space-y-3 text-sm font-bold text-slate-600">
                <div className="flex justify-between">
                  <span>Tạm tính</span>
                  <span className="text-slate-950">
                    {formatCurrency(subtotal)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Vận chuyển tạm tính</span>
                  <span className="text-slate-950">
                    {shipping === 0 ? "Miễn phí" : formatCurrency(shipping)}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between font-bold text-rose-600">
                    <span>Giảm giá ({appliedCoupon})</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
              </div>

              <div className="mt-5 border-t border-dashed border-slate-200 pt-5">
                <div className="flex items-end justify-between">
                  <span className="font-black text-slate-950">Tổng cộng</span>
                  <span className="text-3xl font-black text-orange-600">
                    {formatCurrency(finalTotal)}
                  </span>
                </div>
              </div>

              <Link
                href={{
                  pathname: "/checkout",
                  query: appliedCoupon ? { coupon: appliedCoupon } : {},
                }}
                className="mt-6 block rounded-2xl bg-orange-500 py-4 text-center text-xs font-black uppercase tracking-wider text-white transition hover:-translate-y-0.5 hover:bg-orange-600"
              >
                Tiến hành thanh toán
              </Link>

              <p className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
                <ShieldCheck size={15} className="text-emerald-500" />
                Phí vận chuyển thật sẽ tính ở bước checkout
              </p>
            </aside>
          </div>
        )}
      </div>

      {/* MODAL CHỌN MÃ GIẢM GIÁ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-[32px] border border-slate-100 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                  <Ticket size={18} />
                </div>
                <h3 className="text-lg font-black text-slate-950">
                  Chọn Dynova Voucher
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 max-h-[380px] space-y-3 overflow-y-auto pr-1">
              {isLoadingVouchers ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                  <Loader2 size={28} className="animate-spin text-orange-500" />
                  <p className="mt-2 text-xs font-bold">Đang tải danh sách voucher...</p>
                </div>
              ) : (
                vouchers.map((v) => {
                  const minSpend = v.min_subtotal || v.min_order_value || 0;
                  const isEligible = subtotal >= minSpend;

                  return (
                    <div
                      key={v.code}
                      className={`flex items-center justify-between rounded-2xl border p-4 transition ${
                        isEligible
                          ? "border-orange-200 bg-orange-50/30 hover:border-orange-400 hover:bg-orange-50"
                          : "border-slate-200 bg-slate-50/50 opacity-60"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="rounded-lg bg-orange-500 px-2 py-0.5 text-xs font-black text-white">
                            {v.code}
                          </span>
                          {!isEligible && (
                            <span className="text-[10px] font-bold text-rose-500">
                              Cần thêm {formatCurrency(minSpend - subtotal)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-slate-700">
                          {v.description || v.desc || `Giảm giá cho đơn hàng từ ${formatCurrency(minSpend)}`}
                        </p>
                      </div>

                      <button
                        disabled={!isEligible}
                        onClick={() => handleSelectVoucherFromModal(v.code)}
                        className={`rounded-xl px-4 py-2 text-xs font-black uppercase transition ${
                          isEligible
                            ? "bg-slate-950 text-white hover:bg-orange-500"
                            : "bg-slate-200 text-slate-400 cursor-not-allowed"
                        }`}
                      >
                        {appliedCoupon === v.code ? "Đang dùng" : "Áp dụng"}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <button
              onClick={() => setIsModalOpen(false)}
              className="mt-5 w-full rounded-2xl bg-slate-100 py-3 text-xs font-black uppercase tracking-wider text-slate-600 transition hover:bg-slate-200"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}