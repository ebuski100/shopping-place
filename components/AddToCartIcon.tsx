"use client";

import { useState } from "react";
import { toast } from "sonner";
import Image from "next/image";

import type { Product } from "@/types/product";
import { addProductToCart } from "@/lib/cartActions";

type AddToCartIconProps = {
  product: Product;
};

export default function AddToCartIcon({ product }: AddToCartIconProps) {
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
      await addProductToCart(product, 1);

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
      disabled={loading || product.stock <= 0}
      aria-label={`Add ${product.name} to cart`}
      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white shadow-md transition-transform duration-150 hover:scale-105 active:scale-90 disabled:cursor-not-allowed disabled:opacity-70 md:h-10 md:w-10"
    >
      {loading ? (
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-black dark:border-gray-700" />
      ) : (
        <Image
          src="/cart.png"
          alt=""
          width={28}
          height={28}
          className={`h-5 w-5 object-contain md:h-7 md:w-7 ${
            isAnimating ? "cart-pop" : ""
          }`}
        />
      )}
    </button>
  );
}
