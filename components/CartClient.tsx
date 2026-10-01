// "use client";

// import Image from "next/image";
// import { useState } from "react";
// import { useRouter } from "next/navigation";

// import { useStoreCounts } from "@/lib/store/useStoreCounts";

// import type { Cart, CartItem } from "@/types/cart";
// import type { GuestCartItem } from "@/lib/guestCart";

// import {
//   getGuestCart,
//   updateGuestCartQuantity,
//   removeFromGuestCart,
// } from "@/lib/guestCart";

// import CartItemControls from "./CartItemControls";
// import AuthPromptModal from "./AuthPromptModal";
// import { useAuth } from "@/hooks/useAuth";
// import QuantitySelector from "./QuantitySelector";

// type CartClientProps = {
//   initialCart: Cart | null;
//   isAuthenticated: boolean;
// };

// export default function CartClient({
//   initialCart,
//   isAuthenticated,
// }: CartClientProps) {
//   const router = useRouter();

//   const { isAuthenticated: currentAuth, loading: authLoading } = useAuth();

//   // ---------------------------------------
//   // Zustand store
//   // ---------------------------------------

//   const setCartCount = useStoreCounts((state) => state.setCartCount);

//   const loadCartCount = useStoreCounts((state) => state.loadCartCount);

//   // ---------------------------------------
//   // Local state
//   // ---------------------------------------

//   const [items, setItems] = useState<CartItem[]>(initialCart?.items ?? []);

//   const [authPromptOpen, setAuthPromptOpen] = useState(false);

//   const [loadingItem, setLoadingItem] = useState<number | null>(null);

//   const [guestItems, setGuestItems] = useState<GuestCartItem[]>(() =>
//     getGuestCart(),
//   );

//   const [removeModalOpen, setRemoveModalOpen] = useState(false);

//   const [itemToRemove, setItemToRemove] = useState<{
//     type: "guest" | "user";
//     id: number;
//   } | null>(null);

//   // ---------------------------------------
//   // Remove modal
//   // ---------------------------------------

//   function openRemoveModal(type: "guest" | "user", id: number) {
//     setItemToRemove({
//       type,
//       id,
//     });

//     setRemoveModalOpen(true);
//   }

//   function closeRemoveModal() {
//     if (loadingItem !== null) return;

//     setRemoveModalOpen(false);
//     setItemToRemove(null);
//   }

//   async function confirmRemoveItem() {
//     if (!itemToRemove) return;

//     if (itemToRemove.type === "guest") {
//       removeGuestItem(itemToRemove.id);

//       setRemoveModalOpen(false);
//       setItemToRemove(null);

//       return;
//     }

//     await removeItem(itemToRemove.id);

//     setRemoveModalOpen(false);
//     setItemToRemove(null);
//   }

//   // ---------------------------------------
//   // Guest cart total
//   // ---------------------------------------

//   const guestTotal = guestItems.reduce(
//     (sum, item) => sum + item.product.price * item.quantity,
//     0,
//   );

//   // ---------------------------------------
//   // Database cart total
//   // ---------------------------------------

//   const cartTotal = items.reduce(
//     (sum, item) => sum + item.product.price * item.quantity,
//     0,
//   );

//   // ---------------------------------------
//   // Guest cart quantity
//   // ---------------------------------------

//   function getGuestCartTotalQuantity(cartItems: GuestCartItem[]) {
//     return cartItems.reduce((total, item) => total + item.quantity, 0);
//   }

//   // ---------------------------------------
//   // Logged-in cart quantity
//   // ---------------------------------------

//   function getCartTotalQuantity(cartItems: CartItem[]) {
//     return cartItems.reduce((total, item) => total + item.quantity, 0);
//   }

//   // ---------------------------------------
//   // Guest quantity update
//   // ---------------------------------------

//   function updateGuestQuantity(productId: number, quantity: number) {
//     const currentItem = guestItems.find(
//       (item) => item.product.id === productId,
//     );

//     if (!currentItem) return;

//     const updatedItems = updateGuestCartQuantity(productId, quantity);

//     setGuestItems(updatedItems);

//     // Synchronize footer with actual guest cart.
//     setCartCount(getGuestCartTotalQuantity(updatedItems));
//   }

