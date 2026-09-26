"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Truck,
} from "lucide-react";

import { formatCurrency } from "@/data/shop";
import {
  getCart,
  getSelectedCartKeys,
  saveSelectedCartKeys,
  removeCartItem,
  updateCartItem,
} from "@/utils/shopStorage";
import {
  getDefaultPublicSettings,
  getPublicSettings,
} from "@/services/settings.service";

export default function CartPage() {
  const [items, setItems] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [notice, setNotice] = useState("");
  const [shippingSettings, setShippingSettings] = useState(
    getDefaultPublicSettings
  );

  const getItemKey = (item) => {
    if (item?.key) {
      return String(item.key);
    }

    const productId = item?.id || item?.product_id || "unknown-product";
    const variantId = item?.variant_id || item?.product_variant_id || "no-variant";
    const size = item?.size || "size-unknown";
    const color = item?.color || "color-unknown";

    return `${productId}-${variantId}-${size}-${color}`;
  };
  const getItemProductId = (item) => item?.id || item?.product_id || null;

  const syncCart = () => {
    const nextItems = getCart();
    setItems(nextItems);

    if (nextItems.length === 0) {
      setSelectedKeys([]);
      saveSelectedCartKeys([]);
      return;
    }

    const storedSelected = getSelectedCartKeys();
    const validSelected = storedSelected.filter((key) =>
      nextItems.some((item) => getItemKey(item) === key)
    );

    const nextSelected = validSelected.length > 0 ? validSelected : nextItems.map(getItemKey);
    setSelectedKeys(nextSelected);
    saveSelectedCartKeys(nextSelected);
  };

  useEffect(() => {
    syncCart();

    const handleStockWarning = (event) => {
      const message = event?.detail?.message || "Số lượng vượt quá tồn kho hiện có.";
      setNotice(message);
      syncCart();
    };

    const handleCartSyncError = (event) => {
      const message = event?.detail?.message || "Không thể cập nhật giỏ hàng.";
      setNotice(message);
      syncCart();
    };

    window.addEventListener("dynova:cart-stock-warning", handleStockWarning);
    window.addEventListener("dynova:cart-sync-error", handleCartSyncError);
    window.addEventListener("dynova:cart", syncCart);
    window.addEventListener("storage", syncCart);

    return () => {
      window.removeEventListener("dynova:cart-stock-warning", handleStockWarning);
      window.removeEventListener("dynova:cart-sync-error", handleCartSyncError);
      window.removeEventListener("dynova:cart", syncCart);
      window.removeEventListener("storage", syncCart);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    getPublicSettings()
      .then((response) => {
        if (mounted) {
          setShippingSettings(response.settings);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);


  const selectedKeySet = useMemo(() => new Set(selectedKeys), [selectedKeys]);

  const selectedItems = useMemo(() => {
    return items.filter((item) => selectedKeySet.has(getItemKey(item)));
  }, [items, selectedKeySet]);

  const selectedCount = selectedItems.length;

  const subtotal = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [selectedItems]);

  const freeShippingTarget = Math.max(
    1,
    Number(shippingSettings.free_shipping_threshold || 500000)
  );
  const defaultShippingFee = Math.max(
    0,
    Number(shippingSettings.default_shipping_fee || 30000)
  );
  const shipping =
    subtotal >= freeShippingTarget || subtotal === 0
      ? 0
      : defaultShippingFee;

  const shippingSummaryText =
    subtotal === 0
      ? "Tính khi đặt hàng"
      : subtotal >= freeShippingTarget
        ? "Miễn phí ước tính"
        : `${formatCurrency(defaultShippingFee)} ước tính`;

  const finalTotal = useMemo(() => {
    return subtotal + shipping;
  }, [subtotal, shipping]);

  const allSelected = items.length > 0 && items.every((item) => selectedKeySet.has(getItemKey(item)));

  const progress = Math.min(
    100,
    Math.round((subtotal / freeShippingTarget) * 100)
  );

  const missingFreeShip = Math.max(0, freeShippingTarget - subtotal);

  const showNotice = (text) => {
    setNotice(text);
    setTimeout(() => setNotice(""), 2000);
  };

  const updateQty = (key, qty) => {
    const item = items.find((cartItem) => cartItem.key === key);
    const requestedQty = Math.max(1, Number(qty || 1));
    const stock = Number(item?.stock ?? item?.max_quantity ?? 0);
    const stockKnown = item?.stock_known !== false;

    if (item && stockKnown && stock <= 0) {
      showNotice(`${item.name} hiện đã hết hàng.`);
      return;
    }

    if (item && stockKnown && requestedQty > stock) {
      showNotice(`${item.name} chỉ còn ${stock} sản phẩm trong kho.`);
      return;
    }

    const nextItems = updateCartItem(key, requestedQty);
    setItems(nextItems);
  };

  const remove = (key) => {
    removeCartItem(key);
    syncCart();
    showNotice("Đã xóa sản phẩm khỏi giỏ hàng.");
  };

  return (
    <div className="min-h-screen bg-[#f7f8fb] py-10">
      {notice && (
        <div className="fixed right-5 top-24 z-[90] rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-2xl">
          <div className="flex items-center gap-3">
            <CheckCircle size={17} className="text-orange-300" />
            {notice}
          </div>
        </div>
      )}

      <div className="container-page">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-500">
              Shopping cart
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-[-0.03em] text-slate-950">
              Giỏ hàng của bạn
            </h1>
            <p className="mt-2 text-sm leading-7 text-slate-500">
              Kiểm tra sản phẩm và số lượng trước khi thanh toán.
            </p>
          </div>

          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:-translate-x-1 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
          >
            <ArrowLeft size={16} />
            Tiếp tục mua sắm
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="mx-auto max-w-xl rounded-[34px] border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-50 text-orange-500">
              <ShoppingBag size={34} />
            </div>
            <h2 className="mt-5 text-2xl font-black text-slate-950">
              Giỏ hàng đang trống
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-500">
              Bạn có thể quay lại cửa hàng để thêm sản phẩm và trải nghiệm thanh toán.
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-flex rounded-2xl bg-orange-500 px-6 py-4 text-xs font-black uppercase tracking-wider text-white transition hover:bg-orange-600"
            >
              Khám phá sản phẩm
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_390px]">
            <section className="space-y-4">
              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                      <Truck size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-950">
                        {missingFreeShip === 0
                          ? "Đơn hàng đã đạt mức miễn phí ước tính."
                          : "Mua thêm " + formatCurrency(missingFreeShip) + " để đạt miễn phí ước tính."}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-400">
                        Mốc miễn phí ước tính: {formatCurrency(freeShippingTarget)}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-orange-600">{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-orange-500 transition-all duration-700"
                    style={{ width: progress + "%" }}
                  />
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
                <label className="flex cursor-pointer items-center gap-3 text-sm font-black text-slate-800">
                  <span className="relative inline-flex h-5 w-5 items-center justify-center">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(event) => {
                        const next = event.target.checked
                          ? items.map((item) => getItemKey(item))
                          : [];
                        setSelectedKeys(next);
                        saveSelectedCartKeys(next);
                      }}
                      className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                    />
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                      allSelected
                        ? "border-orange-500 bg-orange-500"
                        : "border-slate-300 bg-white"
                    }`}>
                      <svg
                        viewBox="0 0 12 12"
                        fill="none"
                        className={`h-3 w-3 text-white transition-opacity duration-200 ${
                          allSelected ? "opacity-100" : "opacity-0"
                        }`}
                        aria-hidden="true"
                      >
                        <path
                          d="M2.5 6.2L4.8 8.5L9.5 3.8"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </span>
                  Chọn tất cả ({items.length} sản phẩm)
                </label>
              </div>

              <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
                {items.map((item) => {
                  const itemKey = getItemKey(item);
                  const productId = getItemProductId(item);
                  const checked = selectedKeys.includes(itemKey);

                  return (
                    <div
                      key={item.key}
                      className="grid gap-4 border-b border-slate-100 p-5 last:border-b-0 sm:grid-cols-[26px_96px_1fr_auto] sm:items-center"
                    >
                      <span className="relative inline-flex h-5 w-5 items-center justify-center">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) => {
                            setSelectedKeys((prev) => {
                              const next = event.target.checked
                                ? Array.from(new Set([...prev, itemKey]))
                                : prev.filter((key) => key !== itemKey);

                              saveSelectedCartKeys(next);
                              return next;
                            });
                          }}
                          className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                        />
                        <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                          checked
                            ? "border-orange-500 bg-orange-500"
                            : "border-slate-300 bg-white"
                        }`}>
                          <svg
                            viewBox="0 0 12 12"
                            fill="none"
                            className={`h-3 w-3 text-white transition-opacity duration-200 ${
                              checked ? "opacity-100" : "opacity-0"
                            }`}
                            aria-hidden="true"
                          >
                            <path
                              d="M2.5 6.2L4.8 8.5L9.5 3.8"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                      </span>

                      {productId ? (
                        <Link
                          href={"/shop/product/" + productId}
                          className="block overflow-hidden rounded-2xl bg-slate-100"
                        >
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-24 w-24 object-cover transition duration-500 hover:scale-105"
                          />
                        </Link>
                      ) : (
                        <div className="block overflow-hidden rounded-2xl bg-slate-100">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-24 w-24 object-cover transition duration-500 hover:scale-105"
                          />
                        </div>
                      )}

                      <div>
                        <p className="text-[11px] font-black uppercase tracking-wider text-orange-500">
                          {item.category || "Dynova Sport"}
                        </p>
                        {productId ? (
                          <Link href={"/shop/product/" + productId}>
                            <h3 className="mt-1 line-clamp-2 font-black text-slate-950 transition hover:text-orange-600">
                              {item.name}
                            </h3>
                          </Link>
                        ) : (
                          <h3 className="mt-1 line-clamp-2 font-black text-slate-950">
                            {item.name}
                          </h3>
                        )}
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          {item.color || "Mặc định"} / Size {item.size || "Freesize"}
                        </p>
                        <p className="mt-2 font-black text-orange-600">
                          {formatCurrency(item.price)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                        <div className="flex items-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
                          <button
                            onClick={() => updateQty(item.key, item.quantity - 1)}
                            className="p-3 text-slate-500 transition hover:bg-slate-50 hover:text-orange-600"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="w-10 text-center text-sm font-black text-slate-950">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQty(item.key, item.quantity + 1)}
                            className="p-3 text-slate-500 transition hover:bg-slate-50 hover:text-orange-600"
                          >
                            <Plus size={13} />
                          </button>
                        </div>

                        <p className="font-black text-slate-950">
                          {formatCurrency(item.price * item.quantity)}
                        </p>

                        <button
                          onClick={() => remove(item.key)}
                          className="rounded-xl p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500"
                          aria-label="Xóa sản phẩm"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <aside className="h-fit rounded-[30px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 lg:sticky lg:top-24">
              <h2 className="text-xl font-black text-slate-950">Tóm tắt đơn hàng</h2>

              <div className="mt-5 space-y-3 rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
                  <span className="min-w-0 truncate">Sản phẩm đã chọn</span>
                  <span className="shrink-0 font-black text-slate-900">{selectedCount}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
                  <span className="min-w-0 truncate">Tạm tính</span>
                  <span className="shrink-0 font-bold text-slate-900">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
                  <span className="min-w-0 truncate">Phí vận chuyển</span>
                  <span className="shrink-0 font-bold text-slate-900">{shippingSummaryText}</span>
                </div>
              </div>

              <div className="mt-5 border-t border-dashed border-slate-200 pt-5">
                <div className="flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                      Tổng thanh toán
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {selectedCount > 0 ? "Đã bao gồm phí vận chuyển" : "Chưa chọn sản phẩm"}
                    </p>
                  </div>
                  <span className="shrink-0 text-2xl font-black text-orange-600 sm:text-3xl">
                    {formatCurrency(finalTotal)}
                  </span>
                </div>
              </div>

              <Link
                href={selectedItems.length > 0 ? "/checkout" : "#"}
                onClick={(event) => {
                  if (selectedItems.length === 0) {
                    event.preventDefault();
                    showNotice("Vui lòng chọn ít nhất một sản phẩm để thanh toán.");
                  }
                }}
                className={`mt-6 block rounded-2xl py-4 text-center text-xs font-black uppercase tracking-wider text-white transition ${
                  selectedItems.length > 0
                    ? "bg-orange-500 hover:-translate-y-0.5 hover:bg-orange-600"
                    : "cursor-not-allowed bg-slate-300"
                }`}
              >
                Tiến hành thanh toán
              </Link>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}