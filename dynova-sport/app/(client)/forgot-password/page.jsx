"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";

import {
  forgotPasswordWithApi,
  resetPasswordWithApi,
} from "@/services/auth.service";

function Field({
  label,
  icon: Icon,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
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
            "h-[54px] w-full rounded-2xl border bg-slate-50 pl-11 pr-4 text-sm font-bold text-slate-950 outline-none transition duration-300 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-orange-500/10 " +
            (error
              ? "border-rose-300 focus:border-rose-400"
              : "border-slate-200 focus:border-orange-400")
          }
        />
      </div>

      {error && <p className="mt-2 text-xs font-bold text-rose-500">{error}</p>}
    </label>
  );
}

export default function ForgotPasswordPage() {
  const [step, setStep] = useState("email");
  const [form, setForm] = useState({
    email: "",
    otp: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "", submit: "" }));
  };

  const requestOtp = async (event) => {
    event.preventDefault();

    setErrors({});
    setNotice("");
    setDevOtp("");

    if (!form.email.trim()) {
      setErrors({ email: "Vui lòng nhập email tài khoản." });
      return;
    }

    setLoading(true);

    try {
      const response = await forgotPasswordWithApi({
        email: form.email,
      });

      setNotice(
        response.message ||
          "Mã xác thực đã được tạo. Vui lòng kiểm tra email hoặc dùng mã demo."
      );

      if (response.data?.dev_otp) {
        setDevOtp(response.data.dev_otp);
      }

      setStep("reset");
    } catch (err) {
      setErrors({
        submit:
          err.message ||
          "Không thể gửi mã xác thực. Vui lòng kiểm tra email.",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();

    setErrors({});
    setNotice("");

    const nextErrors = {};

    if (!form.otp.trim()) {
      nextErrors.otp = "Vui lòng nhập mã OTP.";
    }

    if (form.password.length < 6) {
      nextErrors.password = "Mật khẩu mới cần tối thiểu 6 ký tự.";
    }

    if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = "Mật khẩu xác nhận không khớp.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);

    try {
      const response = await resetPasswordWithApi({
        email: form.email,
        otp: form.otp,
        password: form.password,
        password_confirmation: form.confirmPassword,
      });

      setNotice(response.message || "Đổi mật khẩu thành công.");
      setStep("done");
    } catch (err) {
      setErrors({
        submit:
          err.message ||
          "Mã OTP không đúng hoặc đã hết hạn. Vui lòng thử lại.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#f7f8fb]">
      <section className="container-page grid min-h-screen items-center gap-8 py-10 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="relative hidden min-h-[640px] overflow-hidden rounded-[42px] bg-slate-950 text-white shadow-2xl shadow-slate-300/70 lg:block">
          <img
            src="https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=1600&auto=format&fit=crop&q=85"
            alt="Forgot password"
            className="absolute inset-0 h-full w-full object-cover opacity-55"
          />

          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/88 to-orange-950/55" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(249,115,22,0.34),transparent_34%)]" />

          <div className="relative z-10 flex h-full flex-col justify-between p-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-200 backdrop-blur">
                <ShieldCheck size={15} />
                Account Recovery
              </div>

              <h1 className="mt-8 max-w-xl text-6xl font-black uppercase leading-[0.95] tracking-[-0.06em]">
                Khôi phục mật khẩu an toàn
              </h1>

              <p className="mt-6 max-w-lg text-sm font-semibold leading-7 text-slate-300">
                Hệ thống tạo mã OTP, lưu vào database và xác thực trước khi cho
                phép đổi mật khẩu mới.
              </p>
            </div>

            <div className="grid gap-3">
              {[
                "OTP được lưu trong bảng password_reset_tokens",
                "Mã OTP hết hạn sau 10 phút",
                "Mật khẩu mới được mã hóa trước khi lưu",
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

        <div className="mx-auto w-full max-w-[540px]">
          <div className="rounded-[36px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 md:p-8">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-black text-slate-500 transition hover:text-orange-600"
            >
              <ArrowLeft size={16} />
              Quay lại đăng nhập
            </Link>

            <div className="mt-7">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-500">
                Forgot password
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950">
                Quên mật khẩu
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Nhập email tài khoản để nhận mã OTP, sau đó đặt lại mật khẩu mới.
              </p>
            </div>

            {errors.submit && (
              <div className="mt-6 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm font-bold leading-6 text-rose-600">
                {errors.submit}
              </div>
            )}

            {notice && (
              <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold leading-6 text-emerald-600">
                {notice}
              </div>
            )}

            {devOtp && (
              <div className="mt-4 rounded-2xl border border-orange-100 bg-orange-50 p-4 text-sm font-black text-orange-700">
                Mã OTP demo: {devOtp}
              </div>
            )}

            {step === "email" && (
              <form onSubmit={requestOtp} className="mt-7 space-y-5">
                <Field
                  label="Email tài khoản"
                  icon={Mail}
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="name@email.com"
                  error={errors.email}
                />

                <button
                  disabled={loading}
                  className="flex h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 text-xs font-black uppercase tracking-[0.16em] text-white shadow-xl shadow-orange-500/20 transition duration-300 hover:-translate-y-0.5 hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Đang gửi mã...
                    </>
                  ) : (
                    <>
                      Gửi mã OTP
                      <KeyRound size={16} />
                    </>
                  )}
                </button>
              </form>
            )}

            {step === "reset" && (
              <form onSubmit={resetPassword} className="mt-7 space-y-5">
                <Field
                  label="Mã OTP"
                  icon={KeyRound}
                  value={form.otp}
                  onChange={(e) => update("otp", e.target.value)}
                  placeholder="Nhập mã 6 số"
                  error={errors.otp}
                />

                <Field
                  label="Mật khẩu mới"
                  icon={Lock}
                  type="password"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  error={errors.password}
                />

                <Field
                  label="Xác nhận mật khẩu"
                  icon={Lock}
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => update("confirmPassword", e.target.value)}
                  placeholder="Nhập lại mật khẩu"
                  error={errors.confirmPassword}
                />

                <button
                  disabled={loading}
                  className="flex h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 text-xs font-black uppercase tracking-[0.16em] text-white shadow-xl shadow-orange-500/20 transition duration-300 hover:-translate-y-0.5 hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Đang đổi mật khẩu...
                    </>
                  ) : (
                    <>
                      Đặt lại mật khẩu
                      <Lock size={16} />
                    </>
                  )}
                </button>
              </form>
            )}

            {step === "done" && (
              <div className="mt-8 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 size={38} />
                </div>

                <h2 className="mt-5 text-2xl font-black text-slate-950">
                  Mật khẩu đã được cập nhật
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Bạn có thể đăng nhập lại bằng mật khẩu mới.
                </p>

                <Link
                  href="/login"
                  className="mt-6 inline-flex rounded-2xl bg-orange-500 px-6 py-4 text-xs font-black uppercase tracking-wider text-white transition hover:bg-orange-600"
                >
                  Đăng nhập ngay
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}