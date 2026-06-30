"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  ShoppingBag,
  Store,
  Truck,
  X,
} from "lucide-react";

const CONTACT_MESSAGES_KEY = "dynova_contact_messages";

const contactCards = [
  {
    icon: Phone,
    title: "Hotline",
    value: "0866 347 730",
    text: "Hỗ trợ đơn hàng và tư vấn sản phẩm.",
    href: "tel:0866347730",
  },
  {
    icon: Mail,
    title: "Email",
    value: "cskh@dynova.vn",
    text: "Tiếp nhận góp ý, hợp tác và khiếu nại.",
    href: "mailto:cskh@dynova.vn",
  },
  {
    icon: Clock,
    title: "Thời gian",
    value: "08:00 - 22:00",
    text: "Hỗ trợ tất cả các ngày trong tuần.",
    href: null,
  },
];

const supportTypes = [
  {
    value: "order",
    label: "Hỗ trợ đơn hàng",
    icon: ShoppingBag,
  },
  {
    value: "product",
    label: "Tư vấn sản phẩm",
    icon: Store,
  },
  {
    value: "shipping",
    label: "Giao hàng",
    icon: Truck,
  },
  {
    value: "other",
    label: "Khác",
    icon: MessageCircle,
  },
];

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isPhone(value) {
  const clean = value.replace(/\s/g, "");
  return /^(0|\+84)[0-9]{8,10}$/.test(clean);
}

function saveMessage(data) {
  const oldMessages = JSON.parse(
    localStorage.getItem(CONTACT_MESSAGES_KEY) || "[]"
  );

  const nextMessages = [
    {
      id: Date.now(),
      status: "new",
      createdAt: new Date().toISOString(),
      ...data,
    },
    ...oldMessages,
  ];

  localStorage.setItem(CONTACT_MESSAGES_KEY, JSON.stringify(nextMessages));
}

function ContactCard({ item }) {
  const Icon = item.icon;

  const content = (
    <div className="group rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 transition group-hover:bg-orange-500 group-hover:text-white">
          <Icon size={21} />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            {item.title}
          </p>

          <p className="mt-2 break-words text-base font-black text-slate-950">
            {item.value}
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {item.text}
          </p>
        </div>
      </div>
    </div>
  );

  if (!item.href) return content;

  return (
    <a href={item.href} className="block">
      {content}
    </a>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  error,
  type = "text",
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={
          "h-13 w-full rounded-2xl border bg-slate-50 px-4 text-sm font-bold text-slate-950 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-500/10 " +
          (error ? "border-rose-300" : "border-slate-200")
        }
      />

      {error && <p className="mt-2 text-xs font-bold text-rose-500">{error}</p>}
    </div>
  );
}

