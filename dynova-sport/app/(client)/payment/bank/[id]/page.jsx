"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock3,
  Copy,
  Landmark,
  Loader2,
  RefreshCw,
} from "lucide-react";

import { formatCurrency } from "@/data/shop";
import {
  getSePayPayment,
  refreshSePayPayment,
} from "@/services/payment.service";

export default function BankPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  const loadPayment = useCallback(async ({ silent = false, refresh = false } = {}) => {
    if (!orderId) return;

    if (!silent) setChecking(true);

    try {
      const state = refresh
        ? await refreshSePayPayment(orderId)
        : await getSePayPayment(orderId);
      setOrder(state);
      setError("");
    } catch (err) {
      setError(err?.message || "Không thể kiểm tra trạng thái thanh toán.");
    } finally {
      setLoading(false);
      if (!silent) setChecking(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadPayment();
  }, [loadPayment]);

  useEffect(() => {
    if (!orderId || order?.payment_status === "paid") return undefined;

    const timer = window.setInterval(() => {
      loadPayment({ silent: true, refresh: true });
    }, 3000);

    return () => window.clearInterval(timer);
  }, [loadPayment, orderId, order?.payment_status]);

  const total = Number(order?.amount ?? 0);
  const orderCode = order?.order_code || `DNV${orderId || ""}`;
  const paid = String(order?.payment_status || "").toLowerCase() === "paid";

  const qrUrl = order?.qr_url || "";
  const bankAccount = {
    bank: order?.bank?.name || order?.bank?.code || "",
    accountNumber: order?.bank?.account_number || "",
    accountName: order?.bank?.account_name || "",
  };
  const transferContent =
    order?.transfer_content || order?.payment_code || orderCode;

  const copyText = async (value, key) => {
    try {
      await navigator.clipboard.writeText(String(value || ""));
      setCopied(key);
      window.setTimeout(() => setCopied(""), 1200);
    } catch {
      setCopied("");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f8fb] py-16">
        <div className="container-page flex justify-center">
          <Loader2 className="animate-spin text-orange-500" size={34} />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#f7f8fb] py-16">
        <div className="container-page">
          <div className="mx-auto max-w-xl rounded-[30px] border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-black text-slate-950">Không tìm thấy đơn hàng</h1>
            <p className="mt-2 text-sm font-semibold text-slate-500">{error}</p>
            <Link href="/orders" className="mt-6 inline-block rounded-2xl bg-slate-950 px-6 py-3 text-xs font-black uppercase tracking-wider text-white">
              Xem đơn hàng
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (paid) {
    return (
      <div className="min-h-screen bg-[#f7f8fb] py-14">
        <div className="container-page">
          <div className="mx-auto max-w-2xl rounded-[34px] border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/70">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={40} />
            </div>
            <h1 className="mt-5 text-3xl font-black text-slate-950">Thanh toán đã được ghi nhận</h1>
            <p className="mt-2 text-sm leading-7 text-slate-500">
              Chuyển khoản cho đơn <b>{orderCode}</b> đã vào hệ thống. Nhân viên sẽ xác nhận đơn hàng trong thời gian sớm nhất.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => router.push(`/orders/${orderId}`)}
                className="rounded-2xl bg-orange-500 px-6 py-4 text-xs font-black uppercase tracking-wider text-white transition hover:bg-orange-600"
              >
                Xem đơn hàng
              </button>
              <Link
                href="/shop"
                className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50"
              >
                Tiếp tục mua
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff7ed,_#f8fafc_50%,_#f1f5f9)] py-10">
      <div className="container-page">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex flex-col gap-3">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-500">Thanh toán</p>
            <h1 className="text-4xl font-black tracking-[-0.03em] text-slate-950">Quét mã QR để thanh toán</h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-500">
              Đơn hàng của bạn đang ở trạng thái chờ thanh toán. Sau khi chuyển khoản thành công, hệ thống sẽ ghi nhận và nhân viên xác nhận đơn trong thời gian sớm nhất.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
            <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
              <div className="absolute inset-x-10 top-0 h-24 bg-gradient-to-b from-orange-200/50 to-transparent blur-2xl" />
              <div className="relative rounded-[30px] border border-slate-200 bg-white p-3 shadow-inner shadow-slate-100">
                <div className="relative overflow-hidden rounded-[24px] border border-slate-100 bg-white p-3">
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(249,115,22,0.12)_50%,transparent_100%)] opacity-80 animate-pulse" />
                  <div className="pointer-events-none absolute inset-x-6 top-0 h-16 bg-gradient-to-b from-orange-400/30 via-orange-200/20 to-transparent blur-xl" />
                  <img src={qrUrl} alt={`QR thanh toán ${orderCode}`} className="relative z-10 aspect-square w-full rounded-[18px] object-contain" />
                </div>
              </div>
              <div className="relative mt-4 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 px-4 py-3 text-xs font-black text-amber-700 ring-1 ring-amber-100">
                <Clock3 size={16} className="animate-pulse" />
                Đang chờ xác nhận thanh toán
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                  <Landmark size={24} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-slate-400">Chuyển khoản ngân hàng</p>
                  <h2 className="text-xl font-black text-slate-950">{bankAccount.bank}</h2>
                </div>
              </div>

              <div className="mt-6 divide-y divide-slate-100 rounded-3xl bg-slate-50 px-5">
                {[
                  ["Số tài khoản", bankAccount.accountNumber, "account"],
                  ["Chủ tài khoản", bankAccount.accountName, "name"],
                  ["Số tiền", formatCurrency(total), "amount"],
                  ["Nội dung", transferContent, "code"],
                ].map(([label, value, key]) => (
                  <div key={key} className="flex items-center justify-between gap-4 py-4">
                    <div>
                      <p className="text-xs font-bold text-slate-400">{label}</p>
                      <p className="mt-1 break-all text-sm font-black text-slate-950">{value}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyText(key === "amount" ? Math.round(total) : value, key)}
                      className="shrink-0 rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-orange-200 hover:text-orange-500"
                      title="Sao chép"
                    >
                      {copied === key ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                ))}
              </div>

              <p className="mt-5 rounded-2xl bg-rose-50 p-4 text-xs font-bold leading-6 text-rose-600">
                Chuyển đúng số tiền và giữ nguyên nội dung <b>{transferContent}</b> để hệ thống đối soát chính xác và xác nhận nhanh hơn.
              </p>

              {error && <p className="mt-4 text-xs font-bold text-rose-500">{error}</p>}

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => loadPayment({ refresh: true })}
                  disabled={checking}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-xs font-black uppercase tracking-wider text-white disabled:opacity-60"
                >
                  {checking ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                  Kiểm tra thanh toán
                </button>
                <Link href={`/orders/${orderId}`} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-wider text-slate-700">
                  Chi tiết đơn
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
