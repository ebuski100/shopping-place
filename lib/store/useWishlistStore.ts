import { create } from "zustand";

import type { Product } from "@/types/product";

type WishlistItem = {
  id: number;
  productId: number;
  product: Product;
  createdAt: string;
};

type WishlistStore = {
  items: WishlistItem[];
  loading: boolean;
  initialized: boolean;

  loadWishlist: () => Promise<void>;
  addItem: (productId: number) => Promise<void>;
  removeItem: (productId: number) => Promise<void>;
  isWishlisted: (productId: number) => boolean;
};

export const useWishlistStore = create<WishlistStore>((set, get) => ({
  items: [],
  loading: false,
  initialized: false,

  // ------------------------------------------
  // Load wishlist from database
  // ------------------------------------------

  loadWishlist: async () => {
    try {
      set({ loading: true });

      const response = await fetch("/api/wishlist", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to load wishlist");
      }

      const data = await response.json();

      set({
        items: data.items ?? [],
        initialized: true,
      });
    } catch (error) {
      console.error("Load wishlist error:", error);
    } finally {
      set({ loading: false });
    }
  },

  // ------------------------------------------
  // Add item
  // ------------------------------------------

  addItem: async (productId) => {
    const response = await fetch("/api/wishlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to add to wishlist");
    }

    // Update immediately without waiting for another GET request.
    set((state) => ({
      items: state.items.some((item) => item.productId === productId)
        ? state.items
        : [...state.items, data],
    }));
  },

  // ------------------------------------------
  // Remove item
  // ------------------------------------------

  removeItem: async (productId) => {
    const response = await fetch(`/api/wishlist/${productId}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to remove from wishlist");
    }

    set((state) => ({
      items: state.items.filter((item) => item.productId !== productId),
    }));
  },

  // ------------------------------------------
  // Check whether product is wishlisted
  // ------------------------------------------

  isWishlisted: (productId) => {
    return get().items.some((item) => item.productId === productId);
  },
}));
