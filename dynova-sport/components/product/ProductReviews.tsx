"use client";

import { useEffect, useState } from "react";
import { Star, MessageSquareText } from "lucide-react";

import { getProductReviews, ApiReview } from "@/services/review.service";

type ProductReviewsProps = {
    productId: string | number;
};

function formatDate(value?: string) {
    if (!value) return "";
    try {
        return new Date(value).toLocaleDateString("vi-VN");
    } catch {
        return "";
    }
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
    const [reviews, setReviews] = useState<ApiReview[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        async function loadReviews() {
            try {
                setLoading(true);
                const res = await getProductReviews(productId);

                if (isMounted) setReviews(res?.data || []);
            } catch (error: any) {
                console.log("Load reviews error:", error?.message);
                if (isMounted) setReviews([]);
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        if (productId) loadReviews();

        return () => {
            isMounted = false;
        };
    }, [productId]);

    const totalReviews = reviews.length;
    const averageRating =
        totalReviews > 0
            ? (
                reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) /
                totalReviews
            ).toFixed(1)
            : "0";

    return (
        <section className="mt-12 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6">
                <div className="flex items-center gap-2">
                    <MessageSquareText className="text-orange-500" size={22} />
                    <h2 className="text-xl font-black text-slate-950">
                        Đánh giá sản phẩm
                    </h2>
                </div>

                {totalReviews > 0 && (
                    <div className="flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-2">
                        <Star size={16} className="fill-amber-500 text-amber-500" />
                        <span className="text-sm font-black text-amber-700">
                            {averageRating} / 5
                        </span>
                        <span className="text-xs font-semibold text-amber-600">
                            ({totalReviews} đánh giá)
                        </span>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="mt-6 space-y-4">
                    {Array.from({ length: 2 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-20 animate-pulse rounded-2xl bg-slate-100"
                        />
                    ))}
                </div>
            ) : totalReviews === 0 ? (
                <p className="mt-6 text-sm text-slate-500">
                    Sản phẩm này chưa có đánh giá nào. Hãy là người đầu tiên trải nghiệm
                    và chia sẻ cảm nhận!
                </p>
            ) : (
                <div className="mt-6 space-y-5">
                    {reviews.map((review) => (
                        <div
                            key={review.id}
                            className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                            key={i}
                                            size={15}
                                            className={
                                                i < Number(review.rating)
                                                    ? "fill-amber-400 text-amber-400"
                                                    : "text-slate-300"
                                            }
                                        />
                                    ))}
                                </div>

                                <span className="text-xs font-semibold text-slate-400">
                                    {formatDate(review.created_at)}
                                </span>
                            </div>

                            <p className="mt-3 text-sm leading-6 text-slate-700">
                                {review.content}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}