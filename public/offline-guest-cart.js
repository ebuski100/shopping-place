"use strict";

(() => {
  const key = "guest-cart";
  const lockName = "shopping-place-guest-cart";
  const maxQuantity = 2147483647;
  let fallbackQueue = Promise.resolve();

  function validItem(item) {
    return Boolean(
      item &&
        item.product &&
        Number.isInteger(item.product.id) &&
        item.product.id > 0 &&
        typeof item.product.name === "string" &&
        Number.isInteger(item.product.price) &&
        item.product.price >= 0 &&
        typeof item.product.image === "string" &&
        Number.isInteger(item.product.stock) &&
        item.product.stock >= 0 &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0 &&
        item.quantity <= maxQuantity,
    );
  }

  function get() {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return [];
      const items = JSON.parse(stored);
      return Array.isArray(items) ? items.filter(validItem) : [];
    } catch {
      return [];
    }
  }

  function save(items) {
    try {
      localStorage.setItem(key, JSON.stringify(items));
      window.dispatchEvent(new Event("shopping-place:cart-updated"));
    } catch {
      throw new Error("The guest cart could not be saved on this device.");
    }
  }

  function finalizeCompletedMerge() {
    try {
      const pending = localStorage.getItem("guest-cart-pending-merge");
      if (!pending) return;
      if (JSON.parse(pending).phase === "complete") {
        localStorage.removeItem(key);
        localStorage.removeItem("guest-cart-pending-merge");
      }
    } catch {
      throw new Error("A previous cart reconciliation must finish before this cart can change.");
    }
  }

  function withLock(callback) {
    if (navigator.locks) return navigator.locks.request(lockName, callback);
    const next = fallbackQueue.then(callback, callback);
    fallbackQueue = next.then(() => undefined, () => undefined);
    return next;
  }

  function add(product, quantity) {
    return withLock(() => {
      if (
        !product || !Number.isInteger(product.id) || product.id <= 0 ||
        !Number.isInteger(quantity) || quantity <= 0 || quantity > maxQuantity
      ) throw new Error("Invalid guest cart item or quantity.");
      finalizeCompletedMerge();
      const items = get();
      const existing = items.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity + quantity > maxQuantity) {
          throw new Error("The requested quantity is too large.");
        }
        existing.product = product;
        existing.quantity += quantity;
      } else {
        items.push({ product, quantity });
      }
      save(items);
      return items;
    });
  }

  function update(productId, quantity) {
    return withLock(() => {
      if (!Number.isInteger(quantity) || quantity < 0 || quantity > maxQuantity) {
        throw new Error("Invalid guest cart quantity.");
      }
      finalizeCompletedMerge();
      const items = get()
        .map((item) => item.product.id === productId ? { ...item, quantity } : item)
        .filter((item) => item.quantity > 0);
      save(items);
      return items;
    });
  }

  function remove(productId) {
    return withLock(() => {
      finalizeCompletedMerge();
      const items = get().filter((item) => item.product.id !== productId);
      save(items);
      return items;
    });
  }

  window.ShoppingPlaceGuestCart = { get, add, update, remove };
})();
