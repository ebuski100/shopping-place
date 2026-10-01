"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import type { Product } from "@/types/product";

import { useWishlistStore } from "@/lib/store/useWishlistStore";
import { useStoreCounts } from "@/lib/store/useStoreCounts";

type WishlistButtonProps = {
  product: Product;
};

export default function WishlistButton({ product }: WishlistButtonProps) {
  const { initialized, loadWishlist, isWishlisted, addItem, removeItem } =
    useWishlistStore();

  const { setWishlistCount } = useStoreCounts();

  const [loading, setLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // const [mounted, setMounted] = useState(false);

  // useEffect(() => {
  //   setMounted(true);
  // }, []);

  /*
   * Load wishlist once.
   */
  useEffect(() => {
    if (!initialized) {
      loadWishlist();
    }
  }, [initialized, loadWishlist]);

  /*
   * Check whether this product is in the wishlist.
   */
  // const wishlisted = isWishlisted(product.id);

  const wishlisted = initialized ? isWishlisted(product.id) : false;

  /*
   * Keep the footer wishlist badge synchronized
   * with the actual Zustand wishlist state.
   */
  useEffect(() => {
    if (!initialized) return;

    setWishlistCount(useWishlistStore.getState().items.length);
  }, [initialized, wishlisted, setWishlistCount]);

  async function handleWishlist() {
    if (loading) return;

    setLoading(true);
    setIsAnimating(true);

    try {
      if (wishlisted) {
        await removeItem(product.id);

        toast("Removed from wishlist", {
          style: {
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#dc2626",
          },
        });
      } else {
        await addItem(product);

        toast.success("Added to wishlist");
      }

      /*
       * Update footer badge using the actual
       * Zustand wishlist state.
       */
      setWishlistCount(useWishlistStore.getState().items.length);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong",
      );
    } finally {
      setLoading(false);

      setTimeout(() => {
        setIsAnimating(false);
      }, 300);
    }
  }

  return (
    <button
      type="button"
      onClick={handleWishlist}
      disabled={loading || !initialized}
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white shadow-md backdrop-blur transition-transform duration-150 hover:scale-105 active:scale-90 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-black md:h-10 md:w-10"
    >
      {loading || !initialized ? (
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-black dark:border-gray-700" />
      ) : (
        <svg
          viewBox="0 0 24 24"
          fill={wishlisted ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.8"
          className={`h-5 w-5 ${
            wishlisted ? "text-red-500" : "text-gray-700 dark:text-gray-200"
          } ${isAnimating ? "wishlist-pop" : ""}`}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"
          />
        </svg>
      )}
    </button>
  );
}
