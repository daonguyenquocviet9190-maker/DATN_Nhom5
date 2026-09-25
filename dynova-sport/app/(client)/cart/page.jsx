"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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
  Loader2,
} from "lucide-react";

import { formatCurrency } from "@/data/shop";
import {
  getCart,
  removeCartItem,
  updateCartItem,
} from "@/utils/shopStorage";
import {
  getDefaultPublicSettings,
  getPublicSettings,
} from "@/services/settings.service";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export default function CartPage() {
  const [items, setItems] = useState([]);
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponMessage, setCouponMessage] = useState("");
  const [isErrorCoupon, setIsErrorCoupon] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const [availableVouchers, setAvailableVouchers] = useState([]);
  const [showVoucherDropdown, setShowVoucherDropdown] = useState(false);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const voucherDropdownRef = useRef(null);

  const [notice, setNotice] = useState("");
  const [shippingSettings, setShippingSettings] = useState(
    getDefaultPublicSettings
  );

  const syncCart = () => {
    setItems(getCart());
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (voucherDropdownRef.current && !voucherDropdownRef.current.contains(event.target)) {
        setShowVoucherDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchAvailableVouchers = async () => {
    try {
      setLoadingVouchers(true);
      const res = await fetch(`${API_BASE_URL}/vouchers`, {
        headers: { Accept: "application/json" },
      });
      const data = await res.json();
      if (res.ok) {
        const list = Array.isArray(data) ? data : data.data || [];
        const activeVouchers = list.filter((v) => v.is_active === 1 || v.is_active === true);
        setAvailableVouchers(activeVouchers);
      }
    } catch (err) {
      console.error("Không thể tải danh sách mã giảm giá:", err);
    } finally {
      setLoadingVouchers(false);
    }
  };

  useEffect(() => {
    syncCart();
    fetchAvailableVouchers();

    const handleStockWarning = (event) => {
      const message = event?.detail?.message || "Số lượng vượt quá tồn kho hiện có.";
      setNotice(message);
      syncCart();
    };

    const handleCartSyncError = (event) => {
      const message = event?.detail?.message || "Không thể cập nhật giỏ hàng.";
      setNotice(message);
      syncCart();
    };

    window.addEventListener("dynova:cart-stock-warning", handleStockWarning);
    window.addEventListener("dynova:cart-sync-error", handleCartSyncError);
    window.addEventListener("dynova:cart", syncCart);
    window.addEventListener("storage", syncCart);

    return () => {
      window.removeEventListener("dynova:cart-stock-warning", handleStockWarning);
      window.removeEventListener("dynova:cart-sync-error", handleCartSyncError);
      window.removeEventListener("dynova:cart", syncCart);
      window.removeEventListener("storage", syncCart);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    getPublicSettings()
      .then((response) => {
        if (mounted) {
          setShippingSettings(response.settings);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [items]);

  const freeShippingTarget = Math.max(
    1,
    Number(shippingSettings.free_shipping_threshold || 500000)
  );
  const defaultShippingFee = Math.max(
    0,
    Number(shippingSettings.default_shipping_fee || 30000)
  );
  const shipping =
    subtotal >= freeShippingTarget || subtotal === 0
      ? 0
      : defaultShippingFee;

  const finalTotal = useMemo(() => {
    const totalAfterDiscount = subtotal - discountAmount;
    return Math.max(0, totalAfterDiscount) + shipping;
  }, [subtotal, discountAmount, shipping]);

  const progress = Math.min(
    100,
    Math.round((subtotal / freeShippingTarget) * 100)
  );

  const missingFreeShip = Math.max(0, freeShippingTarget - subtotal);

  const showNotice = (text) => {
    setNotice(text);
    setTimeout(() => setNotice(""), 2000);
  };

  const updateQty = (key, qty) => {
    const item = items.find((cartItem) => cartItem.key === key);
    const requestedQty = Math.max(1, Number(qty || 1));
    const stock = Number(item?.stock ?? item?.max_quantity ?? 0);
    const stockKnown = item?.stock_known !== false;

    if (item && stockKnown && stock <= 0) {
      showNotice(`${item.name} hiện đã hết hàng.`);
      return;
    }

    if (item && stockKnown && requestedQty > stock) {
      showNotice(`${item.name} chỉ còn ${stock} sản phẩm trong kho.`);
      return;
    }

    const nextItems = updateCartItem(key, requestedQty);
    setItems(nextItems);

    if (appliedCoupon) {
      const nextSubtotal = nextItems.reduce(
        (sum, cartItem) =>
          sum + Number(cartItem.price || 0) * Number(cartItem.quantity || 1),
        0
      );
      reValidateCoupon(appliedCoupon, nextSubtotal);
    }
  };

  const remove = (key) => {
    removeCartItem(key);
    syncCart();
    showNotice("Đã xóa sản phẩm khỏi giỏ hàng.");
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
          coupon: cleanCoupon,
          cart_total: subtotal,
          subtotal: subtotal,
        }),
      });

      const data = await res.json();

      if (res.ok && (data.success || data.status)) {
        const discountVal =
          data.data?.discount_amount ?? data.data?.discount_value ?? data.discount ?? 0;

        setAppliedCoupon(cleanCoupon);
        setDiscountAmount(Number(discountVal));
        setCouponMessage(data.message || "Áp dụng mã giảm giá thành công!");
        setIsErrorCoupon(false);
        showNotice("Đã áp dụng mã giảm giá!");
      } else {
        setDiscountAmount(0);
        setCouponMessage(data.message || "Mã giảm giá không hợp lệ.");
        setIsErrorCoupon(true);
      }
    } catch (error) {
      console.error("Voucher API Error:", error);
      setDiscountAmount(0);
      setCouponMessage("Không thể kết nối đến máy chủ.");
      setIsErrorCoupon(true);
    } finally {
      setIsApplying(false);
    }
  };

  const handleSelectVoucherFromDropdown = (voucherCode) => {
    setCoupon(voucherCode);
    setShowVoucherDropdown(false);
    handleApplyCoupon(voucherCode);
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
        coupon: code,
        cart_total: currentSubtotal,
        subtotal: currentSubtotal,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success || data.status) {
          const discountVal =
            data.data?.discount_amount ?? data.data?.discount_value ?? data.discount ?? 0;
          setDiscountAmount(Number(discountVal));
        } else {
          removeAppliedCoupon();
          setCouponMessage(data.message || "Mã không còn đủ điều kiện.");
          setIsErrorCoupon(true);
        }
      })
      .catch(() => {});
  };

  const removeAppliedCoupon = () => {
    setAppliedCoupon("");
    setCoupon("");
    setDiscountAmount(0);
    setCouponMessage(""); // Xóa sạch thông báo khi hủy mã
    setIsErrorCoupon(false);
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
              Kiểm tra sản phẩm, số lượng và mã giảm giá trước khi thanh toán.
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
              Bạn có thể quay lại cửa hàng để thêm sản phẩm và trải nghiệm thanh toán.
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
                          : "Mua thêm " + formatCurrency(missingFreeShip) + " để miễn phí vận chuyển."}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-400">
                        Mốc miễn phí vận chuyển: {formatCurrency(freeShippingTarget)}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-orange-600">{progress}%</span>
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
                        {item.color || "Mặc định"} / Size {item.size || "Freesize"}
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
              <h2 className="text-xl font-black text-slate-950">Tóm tắt đơn hàng</h2>

              <div className="mt-5 rounded-3xl bg-slate-50 p-4 relative" ref={voucherDropdownRef}>
                <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-700">
                  <Ticket size={16} className="text-orange-500" />
                  Mã giảm giá
                </div>

                <div className="flex gap-2">
                  <input
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                    onClick={() => setShowVoucherDropdown(true)}
                    className="h-[46px] min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black uppercase text-slate-950 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 cursor-pointer"
                    placeholder="Chọn hoặc nhập mã"
                    disabled={isApplying}
                  />

                  <button
                    onClick={() => handleApplyCoupon(coupon)}
                    disabled={isApplying}
                    className="rounded-2xl bg-slate-950 px-4 text-xs font-black uppercase text-white transition hover:bg-orange-500 disabled:opacity-50"
                  >
                    {isApplying ? "Đang xử lý..." : "Áp dụng"}
                  </button>
                </div>

                {showVoucherDropdown && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-60 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
                    <div className="p-2 text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 flex justify-between items-center">
                      <span>Mã giảm giá khả dụng</span>
                      <button 
                        type="button" 
                        onClick={() => setShowVoucherDropdown(false)}
                        className="text-slate-500 hover:text-slate-950"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {loadingVouchers ? (
                      <div className="flex items-center justify-center py-4 text-xs font-bold text-slate-400 gap-2">
                        <Loader2 size={14} className="animate-spin" /> Đang tải mã...
                      </div>
                    ) : availableVouchers.length === 0 ? (
                      <div className="py-4 text-center text-xs font-bold text-slate-400">
                        Hiện không có mã giảm giá nào.
                      </div>
                    ) : (
                      <div className="space-y-1.5 mt-1">
                        {availableVouchers.map((v) => (
                          <div
                            key={v.id || v.code}
                            onClick={() => handleSelectVoucherFromDropdown(v.code)}
                            className="group cursor-pointer rounded-xl p-2.5 transition hover:bg-orange-50 border border-transparent hover:border-orange-200"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-black text-orange-600 text-xs tracking-wider">
                                {v.code}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 group-hover:text-orange-500">
                                Chọn dùng →
                              </span>
                            </div>
                            <p className="text-xs font-bold text-slate-700 mt-0.5 line-clamp-1">
                              {v.title || v.description}
                            </p>
                            {v.min_order_value > 0 && (
                              <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                                Đơn tối thiểu: {formatCurrency(v.min_order_value)}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {appliedCoupon && (
                  <div className="mt-3 flex items-center justify-between rounded-2xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-black text-emerald-700">
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
                  <span className="text-slate-950">{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Vận chuyển tạm tính</span>
                  <span className="text-slate-950">
                    {shipping === 0 ? "Miễn phí" : formatCurrency(shipping)}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
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
    </div>
  );
}