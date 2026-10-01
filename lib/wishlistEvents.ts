const WISHLIST_UPDATED_EVENT = "shopping-place:wishlist-updated";

export function notifyWishlistUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(WISHLIST_UPDATED_EVENT));
}

export function subscribeToWishlistUpdates(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener(WISHLIST_UPDATED_EVENT, callback);

  return () => {
    window.removeEventListener(WISHLIST_UPDATED_EVENT, callback);
  };
}
