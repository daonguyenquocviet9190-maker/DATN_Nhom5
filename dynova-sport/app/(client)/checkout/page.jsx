"use client";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  Clock3,
  CreditCard,
  Landmark,
  Loader2,
  MapPin,
  PackageCheck,
  Phone,
  ShieldCheck,
  Tag,
  Truck,
  User,
} from "lucide-react";

import { formatCurrency } from "@/data/shop";
import VietQrPaymentCard from "@/components/payment/VietQrPaymentCard";
import { apiFetch } from "@/services/api";
import {
  calculateShippingFee,
  createCheckoutOrder,
  createPaymentSession,
} from "@/services/checkout.service";
import {
  getShippingDistricts,
  getShippingProvinces,
  getShippingStatus,
  getShippingWards,
} from "@/services/address.service";
import {
  getDefaultPublicSettings,
  getPublicSettings,
} from "@/services/settings.service";
import { clearCart, getCart, getCurrentUser, syncCartAfterLogin } from "@/utils/shopStorage";

const BUY_NOW_KEY = "dynova_buy_now_v1";
const BUY_NOW_MAX_AGE = 30 * 60 * 1000;

function getBuyNowItem() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(BUY_NOW_KEY);
    if (!raw) return null;

    const payload = JSON.parse(raw);
    const createdAt = Number(payload?.createdAt || 0);

    if (!payload?.item || !createdAt || Date.now() - createdAt > BUY_NOW_MAX_AGE) {
      window.sessionStorage.removeItem(BUY_NOW_KEY);
      return null;
    }

    return payload.item;
  } catch {
    window.sessionStorage.removeItem(BUY_NOW_KEY);
    return null;
  }
}

function clearBuyNowItem() {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(BUY_NOW_KEY);
  }
}

const paymentMethods = [
  {
    id: "COD",
    name: "Thanh toán khi nhận hàng",
    desc: "Thanh toán trực tiếp cho đơn vị vận chuyển khi nhận hàng.",
    icon: Banknote,
  },
  {
    id: "BANK",
    name: "Thanh toán QR",
    desc: "Quét mã QR bằng Camera điện thoại để hoàn tất thanh toán.",
    icon: Landmark,
  },
  {
    id: "VNPAY",
    name: "VNPAY",
    desc: "Thanh toán trực tuyến qua cổng VNPAY.",
    icon: CreditCard,
  },
];

