"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
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
    if (redirectUrl.includes("profile")) return "hồ sơ cá nhân";
    if (redirectUrl.includes("orders")) return "đơn hàng";
    if (redirectUrl.includes("wishlist")) return "danh sách yêu thích";

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

      setSuccessText("Đăng nhập thành công. Đang chuyển trang...");

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
    <main className="relative min-h-screen overflow-hidden bg-[#f7f8fb]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-120px] top-[-120px] h-[330px] w-[330px] rounded-full bg-orange-200/45 blur-3xl" />
        <div className="absolute bottom-[-140px] right-[-120px] h-[360px] w-[360px] rounded-full bg-slate-300/45 blur-3xl" />
      </div>

      <section className="container-page relative z-10 flex min-h-screen items-center justify-center py-10">
        <div className="w-full max-w-[500px]">
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
                Chào mừng trở lại
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-[-0.04em] text-slate-950">
                Đăng nhập tài khoản
              </h1>

              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">
                Đăng nhập để tiếp tục {redirectLabel} và quản lý trải nghiệm mua
                sắm của bạn tại Dynova Sport.
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
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
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
                    Đang đăng nhập...
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
              Thông tin tài khoản của bạn được bảo vệ trong suốt quá trình sử
              dụng Dynova Sport.
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