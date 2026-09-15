"use client";

import { useMemo, useState } from "react";

import type { Product } from "@/types/product";
import ProductCard from "@/components/ProductCard";
import { useWishlistStore } from "@/lib/store/useWishlistStore";

type MoreToLoveProps = {
  products: Product[];
  excludeWishlisted?: boolean;
};

const PRODUCTS_PER_LOAD = 8;
const LOADING_TIME = 800;

export default function MoreToLove({
  products,
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

  /*
   * Filter products depending on where MoreToLove
   * is being used.
   *
   * Homepage:
   * excludeWishlisted = false
   * → show all products
   *
   * Wishlist page:
   * excludeWishlisted = true
   * → hide products already in wishlist
   */
  const filteredProducts = useMemo(() => {
    if (!excludeWishlisted) {
      return products;
    }

    return products.filter(
      (product) => !wishlistItems.some((item) => item.productId === product.id),
    );
  }, [products, wishlistItems, excludeWishlisted]);

  /*
   * Apply pagination AFTER filtering.
   */
  const visibleProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  /*
   * Determine whether there are more products
   * available to display.
   */
  const hasMore = visibleCount < filteredProducts.length;

  function handleLoadMore() {
    if (loading || !hasMore) {
      return;
    }

    setLoading(true);

    /*
     * Simulate loading.
     *
     * Later, if you implement real pagination
     * from the database, this can be replaced
     * with an API request.
     */
    setTimeout(() => {
      setVisibleCount((current) =>
        Math.min(current + PRODUCTS_PER_LOAD, filteredProducts.length),
      );

      setLoading(false);
    }, LOADING_TIME);
  }

  /*
   * If there are no products after filtering,
   * don't render the section.
   */
  if (filteredProducts.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-8">
      <div className="mx-auto max-w-7xl px-4">
        {/* -------------------------------- */}
        {/* Section Header */}
        {/* -------------------------------- */}

        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
              More to Love
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Discover more products you might like
            </p>
          </div>
        </div>

        {/* -------------------------------- */}
        {/* Product Grid */}
        {/* -------------------------------- */}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* -------------------------------- */}
        {/* Loading */}
        {/* -------------------------------- */}

        {loading && (
          <div className="mt-8 flex justify-center">
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 dark:border-gray-700 border-t-black" />

              <span>Loading more products...</span>
            </div>
          </div>
        )}

        {/* -------------------------------- */}
        {/* Load More */}
        {/* -------------------------------- */}

        {!loading && hasMore && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loading}
              className="rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-8 py-3 text-sm font-semibold text-gray-800 dark:text-gray-100 shadow-sm transition hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Load More
            </button>
          </div>
        )}

        {/* -------------------------------- */}
        {/* End Message */}
        {/* -------------------------------- */}

        {!hasMore && filteredProducts.length > PRODUCTS_PER_LOAD && (
          <p className="mt-8 text-center text-sm text-gray-400 dark:text-gray-500">
            You&apos;ve reached the end of the products.
          </p>
        )}
      </div>
    </section>
  );
}
