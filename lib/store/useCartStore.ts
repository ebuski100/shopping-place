"use client";

import { create } from "zustand";

type CartItem = {
  productId: number;
  quantity: number;
};

type CartStore = {
  items: CartItem[];

  setItems: (items: CartItem[]) => void;

  addItem: (productId: number, quantity: number) => void;

  removeItem: (productId: number) => void;

  updateQuantity: (productId: number, quantity: number) => void;

  clearCart: () => void;

  getTotalQuantity: () => number;
};

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],

  setItems: (items) => {
    set({ items });
  },

  addItem: (productId, quantity) => {
    set((state) => {
      const existingItem = state.items.find(
        (item) => item.productId === productId,
      );

      if (existingItem) {
        return {
          items: state.items.map((item) =>
            item.productId === productId
              ? {
                  ...item,
                  quantity: item.quantity + quantity,
                }
              : item,
          ),
        };
      }

      return {
        items: [
          ...state.items,
          {
            productId,
            quantity,
          },
        ],
      };
    });
  },

  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((item) => item.productId !== productId),
    }));
  },

  updateQuantity: (productId, quantity) => {
    set((state) => ({
      items: state.items
        .map((item) =>
          item.productId === productId ? { ...item, quantity } : item,
        )
        .filter((item) => item.quantity > 0),
    }));
  },

  clearCart: () => {
    set({ items: [] });
  },

  getTotalQuantity: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },
}));
