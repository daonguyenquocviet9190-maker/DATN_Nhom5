"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Camera,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  Heart,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  Mail,
  MapPin,
  PackageCheck,
  Phone,
  RefreshCw,
  Save,
  ShieldCheck,
  ShoppingBag,
  Truck,
  User,
} from "lucide-react";

import { formatCurrency } from "@/data/shop";
import {
  clearAuthSession,
  getAuthToken,
  logoutWithApi,
} from "@/services/auth.service";
import {
  getProfile,
  updateProfile,
  updateProfilePassword,
  uploadProfileAvatar,
} from "@/services/profile.service";

const tabs = [
  {
    id: "overview",
    label: "Tổng quan",
    icon: User,
  },
  {
    id: "profile",
    label: "Thông tin cá nhân",
    icon: ShieldCheck,
  },
  {
    id: "security",
    label: "Bảo mật",
    icon: KeyRound,
  },
];

function getDisplayName(user) {
  return (
    user?.fullName ||
    user?.full_name ||
    user?.name ||
    "Khách hàng Dynova"
  );
}

function getInitials(name = "") {
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function formatDate(value) {
  if (!value) return "Chưa có";

  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function statusLabel(status = "") {
  const clean = String(status).toLowerCase();

  const map = {
    pending: "Chờ xử lý",
    waiting_bank_transfer: "Chờ chuyển khoản",
    confirmed: "Đã xác nhận",
    shipping: "Đang giao",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
  };

  return map[clean] || status || "Chưa xác định";
}

function getOrderTotal(order) {
  const rawTotal =
    order?.grand_total ??
    order?.total_amount ??
    order?.final_total ??
    order?.total ??
    order?.total_price ??
    order?.payable_total ??
    order?.subtotal ??
    0;

  const total = Number(rawTotal);

  return Number.isFinite(total) ? total : 0;
}

function getPaymentLabel(method = "") {
  const clean = String(method || "").trim().toUpperCase();

  const map = {
    COD: "Thanh toán khi nhận hàng",
    BANK: "Chuyển khoản ngân hàng",
    BANK_TRANSFER: "Chuyển khoản ngân hàng",
    VNPAY: "VNPAY",
  };

  return map[clean] || method || "Chưa xác định";
}

function Field({
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false,
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
          type={type}
          value={value}
          disabled={disabled}
          onChange={onChange}
          placeholder={placeholder}
          className="h-[54px] w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-12 text-sm font-bold text-slate-950 outline-none transition duration-300 placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        />

        {rightSlot}
      </div>
    </label>
  );
}

function StatCard({ title, value, icon: Icon, tone = "orange", suffix = "" }) {
  const toneClass =
    tone === "green"
      ? "bg-emerald-50 text-emerald-600"
      : tone === "blue"
        ? "bg-sky-50 text-sky-600"
        : tone === "rose"
          ? "bg-rose-50 text-rose-600"
          : "bg-orange-50 text-orange-600";

  return (
    <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/70">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            {title}
          </p>

          <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950">
            {value || 0}
            {suffix}
          </p>
        </div>

        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${toneClass}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-[#f7f8fb] py-10">
      <div className="container-page">
        <div className="grid place-items-center rounded-[34px] border border-slate-200 bg-white p-16 shadow-sm">
          <Loader2 size={38} className="animate-spin text-orange-500" />
          <p className="mt-4 text-sm font-black text-slate-500">
            Đang tải hồ sơ tài khoản...
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("overview");
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({});
  const [recentOrders, setRecentOrders] = useState([]);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    province: "",
    ward: "",
    avatar_url: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const displayName = getDisplayName(user);
  const profilePercent = useMemo(() => {
    const fields = [
      form.fullName,
      form.email,
      form.phone,
      form.address,
      form.province,
      form.ward,
    ];

    return Math.round((fields.filter((item) => String(item || "").trim()).length / fields.length) * 100);
  }, [form]);

  const showNotice = (text) => {
    setNotice(text);
    setTimeout(() => setNotice(""), 2400);
  };

  const fillForm = (profileUser) => {
    setForm({
      fullName: getDisplayName(profileUser),
      email: profileUser?.email || "",
      phone: profileUser?.phone || "",
      address: profileUser?.address || "",
      province: profileUser?.province || "",
      ward: profileUser?.ward || "",
      avatar_url: profileUser?.avatar_url || "",
    });
  };

  const loadProfile = async () => {
    setLoading(true);
    setError("");

    if (!getAuthToken()) {
      clearAuthSession();
      setUser(null);
      setStats({});
      setRecentOrders([]);
      setLoading(false);
      router.replace("/login?redirect=/profile");
      return;
    }

    try {
      const data = await getProfile();
      const profileUser = data.user;

      if (!profileUser) {
        throw new Error("Không tìm thấy thông tin tài khoản.");
      }

      setUser(profileUser);
      setStats(data.stats || {});
      setRecentOrders(data.recent_orders || []);
      fillForm(profileUser);
    } catch (err) {
      if (err.status === 401) {
        clearAuthSession();
        setUser(null);
        setStats({});
        setRecentOrders([]);
        router.replace("/login?redirect=/profile");
        return;
      }

      setError(
        err.message ||
        "Không thể tải hồ sơ. Vui lòng thử lại sau."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const updateField = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
    setError("");
  };

  const updatePasswordField = (key, value) => {
    setPasswordForm((prev) => ({
      ...prev,
      [key]: value,
    }));
    setError("");
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    if (!form.fullName.trim()) {
      setError("Vui lòng nhập họ và tên.");
      return;
    }

    if (!form.email.trim()) {
      setError("Vui lòng nhập email.");
      return;
    }

    if (!form.phone.trim()) {
      setError("Vui lòng nhập số điện thoại.");
      return;
    }

    setSavingProfile(true);
    setError("");

    try {
      const data = await updateProfile(form);
      const updatedUser = data?.user || user;

      setUser(updatedUser);
      fillForm(updatedUser);
      showNotice("Cập nhật hồ sơ thành công.");
    } catch (err) {
      setError(err.message || "Không thể cập nhật hồ sơ.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();

    if (!passwordForm.current_password.trim()) {
      setError("Vui lòng nhập mật khẩu hiện tại.");
      return;
    }

    if (passwordForm.password.length < 6) {
      setError("Mật khẩu mới cần tối thiểu 6 ký tự.");
      return;
    }

    if (passwordForm.password !== passwordForm.password_confirmation) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setSavingPassword(true);
    setError("");

    try {
      await updateProfilePassword(passwordForm);

      setPasswordForm({
        current_password: "",
        password: "",
        password_confirmation: "",
      });

      showNotice("Đổi mật khẩu thành công.");
    } catch (err) {
      setError(err.message || "Không thể đổi mật khẩu.");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn file hình ảnh.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Ảnh không được vượt quá 2MB.");
      return;
    }

    setSavingProfile(true);
    setError("");

    try {
      const data = await uploadProfileAvatar(file);
      const updatedUser = data?.user;

      if (updatedUser) {
        setUser(updatedUser);
        fillForm(updatedUser);
      }

      showNotice("Cập nhật ảnh đại diện thành công.");
    } catch (err) {
      setError(err.message || "Không thể upload ảnh đại diện.");
    } finally {
      setSavingProfile(false);
      event.target.value = "";
    }
  };

  const handleLogout = async () => {
    setUser(null);
    setStats({});
    setRecentOrders([]);

    try {
      await logoutWithApi();
    } catch {
      // Phiên local vẫn được xóa ngay cả khi backend tạm thời không phản hồi.
    } finally {
      router.replace("/login");
      router.refresh();
    }
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#f7f8fb] py-10">
      {notice && (
        <div className="fixed right-5 top-24 z-[95] rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-2xl">
          {notice}
        </div>
      )}

      <div className="container-page">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-500">
              My account
            </p>

            <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] text-slate-950">
              Hồ sơ cá nhân
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
              Quản lý thông tin tài khoản, địa chỉ giao hàng, bảo mật và theo dõi
              hoạt động mua hàng của bạn tại Dynova Sport.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={loadProfile}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCw size={15} />
              Làm mới
            </button>

            <Link
              href="/orders"
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-orange-500"
            >
              <PackageCheck size={15} />
              Xem đơn hàng
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-3xl border border-rose-100 bg-rose-50 p-4 text-sm font-bold text-rose-600">
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="mt-0.5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          <aside className="space-y-5">
            <div className="overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-sm">
              <div className="relative h-32 bg-slate-950">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(249,115,22,0.5),transparent_35%)]" />
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950" />
              </div>

              <div className="-mt-14 px-6 pb-6">
                <div className="relative">
                  {form.avatar_url ? (
                    <img
                      src={form.avatar_url}
                      alt={displayName}
                      className="h-28 w-28 rounded-[30px] border-4 border-white object-cover shadow-xl"
                    />
                  ) : (
                    <div className="flex h-28 w-28 items-center justify-center rounded-[30px] border-4 border-white bg-orange-500 text-3xl font-black text-white shadow-xl">
                      {getInitials(displayName) || "DN"}
                    </div>
                  )}

                  <label className="absolute bottom-2 left-20 flex h-9 w-9 cursor-pointer items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg transition hover:bg-orange-500">
                    {savingProfile ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Camera size={16} />
                    )}

                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <h2 className="mt-4 text-2xl font-black tracking-[-0.04em] text-slate-950">
                  {displayName}
                </h2>

                <p className="mt-1 text-sm font-bold text-slate-500">
                  {user?.email || "Chưa có email"}
                </p>

                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-600">
                  <ShieldCheck size={15} />
                  {user?.role === "admin" ? "Quản trị viên" : "Khách hàng"}
                </div>

                <div className="mt-5 rounded-3xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between text-xs font-black text-slate-500">
                    <span>Hoàn thiện hồ sơ</span>
                    <span>{profilePercent}%</span>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-orange-500 transition-all duration-700"
                      style={{
                        width: `${profilePercent}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;

                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={
                          "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black transition " +
                          (active
                            ? "bg-slate-950 text-white shadow-lg shadow-slate-200"
                            : "bg-slate-50 text-slate-600 hover:bg-orange-50 hover:text-orange-600")
                        }
                      >
                        <Icon size={17} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={handleLogout}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-black text-rose-600 transition hover:bg-rose-500 hover:text-white"
                >
                  <LogOut size={17} />
                  Đăng xuất
                </button>
              </div>
            </div>

            <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                Thành viên từ
              </p>

              <p className="mt-2 text-lg font-black text-slate-950">
                {formatDate(user?.created_at)}
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Tài khoản của bạn đang được bảo vệ an toàn.
              </p>
            </div>
          </aside>

          <main className="space-y-6">
            {activeTab === "overview" && (
              <>
                <div className="grid gap-4 md:grid-cols-4">
                  <StatCard
                    title="Tổng đơn"
                    value={stats.total_orders}
                    icon={PackageCheck}
                  />

                  <StatCard
                    title="Đang giao"
                    value={stats.shipping_orders}
                    icon={Truck}
                    tone="blue"
                  />

                  <StatCard
                    title="Hoàn thành"
                    value={stats.completed_orders}
                    icon={CheckCircle2}
                    tone="green"
                  />

                  <StatCard
                    title="Wishlist"
                    value={0}
                    icon={Heart}
                    tone="rose"
                  />
                </div>

                <div className="rounded-[34px] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-500">
                        Spending summary
                      </p>

                      <h2 className="mt-2 text-2xl font-black text-slate-950">
                        Tổng chi tiêu
                      </h2>

                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        Tổng giá trị các đơn hàng hoàn thành trong tài khoản.
                      </p>
                    </div>

                    <p className="text-3xl font-black tracking-[-0.04em] text-orange-500">
                      {formatCurrency(
                        stats.total_spent ??
                          stats.completed_total ??
                          stats.totalSpent ??
                          0
                      )}
                    </p>
                  </div>
                </div>

                <div className="rounded-[34px] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-500">
                        Recent orders
                      </p>

                      <h2 className="mt-2 text-2xl font-black text-slate-950">
                        Đơn hàng gần đây
                      </h2>
                    </div>

                    <Link
                      href="/orders"
                      className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-orange-500"
                    >
                      Xem tất cả
                      <ArrowRight size={15} />
                    </Link>
                  </div>

                  {recentOrders.length === 0 ? (
                    <div className="mt-6 rounded-3xl bg-slate-50 p-8 text-center">
                      <ShoppingBag className="mx-auto text-orange-500" size={38} />

                      <h3 className="mt-4 text-xl font-black text-slate-950">
                        Bạn chưa có đơn hàng nào
                      </h3>

                      <p className="mt-2 text-sm text-slate-500">
                        Hãy mua sắm để theo dõi đơn hàng và lịch sử mua sắm.
                      </p>

                      <Link
                        href="/shop"
                        className="mt-5 inline-flex rounded-2xl bg-orange-500 px-5 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-orange-600"
                      >
                        Mua sắm ngay
                      </Link>
                    </div>
                  ) : (
                    <div className="mt-5 space-y-3">
                      {recentOrders.map((order) => (
                        <Link
                          key={order.id}
                          href={`/orders?order=${order.id}`}
                          className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-lg hover:shadow-slate-200/70 md:flex-row md:items-center md:justify-between"
                        >
                          <div>
                            <p className="text-xs font-black uppercase tracking-wider text-orange-500">
                              #{order.order_code || `DNV-${order.id}`}
                            </p>

                            <p className="mt-1 text-sm font-bold text-slate-500">
                              {formatDate(order.created_at)} •{" "}
                              {getPaymentLabel(
                                order.payment_method || order.paymentMethod
                              )}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-600">
                              {statusLabel(order.status)}
                            </span>

                            <span className="text-lg font-black text-slate-950">
                              {formatCurrency(getOrderTotal(order))}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === "profile" && (
              <form
                onSubmit={handleSaveProfile}
                className="rounded-[34px] border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-500">
                    Profile information
                  </p>

                  <h2 className="mt-2 text-2xl font-black text-slate-950">
                    Thông tin cá nhân
                  </h2>

                  <p className="mt-2 text-sm leading-7 text-slate-500">
                    Cập nhật thông tin này để hệ thống tự điền nhanh khi thanh
                    toán và giao hàng.
                  </p>
                </div>

                <div className="mt-7 grid gap-5 md:grid-cols-2">

                  <Field
                    label="Họ và tên"
                    icon={User}
                    value={form.fullName}
                    onChange={(event) =>
                      updateField("fullName", event.target.value)
                    }
                    placeholder="Nguyễn Trọng Hoài"
                  />

                  <Field
                    label="Email"
                    icon={Mail}
                    value={form.email}
                    onChange={(event) =>
                      updateField("email", event.target.value)
                    }
                    placeholder="name@email.com"
                  />

                  <Field
                    label="Số điện thoại"
                    icon={Phone}
                    value={form.phone}
                    onChange={(event) =>
                      updateField("phone", event.target.value)
                    }
                    placeholder="0937 781 823"
                  />

                  <Field
                    label="Tỉnh / Thành phố"
                    icon={MapPin}
                    value={form.province}
                    onChange={(event) =>
                      updateField("province", event.target.value)
                    }
                    placeholder="Thành phố Hồ Chí Minh"
                  />

                  <Field
                    label="Phường / Xã"
                    icon={MapPin}
                    value={form.ward}
                    onChange={(event) =>
                      updateField("ward", event.target.value)
                    }
                    placeholder="Phường Thủ Dầu Một"
                  />

                  <div className="md:col-span-2">
                    <Field
                      label="Địa chỉ chi tiết"
                      icon={MapPin}
                      value={form.address}
                      onChange={(event) =>
                        updateField("address", event.target.value)
                      }
                      placeholder="Số nhà, tên đường, khu phố..."
                    />
                  </div>
                </div>

                <button
                  disabled={savingProfile}
                  className="mt-7 inline-flex h-[54px] items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 text-xs font-black uppercase tracking-[0.16em] text-white shadow-xl shadow-orange-500/20 transition hover:-translate-y-0.5 hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                >
                  {savingProfile ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Lưu thay đổi
                    </>
                  )}
                </button>
              </form>
            )}

            {activeTab === "security" && (
              <form
                onSubmit={handleChangePassword}
                className="rounded-[34px] border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-500">
                    Account security
                  </p>

                  <h2 className="mt-2 text-2xl font-black text-slate-950">
                    Đổi mật khẩu
                  </h2>

                  <p className="mt-2 text-sm leading-7 text-slate-500">
                    Để bảo vệ tài khoản, hãy dùng mật khẩu mạnh và không chia sẻ
                    thông tin đăng nhập cho người khác.
                  </p>
                </div>

                <div className="mt-7 grid gap-5">
                  <Field
                    label="Mật khẩu hiện tại"
                    icon={Lock}
                    type={showPassword.current ? "text" : "password"}
                    value={passwordForm.current_password}
                    onChange={(event) =>
                      updatePasswordField("current_password", event.target.value)
                    }
                    placeholder="Nhập mật khẩu hiện tại"
                    rightSlot={
                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword((prev) => ({
                            ...prev,
                            current: !prev.current,
                          }))
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-orange-500"
                      >
                        {showPassword.current ? (
                          <EyeOff size={17} />
                        ) : (
                          <Eye size={17} />
                        )}
                      </button>
                    }
                  />

                  <Field
                    label="Mật khẩu mới"
                    icon={Lock}
                    type={showPassword.new ? "text" : "password"}
                    value={passwordForm.password}
                    onChange={(event) =>
                      updatePasswordField("password", event.target.value)
                    }
                    placeholder="Tối thiểu 6 ký tự"
                    rightSlot={
                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword((prev) => ({
                            ...prev,
                            new: !prev.new,
                          }))
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-orange-500"
                      >
                        {showPassword.new ? (
                          <EyeOff size={17} />
                        ) : (
                          <Eye size={17} />
                        )}
                      </button>
                    }
                  />

                  <Field
                    label="Xác nhận mật khẩu mới"
                    icon={Lock}
                    type={showPassword.confirm ? "text" : "password"}
                    value={passwordForm.password_confirmation}
                    onChange={(event) =>
                      updatePasswordField(
                        "password_confirmation",
                        event.target.value
                      )
                    }
                    placeholder="Nhập lại mật khẩu mới"
                    rightSlot={
                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword((prev) => ({
                            ...prev,
                            confirm: !prev.confirm,
                          }))
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-orange-500"
                      >
                        {showPassword.confirm ? (
                          <EyeOff size={17} />
                        ) : (
                          <Eye size={17} />
                        )}
                      </button>
                    }
                  />
                </div>

                <div className="mt-6 rounded-3xl bg-slate-50 p-4 text-sm font-bold leading-7 text-slate-500">
                  <ShieldCheck className="mr-2 inline text-emerald-500" size={17} />
                  Mật khẩu mới sẽ được áp dụng cho những lần đăng nhập tiếp theo.
                </div>

                <button
                  disabled={savingPassword}
                  className="mt-7 inline-flex h-[54px] items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 text-xs font-black uppercase tracking-[0.16em] text-white shadow-xl shadow-slate-200 transition hover:-translate-y-0.5 hover:bg-orange-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                >
                  {savingPassword ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Đang cập nhật...
                    </>
                  ) : (
                    <>
                      <KeyRound size={16} />
                      Đổi mật khẩu
                    </>
                  )}
                </button>
              </form>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}