//   // ---------------------------------------
//   // Guest remove
//   // ---------------------------------------

//   function removeGuestItem(productId: number) {
//     const updatedItems = removeFromGuestCart(productId);

//     setGuestItems(updatedItems);

//     // Synchronize footer with actual guest cart.
//     setCartCount(getGuestCartTotalQuantity(updatedItems));
//   }

//   // ---------------------------------------
//   // Logged-in quantity update
//   // ---------------------------------------

//   async function updateQuantity(itemId: number, newQuantity: number) {
//     if (newQuantity < 1) return;

//     const previousItems = items;

//     const item = items.find((item) => item.id === itemId);

//     if (!item) return;

//     const optimisticItems = items.map((currentItem) =>
//       currentItem.id === itemId
//         ? {
//             ...currentItem,
//             quantity: newQuantity,
//           }
//         : currentItem,
//     );

//     // Optimistic cart update.
//     setItems(optimisticItems);

//     // Immediately synchronize footer with
//     // the actual optimistic cart state.
//     setCartCount(getCartTotalQuantity(optimisticItems));

//     setLoadingItem(itemId);

//     try {
//       const response = await fetch(`/api/cart/${itemId}`, {
//         method: "PATCH",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           quantity: newQuantity,
//         }),
//       });

//       if (!response.ok) {
//         const data = await response.json().catch(() => null);

//         // Roll back cart UI.
//         setItems(previousItems);

//         // Roll back footer badge.
//         setCartCount(getCartTotalQuantity(previousItems));

//         alert(data?.error || "Failed to update quantity");
//       }
//     } catch (error) {
//       console.error(error);

//       // Roll back cart UI.
//       setItems(previousItems);

//       // Roll back footer badge.
//       setCartCount(getCartTotalQuantity(previousItems));

//       // Re-sync from server in case
//       // something changed externally.
//       await loadCartCount();

//       alert("Something went wrong");
//     } finally {
//       setLoadingItem(null);
//     }
//   }

//   // ---------------------------------------
//   // Logged-in remove
//   // ---------------------------------------

//   async function removeItem(itemId: number) {
//     const previousItems = items;

//     const itemToRemove = items.find((item) => item.id === itemId);

//     if (!itemToRemove) return;

//     const optimisticItems = items.filter((item) => item.id !== itemId);

//     // Optimistic cart update.
//     setItems(optimisticItems);

//     // Immediately synchronize footer
//     // with the actual optimistic cart state.
//     setCartCount(getCartTotalQuantity(optimisticItems));

//     setLoadingItem(itemId);

//     try {
//       const response = await fetch(`/api/cart/${itemId}`, {
//         method: "DELETE",
//       });

//       if (!response.ok) {
//         const data = await response.json().catch(() => null);

//         // Roll back cart UI.
//         setItems(previousItems);

//         // Roll back footer badge.
//         setCartCount(getCartTotalQuantity(previousItems));

//         alert(data?.error || "Failed to remove item");
//       }
//     } catch (error) {
//       console.error(error);

//       // Roll back cart UI.
//       setItems(previousItems);

//       // Roll back footer badge.
//       setCartCount(getCartTotalQuantity(previousItems));

//       // Re-sync from server.
//       await loadCartCount();

//       alert("Something went wrong");
//     } finally {
//       setLoadingItem(null);
//     }
//   }

//   // ---------------------------------------
//   // Guest cart UI
//   // ---------------------------------------

//   if (!isAuthenticated) {
//     if (guestItems.length === 0) {
//       return (
//         <p className="text-gray-500 dark:text-gray-400">Your cart is empty.</p>
//       );
//     }

//     return (
//       <div className="w-full max-w-4xl space-y-6">
//         {guestItems.map((item) => (
//           <div key={item.product.id} className="flex gap-6 border-b pb-6">
//             {/* Product image */}

//             <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded bg-gray-50 dark:bg-gray-950">
//               <Image
//                 src={item.product.image}
//                 alt={item.product.name}
//                 fill
//                 sizes="96px"
//                 className="object-contain"
//               />
//             </div>

//             {/* Product information */}

//             <div className="flex-1">
//               <h2 className="text-lg font-semibold">{item.product.name}</h2>

