"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Flame, ShoppingBag } from "lucide-react";

export default function FlashSalePage() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("dynova_flash_sale_disabled", "1");
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-16">
      <div className="mx-auto max-w-3xl rounded-[32px] border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 text-orange-600 shadow-inner">
          <Flame size={36} className="fill-current" />
        </div>

        <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-500">
          Thông báo
        </p>

        <h1 className="mt-4 text-3xl font-black text-slate-900 sm:text-4xl">
          Chương trình Flash Sale đã tạm ngừng
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-600">
          Hiện tại, cửa hàng không mở chương trình giảm giá theo thời gian nữa. Bạn có thể tiếp tục
          xem các sản phẩm mới và mua hàng bình thường trong danh mục thương mại.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/shop"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-black text-white transition hover:bg-slate-700"
          >
            <ShoppingBag size={16} />
            Tiếp tục mua sắm
          </Link>

          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
