"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";

import { registerWithApi } from "@/services/auth.service";

function Field({
  label,
  icon: Icon,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  rightSlot,
  autoComplete,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">
        {label}
      </span>

      <div className="group relative">
        <Icon
          size={17}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-orange-500"
        />

        <input
          required
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={
            "h-[54px] w-full rounded-2xl border bg-slate-50 pl-11 pr-12 text-sm font-bold text-slate-950 outline-none transition duration-300 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-orange-500/10 " +
            (error
              ? "border-rose-300 focus:border-rose-400"
              : "border-slate-200 focus:border-orange-400")
          }
        />

        {rightSlot}
      </div>

      {error && <p className="mt-2 text-xs font-bold text-rose-500">{error}</p>}
    </label>
  );
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isPhone(value) {
  return /^(0|\+84)[0-9]{8,10}$/.test(value.replace(/\s/g, ""));
}

function getErrorMessage(error, fallback) {
  if (!error) return fallback;
  if (typeof error === "string") return error;

  return error?.message || fallback;
}

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agree: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [successText, setSuccessText] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordStrength = useMemo(() => {
    let score = 0;

    if (form.password.length >= 6) score += 1;
    if (/[A-Z]/.test(form.password)) score += 1;
    if (/[0-9]/.test(form.password)) score += 1;
    if (/[^A-Za-z0-9]/.test(form.password)) score += 1;

    if (!form.password) {
      return {
        label: "Chưa nhập mật khẩu",
        width: "0%",
      };
    }

    if (score <= 1) {
      return {
        label: "Mật khẩu yếu",
        width: "33%",
      };
    }

    if (score <= 3) {
      return {
        label: "Mật khẩu ổn",
        width: "66%",
      };
    }

    return {
      label: "Mật khẩu mạnh",
      width: "100%",
    };
  }, [form.password]);

  const update = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [key]: "",
      submit: "",
    }));

    setSuccessText("");
  };

  const validate = () => {
    const nextErrors = {};

    const fullName = form.fullName.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();

    if (!fullName) {
      nextErrors.fullName = "Vui lòng nhập họ tên.";
    }

    if (!email) {
      nextErrors.email = "Vui lòng nhập email.";
    } else if (!isEmail(email)) {
      nextErrors.email = "Email chưa đúng định dạng.";
    }

    if (!phone) {
      nextErrors.phone = "Vui lòng nhập số điện thoại.";
    } else if (!isPhone(phone)) {
      nextErrors.phone = "Số điện thoại chưa đúng định dạng.";
    }

    if (!form.password) {
      nextErrors.password = "Vui lòng nhập mật khẩu.";
    } else if (form.password.length < 6) {
      nextErrors.password = "Mật khẩu cần tối thiểu 6 ký tự.";
    }

    if (!form.confirmPassword) {
      nextErrors.confirmPassword = "Vui lòng xác nhận mật khẩu.";
    } else if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = "Mật khẩu xác nhận không khớp.";
    }

    if (!form.agree) {
      nextErrors.submit = "Bạn cần đồng ý với điều khoản sử dụng.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();

    if (loading) return;

    setSuccessText("");

    if (!validate()) return;

    setLoading(true);

    try {
      await registerWithApi({
        fullName: form.fullName.trim(),
        name: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        password_confirmation: form.confirmPassword,
        remember: true,
      });

      setSuccessText("Đăng ký thành công. Đang chuyển đến hồ sơ...");

      window.setTimeout(() => {
        router.replace("/profile");
      }, 700);
    } catch (err) {
      setErrors({
        submit: getErrorMessage(
          err,
          "Không thể đăng ký tài khoản. Vui lòng kiểm tra lại thông tin và thử lại."
        ),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f8fb]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-[-120px] top-[-120px] h-[330px] w-[330px] rounded-full bg-orange-200/45 blur-3xl" />
        <div className="absolute bottom-[-140px] left-[-120px] h-[360px] w-[360px] rounded-full bg-slate-300/45 blur-3xl" />
      </div>

      <section className="container-page relative z-10 flex min-h-screen items-center justify-center py-10">
        <div className="w-full max-w-[620px]">
          <div className="mb-7 text-center">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white shadow-xl shadow-slate-300">
                DNV
              </div>

              <div className="text-left">
                <p className="text-xl font-black uppercase tracking-[-0.04em] text-slate-950">
                  Dynova
                </p>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-orange-500">
                  Sport Shop
                </p>
              </div>
            </Link>
          </div>

          <div className="rounded-[36px] border border-slate-200 bg-white/95 p-6 shadow-2xl shadow-slate-200/80 backdrop-blur md:p-8">
            <div className="text-center">
              <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-orange-600">
                <Sparkles size={14} />
                Thành viên mới
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-[-0.04em] text-slate-950">
                Đăng ký tài khoản
              </h1>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
                Tạo tài khoản để mua sắm nhanh hơn, theo dõi đơn hàng và lưu
                những sản phẩm thể thao bạn yêu thích.
              </p>
            </div>

            {errors.submit && (
              <div className="mt-6 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm font-bold leading-6 text-rose-600">
                {errors.submit}
              </div>
            )}

            {successText && (
              <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold leading-6 text-emerald-600">
                {successText}
              </div>
            )}

            <form onSubmit={submit} className="mt-7 grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <Field
                  label="Họ và tên"
                  icon={User}
                  value={form.fullName}
                  onChange={(event) => update("fullName", event.target.value)}
                  placeholder="Nhập họ và tên"
                  error={errors.fullName}
                  autoComplete="name"
                />
              </div>

              <Field
                label="Email"
                icon={Mail}
                type="email"
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
                placeholder="name@email.com"
                error={errors.email}
                autoComplete="email"
              />

              <Field
                label="Số điện thoại"
                icon={Phone}
                value={form.phone}
                onChange={(event) => update("phone", event.target.value)}
                placeholder="0866 347 730"
                error={errors.phone}
                autoComplete="tel"
              />

              <Field
                label="Mật khẩu"
                icon={Lock}
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(event) => update("password", event.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                error={errors.password}
                autoComplete="new-password"
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-orange-500"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                }
              />

              <Field
                label="Xác nhận mật khẩu"
                icon={Lock}
                type={showConfirmPassword ? "text" : "password"}
                value={form.confirmPassword}
                onChange={(event) =>
                  update("confirmPassword", event.target.value)
                }
                placeholder="Nhập lại mật khẩu"
                error={errors.confirmPassword}
                autoComplete="new-password"
                rightSlot={
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((prev) => !prev)
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-orange-500"
                    aria-label={
                      showConfirmPassword
                        ? "Ẩn mật khẩu xác nhận"
                        : "Hiện mật khẩu xác nhận"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>
                }
              />

              <div className="md:col-span-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between text-xs font-black text-slate-500">
                    <span>Độ mạnh mật khẩu</span>
                    <span>{passwordStrength.label}</span>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-orange-500 transition-all duration-500"
                      style={{ width: passwordStrength.width }}
                    />
                  </div>
                </div>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-bold leading-6 text-slate-600 md:col-span-2">
                <input
                  type="checkbox"
                  checked={form.agree}
                  onChange={(event) => update("agree", event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                />
                <span>
                  Tôi đồng ý với điều khoản sử dụng và chính sách bảo mật của
                  Dynova Sport.
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="flex h-[56px] items-center justify-center gap-2 rounded-2xl bg-orange-500 text-xs font-black uppercase tracking-[0.16em] text-white shadow-xl shadow-orange-500/20 transition duration-300 hover:-translate-y-0.5 hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none md:col-span-2"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Đang tạo tài khoản...
                  </>
                ) : (
                  <>
                    Đăng ký
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 rounded-3xl bg-slate-50 p-4 text-xs font-bold leading-6 text-slate-500">
              <ShieldCheck className="mr-2 inline text-emerald-500" size={15} />
              Thông tin cá nhân của bạn được bảo vệ và chỉ sử dụng cho trải
              nghiệm mua sắm tại Dynova Sport.
            </div>

            <p className="mt-6 text-center text-sm text-slate-500">
              Đã có tài khoản?{" "}
              <Link
                href="/login"
                className="font-black text-orange-600 transition hover:text-orange-700"
              >
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}