//               <p className="text-gray-500 dark:text-gray-400">
//                 ₦{item.product.price.toLocaleString()}
//               </p>

//               <div className="mt-3 flex items-center gap-3">
//                 <QuantitySelector
//                   quantity={item.quantity}
//                   stock={item.product.stock}
//                   onQuantityChange={(newQuantity) =>
//                     updateGuestQuantity(item.product.id, newQuantity)
//                   }
//                 />
//               </div>
//             </div>

//             {/* Price and remove */}

//             <div>
//               <p className="font-semibold">
//                 ₦{(item.product.price * item.quantity).toLocaleString()}
//               </p>

//               <button
//                 type="button"
//                 onClick={() => openRemoveModal("guest", item.product.id)}
//                 className="ml-4 text-red-500 hover:underline"
//               >
//                 Remove
//               </button>
//             </div>
//           </div>
//         ))}

//         {/* Total */}

//         <div className="flex justify-between text-xl font-bold">
//           <span>Total</span>

//           <span>₦{guestTotal.toLocaleString()}</span>
//         </div>

//         {/* Checkout */}

//         <button
//           type="button"
//           disabled={authLoading}
//           onClick={() => setAuthPromptOpen(true)}
//           className="w-[70%] rounded-md bg-black py-3 text-white dark:bg-gray-200 dark:text-gray-900 disabled:opacity-50"
//         >
//           {authLoading ? "Checking..." : "Proceed to Checkout"}
//         </button>

//         <AuthPromptModal
//           open={authPromptOpen}
//           onClose={() => setAuthPromptOpen(false)}
//           title="Sign in to checkout"
//           message="Please sign in or create an account before continuing to checkout."
//         />

//         {/* Remove modal */}

//         {removeModalOpen && (
//           <RemoveItemModal
//             onCancel={closeRemoveModal}
//             onConfirm={confirmRemoveItem}
//             loading={loadingItem !== null}
//           />
//         )}
//       </div>
//     );
//   }

//   // ---------------------------------------
//   // Empty logged-in cart
//   // ---------------------------------------

//   if (items.length === 0) {
//     return (
//       <>
//         <div className="flex h-80 w-full flex-col items-center justify-center bg-white dark:bg-gray-900">
//           <div className="relative h-40 w-40">
//             <Image
//               src="/empty-cart.jpg"
//               alt="Empty cart"
//               fill
//               sizes="160px"
//               className="object-contain"
//             />
//           </div>

//           <p className="text-gray-500 dark:text-gray-400">
//             Your cart is empty.
//           </p>
//         </div>

//         {removeModalOpen && (
//           <RemoveItemModal
//             onCancel={closeRemoveModal}
//             onConfirm={confirmRemoveItem}
//             loading={loadingItem !== null}
//           />
//         )}
//       </>
//     );
//   }

//   // ---------------------------------------
//   // Logged-in cart UI
//   // ---------------------------------------

//   return (
//     <div className="w-full max-w-4xl space-y-6">
//       {items.map((item) => {
//         const isLoading = loadingItem === item.id;

//         return (
//           <div
//             key={item.id}
//             className="flex gap-2 rounded-xl border border-gray-200 py-4 pr-4 shadow-sm dark:border-gray-800"
//           >
//             {/* Product image */}

//             <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded bg-gray-50 dark:bg-gray-950">
//               <Image
//                 src={item.product.image}
//                 alt={item.product.name}
//                 fill
//                 sizes="96px"
//                 className="object-contain"
//               />
//             </div>

//             {/* Product information */}

//             <div className="flex-1">
//               <h2 className="text-lg font-semibold">{item.product.name}</h2>

//               <p className="text-gray-500 dark:text-gray-400">
//                 ₦{item.product.price.toLocaleString()}
//               </p>

//               <CartItemControls
//                 item={item}
//                 loadingItem={loadingItem}
//                 updateQuantity={updateQuantity}
//               />
//             </div>

//             {/* Price and remove */}

//             <div className="flex h-full min-h-26 flex-col items-end justify-between">
//               <p className="font-semibold">
//                 ₦{(item.product.price * item.quantity).toLocaleString()}
//               </p>

