// import type { CartProduct } from "@/types/product";

// import { addToGuestCart } from "@/lib/guestCart";
// import { syncGuestCartCount } from "@/lib/syncGuestCartCount";
// import { useStoreCounts } from "@/lib/store/useStoreCounts";

// type AddProductToCartResult =
//   | {
//       authenticated: true;
//       data: unknown;
//     }
//   | {
//       authenticated: false;
//       items: ReturnType<typeof addToGuestCart>;
//     };

// export async function addProductToCart(
//   product: CartProduct,
//   quantity = 1,
// ): Promise<AddProductToCartResult> {
//   if (product.stock <= 0) {
//     throw new Error("This product is out of stock");
//   }

//   if (quantity <= 0) {
//     throw new Error("Invalid quantity");
//   }

//   const response = await fetch("/api/cart", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//       productId: product.id,
//       quantity,
//     }),
//   });

//   /*
//    * Guest user.
//    *
//    * The API requires authentication, so 401 means
//    * we should use the browser cart instead.
//    */
//   if (response.status === 401) {
//     const items = addToGuestCart(product, quantity);

//     syncGuestCartCount();

//     return {
//       authenticated: false,
//       items,
//     };
//   }

//   const data = await response.json();

//   if (!response.ok) {
//     throw new Error(data.error || "Failed to add product to cart");
//   }

//   /*
//    * Logged-in user.
//    *
//    * The database cart has changed successfully.
//    * Reload the actual cart count so the footer/badge
//    * immediately reflects the database.
//    */
//   await useStoreCounts.getState().loadCartCount();

//   return {
//     authenticated: true,
//     data,
//   };
// }

import type { CartProduct } from "@/types/product";

import { addToGuestCart } from "@/lib/guestCart";
import { syncGuestCartCount } from "@/lib/syncGuestCartCount";
import { useStoreCounts } from "@/lib/store/useStoreCounts";
import { notifyCartUpdated } from "@/lib/cartEvents";

type AddProductToCartResult =
  | {
      authenticated: true;
      data: unknown;
    }
  | {
      authenticated: false;
      items: ReturnType<typeof addToGuestCart>;
    };

export async function addProductToCart(
  product: CartProduct,
  quantity = 1,
): Promise<AddProductToCartResult> {
  if (product.stock <= 0) {
    throw new Error("This product is out of stock");
  }

  if (quantity <= 0) {
    throw new Error("Invalid quantity");
  }

  const response = await fetch("/api/cart", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      productId: product.id,
      quantity,
    }),
  });

  /*
   * Guest user.
   *
   * The API requires authentication, so 401 means
   * we should use the browser cart instead.
   */
  if (response.status === 401) {
    const items = addToGuestCart(product, quantity);

    syncGuestCartCount();

    // Tell CartClient that the cart changed.
    notifyCartUpdated();

    return {
      authenticated: false,
      items,
    };
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to add product to cart");
  }

  /*
   * Logged-in user.
   *
   * The database cart has changed successfully.
   * Reload the actual cart count so the badge
   * immediately reflects the database.
   */
  await useStoreCounts.getState().loadCartCount();

  // Tell CartClient that the cart changed.
  notifyCartUpdated();

  return {
    authenticated: true,
    data,
  };
}
