// import { create } from "zustand";

// type ProductRating = {
//   averageRating: number;
//   totalReviews: number;
// };

// type ProductRatingsStore = {
//   ratings: Record<number, ProductRating>;
//   loading: boolean;
//   initialized: boolean;

//   loadRatings: () => Promise<void>;

//   getRating: (productId: number) => ProductRating;
// };

// export const useProductRatingsStore = create<ProductRatingsStore>(
//   (set, get) => ({
//     ratings: {},

//     loading: false,

//     initialized: false,

//     loadRatings: async () => {
//       if (get().initialized || get().loading) {
//         return;
//       }

//       try {
//         set({
//           loading: true,
//         });

//         const response = await fetch("/api/products/ratings", {
//           credentials: "include",
//           cache: "no-store",
//         });

//         if (!response.ok) {
//           throw new Error("Failed to load product ratings");
//         }

//         const data = await response.json();

//         const ratings: Record<number, ProductRating> = {};

//         for (const item of data.ratings) {
//           ratings[item.productId] = {
//             averageRating: item.averageRating,

//             totalReviews: item.totalReviews,
//           };
//         }

//         set({
//           ratings,
//           initialized: true,
//         });
//       } catch (error) {
//         console.error("Load product ratings error:", error);
//       } finally {
//         set({
//           loading: false,
//         });
//       }
//     },

//     getRating: (productId) => {
//       return (
//         get().ratings[productId] ?? {
//           averageRating: 0,
//           totalReviews: 0,
//         }
//       );
//     },
//   }),
// );

import { create } from "zustand";

type ProductRating = {
  averageRating: number;
  totalReviews: number;
};

type ProductRatingsStore = {
  ratings: Record<number, ProductRating>;
  loading: boolean;
  initialized: boolean;

  loadRatings: () => Promise<void>;
};

export const useProductRatingsStore = create<ProductRatingsStore>(
  (set, get) => ({
    ratings: {},

    loading: false,

    initialized: false,

    loadRatings: async () => {
      if (get().initialized || get().loading) {
        return;
      }

      try {
        set({
          loading: true,
        });

        const response = await fetch("/api/products/ratings", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load product ratings");
        }

        const data = await response.json();

        const ratings: Record<number, ProductRating> = {};

        for (const item of data.ratings ?? []) {
          ratings[item.productId] = {
            averageRating: item.averageRating,

            totalReviews: item.totalReviews,
          };
        }

        set({
          ratings,
          initialized: true,
        });
      } catch (error) {
        console.error("Load product ratings error:", error);
      } finally {
        set({
          loading: false,
        });
      }
    },
  }),
);
