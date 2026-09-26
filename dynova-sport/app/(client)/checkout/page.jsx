"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  Landmark,
  Loader2,
  PackageCheck,
  Phone,
  ShieldCheck,
  Tag,
  Truck,
  User,
  X,
} from "lucide-react";

import { formatCurrency } from "@/data/shop";
import {
  clearBuyNowItems,
  clearCart,
  getBuyNowItems,
  getCart,
  getCurrentUser,
  getSelectedCartKeys,
} from "@/utils/shopStorage";

import {
  calculateShippingFee,
  createCheckoutOrder,
} from "@/services/checkout.service";

import {
  getShippingProvinces,
  getShippingDistricts,
  getShippingWards,
} from "@/services/address.service";

import { getProfile } from "@/services/profile.service";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
const paymentMethods = [
  {
    id: "COD",
    name: "Thanh toán khi nhận hàng",
    icon: Banknote,
    desc: "Khách thanh toán sau khi nhận và kiểm tra kiện hàng.",
  },
  {
    id: "BANK",
    name: "Chuyển khoản ngân hàng",
    icon: Landmark,
    desc: "Tạo đơn trước, sau đó chuyển sang trang QR để thanh toán.",
  },
];

function isEmail(value) {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isPhone(value) {
  return /^(0|\+84)[0-9]{8,10}$/.test(value.replace(/\s/g, ""));
}

function normalizeText(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

function Field({ label, icon: Icon, error, children }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
        {label}
      </label>

      <div className="relative">
        {Icon && (
          <Icon
            size={17}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
        )}
        {children}
      </div>

      {error && <p className="mt-2 text-xs font-bold text-rose-500">{error}</p>}
    </div>
  );
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const buyNowMode = searchParams ? searchParams.get("mode") === "buy_now" : false;

  const [items, setItems] = useState([]);

  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [currentUser, setCurrentUser] = useState(null);

  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [addressLoading, setAddressLoading] = useState(true);
  const [addressError, setAddressError] = useState("");
  const addressRequestId = useRef(0);

  const [shippingFee, setShippingFee] = useState(null);
  const [shippingMessage, setShippingMessage] = useState("");
  const [shippingLoading, setShippingLoading] = useState(false);

  const [submitLoading, setSubmitLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successOrder, setSuccessOrder] = useState(null);
  const [successOrderAmount, setSuccessOrderAmount] = useState(0);

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

  const subtotal = useMemo(() => {
    return items.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
      0
    );
  }, [items]);

  useEffect(() => {
    const syncCart = () => {
      const cartItems = buyNowMode ? getBuyNowItems() : getCart();
      const selected = buyNowMode ? [] : getSelectedCartKeys();

      const filtered = buyNowMode
        ? cartItems
        : cartItems.filter((item) => {
            const key = String(item?.key || item?.id || item?.product_id || "");
            return selected.includes(key);
          });

      setItems(filtered);
    };

    syncCart();
    const user = getCurrentUser();

    setCurrentUser(user || null);
    window.addEventListener("dynova:cart", syncCart);

    if (user) {
      setForm((prev) => ({
        ...prev,
        fullName: user.fullName || user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
      }));
    }

    return () => window.removeEventListener("dynova:cart", syncCart);
  }, [searchParams]);

  useEffect(() => {
    let mounted = true;

    async function loadAddressData() {
      try {
        setAddressLoading(true);
        setAddressError("");

        const data = await getShippingProvinces();
        if (!mounted) return;

        setProvinces(data);

        let savedProfile = null;
        try {
          savedProfile = await getProfile();
        } catch {
          savedProfile = null;
        }

        if (!mounted) return;

        const profileUser = savedProfile?.user || null;
        const latestOrder = Array.isArray(savedProfile?.recent_orders)
          ? savedProfile.recent_orders[0] || null
          : null;

        const savedProvinceName = latestOrder?.province || profileUser?.province || "";
        const savedDistrictName = latestOrder?.district || profileUser?.district || "";
        const savedWardName = latestOrder?.ward || profileUser?.ward || "";
        const savedAddress = latestOrder?.address || profileUser?.address || "";

        const savedProvinceNormalized = normalizeText(savedProvinceName);
        const selectedProvince =
          data.find((item) => {
            const candidate = normalizeText(item.name || "");
            return (
              savedProvinceNormalized &&
              (candidate === savedProvinceNormalized ||
                candidate.includes(savedProvinceNormalized) ||
                savedProvinceNormalized.includes(candidate))
            );
          }) || null;

        const provinceDistricts = selectedProvince
          ? await getShippingDistricts(selectedProvince)
          : [];
        if (!mounted) return;
        const savedDistrictNormalized = normalizeText(savedDistrictName);
        const savedWardNormalized = normalizeText(savedWardName);

        const selectedDistrict =
          provinceDistricts.find((item) => {
            const candidate = normalizeText(item.name || "");
            return (
              savedDistrictNormalized &&
              (candidate === savedDistrictNormalized ||
                candidate.includes(savedDistrictNormalized) ||
                savedDistrictNormalized.includes(candidate))
            );
          }) || null;

        const districtWards = selectedDistrict
          ? await getShippingWards(selectedDistrict)
          : [];
        if (!mounted) return;
        const selectedWard =
          districtWards.find((item) => {
            const candidate = normalizeText(item.name || "");
            return (
              savedWardNormalized &&
              (candidate === savedWardNormalized ||
                candidate.includes(savedWardNormalized) ||
                savedWardNormalized.includes(candidate))
            );
          }) || null;

        setDistricts(provinceDistricts);
        setWards(districtWards);

        setForm((prev) => ({
          ...prev,
          fullName:
            latestOrder?.customer_name ||
            profileUser?.fullName ||
            profileUser?.full_name ||
            profileUser?.name ||
            prev.fullName,
          email:
            latestOrder?.customer_email ||
            latestOrder?.email ||
            profileUser?.email ||
            prev.email,
          phone:
            latestOrder?.customer_phone ||
            latestOrder?.phone ||
            profileUser?.phone ||
            prev.phone,
          provinceCode: selectedProvince ? String(selectedProvince.code) : "",
          province: selectedProvince?.name || "",
          districtCode: selectedDistrict?.code
            ? String(selectedDistrict.code)
            : "",
          district: selectedDistrict?.name || "",
          wardCode: selectedWard?.code ? String(selectedWard.code) : "",
          ward: selectedWard?.name || "",
          address: savedAddress || prev.address,
        }));
      } catch {
        setAddressError("Không tải được dữ liệu địa chỉ cũ.");
      } finally {
        if (mounted) setAddressLoading(false);
      }
    }

    loadAddressData();
    return () => {
      mounted = false;
    };
  }, []);

  const totalWeight = useMemo(() => {
    return items.reduce((sum, item) => {
      const itemWeight = Number(item.weight || 300);
      return sum + itemWeight * Number(item.quantity || 1);
    }, 0);
  }, [items]);

  const isFreeShippingConfirmed =
    shippingFee !== null &&
    Number(shippingFee) === 0 &&
    /miễn phí|free shipping/i.test(String(shippingMessage || ""));

  const finalShipping =
    shippingFee === null
      ? 0
      : Number(shippingFee || 0);

  const finalTotal = subtotal + finalShipping;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "", submit: "" }));
  };

  const handleProvinceChange = async (event) => {
    const requestId = ++addressRequestId.current;
    const provinceCode = event.target.value;
    const province = provinces.find(
      (item) => String(item.code) === String(provinceCode)
    );

    setDistricts([]);
    setWards([]);
    setForm((prev) => ({
      ...prev,
      provinceCode,
      province: province?.name || "",
      districtCode: "",
      district: "",
      wardCode: "",
      ward: "",
    }));

    setShippingFee(null);
    setShippingMessage("");
    setAddressError("");
    setErrors((prev) => ({ ...prev, province: "", district: "", ward: "", submit: "" }));
    if (!province) {
      setAddressLoading(false);
      return;
    }

    setAddressLoading(true);
    try {
      const nextDistricts = await getShippingDistricts(province);
      if (addressRequestId.current === requestId) setDistricts(nextDistricts);
    } catch (error) {
      if (addressRequestId.current === requestId) {
        setAddressError(error?.message || "Không tải được danh sách quận/huyện.");
      }
    } finally {
      if (addressRequestId.current === requestId) setAddressLoading(false);
    }
  };

  const handleDistrictChange = async (event) => {
    const requestId = ++addressRequestId.current;
    const districtCode = event.target.value;
    const district = districts.find(
      (item) => String(item.code) === String(districtCode)
    );

    setWards([]);
    setForm((prev) => ({
      ...prev,
      districtCode,
      district: district?.name || "",
      wardCode: "",
      ward: "",
    }));

    setShippingFee(null);
    setShippingMessage("");
    setAddressError("");
    setErrors((prev) => ({ ...prev, district: "", ward: "", submit: "" }));
    if (!district) {
      setAddressLoading(false);
      return;
    }

    setAddressLoading(true);
    try {
      const nextWards = await getShippingWards(district);
      if (addressRequestId.current === requestId) setWards(nextWards);
    } catch (error) {
      if (addressRequestId.current === requestId) {
        setAddressError(error?.message || "Không tải được danh sách phường/xã.");
      }
    } finally {
      if (addressRequestId.current === requestId) setAddressLoading(false);
    }
  };

  const handleWardChange = (event) => {
    const wardCode = event.target.value;
    const ward = wards.find((item) => String(item.code) === String(wardCode));

    setForm((prev) => ({
      ...prev,
      wardCode,
      ward: ward?.name || "",
    }));

    setShippingFee(null);
    setShippingMessage("");
    setErrors((prev) => ({ ...prev, ward: "", submit: "" }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.fullName.trim()) nextErrors.fullName = "Vui lòng nhập họ tên.";
    if (!form.phone.trim()) {
      nextErrors.phone = "Vui lòng nhập số điện thoại.";
    } else if (!isPhone(form.phone)) {
      nextErrors.phone = "Số điện thoại chưa đúng định dạng.";
    }
    if (form.email && !isEmail(form.email)) nextErrors.email = "Email chưa đúng định dạng.";
    if (!form.province.trim()) nextErrors.province = "Vui lòng chọn tỉnh/thành phố.";
    if (!form.district.trim()) nextErrors.district = "Vui lòng chọn quận/huyện.";
    if (!form.ward.trim()) nextErrors.ward = "Vui lòng chọn phường/xã.";
    if (!form.address.trim()) nextErrors.address = "Vui lòng nhập địa chỉ nhận hàng.";

    const valid = Object.keys(nextErrors).length === 0;
    setErrors(
      valid
        ? {}
        : {
            ...nextErrors,
            submit: "Vui lòng kiểm tra các thông tin nhận hàng được đánh dấu.",
          }
    );
    return valid;
  };

  const resolveShippingFee = async ({ showValidationMessage = true } = {}) => {
    if (subtotal <= 0) {
      setShippingFee(0);
      setShippingMessage("");
      return 0;
    }

    if (!form.province || !form.district || !form.ward || !form.address?.trim()) {
      if (showValidationMessage) {
        setShippingMessage(
          "Vui lòng chọn Tỉnh/Thành, Quận/Huyện, Phường/Xã và nhập Địa chỉ cụ thể."
        );
      }
      return null;
    }

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
        address: form.address.trim(),
        weight: totalWeight || 500,
        value: subtotal,
        items,
      });

      const rawFee = response?.data?.fee ?? response?.fee ?? 0;
      const feeVal = Number(rawFee);
      const isExplicitFreeShipping = Boolean(
        response?.data?.free_shipping ?? response?.free_shipping ?? false
      );

      if (!Number.isFinite(feeVal) || feeVal < 0) {
        throw new Error("Dịch vụ vận chuyển không trả về phí hợp lệ.");
      }

      if (feeVal === 0 && !isExplicitFreeShipping) {
        throw new Error(
          "GHN trả về phí vận chuyển 0 nhưng chưa xác nhận miễn phí vận chuyển."
        );
      }

      setShippingFee(feeVal);
      setShippingMessage(
        isExplicitFreeShipping
          ? "Đơn hàng được miễn phí vận chuyển."
          : response?.message || "Đã tính phí giao hàng thành công!"
      );
      return feeVal;
    } catch (error) {
      setShippingFee(null);
      setShippingMessage(
        error?.message ||
          "Không thể lấy phí vận chuyển. Vui lòng kiểm tra địa chỉ và thử lại."
      );
      return null;
    } finally {
      setShippingLoading(false);
    }
  };

  useEffect(() => {
    if (
      addressLoading ||
      subtotal <= 0 ||
      !form.province ||
      !form.district ||
      !form.ward ||
      !form.address?.trim()
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      resolveShippingFee({ showValidationMessage: false });
    }, 350);

    return () => window.clearTimeout(timer);
  }, [
    addressLoading,
    form.province,
    form.district,
    form.ward,
    form.address,
    subtotal,
    totalWeight,
  ]);

  const handleCalculateShipping = async () => {
    await resolveShippingFee();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!items.length) return;

    if (!currentUser) {
      setErrors({ submit: "Bạn cần đăng nhập trước khi tạo đơn hàng." });
      setTimeout(() => router.push("/login?redirect=/checkout"), 900);
      return;
    }

    if (!validate()) return;

    setSubmitLoading(true);

    try {
      const checkedShippingFee = await resolveShippingFee({
        showValidationMessage: false,
      });

      if (checkedShippingFee === null) {
        setErrors({ submit: "Vui lòng kiểm tra lại địa chỉ nhận hàng." });
        return;
      }

      const checkedTotal = subtotal + Number(checkedShippingFee || 0);

      const payload = {
        customer: {
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
        },
        shippingAddress: {
          province: form.province,
          provinceCode: form.provinceCode,
          district: form.district,
          districtCode: form.districtCode,
          ward: form.ward,
          wardCode: form.wardCode,
          address: form.address.trim(),
          note: form.note,
        },
        items: items.map((item) => ({
          product_id:
            item.product_id ??
            item.productId ??
            item.product?.id ??
            (item.source === "server" ? null : item.id),
          product_variant_id:
            item.product_variant_id ??
            item.variant_id ??
            item.variantId ??
            item.variant?.id ??
            null,
          quantity: Number(item.quantity || 1),
          name: item.name || item.product_name || item.product?.name || "Sản phẩm",
          image: item.image || item.image_url || item.product_image || item.product?.image || "",
          size: item.size || item.size_name || null,
          color: item.color || item.color_name || null,
        })),
        paymentMethod,
        subtotal,
        discount: 0,
        shippingFee: checkedShippingFee,
        total: checkedTotal,
        weight: totalWeight,
      };

      const orderResponse = await createCheckoutOrder(payload);
      const order = orderResponse?.data || orderResponse?.order || orderResponse;
      if (!order?.id) throw new Error("Máy chủ chưa trả về mã đơn hàng.");

      const realOrderAmount = Number(
        order?.grand_total ??
        order?.total ??
        order?.total_price ??
        checkedTotal ??
        0
      );

      if (buyNowMode) {
        clearBuyNowItems();
      } else {
        clearCart();
      }

      removeCouponState();
      window.dispatchEvent(new Event("dynova:storage"));
      setItems([]);
      setSuccessOrderAmount(realOrderAmount);

      if (paymentMethod === "BANK") {
        router.push(`/payment/bank/${order.id}`);
        return;
      }

      setSuccessOrder({
        ...order,
        total: realOrderAmount,
        grand_total: realOrderAmount,
      });
    } catch (error) {
      setErrors({
        submit: error.message || "Không thể tạo đơn hàng. Vui lòng thử lại.",
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  if (successOrder) {
    return (
      <div className="min-h-screen bg-[#f7f8fb] py-14">
        <div className="container-page">
          <div className="mx-auto max-w-2xl rounded-[34px] border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/70">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={38} />
            </div>

            <h1 className="mt-5 text-3xl font-black text-slate-950">Đặt hàng thành công</h1>

            <p className="mt-2 text-sm leading-7 text-slate-500">
              Mã đơn <b>{successOrder.order_code || successOrder.id || "DNV-ORDER"}</b> đã được tạo. Bạn có thể theo dõi trong lịch sử mua hàng.
            </p>

            <div className="mt-6 rounded-3xl bg-slate-50 p-5 text-left text-sm font-bold text-slate-600">
              <div className="flex justify-between">
                <span>Phương thức</span>
                <span>{paymentMethod}</span>
              </div>

              <div className="mt-2 flex justify-between">
                <span>Tổng tiền</span>
                <span className="text-orange-600">
                  {formatCurrency(successOrderAmount || successOrder?.grand_total || successOrder?.total || 0)}
                </span>
              </div>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/orders"
                className="rounded-2xl bg-orange-500 px-6 py-4 text-xs font-black uppercase tracking-wider text-white transition hover:bg-orange-600"
              >
                Theo dõi đơn hàng
              </Link>

              <Link
                href="/shop"
                className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50"
              >
                Tiếp tục mua
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fb] py-10">
      <div className="container-page">
        <div className="mb-8">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-500">
            Checkout
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.03em] text-slate-950">
            Đặt hàng & thanh toán
          </h1>
          <p className="mt-2 text-sm leading-7 text-slate-500">
            Nhập thông tin nhận hàng, tính phí vận chuyển và chọn phương thức thanh toán.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="rounded-[34px] border border-slate-200 bg-white p-10 text-center shadow-sm">
            <PackageCheck className="mx-auto text-orange-500" size={42} />
            <h2 className="mt-4 text-2xl font-black text-slate-950">
              Không có sản phẩm để thanh toán
            </h2>
            <Link
              href="/shop"
              className="mt-6 inline-block rounded-2xl bg-orange-500 px-6 py-4 text-xs font-black uppercase tracking-wider text-white transition hover:bg-orange-600"
            >
              Quay lại cửa hàng
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_420px]">
            <section className="space-y-6">
              <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5">
                  <h2 className="text-xl font-black text-slate-950">
                    Thông tin nhận hàng
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Kiểm tra lại thông tin người nhận và địa chỉ giao hàng.
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Họ và tên" icon={User} error={errors.fullName}>
                    <input
                      type="text"
                      name="fullName"
                      value={form.fullName}
                      onChange={handleChange}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-bold text-slate-950 outline-none transition focus:border-orange-500 focus:bg-white"
                      placeholder="Nhập họ và tên"
                    />
                  </Field>

                  <Field label="Số điện thoại" icon={Phone} error={errors.phone}>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-bold text-slate-950 outline-none transition focus:border-orange-500 focus:bg-white"
                      placeholder="Nhập số điện thoại"
                    />
                  </Field>

                  <Field label="Email" error={errors.email}>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-950 outline-none transition focus:border-orange-500 focus:bg-white"
                      placeholder="Email (không bắt buộc)"
                    />
                  </Field>

                  <Field label="Tỉnh / Thành phố" error={errors.province}>
                    <select
                      name="provinceCode"
                      value={form.provinceCode}
                      onChange={handleProvinceChange}
                      disabled={addressLoading}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-950 outline-none transition focus:border-orange-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="">
                        {addressLoading ? "Đang tải địa chỉ..." : "Chọn Tỉnh / Thành phố"}
                      </option>
                      {provinces.map((province) => (
                        <option key={province.code} value={String(province.code)}>
                          {province.name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Quận / Huyện" error={errors.district}>
                    <select
                      name="districtCode"
                      value={form.districtCode}
                      onChange={handleDistrictChange}
                      disabled={addressLoading || !form.provinceCode}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-950 outline-none transition focus:border-orange-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="">Chọn Quận / Huyện</option>
                      {districts.map((district) => (
                        <option key={district.code} value={String(district.code)}>
                          {district.name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Phường / Xã" error={errors.ward}>
                    <select
                      name="wardCode"
                      value={form.wardCode}
                      onChange={handleWardChange}
                      disabled={addressLoading || !form.districtCode}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-950 outline-none transition focus:border-orange-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="">Chọn Phường / Xã</option>
                      {wards.map((ward) => (
                        <option key={ward.code} value={String(ward.code)}>
                          {ward.name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Địa chỉ cụ thể" error={errors.address}>
                    <input
                      type="text"
                      name="address"
                      value={form.address}
                      onChange={(event) => {
                        handleChange(event);
                        setShippingFee(null);
                        setShippingMessage("");
                      }}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-950 outline-none transition focus:border-orange-500 focus:bg-white"
                      placeholder="Số nhà, tên đường..."
                    />
                  </Field>
                </div>

                <div className="mt-5">
                  <Field label="Ghi chú đơn hàng">
                    <textarea
                      name="note"
                      value={form.note}
                      onChange={handleChange}
                      rows={3}
                      className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-orange-500 focus:bg-white"
                      placeholder="Ghi chú cho người giao hàng (không bắt buộc)"
                    />
                  </Field>
                </div>

                {addressError && (
                  <p className="mt-4 flex items-center gap-2 text-xs font-bold text-rose-500">
                    <AlertCircle size={14} className="shrink-0" />
                    {addressError}
                  </p>
                )}
              </div>

              <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-black text-slate-950">Phí vận chuyển</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Tính theo địa chỉ, trọng lượng và giá trị đơn hàng.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCalculateShipping}
                    disabled={shippingLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-orange-500 disabled:opacity-70"
                  >
                    {shippingLoading ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Truck size={15} />
                    )}
                    Tính phí
                  </button>
                </div>

                <div className="rounded-3xl bg-slate-50 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-black text-slate-950">Giao hàng tiết kiệm</p>
                      <p className="mt-1 text-xs font-bold text-slate-400">
                        Trọng lượng tạm tính: {totalWeight || 500}g
                      </p>
                    </div>

                    <p className="text-xl font-black text-orange-600">
                      {shippingFee === null
                        ? "CHƯA TÍNH"
                        : isFreeShippingConfirmed
                          ? "MIỄN PHÍ"
                          : formatCurrency(finalShipping)}
                    </p>
                  </div>

                  {shippingMessage && (
                    <p className="mt-3 flex items-start gap-2 text-xs font-bold text-slate-500">
                      <AlertCircle
                        size={14}
                        className="mt-0.5 shrink-0 text-orange-500"
                      />
                      {shippingMessage}
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-5 text-xl font-black text-slate-950">
                  Phương thức thanh toán
                </h2>

                <div className="grid gap-3 md:grid-cols-2">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    const active = paymentMethod === method.id;

                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id)}
                        className={
                          "rounded-3xl border p-4 text-left transition " +
                          (active
                            ? "border-orange-500 bg-orange-50 shadow-sm"
                            : "border-slate-200 bg-white hover:border-orange-200 hover:bg-orange-50")
                        }
                      >
                        <Icon className="text-orange-500" size={22} />
                        <p className="mt-3 font-black text-slate-950">{method.name}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">{method.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            <aside className="h-fit rounded-[30px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 lg:sticky lg:top-24">
              <h2 className="text-xl font-black text-slate-950">Đơn hàng</h2>

              <div className="mt-5 max-h-72 space-y-3 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.key} className="flex gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-16 w-16 rounded-xl object-cover"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-black text-slate-950">
                        {item.name}
                      </p>
                      <p className="text-xs font-semibold text-slate-500">
                        {item.quantity} x {item.size || "Freesize"} / {item.color || "Mặc định"}
                      </p>
                    </div>

                    <p className="text-sm font-black text-slate-900">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-3 text-sm font-bold text-slate-600 border-t border-slate-100 pt-5">
                <div className="flex justify-between">
                  <span>Tạm tính</span>
                  <span className="text-slate-950">{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Vận chuyển</span>
                  <span className="text-slate-950">
                    {shippingFee === null
                      ? "Chưa tính"
                      : isFreeShippingConfirmed
                        ? "Miễn phí"
                        : formatCurrency(finalShipping)}
                  </span>
                </div>

              </div>

              <div className="mt-5 border-t border-dashed border-slate-200 pt-5">
                <div className="flex items-end justify-between">
                  <span className="font-black text-slate-950">Tổng thanh toán</span>
                  <span className="text-3xl font-black text-orange-600">
                    {formatCurrency(finalTotal)}
                  </span>
                </div>
              </div>

              {errors.submit && (
                <p className="mt-4 rounded-2xl bg-rose-50 p-3 text-xs font-bold text-rose-600">
                  {errors.submit}
                </p>
              )}

              <button
                type="submit"
                disabled={submitLoading}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 py-4 text-xs font-black uppercase tracking-wider text-white transition hover:-translate-y-0.5 hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Đang tạo đơn...
                  </>
                ) : (
                  <>
                    <Truck size={16} />
                    Tạo đơn hàng
                  </>
                )}
              </button>

              <p className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
                <ShieldCheck size={15} className="text-emerald-500" />
                Hỗ trợ COD, chuyển khoản và online
              </p>
            </aside>
          </form>
        )}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f7f8fb] py-10 text-center font-bold text-slate-500">Đang tải trang thanh toán...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}