//               <button
//                 type="button"
//                 onClick={() => openRemoveModal("user", item.id)}
//                 disabled={isLoading}
//                 className="text-sm text-red-500 hover:underline disabled:opacity-50"
//               >
//                 {isLoading ? "Updating..." : "Remove"}
//               </button>
//             </div>
//           </div>
//         );
//       })}

//       {/* Total */}

//       <div className="flex justify-between px-2 text-xl font-bold">
//         <span>Total</span>

//         <span>₦{cartTotal.toLocaleString()}</span>
//       </div>

//       {/* Checkout */}

//       <div className="flex w-full items-center justify-center lg:justify-start">
//         <button
//           type="button"
//           disabled={authLoading}
//           onClick={() => {
//             if (currentAuth) {
//               router.push("/checkout");
//               return;
//             }

//             setAuthPromptOpen(true);
//           }}
//           className="w-[70%] rounded-md bg-black py-3 text-white disabled:opacity-50"
//         >
//           {authLoading ? "Checking..." : "Proceed to Checkout"}
//         </button>
//       </div>

//       <AuthPromptModal
//         open={authPromptOpen}
//         onClose={() => setAuthPromptOpen(false)}
//         title="Sign in to checkout"
//         message="Please sign in or create an account before continuing to checkout."
//       />

//       {/* Remove confirmation modal */}

//       {removeModalOpen && (
//         <RemoveItemModal
//           onCancel={closeRemoveModal}
//           onConfirm={confirmRemoveItem}
//           loading={loadingItem !== null}
//         />
//       )}
//     </div>
//   );
// }

// // ---------------------------------------
// // Remove item modal
// // ---------------------------------------

// type RemoveItemModalProps = {
//   onCancel: () => void;
//   onConfirm: () => void;
//   loading: boolean;
// };

// function RemoveItemModal({
//   onCancel,
//   onConfirm,
//   loading,
// }: RemoveItemModalProps) {
//   return (
//     <div
//       className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
//       role="dialog"
//       aria-modal="true"
//       aria-labelledby="remove-item-title"
//     >
//       <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-900">
//         <h2 id="remove-item-title" className="text-lg font-semibold">
//           Remove item?
//         </h2>

//         <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
//           Are you sure you want to remove this item from your cart?
//         </p>

//         <div className="mt-6 flex justify-end gap-3">
//           <button
//             type="button"
//             onClick={onCancel}
//             disabled={loading}
//             className="rounded-md border border-gray-300 px-4 py-2.5 text-sm font-medium transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
//           >
//             Cancel
//           </button>

//           <button
//             type="button"
//             onClick={onConfirm}
//             disabled={loading}
//             className="rounded-md bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
//           >
//             {loading ? "Removing..." : "Remove"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useStoreCounts } from "@/lib/store/useStoreCounts";
import { subscribeToCartUpdates } from "@/lib/cartEvents";

import type { Cart, CartItem } from "@/types/cart";
import type { GuestCartItem } from "@/lib/guestCart";

import {
  getGuestCart,
  updateGuestCartQuantity,
  removeFromGuestCart,
} from "@/lib/guestCart";

import CartItemControls from "./CartItemControls";
import AuthPromptModal from "./AuthPromptModal";
import { useAuth } from "@/hooks/useAuth";
import QuantitySelector from "./QuantitySelector";

type CartClientProps = {
  initialCart: Cart | null;
  isAuthenticated: boolean;
};

