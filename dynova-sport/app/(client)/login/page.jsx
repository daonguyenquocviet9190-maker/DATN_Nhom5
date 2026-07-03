"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { loginWithApi, normalizeAuthRole } from "@/services/auth.service";

function Field({
  label,
  icon: Icon,
  type = "text",
  value,
  onChange,
  placeholder,
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
          className="h-[54px] w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-12 text-sm font-bold text-slate-950 outline-none transition duration-300 placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
        />

        {rightSlot}
      </div>
    </label>
  );
}

function resolveRedirectPath(role, redirectUrl) {
  const safeRedirect =
    typeof redirectUrl === "string" && redirectUrl.startsWith("/")
      ? redirectUrl
      : "";

  if (role === "admin") {
    if (safeRedirect && safeRedirect.startsWith("/admin")) {
      return safeRedirect;
    }

    return "/admin";
  }

  if (safeRedirect && !safeRedirect.startsWith("/admin")) {
    return safeRedirect;
  }

  return "/profile";
}

function getErrorMessage(error, fallback) {
  if (!error) return fallback;

  if (typeof error === "string") return error;

  return error?.message || fallback;
}

export default function LoginPage() {
  const router = useRouter();

  const [redirectUrl, setRedirectUrl] = useState("");

  const [form, setForm] = useState({
    email: "",
    password: "",
    remember: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [successText, setSuccessText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setRedirectUrl(params.get("redirect") || "");
  }, []);

  const redirectLabel = useMemo(() => {
    if (redirectUrl.includes("checkout")) return "thanh toán";
    if (redirectUrl.includes("profile")) return "hồ sơ";
    if (redirectUrl.includes("admin")) return "quản trị";

    return "tài khoản";
  }, [redirectUrl]);

  const updateForm = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

    setError("");
    setSuccessText("");
  };

  const submit = async (event) => {
    event.preventDefault();

    if (loading) return;

    setError("");
    setSuccessText("");

    const email = form.email.trim();

    if (!email) {
      setError("Vui lòng nhập email.");
      return;
    }

    if (!form.password.trim()) {
      setError("Vui lòng nhập mật khẩu.");
      return;
    }

    setLoading(true);

    try {
      const auth = await loginWithApi({
        email,
        password: form.password,
        remember: form.remember,
      });

      const role = normalizeAuthRole(auth?.user);
      const nextPath = resolveRedirectPath(role, redirectUrl);

      setSuccessText(
        role === "admin"
          ? "Đăng nhập quản trị thành công. Đang chuyển đến Admin..."
          : "Đăng nhập thành công. Đang chuyển trang..."
      );

      window.setTimeout(() => {
        router.replace(nextPath);
      }, 650);
    } catch (err) {
      setError(getErrorMessage(err, "Email hoặc mật khẩu không đúng."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f8fb]">
      <section className="container-page grid min-h-screen items-center gap-8 py-10 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="relative hidden min-h-[660px] overflow-hidden rounded-[42px] bg-slate-950 text-white shadow-2xl shadow-slate-300/70 lg:block">
          <img
            src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1600&auto=format&fit=crop&q=85"
            alt="Dynova login"
            className="absolute inset-0 h-full w-full object-cover opacity-60"
          />

          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/85 to-orange-950/55" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(249,115,22,0.34),transparent_32%)]" />

          <div className="relative z-10 flex h-full flex-col justify-between p-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-200 backdrop-blur">
                <Sparkles size={15} />
                Dynova Member
              </div>

              <h1 className="mt-8 max-w-xl text-6xl font-black uppercase leading-[0.95] tracking-[-0.06em]">
                Đăng nhập để mua nhanh hơn
              </h1>

              <p className="mt-6 max-w-lg text-sm font-semibold leading-7 text-slate-300">
                Lưu địa chỉ giao hàng, theo dõi đơn, quản lý wishlist và nhận ưu
                đãi thành viên Dynova Sport.
              </p>
            </div>

            <div className="grid gap-3">
              {[
                "Customer đăng nhập sẽ vào hồ sơ hoặc trang cần tiếp tục",
                "Admin đăng nhập sẽ tự động chuyển vào trang quản trị",
                "Token đăng nhập dùng cho checkout, wishlist và đơn hàng",
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

        <div className="mx-auto w-full max-w-[500px]">
          <div className="rounded-[36px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 md:p-8">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-slate-950 text-sm font-black text-white shadow-xl shadow-slate-300">
                DNV
              </div>

              <p className="mt-5 text-xs font-black uppercase tracking-[0.22em] text-orange-500">
                Welcome back
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950">
                Đăng nhập tài khoản
              </h2>

              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">
                Đăng nhập để tiếp tục {redirectLabel}. Hệ thống sẽ tự kiểm tra
                quyền admin hoặc customer.
              </p>
            </div>

            {error && (
              <div className="mt-6 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm font-bold leading-6 text-rose-600">
                {error}
              </div>
            )}

            {successText && (
              <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold leading-6 text-emerald-600">
                {successText}
              </div>
            )}

            <form onSubmit={submit} className="mt-7 space-y-5">
              <Field
                label="Email"
                icon={Mail}
                type="email"
                value={form.email}
                onChange={(event) => updateForm("email", event.target.value)}
                placeholder="Nhập email"
                autoComplete="email"
              />

              <Field
                label="Mật khẩu"
                icon={Lock}
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(event) =>
                  updateForm("password", event.target.value)
                }
                placeholder="Nhập mật khẩu"
                autoComplete="current-password"
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

              <div className="flex items-center justify-between gap-4">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-slate-600">
                  <input
                    type="checkbox"
                    checked={form.remember}
                    onChange={(event) =>
                      updateForm("remember", event.target.checked)
                    }
                    className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                  />
                  Ghi nhớ đăng nhập
                </label>

                <Link
                  href="/forgot-password"
                  className="text-sm font-black text-orange-600 transition hover:text-orange-700"
                >
                  Quên mật khẩu?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 text-xs font-black uppercase tracking-[0.16em] text-white shadow-xl shadow-orange-500/20 transition duration-300 hover:-translate-y-0.5 hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Đang kiểm tra...
                  </>
                ) : (
                  <>
                    Đăng nhập
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 rounded-3xl bg-slate-50 p-4 text-xs font-bold leading-6 text-slate-500">
              <ShieldCheck className="mr-2 inline text-emerald-500" size={15} />
              Admin sẽ được chuyển đến trang quản trị. Customer sẽ vào hồ sơ
              hoặc trang đang cần đăng nhập.
            </div>

            <p className="mt-6 text-center text-sm text-slate-500">
              Chưa có tài khoản?{" "}
              <Link
                href="/register"
                className="font-black text-orange-600 transition hover:text-orange-700"
              >
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}