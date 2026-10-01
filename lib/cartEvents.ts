const CART_UPDATED_EVENT = "shopping-place:cart-updated";

export function notifyCartUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

export function subscribeToCartUpdates(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener(CART_UPDATED_EVENT, callback);

  return () => {
    window.removeEventListener(CART_UPDATED_EVENT, callback);
  };
}
