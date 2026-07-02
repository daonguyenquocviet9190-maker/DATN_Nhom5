"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { getWishlist } from "@/services/wishlist.service";

export default function WishlistBadge() {
  const [count, setCount] = useState(0);

  const loadWishlistCount = async () => {
    try {
      const data = await getWishlist();

      const total =
        data?.total ??
        data?.items?.length ??
        0;

      setCount(Number(total) || 0);
    } catch (error) {
      setCount(0);
    }
  };

  useEffect(() => {
    loadWishlistCount();

    const handleUpdate = () => {
      loadWishlistCount();
    };

    window.addEventListener("dynova:wishlist", handleUpdate);
    window.addEventListener("dynova:storage", handleUpdate);
    window.addEventListener("dynova:auth", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("dynova:wishlist", handleUpdate);
      window.removeEventListener("dynova:storage", handleUpdate);
      window.removeEventListener("dynova:auth", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  return (
    <Link
      href="/wishlist"
      className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500"
      aria-label="Danh sách yêu thích"
    >
      <Heart size={19} />

      {count > 0 && (
        <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-black leading-none text-white shadow-lg ring-2 ring-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}