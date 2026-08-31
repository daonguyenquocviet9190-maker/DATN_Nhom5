"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  CheckCircle2,
  Copy,
  Landmark,
  Loader2,
  QrCode,
  RefreshCw,
} from "lucide-react";
import { formatCurrency } from "@/data/shop";
import { getVietQrPayment } from "@/services/payment.service";

function InfoRow({ label, value, copyable = false, highlight = false }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!copyable || !value) return;

    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {}
  };

  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-3 last:border-b-0">
      <span className="shrink-0 text-xs font-bold text-slate-500">{label}</span>

      <div className="flex min-w-0 items-center justify-end gap-2 text-right">
        <span
          className={`break-all text-sm font-black ${
            highlight ? "text-orange-600" : "text-slate-950"
          }`}
        >
          {value || "—"}
        </span>

        {copyable && value ? (
          <button
            type="button"
            onClick={copy}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-orange-200 hover:text-orange-600"
            aria-label={`Sao chép ${label}`}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function VietQrPaymentCard({ orderId, onPaid, className = "" }) {
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const paidNotifiedRef = useRef(false);
  const onPaidRef = useRef(onPaid);

  useEffect(() => {
    onPaidRef.current = onPaid;
  }, [onPaid]);

  const notifyPaid = useCallback((data) => {
    if (data?.payment_status !== "paid" || paidNotifiedRef.current) return;

    paidNotifiedRef.current = true;
    onPaidRef.current?.(data);
  }, []);

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!orderId) return;

      try {
        if (!silent) setLoading(true);

        const data = await getVietQrPayment(orderId);
        setPayment(data);
        setError("");
        notifyPaid(data);
      } catch (err) {
        if (!silent) {
          setError(err?.message || "Không thể tải thông tin thanh toán.");
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [orderId, notifyPaid]
  );

  useEffect(() => {
    paidNotifiedRef.current = false;
    setPayment(null);
    setError("");
    load();
  }, [orderId, load]);

  useEffect(() => {
    if (!orderId || payment?.payment_status === "paid") return undefined;

    const timer = window.setInterval(() => {
      load({ silent: true });
    }, 1500);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        load({ silent: true });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [orderId, payment?.payment_status, load]);

  if (loading) {
    return (
      <div className={`rounded-[28px] border border-slate-200 bg-white p-8 ${className}`}>
        <div className="flex items-center justify-center gap-3 text-sm font-bold text-slate-500">
          <Loader2 className="animate-spin text-orange-500" size={20} />
          Đang tải mã thanh toán
        </div>
      </div>
    );
  }

  if (error && !payment) {
    return (
      <div className={`rounded-[28px] border border-rose-200 bg-rose-50 p-6 ${className}`}>
        <p className="text-sm font-bold text-rose-700">{error}</p>
        <button
          type="button"
          onClick={() => load()}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white"
        >
          <RefreshCw size={14} /> Thử lại
        </button>
      </div>
    );
  }

  const paid = payment?.payment_status === "paid";
  const scanMode = payment?.payment_mode === "scan";

  if (paid) {
    return (
      <div className={`overflow-hidden rounded-[28px] border border-emerald-200 bg-white ${className}`}>
        <div className="flex flex-col items-center px-6 py-8 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={34} />
          </span>

          <h3 className="mt-4 text-2xl font-black text-slate-950">
            Thanh toán thành công
          </h3>

          <p className="mt-2 text-sm font-semibold text-slate-500">
            Đơn hàng đã được xác nhận. Đang chuyển đến chi tiết đơn hàng...
          </p>

          <p className="mt-4 text-3xl font-black text-emerald-600">
            {formatCurrency(Number(payment?.amount || 0))}
          </p>
        </div>
      </div>
    );
  }

  if (scanMode) {
    return (
      <div className={`overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm ${className}`}>
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
              <QrCode size={22} />
            </span>

            <div>
              <h3 className="text-lg font-black text-slate-950">Thanh toán QR</h3>
              <p className="mt-0.5 text-xs font-semibold text-slate-500">
                Mã đơn {payment?.order_code}
              </p>
            </div>
          </div>

          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-amber-50 px-3 py-2 text-xs font-black text-amber-700">
            <Loader2 size={13} className="animate-spin" />
            Chờ thanh toán
          </span>
        </div>

        <div className="grid gap-6 p-5 md:grid-cols-[240px_1fr] md:p-6">
          <div className="mx-auto w-full max-w-[240px]">
            <div className="aspect-square overflow-hidden rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
              {payment?.qr_url ? (
                <img
                  src={payment.qr_url}
                  alt="QR thanh toán Dynova Sport"
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-center text-sm font-bold text-slate-400">
                  Không tải được mã QR
                </div>
              )}
            </div>

            <p className="mt-3 text-center text-xs font-bold text-slate-500">
              Quét bằng Camera điện thoại
            </p>
          </div>

          <div>
            <div className="rounded-2xl bg-slate-50 px-4 py-2">
              <InfoRow label="Mã đơn" value={payment?.order_code} copyable />
              <InfoRow
                label="Số tiền"
                value={formatCurrency(Number(payment?.amount || 0))}
                highlight
              />
              <InfoRow label="Nội dung" value={payment?.transfer_content} copyable />
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-black text-slate-900">Cách quét mã</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                Mở Camera trên điện thoại, hướng vào mã QR và mở liên kết xuất hiện trên màn hình.
              </p>
            </div>
          </div>
        </div>

        {payment?.scan_local_only ? (
          <div className="border-t border-amber-100 bg-amber-50 px-5 py-4 text-xs font-semibold leading-5 text-amber-800 md:px-6">
            Mã QR chưa thể mở từ thiết bị khác. Hãy cấu hình địa chỉ mạng LAN của backend trước khi quét.
          </div>
        ) : (
          <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4 md:px-6">
            <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
              <Loader2 size={15} className="shrink-0 animate-spin text-orange-500" />
              Đang chờ xác nhận thanh toán...
            </div>
          </div>
        )}

        {error ? (
          <p className="border-t border-rose-100 bg-rose-50 px-5 py-3 text-xs font-bold text-rose-700">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm ${className}`}>
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
            <Landmark size={21} />
          </span>

          <div>
            <h3 className="text-lg font-black text-slate-950">Thanh toán VietQR</h3>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">
              Mã đơn {payment?.order_code}
            </p>
          </div>
        </div>

        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-amber-50 px-3 py-2 text-xs font-black text-amber-700">
          <Loader2 size={13} className="animate-spin" />
          Chờ ngân hàng xác nhận
        </span>
      </div>

      <div className="grid gap-6 p-5 md:grid-cols-[230px_1fr] md:p-6">
        <div className="mx-auto aspect-square w-full max-w-[230px] overflow-hidden rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
          {payment?.qr_url ? (
            <img src={payment.qr_url} alt="VietQR" className="h-full w-full object-contain" />
          ) : (
            <div className="flex h-full items-center justify-center text-center text-sm font-bold text-slate-400">
              Không tải được mã QR
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-slate-50 px-4 py-2">
          <InfoRow label="Ngân hàng" value={payment?.bank?.name} />
          <InfoRow label="Số tài khoản" value={payment?.bank?.account_number} copyable />
          <InfoRow label="Chủ tài khoản" value={payment?.bank?.account_name} />
          <InfoRow
            label="Số tiền"
            value={formatCurrency(Number(payment?.amount || 0))}
            highlight
          />
          <InfoRow label="Nội dung" value={payment?.transfer_content} copyable highlight />
        </div>
      </div>

      {error ? (
        <p className="border-t border-rose-100 bg-rose-50 px-5 py-3 text-xs font-bold text-rose-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}