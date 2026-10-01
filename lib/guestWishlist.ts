import type { Product } from "@/types/product";

const GUEST_WISHLIST_KEY = "guest-wishlist";

export type GuestWishlistItem = {
  product: Product;
  createdAt: string;
};

export function getGuestWishlist(): GuestWishlistItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  const storedWishlist = localStorage.getItem(GUEST_WISHLIST_KEY);

  if (!storedWishlist) {
    return [];
  }

  try {
    return JSON.parse(storedWishlist);
  } catch {
    return [];
  }
}

export function saveGuestWishlist(items: GuestWishlistItem[]) {
  localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(items));
}

export function addToGuestWishlist(product: Product) {
  const items = getGuestWishlist();

  const alreadyExists = items.some((item) => item.product.id === product.id);

  if (alreadyExists) {
    return items;
  }

  const updatedItems = [
    ...items,
    {
      product,
      createdAt: new Date().toISOString(),
    },
  ];

  saveGuestWishlist(updatedItems);

  return updatedItems;
}

export function removeFromGuestWishlist(productId: number) {
  const items = getGuestWishlist();

  const updatedItems = items.filter((item) => item.product.id !== productId);

  saveGuestWishlist(updatedItems);

  return updatedItems;
}

export function isGuestWishlisted(productId: number) {
  return getGuestWishlist().some((item) => item.product.id === productId);
}

export function getGuestWishlistCount() {
  return getGuestWishlist().length;
}

export function clearGuestWishlist() {
  localStorage.removeItem(GUEST_WISHLIST_KEY);
}

export async function mergeGuestWishlist() {
  const items = getGuestWishlist();

  if (items.length === 0) {
    return;
  }

  const response = await fetch("/api/wishlist/merge", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      productIds: items.map((item) => item.product.id),
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to merge guest wishlist");
  }

  clearGuestWishlist();
}
