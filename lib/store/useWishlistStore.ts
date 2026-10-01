import { create } from "zustand";

import type { Product } from "@/types/product";

import {
  addToGuestWishlist,
  getGuestWishlist,
  removeFromGuestWishlist,
} from "@/lib/guestWishlist";

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
  isGuest: boolean;

  loadWishlist: () => Promise<void>;
  addItem: (product: Product) => Promise<void>;
  removeItem: (productId: number) => Promise<void>;
  isWishlisted: (productId: number) => boolean;
};

function guestItemsToWishlistItems(): WishlistItem[] {
  return getGuestWishlist().map((item, index) => ({
    id: -(index + 1),
    productId: item.product.id,
    product: item.product,
    createdAt: item.createdAt,
  }));
}

export const useWishlistStore = create<WishlistStore>((set, get) => ({
  items: [],
  loading: false,
  initialized: false,
  isGuest: false,

  // ------------------------------------------
  // LOAD WISHLIST
  // ------------------------------------------

  loadWishlist: async () => {
    try {
      set({ loading: true });

      const response = await fetch("/api/wishlist", {
        cache: "no-store",
      });

      // ------------------------------------------
      // Guest user
      // ------------------------------------------

      if (response.status === 401) {
        set({
          items: guestItemsToWishlistItems(),
          isGuest: true,
          initialized: true,
        });

        return;
      }

      // ------------------------------------------
      // Server error
      // ------------------------------------------

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(data?.error || "Failed to load wishlist");
      }

      const data = await response.json();

      // ------------------------------------------
      // Authenticated user
      // ------------------------------------------

      set({
        items: data.items ?? [],
        isGuest: false,
        initialized: true,
      });
    } catch (error) {
      console.error("Load wishlist error:", error);

      set({
        initialized: true,
      });
    } finally {
      set({
        loading: false,
      });
    }
  },

  // ------------------------------------------
  // ADD ITEM
  // ------------------------------------------

  addItem: async (product) => {
    const response = await fetch("/api/wishlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId: product.id,
      }),
    });

    // ------------------------------------------
    // Guest user
    // ------------------------------------------

    if (response.status === 401) {
      const updatedItems = addToGuestWishlist(product);

      set({
        items: updatedItems.map((item, index) => ({
          id: -(index + 1),
          productId: item.product.id,
          product: item.product,
          createdAt: item.createdAt,
        })),
        isGuest: true,
        initialized: true,
      });

      return;
    }

    // ------------------------------------------
    // Server error
    // ------------------------------------------

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to add to wishlist");
    }

    // ------------------------------------------
    // Authenticated user
    // ------------------------------------------

    set((state) => ({
      items: state.items.some((item) => item.productId === product.id)
        ? state.items
        : [...state.items, data],
      isGuest: false,
      initialized: true,
    }));
  },

  // ------------------------------------------
  // REMOVE ITEM
  // ------------------------------------------

  removeItem: async (productId) => {
    const response = await fetch(`/api/wishlist/${productId}`, {
      method: "DELETE",
    });

    // ------------------------------------------
    // Guest user
    // ------------------------------------------

    if (response.status === 401) {
      const updatedItems = removeFromGuestWishlist(productId);

      set({
        items: updatedItems.map((item, index) => ({
          id: -(index + 1),
          productId: item.product.id,
          product: item.product,
          createdAt: item.createdAt,
        })),
        isGuest: true,
        initialized: true,
      });

      return;
    }

    // ------------------------------------------
    // Server error
    // ------------------------------------------

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to remove from wishlist");
    }

    // ------------------------------------------
    // Authenticated user
    // ------------------------------------------

    set((state) => ({
      items: state.items.filter((item) => item.productId !== productId),
      isGuest: false,
    }));
  },

  // ------------------------------------------
  // CHECK WISHLIST
  // ------------------------------------------

  isWishlisted: (productId) => {
    const state = get();

    return state.items.some((item) => item.productId === productId);
  },
}));