export default function ContactPage() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    type: "order",
    subject: "",
    message: "",
  });

  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(false);

  const activeType = useMemo(() => {
    return supportTypes.find((item) => item.value === form.type);
  }, [form.type]);

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

  const validate = () => {
    const nextErrors = {};

    if (!form.fullName.trim()) {
      nextErrors.fullName = "Vui lòng nhập họ tên.";
    }

    if (!form.email.trim()) {
      nextErrors.email = "Vui lòng nhập email.";
    } else if (!isEmail(form.email)) {
      nextErrors.email = "Email chưa đúng định dạng.";
    }

    if (!form.phone.trim()) {
      nextErrors.phone = "Vui lòng nhập số điện thoại.";
    } else if (!isPhone(form.phone)) {
      nextErrors.phone = "Số điện thoại chưa đúng định dạng.";
    }

    if (!form.subject.trim()) {
      nextErrors.subject = "Vui lòng nhập chủ đề.";
    }

    if (!form.message.trim()) {
      nextErrors.message = "Vui lòng nhập nội dung.";
    } else if (form.message.trim().length < 10) {
      nextErrors.message = "Nội dung nên có ít nhất 10 ký tự.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setNotice(null);

    if (!validate()) {
      setNotice({
        type: "error",
        text: "Bạn kiểm tra lại thông tin còn thiếu nha.",
      });
      return;
    }

    setLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 700));

    saveMessage({
      ...form,
      typeLabel: activeType?.label || "Liên hệ",
    });

    setLoading(false);
    setNotice({
      type: "success",
      text: "Gửi liên hệ thành công. Dynova sẽ phản hồi trong vòng 24h.",
    });

    setForm({
      fullName: "",
      email: "",
      phone: "",
      type: "order",
      subject: "",
      message: "",
    });
  };

  return (
    <div className="min-h-screen bg-[#f7f8fb]">
      {notice && (
        <div
          className={
            "fixed right-5 top-24 z-[90] max-w-sm rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-2xl " +
            (notice.type === "success" ? "bg-slate-950" : "bg-rose-600")
          }
        >
          <div className="flex items-start gap-3">
            {notice.type === "success" ? (
              <CheckCircle size={18} className="mt-0.5 text-orange-300" />
            ) : (
              <AlertCircle size={18} className="mt-0.5 text-white" />
            )}

            <span>{notice.text}</span>

            <button
              onClick={() => setNotice(null)}
              className="ml-auto rounded-full p-1 hover:bg-white/10"
              aria-label="Đóng thông báo"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0">
          <img
            src="/images/banners/contact-banner.jpg"
            alt="Liên hệ Dynova"
            onError={(event) => {
              event.currentTarget.src =
                "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1600&auto=format&fit=crop&q=85";
            }}
            className="h-full w-full object-cover opacity-20"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/92 to-slate-950/70" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_24%,rgba(249,115,22,0.22),transparent_32%)]" />
        </div>

        <div className="container-page relative z-10 py-14 md:py-20">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-200 backdrop-blur">
              Dynova Support
            </p>

            <h1 className="mt-5 text-4xl font-black uppercase leading-tight tracking-[-0.04em] md:text-6xl">
              Liên hệ với Dynova
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
              Cần tư vấn sản phẩm, hỗ trợ đơn hàng hoặc góp ý dịch vụ? Gửi thông
              tin cho Dynova, đội ngũ hỗ trợ sẽ phản hồi bạn sớm nhất.
            </p>
          </div>
        </div>
      </section>

      <section className="container-page -mt-8 relative z-20">
        <div className="grid gap-4 md:grid-cols-3">
          {contactCards.map((item) => (
            <ContactCard key={item.title} item={item} />
          ))}
        </div>
      </section>

      <section className="container-page grid gap-8 py-12 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-5">
          <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-500">
              Hỗ trợ nhanh
            </p>

            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Bạn cần hỗ trợ gì?
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-500">
              Chọn nhóm liên hệ để Dynova xử lý yêu cầu đúng bộ phận.
            </p>

            <div className="mt-5 grid gap-3">
              {supportTypes.map((item) => {
                const Icon = item.icon;
                const active = form.type === item.value;

                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        type: item.value,
                        subject: item.label,
                      }))
                    }
                    className={
                      "flex items-center gap-3 rounded-2xl border p-4 text-left transition " +
                      (active
                        ? "border-orange-200 bg-orange-50 text-orange-600"
                        : "border-slate-200 bg-white text-slate-600 hover:border-orange-200 hover:bg-orange-50")
                    }
                  >
                    <span
                      className={
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl " +
                        (active
                          ? "bg-orange-500 text-white"
                          : "bg-slate-100 text-slate-500")
                      }
                    >
                      <Icon size={19} />
                    </span>

                    <span className="text-sm font-black">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                <MapPin size={22} />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                  Showroom
                </p>

                <h3 className="mt-2 text-lg font-black text-slate-950">
                  TP. Hồ Chí Minh
                </h3>

                <p className="mt-2 text-sm leading-7 text-slate-500">
                  Số 1, Đường B, Khu ADC, Phường Trung Mỹ Tây, Quận 12.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70 md:p-8">
          <div className="mb-6 border-b border-slate-200 pb-5">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-500">
              Form liên hệ
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-[-0.03em] text-slate-950">
              Gửi yêu cầu hỗ trợ
            </h2>

            <p className="mt-2 text-sm leading-7 text-slate-500">
              Thông tin được lưu demo vào localStorage để mô phỏng hệ thống tiếp
              nhận liên hệ.
            </p>

            <span className="mt-4 inline-flex rounded-full bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-wider text-orange-600">
              {activeType?.label}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-5">
            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Họ và tên *"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Nguyễn Trọng Hoài"
                error={errors.fullName}
              />

              <Field
                label="Email *"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="name@email.com"
                error={errors.email}
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Số điện thoại *"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="0866 347 730"
                error={errors.phone}
              />

              <Field
                label="Chủ đề *"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder="Hỗ trợ đơn hàng"
                error={errors.subject}
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                Nội dung *
              </label>

              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Nhập nội dung cần hỗ trợ..."
                className={
                  "min-h-36 w-full resize-none rounded-2xl border bg-slate-50 px-4 py-4 text-sm font-bold leading-7 text-slate-950 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-500/10 " +
                  (errors.message ? "border-rose-300" : "border-slate-200")
                }
              />

              {errors.message && (
                <p className="mt-2 text-xs font-bold text-rose-500">
                  {errors.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 py-4 text-sm font-black uppercase tracking-wider text-white transition hover:-translate-y-0.5 hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Đang gửi...
                </>
              ) : (
                <>
                  Gửi liên hệ
                  <Send size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </section>

      <section className="container-page pb-16">
        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-500">
                Location
              </p>

              <h2 className="mt-1 text-2xl font-black text-slate-950">
                Bản đồ showroom
              </h2>
            </div>

            <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-xs font-black text-orange-600">
              <MapPin size={14} />
              Dynova Sport
            </span>
          </div>

          <div className="h-[360px] bg-slate-100 md:h-[430px]">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.4749787803244!2d106.62340577590623!3d10.851432457805177!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752a210e57bb9b%3A0x81ffe69af45656b2!2zVHLGsOG7nW5nIENhbyDEkeG6s25nIEZQVCBQb2x5dGVjaG5pYw!5e0!3m2!1svi!2s!4v1716900000000!5m2!1svi!2s"
              className="h-full w-full border-0"
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </div>
  );
}