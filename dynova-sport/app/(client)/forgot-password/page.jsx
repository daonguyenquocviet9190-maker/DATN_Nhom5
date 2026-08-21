"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
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
  rightSlot,
  autoComplete,
  inputMode,
  maxLength,
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
          inputMode={inputMode}
          maxLength={maxLength}
          className={
            "h-[54px] w-full rounded-2xl border bg-slate-50 pl-11 text-sm font-bold text-slate-950 outline-none transition duration-300 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-orange-500/10 " +
            (rightSlot ? "pr-12 " : "pr-4 ") +
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

function getErrorMessage(error, fallback) {
  if (!error) return fallback;
  if (typeof error === "string") return error;

  return error?.message || fallback;
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
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

    setNotice("");
  };

  const requestOtp = async (event) => {
    event.preventDefault();

    if (loading) return;

    setErrors({});
    setNotice("");

    const email = form.email.trim();

    if (!email) {
      setErrors({
        email: "Vui lòng nhập email tài khoản.",
      });
      return;
    }

    if (!isEmail(email)) {
      setErrors({
        email: "Email chưa đúng định dạng.",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await forgotPasswordWithApi({
        email,
      });

      setNotice(
        response?.message ||
          "Mã xác thực đã được gửi. Vui lòng kiểm tra email của bạn."
      );

      setStep("reset");
    } catch (err) {
      setErrors({
        submit: getErrorMessage(
          err,
          "Không thể gửi mã xác thực. Vui lòng kiểm tra email và thử lại."
        ),
      });
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();

    if (loading) return;

    setErrors({});
    setNotice("");

    const nextErrors = {};
    const email = form.email.trim();
    const otp = form.otp.trim();

    if (!email) {
      nextErrors.submit = "Vui lòng nhập email để tiếp tục.";
    }

    if (!otp) {
      nextErrors.otp = "Vui lòng nhập mã xác thực.";
    }

    if (form.password.length < 8) {
      nextErrors.password = "Mật khẩu mới cần tối thiểu 8 ký tự.";
    } else if (!/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      nextErrors.password = "Mật khẩu mới cần có ít nhất 1 chữ và 1 số.";
    }

    if (!form.confirmPassword) {
      nextErrors.confirmPassword = "Vui lòng xác nhận mật khẩu.";
    } else if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = "Mật khẩu xác nhận không khớp.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);

    try {
      const response = await resetPasswordWithApi({
        email,
        otp,
        password: form.password,
        password_confirmation: form.confirmPassword,
      });

      setNotice(response?.message || "Mật khẩu đã được cập nhật thành công.");
      setStep("done");
    } catch (err) {
      setErrors({
        submit: getErrorMessage(
          err,
          "Mã xác thực không đúng hoặc đã hết hạn. Vui lòng thử lại."
        ),
      });
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (loading) return;

    setErrors({});
    setNotice("");

    const email = form.email.trim();

    if (!email || !isEmail(email)) {
      setStep("email");
      setErrors({
        email: "Vui lòng nhập lại email tài khoản.",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await forgotPasswordWithApi({
        email,
      });

      setNotice(
        response?.message ||
          "Mã xác thực mới đã được gửi. Vui lòng kiểm tra email của bạn."
      );
    } catch (err) {
      setErrors({
        submit: getErrorMessage(
          err,
          "Không thể gửi lại mã xác thực. Vui lòng thử lại sau."
        ),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f8fb]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-120px] top-[-120px] h-[330px] w-[330px] rounded-full bg-orange-200/45 blur-3xl" />
        <div className="absolute bottom-[-140px] right-[-120px] h-[360px] w-[360px] rounded-full bg-slate-300/45 blur-3xl" />
      </div>

      <section className="container-page relative z-10 flex min-h-screen items-center justify-center py-10">
        <div className="w-full max-w-[540px]">
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
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-black text-slate-500 transition hover:text-orange-600"
            >
              <ArrowLeft size={16} />
              Quay lại đăng nhập
            </Link>

            <div className="mt-7 text-center">
              <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-orange-600">
                <Sparkles size={14} />
                Khôi phục tài khoản
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-[-0.04em] text-slate-950">
                Quên mật khẩu
              </h1>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
                Nhập email tài khoản của bạn. Dynova Sport sẽ gửi mã xác thực để
                bạn đặt lại mật khẩu mới.
              </p>
            </div>

            {errors.submit && (
              <div className="mt-6 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm font-bold leading-6 text-rose-600">
                {errors.submit}
              </div>
            )}

            {notice && step !== "done" && (
              <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold leading-6 text-emerald-600">
                {notice}
              </div>
            )}

            {step === "email" && (
              <form onSubmit={requestOtp} className="mt-7 space-y-5">
                <Field
                  label="Email tài khoản"
                  icon={Mail}
                  type="email"
                  value={form.email}
                  onChange={(event) => update("email", event.target.value)}
                  placeholder="name@email.com"
                  error={errors.email}
                  autoComplete="email"
                />

                <button
                  type="submit"
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
                      Gửi mã xác thực
                      <KeyRound size={16} />
                    </>
                  )}
                </button>
              </form>
            )}

            {step === "reset" && (
              <form onSubmit={resetPassword} className="mt-7 space-y-5">
                <div className="rounded-2xl bg-slate-50 p-4 text-xs font-bold leading-6 text-slate-500">
                  Mã xác thực đã được gửi đến{" "}
                  <span className="font-black text-slate-950">
                    {form.email.trim()}
                  </span>
                  . Vui lòng kiểm tra email và nhập mã bên dưới.
                </div>

                <Field
                  label="Mã xác thực"
                  icon={KeyRound}
                  value={form.otp}
                  onChange={(event) =>
                    update(
                      "otp",
                      event.target.value.replace(/\D/g, "").slice(0, 6)
                    )
                  }
                  placeholder="Nhập mã 6 số"
                  error={errors.otp}
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="one-time-code"
                />

                <Field
                  label="Mật khẩu mới"
                  icon={Lock}
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(event) => update("password", event.target.value)}
                  placeholder="Tối thiểu 8 ký tự, có chữ và số"
                  error={errors.password}
                  autoComplete="new-password"
                  rightSlot={
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-orange-500"
                      aria-label={
                        showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                      }
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

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 text-xs font-black uppercase tracking-[0.16em] text-white shadow-xl shadow-orange-500/20 transition duration-300 hover:-translate-y-0.5 hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Đang cập nhật...
                    </>
                  ) : (
                    <>
                      Đặt lại mật khẩu
                      <Lock size={16} />
                    </>
                  )}
                </button>

                <div className="flex flex-col gap-3 text-center sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={resendOtp}
                    disabled={loading}
                    className="text-sm font-black text-orange-600 transition hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Gửi lại mã
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStep("email");
                      setNotice("");
                      setErrors({});
                    }}
                    className="text-sm font-bold text-slate-500 transition hover:text-slate-900"
                  >
                    Đổi email khác
                  </button>
                </div>
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

                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  Bạn có thể đăng nhập lại bằng mật khẩu mới để tiếp tục mua sắm
                  tại Dynova Sport.
                </p>

                <Link
                  href="/login"
                  className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 text-xs font-black uppercase tracking-wider text-white shadow-xl shadow-orange-500/20 transition hover:-translate-y-0.5 hover:bg-orange-600"
                >
                  Đăng nhập ngay
                  <ArrowRight size={16} />
                </Link>
              </div>
            )}

            {step !== "done" && (
              <div className="mt-6 rounded-3xl bg-slate-50 p-4 text-xs font-bold leading-6 text-slate-500">
                <ShieldCheck className="mr-2 inline text-emerald-500" size={15} />
                Vì lý do bảo mật, hãy sử dụng mật khẩu mới khác với mật khẩu cũ
                và không chia sẻ mã xác thực cho người khác.
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}