"use client";

import { useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { addProductToCart } from "@/lib/cartActions";
import type { CartProduct } from "@/types/product";

type AddToCartButtonProps = {
  product: CartProduct;
  quantity: number;
};

export default function AddToCartButton({
  product,
  quantity,
}: AddToCartButtonProps) {
  const { loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(false);

  async function handleAddToCart() {
    if (authLoading || loading) return;

    if (product.stock <= 0) {
      toast.error("This product is out of stock");
      return;
    }

    if (quantity <= 0) {
      toast.error("Invalid quantity");
      return;
    }

    setLoading(true);

    try {
      await addProductToCart(product, quantity);

      toast.success(
        quantity > 1
          ? `${quantity} × ${product.name} added to cart`
          : `${product.name} added to cart`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to add product to cart",
      );
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
