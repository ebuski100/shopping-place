// import { create } from "zustand";

// type StoreCounts = {
//   cartCount: number;
//   wishlistCount: number;
//   orderCount: number;
//   setOrderCount: (count: number) => void;
//   loadOrderCount: () => Promise<void>;

//   wishlistProductIds: number[];
//   adjustCart: (amount: number) => void;
//   setCartCount: (count: number) => void;
//   setWishlistCount: (count: number) => void;

//   setWishlistProductIds: (ids: number[]) => void;
//   addWishlistProduct: (productId: number) => void;
//   removeWishlistProduct: (productId: number) => void;

//   incrementCart: (amount?: number) => void;
//   decrementCart: (amount?: number) => void;

//   loadCartCount: () => Promise<void>;
// };

// export const useStoreCounts = create<StoreCounts>((set) => ({
//   cartCount: 0,
//   wishlistCount: 0,
//   orderCount: 0,

//   wishlistProductIds: [],
//   adjustCart: (amount) =>
//     set((state) => ({
//       cartCount: Math.max(0, state.cartCount + amount),
//     })),

//   setCartCount: (count) =>
//     set({
//       cartCount: Math.max(0, count),
//     }),

//   setOrderCount: (count) =>
//     set({
//       orderCount: count,
//     }),

//   setWishlistCount: (count) =>
//     set({
//       wishlistCount: count,
//     }),

//   loadOrderCount: async () => {
//     try {
//       const response = await fetch("/api/orders/count", {
//         cache: "no-store",
//       });

//       if (!response.ok) {
//         return;
//       }

//       const data = await response.json();

//       if (typeof data.orderCount === "number") {
//         set({
//           orderCount: data.orderCount,
//         });
//       }
//     } catch (error) {
//       console.error("Failed to load order count:", error);
//     }
//   },

//   setWishlistProductIds: (ids) =>
//     set({
//       wishlistProductIds: ids,
//       wishlistCount: ids.length,
//     }),

//   addWishlistProduct: (productId) =>
//     set((state) => {
//       if (state.wishlistProductIds.includes(productId)) {
//         return state;
//       }

//       const updatedIds = [...state.wishlistProductIds, productId];

//       return {
//         wishlistProductIds: updatedIds,
//         wishlistCount: updatedIds.length,
//       };
//     }),

//   removeWishlistProduct: (productId) =>
//     set((state) => {
//       const updatedIds = state.wishlistProductIds.filter(
//         (id) => id !== productId,
//       );

//       return {
//         wishlistProductIds: updatedIds,
//         wishlistCount: updatedIds.length,
//       };
//     }),

//   incrementCart: (amount = 1) =>
//     set((state) => ({
//       cartCount: state.cartCount + amount,
//     })),

//   decrementCart: (amount = 1) =>
//     set((state) => ({
//       cartCount: Math.max(0, state.cartCount - amount),
//     })),

//   /*
//    * Load the real cart count from the database.
//    */
//   loadCartCount: async () => {
//     try {
//       const response = await fetch("/api/cart", {
//         cache: "no-store",
//       });

//       if (!response.ok) {
//         return;
//       }

//       const data = await response.json();

//       /*
//        * Adjust this depending on the shape
//        * returned by your /api/cart endpoint.
//        */
//       if (typeof data.totalItems === "number") {
//         set({
//           cartCount: data.totalItems,
//         });

//         return;
//       }

//       /*
//        * If your API returns cart.items instead,
//        * calculate the quantity from the items.
//        */
//       if (Array.isArray(data.items)) {
//         const totalQuantity = data.items.reduce(
//           (total: number, item: { quantity: number }) => total + item.quantity,
//           0,
//         );

//         set({
//           cartCount: totalQuantity,
//         });
//       }
//     } catch (error) {
//       console.error("Failed to load cart count:", error);
//     }
//   },
// }));

import { create } from "zustand";

type StoreCounts = {
  cartCount: number;
  wishlistCount: number;
  orderCount: number;

  setCartCount: (count: number) => void;
  loadCartCount: () => Promise<void>;

  setOrderCount: (count: number) => void;
  loadOrderCount: () => Promise<void>;

  setWishlistCount: (count: number) => void;

  wishlistProductIds: number[];
  setWishlistProductIds: (ids: number[]) => void;
  addWishlistProduct: (productId: number) => void;
  removeWishlistProduct: (productId: number) => void;

  incrementCart: (amount?: number) => void;
  decrementCart: (amount?: number) => void;
  adjustCart: (amount: number) => void;
};

export const useStoreCounts = create<StoreCounts>((set) => ({
  cartCount: 0,
  wishlistCount: 0,
  orderCount: 0,

  wishlistProductIds: [],

  // ---------------------------------------
  // Cart count
  // ---------------------------------------

  setCartCount: (count) =>
    set({
      cartCount: Math.max(0, count),
    }),

  incrementCart: (amount = 1) =>
    set((state) => ({
      cartCount: Math.max(0, state.cartCount + amount),
    })),

  decrementCart: (amount = 1) =>
    set((state) => ({
      cartCount: Math.max(0, state.cartCount - amount),
    })),

  adjustCart: (amount) =>
    set((state) => ({
      cartCount: Math.max(0, state.cartCount + amount),
    })),

  // ---------------------------------------
  // Load cart count from server
  // ---------------------------------------

  loadCartCount: async () => {
    try {
      const response = await fetch("/api/cart", {
        cache: "no-store",
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      // If API returns totalItems directly.
      if (typeof data.totalItems === "number") {
        set({
          cartCount: Math.max(0, data.totalItems),
        });

        return;
      }

      // If API returns cart items.
      if (Array.isArray(data.items)) {
        const totalQuantity = data.items.reduce(
          (total: number, item: { quantity: number }) => total + item.quantity,
          0,
        );

        set({
          cartCount: Math.max(0, totalQuantity),
        });
      }
    } catch (error) {
      console.error("Failed to load cart count:", error);
    }
  },

  // ---------------------------------------
  // Order count
  // ---------------------------------------

  setOrderCount: (count) =>
    set({
      orderCount: Math.max(0, count),
    }),

  loadOrderCount: async () => {
    try {
      const response = await fetch("/api/orders/count", {
        cache: "no-store",
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      if (typeof data.orderCount === "number") {
        set({
          orderCount: Math.max(0, data.orderCount),
        });
      }
    } catch (error) {
      console.error("Failed to load order count:", error);
    }
  },

  // ---------------------------------------
  // Wishlist count
  // ---------------------------------------

  setWishlistCount: (count) =>
    set({
      wishlistCount: Math.max(0, count),
    }),

  // ---------------------------------------
  // Wishlist product IDs
  // ---------------------------------------

  setWishlistProductIds: (ids) =>
    set({
      wishlistProductIds: ids,
      wishlistCount: ids.length,
    }),

  addWishlistProduct: (productId) =>
    set((state) => {
      if (state.wishlistProductIds.includes(productId)) {
        return state;
      }

      const updatedIds = [...state.wishlistProductIds, productId];

      return {
        wishlistProductIds: updatedIds,
        wishlistCount: updatedIds.length,
      };
    }),

  removeWishlistProduct: (productId) =>
    set((state) => {
      const updatedIds = state.wishlistProductIds.filter(
        (id) => id !== productId,
      );

      return {
        wishlistProductIds: updatedIds,
        wishlistCount: updatedIds.length,
      };
    }),
}));