function isEmail(value) {
  return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isPhone(value) {
  return /^(0|\+84)[0-9]{8,10}$/.test(String(value || "").replace(/\s/g, ""));
}

function itemProductId(item) {
  return item?.product_id ?? item?.productId ?? item?.product?.id ?? item?.id;
}

function itemVariantId(item) {
  return (
    item?.product_variant_id ??
    item?.variant_id ??
    item?.variantId ??
    item?.selected_variant?.id ??
    item?.selectedVariant?.id ??
    null
  );
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutMode = searchParams?.get("mode") === "buy-now" ? "buy_now" : "cart";
  const isBuyNow = checkoutMode === "buy_now";
  const [items, setItems] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [settings, setSettings] = useState(getDefaultPublicSettings());

  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [addressLoading, setAddressLoading] = useState(true);
  const [shippingSetupError, setShippingSetupError] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  // Danh sách voucher khả dụng
  const [availableVouchers, setAvailableVouchers] = useState([]);
  const [vouchersLoading, setVouchersLoading] = useState(false);

  const [shippingFee, setShippingFee] = useState(null);
  const [shippingMessage, setShippingMessage] = useState("");
  const [shippingInfo, setShippingInfo] = useState(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successOrder, setSuccessOrder] = useState(null);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    provinceCode: "",
    province: "",
    districtCode: "",
    district: "",
    wardCode: "",
    ward: "",
    address: "",
    note: "",
  });

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + Number(item?.price || 0) * Number(item?.quantity || item?.qty || 1),
        0
      ),
    [items]
  );

  const totalWeight = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + Number(item?.weight || 300) * Number(item?.quantity || item?.qty || 1),
        0
      ),
    [items]
  );

  const displayedShipping = shippingFee === null ? 0 : Number(shippingFee);
  const displayedTotal = Math.max(0, subtotal - discountAmount + displayedShipping);
  const bankConfigured = Boolean(
    String(settings?.bank_code || "").trim() &&
      String(settings?.bank_account_number || "").trim() &&
      String(settings?.bank_account_name || "").trim()
  );

  useEffect(() => {
    const loadCheckoutItems = () => {
      const buyNowItem = isBuyNow ? getBuyNowItem() : null;
      setItems(buyNowItem ? [buyNowItem] : isBuyNow ? [] : getCart());

      const user = getCurrentUser();
      setCurrentUser(user || null);
      if (user) {
        setForm((prev) => ({
          ...prev,
          fullName: prev.fullName || user.fullName || user.name || "",
          email: prev.email || user.email || "",
          phone: prev.phone || user.phone || "",
          address: prev.address || user.address || "",
        }));
      }
    };

    loadCheckoutItems();

    if (!isBuyNow) {
      window.addEventListener("dynova:cart", loadCheckoutItems);
      window.addEventListener("dynova:storage", loadCheckoutItems);
    }

    return () => {
      window.removeEventListener("dynova:cart", loadCheckoutItems);
      window.removeEventListener("dynova:storage", loadCheckoutItems);
    };
  }, [isBuyNow]);

  useEffect(() => {
    const urlCoupon = searchParams?.get("coupon") || "";
    if (urlCoupon) setCouponInput(urlCoupon.toUpperCase());
  }, [searchParams]);

  useEffect(() => {
    getPublicSettings()
      .then((r) => setSettings(r.settings || getDefaultPublicSettings()))
      .catch(() => setSettings(getDefaultPublicSettings()));
  }, []);

  // Fetch danh sách mã giảm giá khả dụng
  useEffect(() => {
    let isMounted = true;
    const fetchVouchers = async () => {
      setVouchersLoading(true);
      try {
        const response = await apiFetch("/vouchers");
        const list = response?.data || response || [];
        if (isMounted && Array.isArray(list)) {
          setAvailableVouchers(list);
        }
      } catch (err) {
        console.error("Không tải được danh sách mã giảm giá:", err);
      } finally {
        if (isMounted) setVouchersLoading(false);
      }
    };

    fetchVouchers();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (paymentMethod === "BANK" && !bankConfigured) {
      setPaymentMethod("COD");
    }
  }, [bankConfigured, paymentMethod]);

  useEffect(() => {
    let mounted = true;

    const loadShippingAddress = async () => {
      setAddressLoading(true);
      try {
        const status = await getShippingStatus();
        if (!status?.configured) {
          throw new Error("Cửa hàng chưa cấu hình kết nối Giao Hàng Nhanh.");
        }

        const rows = await getShippingProvinces();
        if (!mounted) return;
        const list = Array.isArray(rows) ? rows : [];
        setProvinces(list);
        setShippingSetupError(list.length ? "" : "Không tải được khu vực giao hàng Giao Hàng Nhanh.");
      } catch (error) {
        if (!mounted) return;
        setProvinces([]);
        setShippingSetupError(error?.message || "Chưa thể kết nối Giao Hàng Nhanh.");
      } finally {
        if (mounted) setAddressLoading(false);
      }
    };

    loadShippingAddress();
    return () => {
      mounted = false;
    };
  }, []);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "", submit: "" }));
  };

  const handleProvince = async (event) => {
    const id = event.target.value;
    const province = provinces.find((x) => String(x.id) === String(id));
    setForm((prev) => ({
      ...prev,
      provinceCode: id,
      province: province?.name || "",
      districtCode: "",
      district: "",
      wardCode: "",
      ward: "",
    }));
    setDistricts([]);
    setWards([]);
    setShippingFee(null);
    if (!province) return;
    try {
      setAddressLoading(true);
      setDistricts(await getShippingDistricts(province));
    } catch (error) {
      setErrors((prev) => ({ ...prev, province: error?.message || "Không tải được quận/huyện." }));
    } finally {
      setAddressLoading(false);
    }
  };

  const handleDistrict = async (event) => {
    const id = event.target.value;
    const district = districts.find((x) => String(x.id) === String(id));
    setForm((prev) => ({ ...prev, districtCode: id, district: district?.name || "", wardCode: "", ward: "" }));
    setWards([]);
    setShippingFee(null);
    if (!district) return;
    try {
      setAddressLoading(true);
      setWards(await getShippingWards(district));
    } catch (error) {
      setErrors((prev) => ({ ...prev, district: error?.message || "Không tải được phường/xã." }));
    } finally {
      setAddressLoading(false);
    }
  };

  const handleWard = (event) => {
    const id = event.target.value;
    const ward = wards.find((x) => String(x.id) === String(id));
    setForm((prev) => ({ ...prev, wardCode: id, ward: ward?.name || "" }));
    setShippingFee(null);
  };

  const validate = () => {
    const next = {};
    if (!form.fullName.trim()) next.fullName = "Vui lòng nhập họ tên người nhận.";
    if (!form.phone.trim()) next.phone = "Vui lòng nhập số điện thoại.";
    else if (!isPhone(form.phone)) next.phone = "Số điện thoại chưa đúng định dạng.";
    if (!isEmail(form.email)) next.email = "Email chưa đúng định dạng.";
    if (shippingSetupError) next.shipping = shippingSetupError;
    if (!form.provinceCode) next.province = "Vui lòng chọn tỉnh/thành.";
    if (!form.districtCode) next.district = "Vui lòng chọn quận/huyện.";
    if (!form.wardCode) next.ward = "Vui lòng chọn phường/xã.";
    if (!form.address.trim()) next.address = "Vui lòng nhập số nhà, tên đường.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const applyCouponCode = async (codeOverride) => {
    const code = (codeOverride || couponInput).trim().toUpperCase();
    if (!code || subtotal <= 0) return;
    setCouponLoading(true);
    setCouponMessage("");
    try {
      const response = await apiFetch("/vouchers/apply", {
        method: "POST",
        body: JSON.stringify({ code, subtotal }),
      });
      setAppliedCoupon(code);
      setDiscountAmount(Number(response?.data?.discount_amount ?? response?.discount_amount ?? response?.discount ?? 0));
      setCouponMessage(response?.message || "Áp dụng mã giảm giá thành công.");
    } catch (error) {
      setAppliedCoupon("");
      setDiscountAmount(0);
      setCouponMessage(error?.message || "Mã giảm giá không hợp lệ.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleSelectCoupon = (code) => {
    const upperCode = code.toUpperCase();
    setCouponInput(upperCode);
    applyCouponCode(upperCode);
  };

  const calculateShipping = async () => {
    if (!validate()) return;
    setShippingLoading(true);
    setShippingMessage("");
    try {
      const response = await calculateShippingFee({
        province: form.province,
        provinceCode: form.provinceCode,
        district: form.district,
        districtCode: form.districtCode,
        ward: form.ward,
        wardCode: form.wardCode,
        address: form.address,
        weight: totalWeight || 500,
        value: Math.max(0, subtotal - discountAmount),
      });
      const info = response?.data || {};
      setShippingFee(Number(info?.fee ?? response?.fee ?? 0));
      setShippingInfo(info);
      setShippingMessage(response?.message || "Đã tính phí vận chuyển GHN.");
    } catch (error) {
      setShippingFee(null);
      setShippingMessage(error?.message || "Không thể tính phí vận chuyển.");
    } finally {
      setShippingLoading(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!currentUser) {
      const redirectPath = isBuyNow ? "/checkout?mode=buy-now" : "/checkout";
      router.push(`/login?redirect=${encodeURIComponent(redirectPath)}`);
      return;
    }
    if (!items.length || !validate()) return;
    if (paymentMethod === "BANK" && !bankConfigured) {
      setErrors((prev) => ({
        ...prev,
        submit: "Phương thức chuyển khoản hiện chưa khả dụng.",
      }));
      return;
    }
    setSubmitLoading(true);
    setErrors((prev) => ({ ...prev, submit: "" }));

    try {
      let checkoutItems = items;

      if (!isBuyNow) {
        const synced = await syncCartAfterLogin();
        checkoutItems = Array.isArray(synced?.items) && synced.items.length
          ? synced.items
          : getCart();
      }

      if (!checkoutItems.length) {
        throw new Error(
          isBuyNow
            ? "Sản phẩm mua ngay không còn hợp lệ. Vui lòng chọn lại sản phẩm."
            : "Giỏ hàng chưa có sản phẩm hợp lệ để đặt hàng."
        );
      }

      setItems(checkoutItems);

      const feeResponse = await calculateShippingFee({
        province: form.province,
        provinceCode: form.provinceCode,
        district: form.district,
        districtCode: form.districtCode,
        ward: form.ward,
        wardCode: form.wardCode,
        address: form.address,
        weight: totalWeight || 500,
        value: Math.max(0, subtotal - discountAmount),
      });
      const confirmedShipping = Number(feeResponse?.data?.fee ?? feeResponse?.fee ?? 0);
      setShippingFee(confirmedShipping);
      setShippingInfo(feeResponse?.data || null);

      const normalizedOrderItems = checkoutItems.map((item) => ({
        product_id: Number(itemProductId(item) || 0),
        product_variant_id: itemVariantId(item) ? Number(itemVariantId(item)) : null,
        quantity: Math.max(1, Number(item?.quantity || item?.qty || 1)),
        weight: Math.max(1, Number(item?.weight || 300)),
      }));

      if (normalizedOrderItems.some((item) => !Number.isInteger(item.product_id) || item.product_id <= 0)) {
        throw new Error("Giỏ hàng có dữ liệu sản phẩm chưa đồng bộ. Vui lòng tải lại trang và thử lại.");
      }

      const orderResponse = await createCheckoutOrder({
        customer: { fullName: form.fullName.trim(), email: form.email.trim(), phone: form.phone.trim() },
        shippingAddress: {
          province: form.province,
          provinceCode: form.provinceCode,
          district: form.district,
          districtCode: form.districtCode,
          ward: form.ward,
          wardCode: form.wardCode,
          address: form.address.trim(),
          note: form.note.trim(),
        },
        items: normalizedOrderItems,
        coupon: appliedCoupon || undefined,
        paymentMethod,
        checkoutMode,
        subtotal,
        discount: discountAmount,
        shippingFee: confirmedShipping,
        total: Math.max(0, subtotal - discountAmount + confirmedShipping),
        weight: totalWeight || 500,
      });

      const order = orderResponse?.data ?? orderResponse?.order ?? orderResponse;

      if (isBuyNow) {
        clearBuyNowItem();
      } else {
        clearCart();
      }

      if (paymentMethod === "VNPAY") {
        const payment = await createPaymentSession({ orderId: order.id, provider: "VNPAY" });
        const paymentUrl = payment?.data?.paymentUrl || payment?.data?.payment_url || payment?.payment_url;
        if (!paymentUrl) throw new Error("Không tạo được liên kết thanh toán VNPAY.");
        window.location.assign(paymentUrl);
        return;
      }

      setItems([]);
      setSuccessOrder(order);
    } catch (error) {
      setErrors((prev) => ({ ...prev, submit: error?.message || "Không thể tạo đơn hàng." }));
    } finally {
      setSubmitLoading(false);
    }
  };

  if (successOrder) {
    const total = Number(successOrder?.grand_total ?? successOrder?.total ?? 0);
    const bankPaid = successOrder?.payment_status === "paid";

    return (
      <main className="min-h-screen bg-slate-50 py-12">
        <div className="container-page mx-auto max-w-3xl">
          <div className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/50 md:p-8">
            <div className="text-center">
              {paymentMethod === "BANK" && !bankPaid ? (
                <Clock3 className="mx-auto text-amber-500" size={54} />
              ) : (
                <CheckCircle2 className="mx-auto text-emerald-600" size={54} />
              )}
              <h1 className="mt-4 text-3xl font-black text-slate-950">
                {paymentMethod === "BANK" && !bankPaid ? "Chờ thanh toán" : "Đặt hàng thành công"}
              </h1>
              <p className="mt-2 text-slate-500">
                Mã đơn: <b className="text-slate-950">{successOrder?.order_code}</b>
              </p>
              <p className="mt-2 text-2xl font-black text-orange-600">{formatCurrency(total)}</p>
            </div>

            {paymentMethod === "BANK" ? (
              <VietQrPaymentCard
                orderId={successOrder?.id}
                className="mt-7"
                onPaid={(payment) => {
                  const paidOrderId = payment?.order_id || successOrder?.id;

                  setSuccessOrder((current) => ({
                    ...current,
                    payment_status: "paid",
                    status: payment?.order_status || "confirmed",
                  }));

                  window.setTimeout(() => {
                    if (paidOrderId) {
                      router.replace(`/orders/${paidOrderId}?payment=success`);
                    }
                  }, 900);
                }}
              />
            ) : null}

            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                href={`/orders/${successOrder?.id}`}
                className="rounded-2xl bg-orange-500 px-6 py-3 text-sm font-black text-white"
              >
                Xem đơn hàng
              </Link>
              <Link
                href="/shop"
                className="rounded-2xl border border-slate-200 px-6 py-3 text-sm font-black text-slate-700"
              >
                Tiếp tục mua
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 py-10">
      <div className="container-page">
        <div className="mb-8">
          <p className="text-xs font-black uppercase tracking-[.22em] text-orange-500">Checkout</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Đặt hàng & thanh toán</h1>
          <p className="mt-2 text-sm text-slate-500">Kiểm tra thông tin nhận hàng và phương thức thanh toán trước khi đặt đơn.</p>
        </div>

        {!items.length ? (
          <div className="rounded-[30px] border border-slate-200 bg-white p-10 text-center">
            <PackageCheck className="mx-auto text-orange-500" size={44} />
            <h2 className="mt-4 text-2xl font-black">{isBuyNow ? "Sản phẩm mua ngay không còn hiệu lực" : "Giỏ hàng đang trống"}</h2>
            <Link href="/shop" className="mt-5 inline-flex rounded-2xl bg-orange-500 px-6 py-3 font-black text-white">Mua sắm ngay</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_390px]">
            <section className="space-y-6">
              <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <User className="text-orange-500" size={22} />
                  <h2 className="text-xl font-black">Thông tin người nhận</h2>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <Input label="Họ và tên *" name="fullName" value={form.fullName} onChange={updateField} error={errors.fullName} />
                  <Input label="Số điện thoại *" name="phone" value={form.phone} onChange={updateField} error={errors.phone} />
                  <div className="md:col-span-2"><Input label="Email" name="email" type="email" value={form.email} onChange={updateField} error={errors.email} /></div>
                </div>
              </div>

              <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3"><MapPin className="text-orange-500" size={22} /><h2 className="text-xl font-black">Địa chỉ giao hàng</h2></div>
                {shippingSetupError && (
                  <div className="mt-4 flex gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <span>{shippingSetupError}</span>
                  </div>
                )}
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <>
                    <Select label="Tỉnh/Thành *" value={form.provinceCode} onChange={handleProvince} error={errors.province} disabled={addressLoading || !!shippingSetupError} options={provinces} />
                    <Select label="Quận/Huyện *" value={form.districtCode} onChange={handleDistrict} error={errors.district} disabled={!districts.length || addressLoading || !!shippingSetupError} options={districts} />
                    <Select label="Phường/Xã *" value={form.wardCode} onChange={handleWard} error={errors.ward} disabled={!wards.length || addressLoading || !!shippingSetupError} options={wards} />
                  </>
                  <div className="md:col-span-3"><Input label="Số nhà, tên đường *" name="address" value={form.address} onChange={updateField} error={errors.address} /></div>
                  <div className="md:col-span-3">
                    <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">Ghi chú giao hàng</label>
                    <textarea name="note" value={form.note} onChange={updateField} rows={3} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-orange-400 focus:bg-white" placeholder="Ví dụ: gọi trước khi giao..." />
                  </div>
                </div>
              </div>

              <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div><h2 className="text-xl font-black">Vận chuyển</h2><p className="mt-1 text-sm text-slate-500">Phí giao hàng được tính theo địa chỉ nhận hàng.</p></div>
                  <button type="button" onClick={calculateShipping} disabled={shippingLoading || !!shippingSetupError} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-xs font-black uppercase text-white hover:bg-orange-500 disabled:opacity-60">{shippingLoading ? <Loader2 className="animate-spin" size={16} /> : <Truck size={16} />} Tính phí</button>
                </div>
                <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                  <span className="text-sm font-bold text-slate-500">Phí hiện tại</span>
                  <b className="text-lg text-orange-600">{shippingFee === null ? "Chưa tính" : shippingFee === 0 ? "Miễn phí" : formatCurrency(shippingFee)}</b>
                </div>
                {shippingMessage && <p className="mt-3 text-sm font-bold text-slate-500">{shippingMessage}</p>}
                {shippingInfo?.provider === "ghn" && (
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs font-bold text-slate-500">
                    <span>Đơn vị: <b className="text-slate-800">Giao Hàng Nhanh</b></span>
                    {shippingInfo?.service_name && <span>Dịch vụ: <b className="text-slate-800">{shippingInfo.service_name}</b></span>}
                  </div>
                )}
              </div>

              <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3"><ShieldCheck className="text-orange-500" size={22} /><h2 className="text-xl font-black">Phương thức thanh toán</h2></div>
                <div className="mt-5 grid gap-3">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    const active = paymentMethod === method.id;
                    const disabled = method.id === "BANK" && !bankConfigured;
                    const description = disabled
                      ? "Phương thức này đang tạm thời chưa khả dụng."
                      : method.desc;

                    return (
                      <button
                        key={method.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => !disabled && setPaymentMethod(method.id)}
                        className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition ${
                          disabled
                            ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
                            : active
                              ? "border-orange-400 bg-orange-50"
                              : "border-slate-200 hover:border-orange-200"
                        }`}
                      >
                        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${active ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-500"}`}><Icon size={20} /></span>
                        <span><b className="block text-sm text-slate-950">{method.name}</b><span className="mt-1 block text-xs font-semibold text-slate-500">{description}</span></span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            <aside className="h-fit rounded-[30px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 lg:sticky lg:top-24">
              <h2 className="text-xl font-black">Đơn hàng</h2>
              <div className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
                {items.map((item, index) => (
                  <div key={item?.key || `${itemProductId(item)}-${itemVariantId(item)}-${index}`} className="flex gap-3 rounded-2xl bg-slate-50 p-3">
                    <img src={item?.image || "/images/placeholder-product.png"} alt={item?.name || "Sản phẩm"} className="h-16 w-16 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1"><p className="line-clamp-2 text-sm font-black">{item?.name || "Sản phẩm"}</p><p className="mt-1 text-xs font-semibold text-slate-500">SL {item?.quantity || item?.qty || 1} · {item?.size || "-"} · {item?.color || "-"}</p><p className="mt-1 text-sm font-black text-orange-600">{formatCurrency(Number(item?.price || 0) * Number(item?.quantity || item?.qty || 1))}</p></div>
                  </div>
                ))}
              </div>

              {/* KHỐI MÃ GIẢM GIÁ */}
              <div className="mt-5 border-t border-slate-200 pt-5">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500">
                    Mã giảm giá
                  </label>
                  {appliedCoupon && (
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Đã dùng: {appliedCoupon}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    value={couponInput ?? ""}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black outline-none focus:border-orange-400"
                    placeholder="VD: DYNOVA10"
                  />
                  <button
                    type="button"
                    onClick={() => applyCouponCode()}
                    disabled={couponLoading}
                    className="rounded-2xl bg-slate-950 px-4 text-xs font-black uppercase text-white hover:bg-orange-500 disabled:opacity-60 transition"
                  >
                    {couponLoading ? "..." : "Áp dụng"}
                  </button>
                </div>

                {couponMessage && (
                  <p className={`mt-2 text-xs font-bold ${appliedCoupon ? "text-emerald-600" : "text-rose-500"}`}>
                    {couponMessage}
                  </p>
                )}

                {/* Danh sách chọn mã giảm giá */}
                <div className="mt-3">
                  <p className="text-[11px] font-bold text-slate-400 mb-2 flex items-center gap-1">
                    <Tag size={12} /> Mã giảm giá dành cho bạn:
                  </p>
                  
                  {vouchersLoading ? (
                    <p className="text-xs text-slate-400 italic">Đang tải mã giảm giá...</p>
                  ) : availableVouchers.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                      {availableVouchers.map((v) => {
                        const code = v.code || v.voucher_code;
                        const isSelected = appliedCoupon === code;
                        const discountText = v.discount_percent 
                          ? `Giảm ${v.discount_percent}%` 
                          : v.discount_amount 
                            ? `Giảm ${formatCurrency(v.discount_amount)}` 
                            : code;

                        return (
                          <button
                            key={v.id || code}
                            type="button"
                            onClick={() => handleSelectCoupon(code)}
                            className={`group flex items-center gap-1 rounded-xl border border-dashed px-2.5 py-1.5 text-xs font-extrabold transition ${
                              isSelected
                                ? "border-orange-500 bg-orange-50 text-orange-600 ring-2 ring-orange-400/20"
                                : "border-slate-300 bg-slate-50 text-slate-700 hover:border-orange-400 hover:bg-orange-50/50"
                            }`}
                          >
                            <Tag size={12} className={isSelected ? "text-orange-500" : "text-slate-400 group-hover:text-orange-500"} />
                            <span>{code}</span>
                            <span className="text-[10px] opacity-75">({discountText})</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Hiện chưa có mã giảm giá khả dụng.</p>
                  )}
                </div>
              </div>

              <div className="mt-5 space-y-3 border-t border-slate-200 pt-5 text-sm">
                <Row label="Tạm tính" value={formatCurrency(subtotal)} />
                <Row label="Giảm giá" value={`- ${formatCurrency(discountAmount)}`} />
                <Row label="Vận chuyển" value={shippingFee === null ? "Tính khi xác nhận" : formatCurrency(shippingFee)} />
                <div className="flex items-end justify-between border-t border-slate-200 pt-4"><span className="font-black">Tổng dự kiến</span><span className="text-2xl font-black text-orange-600">{formatCurrency(displayedTotal)}</span></div>
              </div>

              {errors.submit && <div className="mt-4 flex gap-2 rounded-2xl bg-rose-50 p-3 text-sm font-bold text-rose-600"><AlertCircle size={18} className="shrink-0" />{errors.submit}</div>}

              <button type="submit" disabled={submitLoading || !!shippingSetupError} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-4 text-sm font-black uppercase tracking-wider text-white hover:bg-orange-600 disabled:opacity-60">{submitLoading ? <Loader2 className="animate-spin" size={18} /> : <PackageCheck size={18} />} {paymentMethod === "VNPAY" ? "Đặt hàng & sang VNPAY" : paymentMethod === "BANK" ? "Đặt hàng & thanh toán" : "Xác nhận đặt hàng"}</button>
              <p className="mt-3 text-center text-[11px] font-semibold leading-5 text-slate-400">Đơn hàng sẽ được xác nhận sau khi hệ thống kiểm tra tồn kho và thanh toán.</p>
            </aside>
          </form>
        )}
      </div>
    </main>
  );
}

function Input({ label, error, value, ...props }) {
  return <div><label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">{label}</label><input {...props} value={value ?? ""} className={`h-12 w-full rounded-2xl border bg-slate-50 px-4 text-sm font-semibold outline-none focus:bg-white ${error ? "border-rose-300" : "border-slate-200 focus:border-orange-400"}`} />{error && <p className="mt-1 text-xs font-bold text-rose-500">{error}</p>}</div>;
}

function Select({ label, options, error, value, ...props }) {
  return <div><label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">{label}</label><select {...props} value={value ?? ""} className={`h-12 w-full rounded-2xl border bg-slate-50 px-3 text-sm font-semibold outline-none ${error ? "border-rose-300" : "border-slate-200 focus:border-orange-400"}`}><option value="">-- Chọn --</option>{options.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>{error && <p className="mt-1 text-xs font-bold text-rose-500">{error}</p>}</div>;
}

function Row({ label, value }) {
  return <div className="flex justify-between gap-3"><span className="font-semibold text-slate-500">{label}</span><b className="text-slate-950">{value}</b></div>;
}

export default function CheckoutPage() {
  return <Suspense fallback={<div className="min-h-screen bg-slate-50 p-10 text-center font-black">Đang tải trang thanh toán...</div>}><CheckoutContent /></Suspense>;
}