// import type { Product } from "@/types/product";
import type { CartProduct } from "@/types/product";

export type GuestCartItem = {
  product: CartProduct;
  quantity: number;
};

const GUEST_CART_KEY = "guest-cart";

export function getGuestCart(): GuestCartItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  const storedCart = localStorage.getItem(GUEST_CART_KEY);

  if (!storedCart) {
    return [];
  }

  try {
    return JSON.parse(storedCart);
  } catch {
    return [];
  }
}

export function saveGuestCart(items: GuestCartItem[]) {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}

export function addToGuestCart(product: CartProduct, quantity = 1) {
  const items = getGuestCart();

  const existingItem = items.find((item) => item.product.id === product.id);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    items.push({
      product,
      quantity,
    });
  }

  saveGuestCart(items);

  return items;
}

export function removeFromGuestCart(productId: number) {
  const items = getGuestCart();

  const updatedItems = items.filter((item) => item.product.id !== productId);

  saveGuestCart(updatedItems);

  return updatedItems;
}

export function updateGuestCartQuantity(productId: number, quantity: number) {
  const items = getGuestCart();

  const updatedItems = items
    .map((item) =>
      item.product.id === productId ? { ...item, quantity } : item,
    )
    .filter((item) => item.quantity > 0);

  saveGuestCart(updatedItems);

  return updatedItems;
}

export async function mergeGuestCart() {
  const items = getGuestCart();

  if (items.length === 0) {
    return;
  }

  const response = await fetch("/api/cart/merge", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      })),
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to merge guest cart");
  }

  clearGuestCart();
}

export function clearGuestCart() {
  localStorage.removeItem(GUEST_CART_KEY);
}

export function getGuestCartQuantity() {
  return getGuestCart().reduce((total, item) => total + item.quantity, 0);
}
