"use client";

import type { CartItem } from "@/types/cart";
import QuantitySelector from "@/components/QuantitySelector";

type CartItemControlsProps = {
  item: CartItem;
  loadingItem: number | null;
  updateQuantity: (itemId: number, newQuantity: number) => void;
};

export default function CartItemControls({
  item,
  loadingItem,
  updateQuantity,
}: CartItemControlsProps) {
  const isLoading = loadingItem === item.id;

  return (
    <div className="mt-3 flex items-center   justify-between w-full max-w-4xl">
      <QuantitySelector
        quantity={item.quantity}
        stock={item.product.stock}
        disabled={isLoading}
        onQuantityChange={(newQuantity) => updateQuantity(item.id, newQuantity)}
      />
    </div>
  );
}
