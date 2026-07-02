"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Send,
  Star,
  UserRound,
} from "lucide-react";

import {
  createReview,
  getProductReviews,
} from "@/services/review.service";

function StarRating({ value, onChange, readonly = false, size = 20 }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= value;

        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => !readonly && onChange?.(star)}
            className={
              "transition " +
              (readonly
                ? "cursor-default"
                : "hover:-translate-y-0.5 active:scale-95")
            }
            aria-label={`${star} sao`}
          >
            <Star
              size={size}
              className={
                active
                  ? "fill-amber-400 text-amber-400"
                  : "text-slate-300"
              }
            />
          </button>
        );
      })}
    </div>
  );
}

function getUserName(review) {
  return review?.user?.name || "Khách hàng Dynova";
}

function getCreatedDate(review) {
  if (!review?.created_at) return "Vừa xong";

  return new Date(review.created_at).toLocaleDateString("vi-VN");
}

export default function ProductReviews({ productId, orderId = null }) {
  const router = useRouter();

  const [reviews, setReviews] = useState([]);
  const [average, setAverage] = useState(0);
  const [total, setTotal] = useState(0);
  const [breakdown, setBreakdown] = useState({
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  });

  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const ratingPercent = useMemo(() => {
    const result = {};

    [5, 4, 3, 2, 1].forEach((star) => {
      result[star] =
        total > 0 ? Math.round((Number(breakdown[star] || 0) / total) * 100) : 0;
    });

    return result;
  }, [breakdown, total]);

  const loadReviews = async () => {
    if (!productId) return;

    try {
      setLoading(true);
      setError("");

      const data = await getProductReviews(productId);

      setReviews(data.reviews || []);
      setAverage(Number(data.average || 0));
      setTotal(Number(data.total || 0));
      setBreakdown(data.breakdown || {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0,
      });
    } catch (err) {
      setError(err.message || "Không thể tải đánh giá sản phẩm.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [productId]);

  const showNotice = (message) => {
    setNotice(message);
    setTimeout(() => setNotice(""), 2200);
  };

  const handleSubmit = async (event) => {
  event.preventDefault();

  const text = content.trim();

  if (!productId) {
    setError("Thiếu mã sản phẩm.");
    return;
  }

  if (!text || text.length < 5) {
    setError("Nội dung đánh giá phải có ít nhất 5 ký tự.");
    return;
  }

  try {
    setSending(true);
    setError("");

    const data = await createReview({
      product_id: productId,
      order_id: orderId,
      rating,
      content: text,
    });

    const newReview =
      data?.review || {
        id: "temp-" + Date.now(),
        product_id: productId,
        order_id: orderId,
        rating,
        content: text,
        status: "approved",
        created_at: new Date().toISOString(),
        user: {
          name: "Bạn",
        },
      };

    setReviews((prev) => {
      const cleanPrev = prev.filter(
        (item) => String(item.id) !== String(newReview.id)
      );

      return [newReview, ...cleanPrev];
    });

    if (data?.stats) {
      setAverage(Number(data.stats.average || 0));
      setTotal(Number(data.stats.total || 0));
      setBreakdown(
        data.stats.breakdown || {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0,
        }
      );
    } else {
      setTotal((prev) => prev + 1);
    }

    setContent("");
    setRating(5);

    showNotice("Gửi đánh giá thành công.");

    setTimeout(() => {
      loadReviews();
    }, 300);
  } catch (err) {
    if (err.status === 401) {
      router.push(`/login?redirect=/shop/product/${productId}#reviews`);
      return;
    }

    setError(err.message || "Không thể gửi đánh giá.");
  } finally {
    setSending(false);
  }
};

  return (
    <section
      id="reviews"
      className="mt-12 rounded-[34px] border border-slate-200 bg-white p-5 shadow-sm md:p-7"
    >
      {notice && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-600">
          <CheckCircle2 size={18} />
          {notice}
        </div>
      )}

      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-600">
            <MessageSquare size={15} />
            Reviews
          </div>

          <h2 className="mt-3 text-2xl font-black tracking-[-0.03em] text-slate-950 md:text-3xl">
            Đánh giá sản phẩm
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Xem nhận xét thực tế từ khách hàng và chia sẻ trải nghiệm của bạn.
          </p>
        </div>

        <div className="rounded-3xl bg-slate-950 px-6 py-5 text-white">
          <p className="text-sm font-bold text-slate-300">Điểm trung bình</p>

          <div className="mt-1 flex items-end gap-2">
            <span className="text-4xl font-black text-orange-300">
              {average || 0}
            </span>
            <span className="pb-1 text-sm font-bold text-slate-400">/ 5</span>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <StarRating value={Math.round(average || 0)} readonly size={16} />
            <span className="text-xs font-bold text-slate-400">
              {total} đánh giá
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-7 lg:grid-cols-[360px_1fr]">
        <div className="space-y-5">
          <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
            <p className="mb-4 text-sm font-black text-slate-950">
              Thống kê sao
            </p>

            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((star) => (
                <div key={star} className="grid grid-cols-[56px_1fr_44px] items-center gap-3">
                  <div className="flex items-center gap-1 text-xs font-black text-slate-600">
                    {star}
                    <Star size={13} className="fill-amber-400 text-amber-400" />
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-orange-500 transition-all"
                      style={{ width: `${ratingPercent[star]}%` }}
                    />
                  </div>

                  <p className="text-right text-xs font-black text-slate-500">
                    {breakdown[star] || 0}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-orange-100 bg-orange-50 p-5"
          >
            <p className="text-sm font-black text-slate-950">
              Viết đánh giá của bạn
            </p>

            <div className="mt-4">
              <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">
                Chọn số sao
              </p>

              <StarRating value={rating} onChange={setRating} size={24} />
            </div>

            <label className="mt-4 block">
              <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                Nội dung
              </span>

              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                rows={5}
                placeholder="Chia sẻ cảm nhận về chất lượng, size, chất liệu, trải nghiệm sử dụng..."
                className="w-full resize-none rounded-3xl border border-orange-100 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
              />
            </label>

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">
                <AlertCircle size={17} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <button
              disabled={sending}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {sending ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Send size={17} />
              )}
              Gửi đánh giá
            </button>
          </form>
        </div>

        <div>
          {loading ? (
            <div className="grid place-items-center rounded-3xl border border-slate-100 bg-slate-50 p-12">
              <Loader2 size={32} className="animate-spin text-orange-500" />
              <p className="mt-3 text-sm font-bold text-slate-500">
                Đang tải đánh giá...
              </p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-10 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-orange-500">
                <MessageSquare size={30} />
              </div>

              <p className="mt-4 text-lg font-black text-slate-950">
                Chưa có đánh giá
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Hãy là người đầu tiên đánh giá sản phẩm này.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                      <UserRound size={20} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-black text-slate-950">
                            {getUserName(review)}
                          </p>

                          <p className="mt-1 text-xs font-bold text-slate-400">
                            {getCreatedDate(review)}
                          </p>
                        </div>

                        <StarRating
                          value={Number(review.rating || 5)}
                          readonly
                          size={16}
                        />
                      </div>

                      <p className="mt-3 text-sm leading-7 text-slate-600">
                        {review.content}
                      </p>

                      {review.status && review.status !== "approved" && (
                        <span className="mt-3 inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-600">
                          {review.status}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}