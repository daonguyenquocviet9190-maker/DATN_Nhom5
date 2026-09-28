"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Edit3,
  Loader2,
  MapPin,
  Phone,
  Plus,
  Save,
  Star,
  Trash2,
  User,
  X,
} from "lucide-react";

import { getAuthToken } from "@/services/auth.service";
import {
  getShippingDistricts,
  getShippingProvinces,
  getShippingWards,
} from "@/services/address.service";
import {
  createSavedAddress,
  deleteSavedAddress,
  getSavedAddresses,
  setDefaultSavedAddress,
  updateSavedAddress,
} from "@/services/saved-address.service";

const emptyForm = {
  recipient_name: "",
  phone: "",
  province_code: "",
  province: "",
  district_code: "",
  district: "",
  ward_code: "",
  ward: "",
  address_line: "",
  is_default: false,
};

function formatFullAddress(address) {
  return [
    address?.address_line,
    address?.ward,
    address?.district,
    address?.province,
  ]
    .filter(Boolean)
    .join(", ");
}

function isPhone(value) {
  return /^(0|\+84)[0-9]{8,10}$/.test(String(value || "").replace(/\s/g, ""));
}

export default function AddressBookPage() {
  const router = useRouter();
  const [addresses, setAddresses] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const title = useMemo(
    () => (editingId ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới"),
    [editingId]
  );

  const loadAddresses = async () => {
    const list = await getSavedAddresses();
    setAddresses(list);
    return list;
  };

  useEffect(() => {
    let mounted = true;

    async function init() {
      if (!getAuthToken()) {
        router.replace("/login?redirect=/profile/addresses");
        return;
      }

      try {
        setLoading(true);
        const [addressList, provinceList] = await Promise.all([
          getSavedAddresses(),
          getShippingProvinces(),
        ]);

        if (!mounted) return;
        setAddresses(addressList);
        setProvinces(provinceList);
      } catch (err) {
        if (!mounted) return;
        setError(err?.message || "Không thể tải sổ địa chỉ.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();
    return () => {
      mounted = false;
    };
  }, [router]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setDistricts([]);
    setWards([]);
    setError("");
    setShowForm(false);
  };

  const openCreate = () => {
    setForm({
      ...emptyForm,
      is_default: addresses.length === 0,
    });
    setEditingId(null);
    setDistricts([]);
    setWards([]);
    setError("");
    setMessage("");
    setShowForm(true);
  };

  const openEdit = async (address) => {
    setShowForm(true);
    setEditingId(address.id);
    setError("");
    setMessage("");
    setFormLoading(true);

    try {
      const selectedProvince =
        provinces.find(
          (item) => String(item.code) === String(address.province_code)
        ) || null;

      const nextDistricts = selectedProvince
        ? await getShippingDistricts(selectedProvince)
        : [];

      const selectedDistrict =
        nextDistricts.find(
          (item) => String(item.code) === String(address.district_code)
        ) || null;

      const nextWards = selectedDistrict
        ? await getShippingWards(selectedDistrict)
        : [];

      setDistricts(nextDistricts);
      setWards(nextWards);
      setForm({
        recipient_name: address.recipient_name || "",
        phone: address.phone || "",
        province_code: String(address.province_code || ""),
        province: address.province || "",
        district_code: String(address.district_code || ""),
        district: address.district || "",
        ward_code: String(address.ward_code || ""),
        ward: address.ward || "",
        address_line: address.address_line || "",
        is_default: Boolean(address.is_default),
      });
    } catch (err) {
      setError(err?.message || "Không tải được dữ liệu địa chỉ để chỉnh sửa.");
    } finally {
      setFormLoading(false);
    }
  };

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError("");
  };

  const handleProvinceChange = async (event) => {
    const code = event.target.value;
    const province = provinces.find((item) => String(item.code) === String(code));

    setForm((prev) => ({
      ...prev,
      province_code: code,
      province: province?.name || "",
      district_code: "",
      district: "",
      ward_code: "",
      ward: "",
    }));
    setDistricts([]);
    setWards([]);

    if (!province) return;

    setFormLoading(true);
    try {
      setDistricts(await getShippingDistricts(province));
    } catch (err) {
      setError(err?.message || "Không tải được quận/huyện.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDistrictChange = async (event) => {
    const code = event.target.value;
    const district = districts.find((item) => String(item.code) === String(code));

    setForm((prev) => ({
      ...prev,
      district_code: code,
      district: district?.name || "",
      ward_code: "",
      ward: "",
    }));
    setWards([]);

    if (!district) return;

    setFormLoading(true);
    try {
      setWards(await getShippingWards(district));
    } catch (err) {
      setError(err?.message || "Không tải được phường/xã.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleWardChange = (event) => {
    const code = event.target.value;
    const ward = wards.find((item) => String(item.code) === String(code));

    setForm((prev) => ({
      ...prev,
      ward_code: code,
      ward: ward?.name || "",
    }));
  };

  const validate = () => {
    if (!form.recipient_name.trim()) return "Vui lòng nhập tên người nhận.";
    if (!form.phone.trim()) return "Vui lòng nhập số điện thoại.";
    if (!isPhone(form.phone)) return "Số điện thoại chưa đúng định dạng.";
    if (!form.province_code) return "Vui lòng chọn tỉnh/thành phố.";
    if (!form.district_code) return "Vui lòng chọn quận/huyện.";
    if (!form.ward_code) return "Vui lòng chọn phường/xã.";
    if (!form.address_line.trim()) return "Vui lòng nhập địa chỉ chi tiết.";
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        ...form,
        province_code: Number(form.province_code),
        district_code: Number(form.district_code),
        recipient_name: form.recipient_name.trim(),
        phone: form.phone.replace(/\s/g, ""),
        address_line: form.address_line.trim(),
        is_default: Boolean(form.is_default),
      };

      const response = editingId
        ? await updateSavedAddress(editingId, payload)
        : await createSavedAddress(payload);

      await loadAddresses();
      setMessage(
        response?.message ||
          (editingId ? "Cập nhật địa chỉ thành công." : "Thêm địa chỉ thành công.")
      );
      resetForm();
    } catch (err) {
      setError(err?.message || "Không thể lưu địa chỉ.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (address) => {
    if (!window.confirm(`Xóa địa chỉ ${formatFullAddress(address)}?`)) return;

    try {
      setError("");
      const response = await deleteSavedAddress(address.id);
      await loadAddresses();
      setMessage(response?.message || "Đã xóa địa chỉ.");
    } catch (err) {
      setError(err?.message || "Không thể xóa địa chỉ.");
    }
  };

  const handleSetDefault = async (address) => {
    if (address.is_default) return;

    try {
      setError("");
      const response = await setDefaultSavedAddress(address.id);
      await loadAddresses();
      setMessage(response?.message || "Đã đặt làm địa chỉ mặc định.");
    } catch (err) {
      setError(err?.message || "Không thể đặt địa chỉ mặc định.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f8fb] py-16">
        <div className="container-page grid place-items-center">
          <Loader2 className="animate-spin text-orange-500" size={38} />
          <p className="mt-3 text-sm font-black text-slate-500">Đang tải sổ địa chỉ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fb] py-10">
      <div className="container-page">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500 transition hover:text-orange-500"
            >
              <ArrowLeft size={15} /> Hồ sơ cá nhân
            </Link>
            <p className="mt-5 text-xs font-black uppercase tracking-[0.24em] text-orange-500">
              Address book
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] text-slate-950">
              Sổ địa chỉ
            </h1>
              {/* <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
                Lưu nhiều địa chỉ nhận hàng và chọn địa chỉ mặc định để checkout nhanh hơn.
              </p> */}
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 text-xs font-black uppercase tracking-wider text-white transition hover:bg-orange-600"
          >
            <Plus size={16} /> Thêm địa chỉ
          </button>
        </div>

        {message && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm font-bold text-rose-600">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_430px]">
          <section>
            {addresses.length === 0 ? (
              <div className="rounded-[30px] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
                <MapPin className="mx-auto text-orange-500" size={42} />
                <h2 className="mt-4 text-xl font-black text-slate-950">Chưa có địa chỉ đã lưu</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Thêm địa chỉ đầu tiên. Địa chỉ này sẽ tự động được đặt làm mặc định.
                </p>
                <button
                  type="button"
                  onClick={openCreate}
                  className="mt-5 rounded-2xl bg-slate-950 px-5 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-orange-500"
                >
                  Thêm địa chỉ
                </button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {addresses.map((address) => (
                  <article
                    key={address.id}
                    className={
                      "rounded-[28px] border bg-white p-5 shadow-sm transition " +
                      (address.is_default
                        ? "border-orange-300 ring-4 ring-orange-500/5"
                        : "border-slate-200 hover:border-orange-200")
                    }
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-black text-slate-950">{address.recipient_name}</h3>
                          {address.is_default && (
                            <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-orange-600">
                              Mặc định
                            </span>
                          )}
                        </div>
                        <p className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-500">
                          <Phone size={14} /> {address.phone}
                        </p>
                      </div>
                      <MapPin className="shrink-0 text-orange-500" size={20} />
                    </div>

                    <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
                      {formatFullAddress(address)}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                      {!address.is_default && (
                        <button
                          type="button"
                          onClick={() => handleSetDefault(address)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-xs font-black text-amber-700 transition hover:bg-amber-100"
                        >
                          <Star size={14} /> Đặt mặc định
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => openEdit(address)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-200"
                      >
                        <Edit3 size={14} /> Sửa
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(address)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-600 transition hover:bg-rose-100"
                      >
                        <Trash2 size={14} /> Xóa
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside className="h-fit lg:sticky lg:top-24">
            {showForm ? (
              <form onSubmit={handleSubmit} className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-500">Address</p>
                    <h2 className="mt-1 text-xl font-black text-slate-950">{title}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-xl bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200"
                  >
                    <X size={17} />
                  </button>
                </div>

                <div className="mt-6 space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">Tên người nhận</span>
                    <div className="relative">
                      <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        value={form.recipient_name}
                        onChange={(e) => updateField("recipient_name", e.target.value)}
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-bold outline-none focus:border-orange-500 focus:bg-white"
                        placeholder="Nguyễn Văn A"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">Số điện thoại</span>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        value={form.phone}
                        onChange={(e) => updateField("phone", e.target.value)}
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-bold outline-none focus:border-orange-500 focus:bg-white"
                        placeholder="0901234567"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">Tỉnh / Thành phố</span>
                    <select
                      value={form.province_code}
                      onChange={handleProvinceChange}
                      disabled={formLoading}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-orange-500 focus:bg-white disabled:opacity-60"
                    >
                      <option value="">Chọn Tỉnh / Thành phố</option>
                      {provinces.map((item) => (
                        <option key={item.code} value={String(item.code)}>{item.name}</option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">Quận / Huyện</span>
                    <select
                      value={form.district_code}
                      onChange={handleDistrictChange}
                      disabled={formLoading || !form.province_code}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-orange-500 focus:bg-white disabled:opacity-60"
                    >
                      <option value="">Chọn Quận / Huyện</option>
                      {districts.map((item) => (
                        <option key={item.code} value={String(item.code)}>{item.name}</option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">Phường / Xã</span>
                    <select
                      value={form.ward_code}
                      onChange={handleWardChange}
                      disabled={formLoading || !form.district_code}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-orange-500 focus:bg-white disabled:opacity-60"
                    >
                      <option value="">Chọn Phường / Xã</option>
                      {wards.map((item) => (
                        <option key={item.code} value={String(item.code)}>{item.name}</option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">Địa chỉ chi tiết</span>
                    <textarea
                      rows={3}
                      value={form.address_line}
                      onChange={(e) => updateField("address_line", e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-orange-500 focus:bg-white"
                      placeholder="Số nhà, tên đường, khu phố..."
                    />
                  </label>

                  <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-slate-50 p-4">
                    <input
                      type="checkbox"
                      checked={form.is_default}
                      onChange={(e) => updateField("is_default", e.target.checked)}
                      className="h-4 w-4 accent-orange-500"
                    />
                    <span className="text-sm font-black text-slate-700">Đặt làm địa chỉ mặc định</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={saving || formLoading}
                  className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 text-xs font-black uppercase tracking-wider text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {saving ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Thêm địa chỉ"}
                </button>
              </form>
            ) : (
              <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                <MapPin className="text-orange-500" size={28} />
                <h2 className="mt-4 text-xl font-black text-slate-950">Địa chỉ nhận hàng</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Địa chỉ mặc định sẽ được ưu tiên tự điền khi bạn sang trang thanh toán.
                </p>
                <button
                  type="button"
                  onClick={openCreate}
                  className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-orange-600"
                >
                  <Plus size={15} /> Thêm địa chỉ
                </button>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
