"use client";

import { useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { addToGuestCart } from "@/lib/guestCart";
import { useStoreCounts } from "@/lib/store/useStoreCounts";
import type { CartProduct } from "@/types/product";

type AddToCartButtonProps = {
  product: CartProduct;
  quantity: number;
};

export default function AddToCartButton({
  product,
  quantity,
}: AddToCartButtonProps) {
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(false);

  const incrementCart = useStoreCounts((state) => state.incrementCart);

  async function handleAddToCart() {
    if (authLoading || loading) return;

    // -------------------------
    // Guest cart
    // -------------------------
    if (!isAuthenticated) {
      addToGuestCart(product, quantity);

      // Immediately update global badge
      incrementCart(quantity);

      alert("Added to cart");

      return;
    }

    // -------------------------
    // Logged-in user
    // -------------------------
    setLoading(true);

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          quantity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to add to cart");
        return;
      }

      // API succeeded → update badge
      incrementCart(quantity);

      alert("Added to cart");
    } catch (error) {
      console.error("Add to cart error:", error);

      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleAddToCart}
      disabled={product.stock <= 0 || authLoading || loading}
      className="w-full rounded-xl bg-black px-6 py-4 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {product.stock <= 0
        ? "Out of Stock"
        : authLoading
          ? "Loading..."
          : loading
            ? "Adding..."
            : `Add to Cart${quantity > 1 ? ` (${quantity})` : ""}`}
    </button>
  );
}
