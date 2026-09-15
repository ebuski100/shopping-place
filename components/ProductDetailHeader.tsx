"use client";

import Link from "next/link";
import { Heart, Search, ShoppingCart } from "lucide-react";

import { useStoreCounts } from "@/lib/store/useStoreCounts";
import GoBack from "./GoBack";

export default function ProductDetailHeader() {
  const { wishlistCount, cartCount } = useStoreCounts();

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white dark:bg-gray-900/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        {/* Back button */}

        <GoBack />
        {/* Search */}
        <div className="relative min-w-0 flex-1">
          <Search
            size={19}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
          />

          <input
            type="search"
            placeholder="Search products..."
            aria-label="Search products"
            className="h-10 w-full rounded-full border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 pl-11 pr-4 text-sm outline-none transition placeholder:text-gray-400 dark:text-gray-500 focus:border-gray-300 dark:border-gray-700 focus:bg-white dark:bg-gray-900 focus:ring-2 focus:ring-gray-100"
          />
        </div>

        {/* Wishlist */}
        <Link
          href="/wishlist"
          aria-label="Wishlist"
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95"
        >
          <Heart size={21} />

          {wishlistCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {wishlistCount > 99 ? "99+" : wishlistCount}
            </span>
          )}
        </Link>

        {/* Cart */}
        <Link
          href="/cart"
          aria-label="Shopping cart"
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95"
        >
          <ShoppingCart size={21} />

          {cartCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          )}

          {/* {cartQuantity > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
              {cartQuantity}
            </span>
          )} */}
        </Link>

        {/* Share */}
        {/* <button
          type="button"
          onClick={handleShare}
          aria-label="Share product"
          className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full transition hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 sm:flex"
        >
          <Share2 size={20} />
        </button> */}
      </div>
    </header>
  );
}
