"use client";

import { useMemo, useState } from "react";

import type { Product } from "@/types/product";
import ProductCard from "@/components/ProductCard";
import { useWishlistStore } from "@/lib/store/useWishlistStore";

type MoreToLoveProps = {
  products: Product[];
  title: string;
  excludeWishlisted?: boolean;
};

const PRODUCTS_PER_LOAD = 8;
const LOADING_TIME = 800;

export default function MoreToLove({
  products,
  title,
  excludeWishlisted = false,
}: MoreToLoveProps) {
  /*
   * Get the current wishlist from Zustand.
   *
   * This allows MoreToLove to react immediately
   * whenever a product is added or removed from
   * the wishlist.
   */
  const wishlistItems = useWishlistStore((state) => state.items);

  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_LOAD);

  const [loading, setLoading] = useState(false);

  const filteredProducts = useMemo(() => {
    if (!excludeWishlisted) {
      return products;
    }

    return products.filter(
      (product) => !wishlistItems.some((item) => item.productId === product.id),
    );
  }, [products, wishlistItems, excludeWishlisted]);

  const visibleProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  const hasMore = visibleCount < filteredProducts.length;

  function handleLoadMore() {
    if (loading || !hasMore) {
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setVisibleCount((current) =>
        Math.min(current + PRODUCTS_PER_LOAD, filteredProducts.length),
      );

      setLoading(false);
    }, LOADING_TIME);
  }

  if (filteredProducts.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-8">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
              {title}
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Discover more products you might like
            </p>
          </div>
        </div>

        <div className="grid grid-cols gap-6  md:grid-cols-2 lg:grid-cols-3">
          {visibleProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              showAddToCart
              showCategory={false}
              showDescription={false}
            />
          ))}
        </div>

        {loading && (
          <div className="mt-8 flex justify-center">
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 dark:border-gray-700 border-t-black" />

              <span>Loading more products...</span>
            </div>
          </div>
        )}

        {!loading && hasMore && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loading}
              className="cursor-pointer rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-8 py-3 text-sm font-semibold text-gray-800 dark:text-gray-100 shadow-sm transition hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Load More
            </button>
          </div>
        )}

        {!hasMore && filteredProducts.length > PRODUCTS_PER_LOAD && (
          <p className="mt-8 text-center text-sm text-gray-400 dark:text-gray-500">
            You&apos;ve reached the end of the products.
          </p>
        )}
      </div>
    </section>
  );
}
