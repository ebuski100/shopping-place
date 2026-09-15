"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

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

  const [items, setItems] = useState<CartItem[]>(initialCart?.items ?? []);

  const [authPromptOpen, setAuthPromptOpen] = useState(false);

  const [loadingItem, setLoadingItem] = useState<number | null>(null);

  const [guestItems, setGuestItems] = useState<GuestCartItem[]>(() =>
    getGuestCart(),
  );

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
  // Guest quantity update
  // ---------------------------------------

  function updateGuestQuantity(productId: number, quantity: number) {
    const updatedItems = updateGuestCartQuantity(productId, quantity);

    setGuestItems(updatedItems);
  }

  // ---------------------------------------
  // Guest remove
  // ---------------------------------------

  function removeGuestItem(productId: number) {
    const updatedItems = removeFromGuestCart(productId);

    setGuestItems(updatedItems);
  }

  // ---------------------------------------
  // Logged-in quantity update
  // ---------------------------------------

  async function updateQuantity(itemId: number, newQuantity: number) {
    if (newQuantity < 1) return;

    const previousItems = items;

    // Optimistic update
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity: newQuantity,
            }
          : item,
      ),
    );

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
        const data = await response.json();

        setItems(previousItems);

        alert(data.error || "Failed to update quantity");
      }
    } catch (error) {
      console.error(error);

      setItems(previousItems);

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

    // Optimistic update
    setItems((currentItems) =>
      currentItems.filter((item) => item.id !== itemId),
    );

    setLoadingItem(itemId);

    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();

        setItems(previousItems);

        alert(data.error || "Failed to remove item");
      }
    } catch (error) {
      console.error(error);

      setItems(previousItems);

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
      return <p className="text-gray-500 dark:text-gray-400">Your cart is empty.</p>;
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

            <div>
              <p className="font-semibold">
                ₦{(item.product.price * item.quantity).toLocaleString()}
              </p>

              <button
                type="button"
                onClick={() => removeGuestItem(item.product.id)}
                className="ml-4 text-red-500"
              >
                Remove
              </button>
            </div>
          </div>
        ))}

        <div className="flex justify-between text-xl font-bold">
          <span>Total</span>

          <span>₦{guestTotal.toLocaleString()}</span>
        </div>

        <button
          type="button"
          disabled={authLoading}
          onClick={() => setAuthPromptOpen(true)}
          className="w-full rounded-md bg-black py-3 text-white disabled:opacity-50"
        >
          {authLoading ? "Checking..." : "Proceed to Checkout"}
        </button>

        <AuthPromptModal
          open={authPromptOpen}
          onClose={() => setAuthPromptOpen(false)}
          title="Sign in to checkout"
          message="Please sign in or create an account before continuing to checkout."
        />
      </div>
    );
  }

  // ---------------------------------------
  // Empty logged-in cart
  // ---------------------------------------

  if (items.length === 0) {
    return (
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

        <p className="text-gray-500 dark:text-gray-400">Your cart is empty.</p>
      </div>
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
            className="flex gap-2 rounded-xl border border-gray-200 dark:border-gray-800 py-4 pr-4 shadow-sm"
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

            <div className="flex min-h-26 h-full flex-col items-end justify-between">
              <p className="font-semibold">
                ₦{(item.product.price * item.quantity).toLocaleString()}
              </p>

              <button
                type="button"
                onClick={() => removeItem(item.id)}
                disabled={isLoading}
                className="text-sm text-red-500 hover:underline disabled:opacity-50"
              >
                {isLoading ? "Updating..." : "Remove"}
              </button>
            </div>
          </div>
        );
      })}

      <div className="flex justify-between px-2 text-xl font-bold">
        <span>Total</span>

        <span>₦{cartTotal.toLocaleString()}</span>
      </div>

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
        className="w-full rounded-md bg-black py-3 text-white disabled:opacity-50"
      >
        {authLoading ? "Checking..." : "Proceed to Checkout"}
      </button>

      <AuthPromptModal
        open={authPromptOpen}
        onClose={() => setAuthPromptOpen(false)}
        title="Sign in to checkout"
        message="Please sign in or create an account before continuing to checkout."
      />
    </div>
  );
}