export default function CartClient({
  initialCart,
  isAuthenticated,
}: CartClientProps) {
  const router = useRouter();

  const { isAuthenticated: currentAuth, loading: authLoading } = useAuth();

  // ---------------------------------------
  // Zustand store
  // ---------------------------------------

  const setCartCount = useStoreCounts((state) => state.setCartCount);

  const loadCartCount = useStoreCounts((state) => state.loadCartCount);

  // ---------------------------------------
  // Local state
  // ---------------------------------------

  const [items, setItems] = useState<CartItem[]>(initialCart?.items ?? []);

  const [authPromptOpen, setAuthPromptOpen] = useState(false);

  const [loadingItem, setLoadingItem] = useState<number | null>(null);

  const [guestItems, setGuestItems] = useState<GuestCartItem[]>(() =>
    getGuestCart(),
  );

  const [removeModalOpen, setRemoveModalOpen] = useState(false);

  const [itemToRemove, setItemToRemove] = useState<{
    type: "guest" | "user";
    id: number;
  } | null>(null);

  // ---------------------------------------
  // Refresh cart from storage / database
  // ---------------------------------------

  async function refreshCart() {
    /*
     * Guest cart
     */
    if (!currentAuth) {
      const updatedGuestItems = getGuestCart();

      setGuestItems(updatedGuestItems);

      setCartCount(getGuestCartTotalQuantity(updatedGuestItems));

      return;
    }

    /*
     * Logged-in cart
     */
    try {
      const response = await fetch("/api/cart", {
        cache: "no-store",
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      const updatedItems: CartItem[] = data.items ?? [];

      setItems(updatedItems);

      setCartCount(getCartTotalQuantity(updatedItems));
    } catch (error) {
      console.error("Failed to refresh cart:", error);

      /*
       * If the cart refresh fails, at least
       * synchronize the badge from the server.
       */
      await loadCartCount();
    }
  }

  // ---------------------------------------
  // Listen for cart changes from elsewhere
  // ---------------------------------------

  useEffect(() => {
    return subscribeToCartUpdates(() => {
      void refreshCart();
    });
  }, [currentAuth]);

  // ---------------------------------------
  // Remove modal
  // ---------------------------------------

  function openRemoveModal(type: "guest" | "user", id: number) {
    setItemToRemove({
      type,
      id,
    });

    setRemoveModalOpen(true);
  }

  function closeRemoveModal() {
    if (loadingItem !== null) return;

    setRemoveModalOpen(false);
    setItemToRemove(null);
  }

  async function confirmRemoveItem() {
    if (!itemToRemove) return;

    if (itemToRemove.type === "guest") {
      removeGuestItem(itemToRemove.id);

      setRemoveModalOpen(false);
      setItemToRemove(null);

      return;
    }

    await removeItem(itemToRemove.id);

    setRemoveModalOpen(false);
    setItemToRemove(null);
  }

  // ---------------------------------------
  // Guest cart total
  // ---------------------------------------

  const guestTotal = guestItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  // ---------------------------------------
  // Database cart total
  // ---------------------------------------

  const cartTotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  // ---------------------------------------
  // Guest cart quantity
  // ---------------------------------------

  function getGuestCartTotalQuantity(cartItems: GuestCartItem[]) {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }

  // ---------------------------------------
  // Logged-in cart quantity
  // ---------------------------------------

  function getCartTotalQuantity(cartItems: CartItem[]) {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }

  // ---------------------------------------
  // Guest quantity update
  // ---------------------------------------

  function updateGuestQuantity(productId: number, quantity: number) {
    const currentItem = guestItems.find(
      (item) => item.product.id === productId,
    );

    if (!currentItem) return;

    const updatedItems = updateGuestCartQuantity(productId, quantity);

    setGuestItems(updatedItems);

    setCartCount(getGuestCartTotalQuantity(updatedItems));
  }

  // ---------------------------------------
  // Guest remove
  // ---------------------------------------

  function removeGuestItem(productId: number) {
    const updatedItems = removeFromGuestCart(productId);

    setGuestItems(updatedItems);

    setCartCount(getGuestCartTotalQuantity(updatedItems));
  }

  // ---------------------------------------
  // Logged-in quantity update
  // ---------------------------------------

  async function updateQuantity(itemId: number, newQuantity: number) {
    if (newQuantity < 1) return;

    const previousItems = items;

    const item = items.find((item) => item.id === itemId);

    if (!item) return;

    const optimisticItems = items.map((currentItem) =>
      currentItem.id === itemId
        ? {
            ...currentItem,
            quantity: newQuantity,
          }
        : currentItem,
    );

    // Optimistic cart update.
    setItems(optimisticItems);

    // Immediately synchronize footer.
    setCartCount(getCartTotalQuantity(optimisticItems));

    setLoadingItem(itemId);

    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quantity: newQuantity,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        // Roll back cart UI.
        setItems(previousItems);

        // Roll back footer badge.
        setCartCount(getCartTotalQuantity(previousItems));

        alert(data?.error || "Failed to update quantity");

        return;
      }

      /*
       * Server accepted the change.
       * Make sure the badge reflects
       * the actual server state.
       */
      await loadCartCount();
    } catch (error) {
      console.error(error);

      // Roll back cart UI.
      setItems(previousItems);

      // Roll back footer badge.
      setCartCount(getCartTotalQuantity(previousItems));

      // Re-sync from server.
      await loadCartCount();

      alert("Something went wrong");
    } finally {
      setLoadingItem(null);
    }
  }

  // ---------------------------------------
  // Logged-in remove
  // ---------------------------------------

  async function removeItem(itemId: number) {
    const previousItems = items;

    const itemToRemove = items.find((item) => item.id === itemId);

    if (!itemToRemove) return;

    const optimisticItems = items.filter((item) => item.id !== itemId);

    // Optimistic cart update.
    setItems(optimisticItems);

    // Immediately synchronize footer.
    setCartCount(getCartTotalQuantity(optimisticItems));

    setLoadingItem(itemId);

    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        // Roll back cart UI.
        setItems(previousItems);

        // Roll back footer badge.
        setCartCount(getCartTotalQuantity(previousItems));

        alert(data?.error || "Failed to remove item");

        return;
      }

      /*
       * Server accepted the removal.
       */
      await loadCartCount();
    } catch (error) {
      console.error(error);

      // Roll back cart UI.
      setItems(previousItems);

      // Roll back footer badge.
      setCartCount(getCartTotalQuantity(previousItems));

      // Re-sync from server.
      await loadCartCount();

      alert("Something went wrong");
    } finally {
      setLoadingItem(null);
    }
  }

  // ---------------------------------------
  // Guest cart UI
  // ---------------------------------------

  if (!isAuthenticated) {
    if (guestItems.length === 0) {
      return (
        <p className="text-gray-500 dark:text-gray-400">Your cart is empty.</p>
      );
    }

    return (
      <div className="w-full max-w-4xl space-y-6">
        {guestItems.map((item) => (
          <div key={item.product.id} className="flex gap-6 border-b pb-6">
            {/* Product image */}

            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded bg-gray-50 dark:bg-gray-950">
              <Image
                src={item.product.image}
                alt={item.product.name}
                fill
                sizes="96px"
                className="object-contain"
              />
            </div>

            {/* Product information */}

            <div className="flex-1">
              <h2 className="text-lg font-semibold">{item.product.name}</h2>

              <p className="text-gray-500 dark:text-gray-400">
                ₦{item.product.price.toLocaleString()}
              </p>

              <div className="mt-3 flex items-center gap-3">
                <QuantitySelector
                  quantity={item.quantity}
                  stock={item.product.stock}
                  onQuantityChange={(newQuantity) =>
                    updateGuestQuantity(item.product.id, newQuantity)
                  }
                />
              </div>
            </div>

            {/* Price and remove */}

            <div>
              <p className="font-semibold">
                ₦{(item.product.price * item.quantity).toLocaleString()}
              </p>

              <button
                type="button"
                onClick={() => openRemoveModal("guest", item.product.id)}
                className="ml-4 text-red-500 hover:underline"
              >
                Remove
              </button>
            </div>
          </div>
        ))}

        {/* Total */}

        <div className="flex justify-between text-xl font-bold">
          <span>Total</span>

          <span>₦{guestTotal.toLocaleString()}</span>
        </div>

        {/* Checkout */}

        <button
          type="button"
          disabled={authLoading}
          onClick={() => setAuthPromptOpen(true)}
          className="w-[70%] rounded-md bg-black py-3 text-white dark:bg-gray-200 dark:text-gray-900 disabled:opacity-50"
        >
          {authLoading ? "Checking..." : "Proceed to Checkout"}
        </button>

        <AuthPromptModal
          open={authPromptOpen}
          onClose={() => setAuthPromptOpen(false)}
          title="Sign in to checkout"
          message="Please sign in or create an account before continuing to checkout."
        />

        {/* Remove modal */}

        {removeModalOpen && (
          <RemoveItemModal
            onCancel={closeRemoveModal}
            onConfirm={confirmRemoveItem}
            loading={loadingItem !== null}
          />
        )}
      </div>
    );
  }

  // ---------------------------------------
  // Empty logged-in cart
  // ---------------------------------------

  if (items.length === 0) {
    return (
      <>
        <div className="flex h-80 w-full flex-col items-center justify-center bg-white dark:bg-gray-900">
          <div className="relative h-40 w-40">
            <Image
              src="/empty-cart.jpg"
              alt="Empty cart"
              fill
              sizes="160px"
              className="object-contain"
            />
          </div>

          <p className="text-gray-500 dark:text-gray-400">
            Your cart is empty.
          </p>
        </div>

        {removeModalOpen && (
          <RemoveItemModal
            onCancel={closeRemoveModal}
            onConfirm={confirmRemoveItem}
            loading={loadingItem !== null}
          />
        )}
      </>
    );
  }

  // ---------------------------------------
  // Logged-in cart UI
  // ---------------------------------------

  return (
    <div className="w-full max-w-4xl space-y-6">
      {items.map((item) => {
        const isLoading = loadingItem === item.id;

        return (
          <div
            key={item.id}
            className="flex gap-2 rounded-xl border border-gray-200 py-4 pr-4 shadow-sm dark:border-gray-800"
          >
            {/* Product image */}

            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded bg-gray-50 dark:bg-gray-950">
              <Image
                src={item.product.image}
                alt={item.product.name}
                fill
                sizes="96px"
                className="object-contain"
              />
            </div>

            {/* Product information */}

            <div className="flex-1">
              <h2 className="text-lg font-semibold">{item.product.name}</h2>

              <p className="text-gray-500 dark:text-gray-400">
                ₦{item.product.price.toLocaleString()}
              </p>

              <CartItemControls
                item={item}
                loadingItem={loadingItem}
                updateQuantity={updateQuantity}
              />
            </div>

            {/* Price and remove */}

            <div className="flex h-full min-h-26 flex-col items-end justify-between">
              <p className="font-semibold">
                ₦{(item.product.price * item.quantity).toLocaleString()}
              </p>

              <button
                type="button"
                onClick={() => openRemoveModal("user", item.id)}
                disabled={isLoading}
                className="text-sm text-red-500 hover:underline disabled:opacity-50"
              >
                {isLoading ? "Updating..." : "Remove"}
              </button>
            </div>
          </div>
        );
      })}

      {/* Total */}

      <div className="flex justify-between px-2 text-xl font-bold">
        <span>Total</span>

        <span>₦{cartTotal.toLocaleString()}</span>
      </div>

      {/* Checkout */}

      <div className="flex w-full items-center justify-center lg:justify-start">
        <button
          type="button"
          disabled={authLoading}
          onClick={() => {
            if (currentAuth) {
              router.push("/checkout");
              return;
            }

            setAuthPromptOpen(true);
          }}
          className="w-[70%] rounded-md bg-black py-3 text-white disabled:opacity-50 border dark:bg-gray-900 dark:border-gray-300"
        >
          {authLoading ? "Checking..." : "Proceed to Checkout"}
        </button>
      </div>

      <AuthPromptModal
        open={authPromptOpen}
        onClose={() => setAuthPromptOpen(false)}
        title="Sign in to checkout"
        message="Please sign in or create an account before continuing to checkout."
      />

      {/* Remove confirmation modal */}

      {removeModalOpen && (
        <RemoveItemModal
          onCancel={closeRemoveModal}
          onConfirm={confirmRemoveItem}
          loading={loadingItem !== null}
        />
      )}
    </div>
  );
}

// ---------------------------------------
// Remove item modal
// ---------------------------------------

type RemoveItemModalProps = {
  onCancel: () => void;
  onConfirm: () => void;
  loading: boolean;
};

function RemoveItemModal({
  onCancel,
  onConfirm,
  loading,
}: RemoveItemModalProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="remove-item-title"
    >
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-900">
        <h2 id="remove-item-title" className="text-lg font-semibold">
          Remove item?
        </h2>

        <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
          Are you sure you want to remove this item from your cart?
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-md border border-gray-300 px-4 py-2.5 text-sm font-medium transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-md bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Removing..." : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}
