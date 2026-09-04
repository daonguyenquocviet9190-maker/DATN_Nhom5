"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, CheckCircle2, Copy, Loader2, QrCode } from "lucide-react";
import { formatCurrency } from "@/data/shop";
import { getSePayPayment } from "@/services/payment.service";

const POLL_MS = 2500;
const MAX_WAIT_MS = 15 * 60 * 1000;

function isPaid(payment) {
  return String(payment?.payment_status || "").toLowerCase() === "paid"
    || String(payment?.transaction_status || "").toLowerCase() === "paid"
    || Boolean(payment?.paid_at);
}

function InfoRow({ label, value, highlight = false, copyable = false }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!value || !copyable) return;
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-3 last:border-b-0">
      <span className="shrink-0 text-sm font-semibold text-slate-500">{label}</span>
      <div className="flex min-w-0 items-center gap-2 text-right">
        <span className={`break-all text-sm font-black ${highlight ? "text-orange-600" : "text-slate-950"}`}>
          {value || "—"}
        </span>
        {copyable && value ? (
          <button
            type="button"
            onClick={copy}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            aria-label={`Sao chép ${label}`}
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function SePayPaymentCard({ orderId, onPaid, className = "" }) {
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const notifiedRef = useRef(false);
  const mountedRef = useRef(true);
  const runningRef = useRef(false);
  const onPaidRef = useRef(onPaid);

  useEffect(() => {
    onPaidRef.current = onPaid;
  }, [onPaid]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const load = useCallback(async (silent = false) => {
    if (!orderId || runningRef.current) return null;
    runningRef.current = true;

    try {
      if (!silent) setLoading(true);
      const next = await getSePayPayment(orderId);
      if (!mountedRef.current) return next;

      setPayment(next || null);
      setError("");

      if (isPaid(next) && !notifiedRef.current) {
        notifiedRef.current = true;
        await onPaidRef.current?.(next);
      }
      return next;
    } catch (err) {
      if (mountedRef.current && !silent) {
        setError(err?.message || "Không thể tải thông tin thanh toán.");
      }
      return null;
    } finally {
      runningRef.current = false;
      if (mountedRef.current && !silent) setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    notifiedRef.current = false;
    setPayment(null);
    setError("");
    load(false);
  }, [load]);

  useEffect(() => {
    if (!orderId || !payment || isPaid(payment)) return undefined;

    const startedAt = Date.now();
    let timer;

    const poll = async () => {
      if (!mountedRef.current) return;
      if (Date.now() - startedAt >= MAX_WAIT_MS) {
        setError("Thời gian chờ thanh toán đã hết. Vui lòng mở lại trang đơn hàng để kiểm tra.");
        return;
      }
      const next = await load(true);
      if (next && isPaid(next)) return;
      timer = window.setTimeout(poll, POLL_MS);
    };

    timer = window.setTimeout(poll, POLL_MS);
    return () => window.clearTimeout(timer);
  }, [load, orderId, payment]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && payment && !isPaid(payment)) {
        load(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [load, payment]);

  if (loading) {
    return (
      <section className={`rounded-[28px] border border-slate-200 bg-white p-8 ${className}`}>
        <div className="flex min-h-[260px] items-center justify-center gap-3 text-sm font-bold text-slate-500">
          <Loader2 className="animate-spin text-orange-500" size={22} />
          Đang tải mã thanh toán...
        </div>
      </section>
    );
  }

  if (error && !payment) {
    return (
      <section className={`rounded-[28px] border border-rose-200 bg-rose-50 p-6 ${className}`}>
        <p className="text-sm font-bold text-rose-700">{error}</p>
      </section>
    );
  }

  const paid = isPaid(payment);

  return (
    <section className={`overflow-hidden rounded-[28px] border ${paid ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200 bg-white"} ${className}`}>
      <div className="border-b border-slate-100 px-5 py-5 md:px-6">
        <div className="flex items-center gap-3">
          <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${paid ? "bg-emerald-100 text-emerald-600" : "bg-orange-50 text-orange-600"}`}>
            {paid ? <CheckCircle2 size={22} /> : <QrCode size={22} />}
          </span>
          <div>
            <h3 className="text-lg font-black text-slate-950">
              {paid ? "Thanh toán thành công" : "Thanh toán bằng QR"}
            </h3>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">
              {paid ? "Hệ thống đã ghi nhận thanh toán." : "Quét mã VietQR để thanh toán."}
            </p>
          </div>
        </div>
      </div>

      {paid ? (
        <div className="px-6 py-9 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 size={34} />
          </div>
          <p className="mt-4 text-2xl font-black text-slate-950">Thanh toán thành công</p>
          <p className="mt-2 text-sm font-semibold text-slate-500">Đơn hàng đã được chuyển sang trạng thái xác nhận.</p>
          <p className="mt-4 text-3xl font-black text-emerald-600">{formatCurrency(Number(payment?.amount || 0))}</p>
        </div>
      ) : (
        <div className="grid gap-6 p-5 md:grid-cols-[270px_1fr] md:p-6">
          <div className="mx-auto w-full max-w-[270px] rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
            {payment?.qr_url ? (
              <img
                src={payment.qr_url}
                alt={`VietQR thanh toán ${payment?.payment_code || payment?.order_code || orderId}`}
                className="aspect-square w-full object-contain"
              />
            ) : (
              <div className="flex aspect-square items-center justify-center rounded-2xl bg-slate-50 text-center text-sm font-bold text-slate-400">Không tải được QR</div>
            )}
          </div>

          <div>
            <div className="rounded-3xl bg-slate-50 px-4 py-2">
              <InfoRow label="Ngân hàng" value={payment?.bank?.name || payment?.bank?.code} />
              <InfoRow label="Số tài khoản" value={payment?.bank?.account_number} copyable />
              <InfoRow label="Chủ tài khoản" value={payment?.bank?.account_name} />
              <InfoRow label="Số tiền" value={formatCurrency(Number(payment?.amount || 0))} highlight />
              <InfoRow label="Nội dung" value={payment?.transfer_content} copyable highlight />
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-500">
              <Loader2 size={16} className="shrink-0 animate-spin text-orange-500" />
              Đang chờ SePay xác nhận thanh toán...
            </div>
          </div>
        </div>
      )}

      {error ? <div className="border-t border-rose-100 bg-rose-50 px-5 py-3 text-xs font-bold text-rose-700">{error}</div> : null}
    </section>
  );
}