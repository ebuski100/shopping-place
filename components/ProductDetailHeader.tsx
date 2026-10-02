"use client";

import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";

import { useStoreCounts } from "@/lib/store/useStoreCounts";
import type { Product } from "@/lib/generated/prisma/client";
import GoBack from "./GoBack";

type ProductDetailHeaderProps = {
  product: Product;
};

export default function ProductDetailHeader({
  product,
}: ProductDetailHeaderProps) {
  const { wishlistCount, cartCount } = useStoreCounts();

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-gray-200 bg-white backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-2 sm:px-6 lg:px-8">
        <GoBack />

        <div className="min-w-0 flex-1 pt-1">
          <span
            className="block truncate font-medium text-green-600 dark:text-green-500"
            title={product.name}
          >
            {product.name}
          </span>
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
        </Link>
      </div>
    </header>
  );
}
