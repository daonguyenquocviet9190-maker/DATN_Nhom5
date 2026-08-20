"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Percent, Search, TicketPercent, Plus, Trash2, CheckCircle2, XCircle, X } from "lucide-react";
import { extractItems, getAdminPromotions } from "@/services/admin.service";
import { formatCurrency } from "@/data/shop";

export default function AdminPromotionsPage() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State quản lý Modal và Form thêm mã mới
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    type: "fixed", // 'fixed' (tiền) hoặc 'percent' (%)
    value: "",
    min_order_value: "",
    is_active: true,
  });

  // 1. Gọi API lấy danh sách mã giảm giá
  const fetchPromotions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminPromotions();
      const data = extractItems(res);
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Lỗi khi tải mã giảm giá:", err);
      setError("Không thể tải danh sách mã giảm giá. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  // 2. Tìm kiếm mã giảm giá
  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    const lowerQuery = query.toLowerCase();
    return items.filter(
      (item) =>
        item?.code?.toLowerCase().includes(lowerQuery) ||
        item?.name?.toLowerCase().includes(lowerQuery) ||
        item?.title?.toLowerCase().includes(lowerQuery)
    );
  }, [items, query]);

  // 3. Xử lý Thêm mã mới
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.value) {
      alert("Vui lòng nhập đầy đủ Mã Code và Giá trị giảm!");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("http://localhost:8000/api/admin/promotions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          code: formData.code.trim().toUpperCase(),
          name: formData.name,
          type: formData.type,
          value: Number(formData.value),
          min_order_value: Number(formData.min_order_value || 0),
          is_active: formData.is_active ? 1 : 0,
        }),
      });

      const data = await res.json();
      if (res.ok || data.success) {
        alert("Thêm mã giảm giá thành công!");
        setIsOpenModal(false);
        setFormData({
          code: "",
          name: "",
          type: "fixed",
          value: "",
          min_order_value: "",
          is_active: true,
        });
        fetchPromotions(); // Reload danh sách
      } else {
        alert(data.message || "Lỗi khi lưu mã giảm giá.");
      }
    } catch (err) {
      console.error("Lỗi submit:", err);
      alert("Không thể kết nối đến máy chủ.");
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Xử lý Xóa mã giảm giá
  const handleDelete = async (id, code) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa mã "${code}"?`)) return;

    try {
      const res = await fetch(`http://localhost:8000/api/admin/promotions/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        alert("Đã xóa mã thành công!");
        fetchPromotions();
      } else {
        alert("Lỗi khi xóa mã.");
      }
    } catch (err) {
      console.error("Lỗi delete:", err);
    }
  };

  return (
    <div className="space-y-6 p-6 text-slate-100">
      {/* Header & Tiêu đề */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-orange-500">PROMOTIONS</p>
          <h1 className="text-2xl font-bold tracking-tight text-white">Quản lý mã giảm giá</h1>
          <p className="mt-1 text-sm text-slate-400">
            Xem và quản lý các chương trình ưu đãi, voucher giảm giá toàn cửa hàng.
          </p>
        </div>

        <button
          onClick={() => setIsOpenModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition-all hover:bg-orange-600 active:scale-95"
        >
          <Plus size={18} />
          <span>Thêm mã mới</span>
        </button>
      </div>

      {/* Thanh Tìm Kiếm */}
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-slate-400 transition-all focus-within:border-orange-500/50">
        <Search size={18} className="text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm mã giảm giá theo tên hoặc mã code..."
          className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
        />
        {query && (
          <button onClick={() => setQuery("")} className="text-xs text-slate-400 hover:text-white">
            Xóa
          </button>
        )}
      </div>

      {/* Bảng dữ liệu */}
      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] py-16 text-slate-400">
          <Loader2 size={32} className="animate-spin text-orange-500 mb-3" />
          <p className="text-sm font-medium">Đang tải danh sách mã giảm giá...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-400">
          <p className="font-medium">{error}</p>
          <button onClick={fetchPromotions} className="mt-3 rounded-lg bg-red-500/20 px-4 py-1.5 text-xs font-semibold hover:bg-red-500/30">
            Thử lại
          </button>
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-semibold">Mã Code / Tên</th>
                  <th className="px-6 py-4 font-semibold">Mức giảm</th>
                  <th className="px-6 py-4 font-semibold">Đơn tối thiểu</th>
                  <th className="px-6 py-4 font-semibold">Trạng thái</th>
                  <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredItems.map((item, index) => {
                  const isPercent = item.type === "percent" || item.discount_type === "percent";
                  const discountVal = item.value ?? item.discount_value ?? 0;
                  const minOrderVal = item.min_order_value ?? item.min_subtotal ?? 0;
                  const isActive = item.is_active ?? item.status === 1 ?? true;

                  return (
                    <tr key={item.id || index} className="transition-colors hover:bg-white/[0.02]">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                            <TicketPercent size={20} />
                          </div>
                          <div>
                            <span className="font-mono text-base font-bold text-orange-400 tracking-wider">
                              {item.code || "N/A"}
                            </span>
                            <p className="text-xs text-slate-400">{item.name || item.title || "Mã giảm giá"}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 font-semibold text-white">
                        {isPercent ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400">
                            <Percent size={14} /> {discountVal}%
                          </span>
                        ) : (
                          <span className="text-emerald-400">
                            {formatCurrency ? formatCurrency(discountVal) : `${Number(discountVal).toLocaleString("vi-VN")} đ`}
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-slate-400">
                        {minOrderVal > 0 ? (
                          formatCurrency ? formatCurrency(minOrderVal) : `${Number(minOrderVal).toLocaleString("vi-VN")} đ`
                        ) : (
                          <span className="text-slate-500">Không yêu cầu</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 size={12} /> Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-500/10 px-3 py-1 text-xs font-medium text-slate-400 border border-slate-500/20">
                            <XCircle size={12} /> Tắt
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(item.id, item.code)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                          title="Xóa mã giảm giá"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.01] py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20 mb-4">
            <TicketPercent size={32} />
          </div>
          <h3 className="text-lg font-semibold text-white">Chưa có mã giảm giá nào</h3>
          <p className="mt-1 text-sm text-slate-400">Bấm nút "Thêm mã mới" ở trên để tạo mã giảm giá đầu tiên.</p>
        </div>
      )}

      {/* MODAL THÊM MÃ MỚI */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl text-slate-100 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setIsOpenModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold text-white mb-4">Tạo mã giảm giá mới</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Mã Code (viết hoa)*</label>
                <input
                  type="text"
                  placeholder="VD: DYNOVA50K"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-orange-500 focus:outline-none uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tên chương trình / Mô tả</label>
                <input
                  type="text"
                  placeholder="VD: Giảm 50k cho khách hàng mới"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Loại giảm giá</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-orange-500 focus:outline-none"
                  >
                    <option value="fixed">Số tiền cố định (đ)</option>
                    <option value="percent">Phần trăm (%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Giá trị giảm*</label>
                  <input
                    type="number"
                    placeholder={formData.type === "fixed" ? "50000" : "10"}
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-orange-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Giá trị đơn hàng tối thiểu (đ)</label>
                <input
                  type="number"
                  placeholder="0 (Nếu không yêu cầu)"
                  value={formData.min_order_value}
                  onChange={(e) => setFormData({ ...formData, min_order_value: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 rounded border-white/10 bg-white/5 text-orange-500 focus:ring-orange-500"
                />
                <label htmlFor="is_active" className="text-xs text-slate-300">
                  Kích hoạt mã ngay sau khi tạo
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsOpenModal(false)}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-400 hover:bg-white/5"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  Lưu mã giảm giá
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}