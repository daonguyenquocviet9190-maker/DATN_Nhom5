"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, ShoppingBag, Star } from "lucide-react";

import { formatCurrency } from "@/data/shop";
import { addToCart, toggleWishlist } from "@/utils/shopStorage";
import { getProductImage, PRODUCT_FALLBACK } from "@/utils/imageUrl";

function getCategoryName(product) {
    if (typeof product?.category === "string") return product.category;

    return (
        product?.category?.name ||
        product?.category_name ||
        product?.categoryName ||
        "Dynova Sport"
    );
}

function getBrandName(product) {
    if (typeof product?.brand === "string") return product.brand;

    return (
        product?.brand_data?.name ||
        product?.brandInfo?.name ||
        product?.brand?.name ||
        product?.brand_name ||
        "Dynova"
    );
}

function buildCartProduct(product) {
    return {
        ...product,
        image: getProductImage(product),
        category: getCategoryName(product),
        brand: getBrandName(product),
        oldPrice: product.oldPrice || product.compare_price,
    };
}

function SeasonProductCard({ product, onAdd, onWishlist }) {
    return (
        <article className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition hover:border-orange-200 hover:shadow-xl">
            <Link
                href={"/shop/product/" + product.id}
                className="relative block overflow-hidden bg-slate-100"
            >
                <img
                    src={getProductImage(product)}
                    alt={product.name}
                    onError={(event) => {
                        event.currentTarget.src = PRODUCT_FALLBACK;
                    }}
                    className="aspect-[4/4.35] w-full object-cover transition duration-500 group-hover:scale-105"
                />

                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-orange-600 shadow-sm">
                    {getBrandName(product)}
                </span>
            </Link>

            <div className="flex flex-1 flex-col p-4">
                <div className="flex items-center justify-between gap-3">
                    <p className="line-clamp-1 text-[11px] font-black uppercase tracking-[0.16em] text-orange-500">
                        {getCategoryName(product)}
                    </p>

                    <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500">
                        <Star size={13} className="fill-orange-400 text-orange-400" />
                        {product.rating || 4.8}
                    </span>
                </div>

                <Link href={"/shop/product/" + product.id}>
                    <h3 className="mt-2 line-clamp-2 min-h-[44px] text-sm font-black leading-6 text-slate-950 transition group-hover:text-orange-600">
                        {product.name}
                    </h3>
                </Link>

                <div className="mt-auto pt-4">
                    <div className="flex items-end justify-between gap-3">
                        <div>
                            <p className="text-[11px] font-semibold text-slate-400">
                                Giá bán
                            </p>
                            <p className="text-base font-black text-slate-950">
                                {formatCurrency(product.price || 0)}
                            </p>
                        </div>

                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-600">
                            Còn hàng
                        </span>
                    </div>

                    <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
                        <button
                            onClick={() => onAdd(product)}
                            className="btn-primary flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-wider"
                        >
                            <ShoppingBag size={15} />
                            Thêm giỏ
                        </button>

                        <button
                            onClick={() => onWishlist(product)}
                            className="btn-ghost flex h-11 w-11 items-center justify-center rounded-2xl"
                            aria-label="Yêu thích"
                        >
                            <Heart size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </article>
    );
}

export default function SeasonProductGrid({ products = [] }) {
    const [notice, setNotice] = useState("");

    const showNotice = (text) => {
        setNotice(text);
        setTimeout(() => setNotice(""), 1800);
    };

    const handleAdd = (product) => {
        addToCart(buildCartProduct(product), { quantity: 1 });

        window.dispatchEvent(new Event("dynova:storage"));
        showNotice("Đã thêm sản phẩm vào giỏ hàng.");
    };

    const handleWishlist = (product) => {
        toggleWishlist(product.id);

        window.dispatchEvent(new Event("dynova:storage"));
        showNotice("Đã cập nhật danh sách yêu thích.");
    };

    if (!Array.isArray(products) || products.length === 0) {
        return (
            <p className="text-gray-500 text-sm">
                Chưa có sản phẩm nào cho bộ sưu tập này.
            </p>
        );
    }

    return (
        <>
            {notice && (
                <div className="fixed right-5 top-24 z-[90] max-w-sm rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-2xl">
                    {notice}
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {products.map((product) => (
                    <SeasonProductCard
                        key={product.id}
                        product={product}
                        onAdd={handleAdd}
                        onWishlist={handleWishlist}
                    />
                ))}
            </div>
        </>
    );
}