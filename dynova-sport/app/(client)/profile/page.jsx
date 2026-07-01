"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
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

    if (!form.password) return { label: "Chưa nhập mật khẩu", width: "0%" };
    if (score <= 1) return { label: "Mật khẩu yếu", width: "33%" };
    if (score <= 3) return { label: "Mật khẩu ổn", width: "66%" };

    return { label: "Mật khẩu mạnh", width: "100%" };
  }, [form.password]);

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "", submit: "" }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.fullName.trim()) nextErrors.fullName = "Vui lòng nhập họ tên.";

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

    if (form.password.length < 6) {
      nextErrors.password = "Mật khẩu cần tối thiểu 6 ký tự.";
    }

    if (form.password !== form.confirmPassword) {
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

    setSuccessText("");

    if (!validate()) return;

    setLoading(true);

    try {
      await registerWithApi({
        fullName: form.fullName,
        name: form.fullName,
        email: form.email,
        phone: form.phone,
        password: form.password,
        password_confirmation: form.confirmPassword,
      });

      setSuccessText("Đăng ký thành công. Đang chuyển đến hồ sơ...");

      setTimeout(() => {
        router.push("/profile");
      }, 700);
    } catch (err) {
      setErrors({
        submit:
          err.message ||
          "Không thể đăng ký tài khoản. Vui lòng kiểm tra API Laravel.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#f7f8fb]">
      <section className="container-page grid min-h-screen items-center gap-8 py-10 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="relative hidden min-h-[680px] overflow-hidden rounded-[42px] bg-slate-950 text-white shadow-2xl shadow-slate-300/70 lg:block">
          <img
            src="https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf?w=1600&auto=format&fit=crop&q=85"
            alt="Dynova register"
            className="absolute inset-0 h-full w-full object-cover opacity-60"
          />

          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/85 to-orange-950/55" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(249,115,22,0.34),transparent_32%)]" />

          <div className="relative z-10 flex h-full flex-col justify-between p-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-200 backdrop-blur">
                <Sparkles size={15} />
                Dynova Club
              </div>

              <h1 className="mt-8 max-w-xl text-6xl font-black uppercase leading-[0.95] tracking-[-0.06em]">
                Tạo tài khoản thành viên
              </h1>

              <p className="mt-6 max-w-lg text-sm font-semibold leading-7 text-slate-300">
                Mua hàng nhanh hơn, lưu địa chỉ giao hàng, theo dõi đơn và nhận
                ưu đãi riêng cho thành viên.
              </p>
            </div>

            <div className="grid gap-3">
              {[
                "Lưu tài khoản vào bảng users",
                "Mật khẩu được mã hóa bằng Laravel Hash",
                "Đăng ký xong tự đăng nhập bằng token",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-4 text-sm font-bold text-slate-100 backdrop-blur"
                >
                  <CheckCircle2 size={18} className="text-orange-300" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[620px]">
          <div className="rounded-[36px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 md:p-8">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-500">
                Create account
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950">
                Đăng ký tài khoản
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
                Tài khoản sẽ được lưu vào database Laravel. Sau khi đăng ký,
                hệ thống tự đăng nhập và chuyển đến hồ sơ.
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
                  onChange={(e) => update("fullName", e.target.value)}
                  placeholder="Nguyễn Trọng Hoài"
                  error={errors.fullName}
                />
              </div>

              <Field
                label="Email"
                icon={Mail}
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="name@email.com"
                error={errors.email}
              />

              <Field
                label="Số điện thoại"
                icon={Phone}
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="0866 347 730"
                error={errors.phone}
              />

              <Field
                label="Mật khẩu"
                icon={Lock}
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                error={errors.password}
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-orange-500"
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
                onChange={(e) => update("confirmPassword", e.target.value)}
                placeholder="Nhập lại mật khẩu"
                error={errors.confirmPassword}
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-orange-500"
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
                  onChange={(e) => update("agree", e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                />
                <span>
                  Tôi đồng ý với điều khoản sử dụng và chính sách bảo mật của
                  Dynova Sport.
                </span>
              </label>

              <button
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
              Mật khẩu sẽ được mã hóa trước khi lưu vào database.
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
    </div>
  );
}