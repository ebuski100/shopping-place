"use client";

import { useEffect } from "react";

import { useStoreCounts } from "@/lib/store/useStoreCounts";

export default function WishlistInitializer() {
  const setWishlistProductIds = useStoreCounts(
    (state) => state.setWishlistProductIds,
  );

  useEffect(() => {
    async function loadWishlist() {
      try {
        const response = await fetch("/api/wishlist", {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        const productIds =
          data.items?.map((item: { productId: number }) => item.productId) ??
          [];

        setWishlistProductIds(productIds);
      } catch (error) {
        console.error("Failed to load wishlist:", error);
      }
    }

    loadWishlist();
  }, [setWishlistProductIds]);

  return null;
}
