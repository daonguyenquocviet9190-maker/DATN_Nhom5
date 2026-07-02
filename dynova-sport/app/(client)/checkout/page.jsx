"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  CreditCard,
  Landmark,
  Loader2,
  PackageCheck,
  Phone,
  ShieldCheck,
  Smartphone,
  Truck,
  User,
} from "lucide-react";

import { bankAccount, formatCurrency } from "@/data/shop";
import {
  calculateOrder,
  clearCart,
  getCart,
  getCurrentUser,
} from "@/utils/shopStorage";

import {
  calculateShippingFee,
  createCheckoutOrder,
  createPaymentSession,
} from "@/services/checkout.service";

import {
  getMergedProvinces,
  getProvinceWards,
} from "@/services/address.service";

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
    desc: "Hiển thị thông tin tài khoản và nội dung chuyển khoản.",
  },
  {
    id: "VNPAY",
    name: "VNPAY",
    icon: CreditCard,
    desc: "Backend tạo link thanh toán và chuyển sang cổng VNPAY.",
  },
  {
    id: "MOMO",
    name: "MoMo",
    icon: Smartphone,
    desc: "Backend tạo payment session và redirect sang MoMo.",
  },
];

function isEmail(value) {
  if (!value) return true;

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isPhone(value) {
  return /^(0|\+84)[0-9]{8,10}$/.test(value.replace(/\s/g, ""));
}
function createVietQrUrl({ amount, orderCode, phone }) {
  const bankCode = bankAccount.bankCode || "MB";
  const accountNumber = String(bankAccount.accountNumber || "").replace(
    /\s/g,
    ""
  );
  const accountName = encodeURIComponent(bankAccount.accountName || "");
  const addInfo = encodeURIComponent(
    `${orderCode || "DYNOVA"} ${phone || ""}`.trim()
  );

  return `https://img.vietqr.io/image/${bankCode}-${accountNumber}-compact2.png?amount=${Math.round(
    amount
  )}&addInfo=${addInfo}&accountName=${accountName}`;
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

export default function CheckoutPage() {
  const router = useRouter();
  // console.log("BANK ACCOUNT CHECKOUT:", bankAccount);

  const [items, setItems] = useState([]);
  const [coupon, setCoupon] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [currentUser, setCurrentUser] = useState(null);

  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);
  const [addressLoading, setAddressLoading] = useState(true);
  const [addressError, setAddressError] = useState("");

  const [shippingFee, setShippingFee] = useState(null);
  const [shippingMessage, setShippingMessage] = useState("");
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
    wardCode: "",
    ward: "",
    address: "",
    note: "",
  });

  useEffect(() => {
    const cart = getCart();
    const user = getCurrentUser();

    setItems(cart);
    setCurrentUser(user || null);

    if (user) {
      setForm((prev) => ({
        ...prev,
        fullName: user.fullName || user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
      }));
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadAddressData() {
      try {
        setAddressLoading(true);
        setAddressError("");

        const data = await getMergedProvinces();

        if (!mounted) return;

        setProvinces(data);

        const defaultProvince =
          data.find((item) =>
            normalizeText(item.name || "").includes("ho chi minh")
          ) || data[0];

        if (defaultProvince) {
          const defaultWards = getProvinceWards(defaultProvince);

          setWards(defaultWards);

          setForm((prev) => ({
            ...prev,
            provinceCode: String(defaultProvince.code || ""),
            province: defaultProvince.name || "",
            wardCode: defaultWards[0]?.code ? String(defaultWards[0].code) : "",
            ward: defaultWards[0]?.name || "",
          }));
        }
      } catch {
        setAddressError(
          "Không tải được dữ liệu địa chỉ. Bạn có thể thử lại sau."
        );
      } finally {
        if (mounted) {
          setAddressLoading(false);
        }
      }
    }

    loadAddressData();

    return () => {
      mounted = false;
    };
  }, []);

  const localTotals = useMemo(
    () => calculateOrder(items, coupon),
    [items, coupon]
  );

  const totalWeight = useMemo(() => {
    return items.reduce((sum, item) => {
      const itemWeight = Number(item.weight || 300);
      return sum + itemWeight * Number(item.quantity || 1);
    }, 0);
  }, [items]);

  const finalShipping =
    shippingFee !== null ? Number(shippingFee) : Number(localTotals.shipping);

  const finalTotal = Math.max(
    0,
    Number(localTotals.subtotal) -
    Number(localTotals.discount || 0) +
    Number(finalShipping)
  );

  const bankQrUrl = useMemo(() => {
    return createVietQrUrl({
      amount: finalTotal,
      orderCode: "DYNOVA",
      phone: form.phone,
    });
  }, [finalTotal, form.phone]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const handleProvinceChange = (event) => {
    const provinceCode = event.target.value;

    const province = provinces.find(
      (item) => String(item.code) === String(provinceCode)
    );

    const nextWards = getProvinceWards(province);

    setWards(nextWards);

    setForm((prev) => ({
      ...prev,
      provinceCode,
      province: province?.name || "",
      wardCode: nextWards[0]?.code ? String(nextWards[0].code) : "",
      ward: nextWards[0]?.name || "",
    }));

    setShippingFee(null);
    setShippingMessage("");

    setErrors((prev) => ({
      ...prev,
      province: "",
      ward: "",
    }));
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

    setErrors((prev) => ({
      ...prev,
      ward: "",
    }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.fullName.trim()) {
      nextErrors.fullName = "Vui lòng nhập họ tên.";
    }

    if (!form.phone.trim()) {
      nextErrors.phone = "Vui lòng nhập số điện thoại.";
    } else if (!isPhone(form.phone)) {
      nextErrors.phone = "Số điện thoại chưa đúng định dạng.";
    }

    if (form.email && !isEmail(form.email)) {
      nextErrors.email = "Email chưa đúng định dạng.";
    }

    if (!form.province.trim()) {
      nextErrors.province = "Vui lòng chọn tỉnh/thành phố.";
    }

    if (!form.ward.trim()) {
      nextErrors.ward = "Vui lòng chọn phường/xã.";
    }

    if (!form.address.trim()) {
      nextErrors.address = "Vui lòng nhập địa chỉ nhận hàng.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleCalculateShipping = async () => {
    if (!form.province.trim() || !form.ward.trim() || !form.address.trim()) {
      setShippingMessage(
        "Vui lòng chọn tỉnh/thành, phường/xã và nhập địa chỉ trước."
      );
      return;
    }

    setShippingLoading(true);
    setShippingMessage("");

    try {
      const response = await calculateShippingFee({
        province: form.province,
        provinceCode: form.provinceCode,

        // Giữ district = ward để tương thích backend/GHTK cũ nếu backend còn bắt district.
        district: form.ward,

        ward: form.ward,
        wardCode: form.wardCode,
        address: form.address,
        weight: totalWeight,
        value: localTotals.subtotal,
        items,
      });

      const fee = Number(response?.data?.fee ?? response?.fee ?? 0);

      setShippingFee(fee);
      setShippingMessage(
        response?.message || "Đã tính phí vận chuyển theo API."
      );
    } catch {
      setShippingFee(localTotals.shipping);
      setShippingMessage(
        "Chưa kết nối được API vận chuyển, đang dùng phí tạm tính demo."
      );
    } finally {
      setShippingLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!items.length) return;

    if (!currentUser) {
      setErrors({
        submit: "Bạn cần đăng nhập trước khi tạo đơn hàng.",
      });

      setTimeout(() => {
        router.push("/login?redirect=/checkout");
      }, 900);

      return;
    }

    if (!validate()) return;

    setSubmitLoading(true);

    const payload = {
      customer: {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
      },
      shippingAddress: {
        province: form.province,
        provinceCode: form.provinceCode,

        // Gửi thêm district để không lỗi nếu backend cũ vẫn còn validate district.
        district: form.ward,

        ward: form.ward,
        wardCode: form.wardCode,
        address: form.address,
        note: form.note,
      },
      items,
      coupon,
      paymentMethod,
      subtotal: localTotals.subtotal,
      discount: localTotals.discount,
      shippingFee: finalShipping,
      total: finalTotal,
      weight: totalWeight,
    };

    try {
      const orderResponse = await createCheckoutOrder(payload);
      const order = orderResponse?.data || orderResponse?.order || orderResponse;

      if (["VNPAY", "MOMO"].includes(paymentMethod)) {
        const paymentResponse = await createPaymentSession({
          orderId: order.id,
          provider: paymentMethod,
          amount: finalTotal,
          returnUrl: window.location.origin + "/orders",
        });

        const paymentUrl =
          paymentResponse?.data?.payment_url ||
          paymentResponse?.payment_url ||
          paymentResponse?.payUrl;

        if (paymentUrl) {
          window.location.href = paymentUrl;
          return;
        }
      }

      clearCart();
      window.dispatchEvent(new Event("dynova:storage"));
      setItems([]);
      setSuccessOrder(order);
    } catch (error) {
      setErrors({
        submit:
          error.message ||
          "Không thể tạo đơn hàng. Vui lòng kiểm tra API backend.",
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

            <h1 className="mt-5 text-3xl font-black text-slate-950">
              Đặt hàng thành công
            </h1>

            <p className="mt-2 text-sm leading-7 text-slate-500">
              Mã đơn{" "}
              <b>{successOrder.order_code || successOrder.id || "DNV-ORDER"}</b>{" "}
              đã được tạo. Bạn có thể theo dõi trạng thái xử lý trong lịch sử
              mua hàng.
            </p>

            <div className="mt-6 rounded-3xl bg-slate-50 p-5 text-left text-sm font-bold text-slate-600">
              <div className="flex justify-between">
                <span>Thanh toán</span>
                <span>{paymentMethod}</span>
              </div>

              <div className="mt-2 flex justify-between">
                <span>Tổng tiền</span>
                <span className="text-orange-600">
                  {formatCurrency(successOrder.total || finalTotal)}
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => router.push("/orders")}
                className="rounded-2xl bg-orange-500 px-6 py-4 text-xs font-black uppercase tracking-wider text-white transition hover:bg-orange-600"
              >
                Theo dõi đơn hàng
              </button>

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
            Nhập thông tin nhận hàng, tính phí vận chuyển và chọn phương thức
            thanh toán.
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
          <form
            onSubmit={handleSubmit}
            className="grid gap-6 lg:grid-cols-[1fr_400px]"
          >
            <section className="space-y-6">
              <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-5 text-xl font-black text-slate-950">
                  Thông tin nhận hàng
                </h2>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Họ và tên *" icon={User} error={errors.fullName}>
                    <input
                      name="fullName"
                      value={form.fullName}
                      onChange={handleChange}
                      className="h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-bold text-slate-950 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                      placeholder="Nguyễn Trọng Hoài"
                    />
                  </Field>

                  <Field label="Số điện thoại *" icon={Phone} error={errors.phone}>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      className="h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-bold text-slate-950 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                      placeholder="0866 347 730"
                    />
                  </Field>

                  <Field label="Email" error={errors.email}>
                    <input
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className="h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-950 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                      placeholder="name@email.com"
                    />
                  </Field>

                  <Field label="Tỉnh / Thành phố *" error={errors.province}>
                    <select
                      value={form.provinceCode}
                      onChange={handleProvinceChange}
                      disabled={addressLoading}
                      className="h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-950 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-500/10 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <option value="">
                        {addressLoading
                          ? "Đang tải tỉnh/thành..."
                          : "Chọn tỉnh/thành phố"}
                      </option>

                      {provinces.map((province) => (
                        <option key={province.code} value={province.code}>
                          {province.name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Phường / Xã *" error={errors.ward}>
                    <select
                      value={form.wardCode}
                      onChange={handleWardChange}
                      disabled={addressLoading || !form.provinceCode}
                      className="h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-950 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-500/10 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <option value="">
                        {form.provinceCode
                          ? "Chọn phường/xã"
                          : "Chọn tỉnh/thành trước"}
                      </option>

                      {wards.map((ward) => (
                        <option key={ward.code} value={ward.code}>
                          {ward.name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  {addressError && (
                    <div className="rounded-2xl bg-rose-50 p-3 text-xs font-bold text-rose-600 md:col-span-2">
                      {addressError}
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <Field label="Địa chỉ cụ thể *" error={errors.address}>
                    <input
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      className="h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-950 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                      placeholder="Số nhà, tên đường..."
                    />
                  </Field>
                </div>

                <textarea
                  name="note"
                  value={form.note}
                  onChange={handleChange}
                  className="mt-4 min-h-24 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold leading-7 text-slate-950 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                  placeholder="Ghi chú cho cửa hàng hoặc đơn vị vận chuyển"
                />
              </div>

              <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-black text-slate-950">
                      Phí vận chuyển
                    </h2>

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
                      <p className="text-sm font-black text-slate-950">
                        Giao hàng tiết kiệm
                      </p>

                      <p className="mt-1 text-xs font-bold text-slate-400">
                        Trọng lượng tạm tính: {totalWeight}g
                      </p>
                    </div>

                    <p className="text-xl font-black text-orange-600">
                      {formatCurrency(finalShipping)}
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
                        <p className="mt-3 font-black text-slate-950">
                          {method.name}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {method.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {paymentMethod === "BANK" && (
                  <div className="mt-5 grid gap-5 rounded-[32px] bg-slate-950 p-5 text-white lg:grid-cols-[320px_1fr]">
                    <div className="rounded-[28px] bg-white p-4 shadow-2xl">
                      <img
                        src={bankQrUrl}
                        alt="QR chuyển khoản Dynova"
                        className="aspect-square w-full rounded-2xl object-contain"
                      />
                    </div>

                    <div className="flex flex-col justify-center">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">
                        QR chuyển khoản
                      </p>

                      <h3 className="mt-2 text-2xl font-black">
                        Quét mã để thanh toán
                      </h3>

                      <div className="mt-5 grid gap-3 text-sm text-slate-300">
                        <p>
                          Ngân hàng:{" "}
                          <b className="text-white">{bankAccount.bank}</b>
                        </p>

                        <p>
                          Số tài khoản:{" "}
                          <b className="text-white">{bankAccount.accountNumber}</b>
                        </p>

                        <p>
                          Chủ tài khoản:{" "}
                          <b className="text-white">{bankAccount.accountName}</b>
                        </p>

                        <p>
                          Số tiền:{" "}
                          <b className="text-orange-300">
                            {formatCurrency(finalTotal)}
                          </b>
                        </p>

                        <p>
                          Nội dung:{" "}
                          <b className="text-orange-300">
                            DYNOVA {form.phone || "SO-DIEN-THOAI"}
                          </b>
                        </p>
                      </div>

                      <div className="mt-5 rounded-2xl bg-white/10 p-4 text-xs font-bold leading-6 text-slate-300">
                        Sau khi khách chuyển khoản, đơn hàng sẽ được lưu vào hệ thống với trạng
                        thái chờ xác nhận chuyển khoản. Muốn tự động xác nhận đã nhận tiền thì
                        cần tích hợp thêm webhook ngân hàng như PayOS, Casso, SePay hoặc cổng
                        thanh toán thật.
                      </div>
                    </div>
                  </div>
                )}
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
                        {item.quantity} x {item.size || "Freesize"} /{" "}
                        {item.color || "Mặc định"}
                      </p>
                    </div>

                    <p className="text-sm font-black text-slate-900">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <input
                value={coupon}
                onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                className="mt-5 h-[50px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black uppercase text-slate-950 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                placeholder="Mã giảm giá"
              />

              {localTotals.message && (
                <p className="mt-2 text-xs font-bold text-slate-500">
                  {localTotals.message}
                </p>
              )}

              <div className="mt-5 space-y-3 text-sm font-bold text-slate-600">
                <div className="flex justify-between">
                  <span>Tạm tính</span>
                  <span>{formatCurrency(localTotals.subtotal)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Vận chuyển</span>
                  <span>
                    {finalShipping === 0
                      ? "Miễn phí"
                      : formatCurrency(finalShipping)}
                  </span>
                </div>

                {localTotals.discount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Giảm giá</span>
                    <span>-{formatCurrency(localTotals.discount)}</span>
                  </div>
                )}
              </div>

              <div className="mt-5 border-t border-dashed border-slate-200 pt-5">
                <div className="flex items-end justify-between">
                  <span className="font-black text-slate-950">
                    Tổng thanh toán
                  </span>
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