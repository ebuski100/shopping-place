"use client";

import { useState } from "react";
import { toast } from "sonner";

import type { Product } from "@/types/product";
import { useStoreCounts } from "@/lib/store/useStoreCounts";

type AddToCartIconProps = {
  product: Product;
};

export default function AddToCartIcon({ product }: AddToCartIconProps) {
  const { incrementCart } = useStoreCounts();

  const [isAnimating, setIsAnimating] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleAddToCart() {
    if (loading) return;

    if (product.stock <= 0) {
      toast.error("This product is out of stock");
      return;
    }

    setLoading(true);
    setIsAnimating(true);

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          quantity: 1,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add product to cart");
      }

      // Update the footer cart badge
      incrementCart();

      toast.success(`${product.name} added to cart`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to add product to cart",
      );
    } finally {
      setLoading(false);

      setTimeout(() => {
        setIsAnimating(false);
      }, 350);
    }
  }

  return (
    <button
      type="button"
      onClick={handleAddToCart}
      disabled={loading}
      aria-label={`Add ${product.name} to cart`}
      className="flex h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-gray-900 p-2 shadow-md transition-transform duration-150 hover:scale-105 active:scale-90 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {loading ? (
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 dark:border-gray-700 border-t-black" />
      ) : (
        <img
          src="/cart.png"
          alt=""
          className={`h-full w-full object-contain ${
            isAnimating ? "cart-pop" : ""
          }`}
        />
      )}
    </button>
  );
}
