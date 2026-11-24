"use strict";

(() => {
  const itemsContainer = document.getElementById("cart-items");
  const summary = document.getElementById("cart-summary");
  const notice = document.getElementById("notice");
  const reconnectButton = document.getElementById("reconnect");
  const cart = window.ShoppingPlaceGuestCart;

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[character]);
  }

  function productImage(product) {
    try {
      const image = new URL(product.image);
      const allowed = image.protocol === "https:" && (
        image.hostname === "cdn.dummyjson.com" ||
        (image.hostname === "res.cloudinary.com" && /\/market-place\/products\//.test(image.pathname))
      );
      return allowed
        ? `<img src="${escapeHtml(image.href)}" alt="${escapeHtml(product.name)}" onerror="this.remove()">`
        : "";
    } catch {
      return "";
    }
  }

  function render() {
    const items = cart.get();
    if (!items.length) {
      itemsContainer.innerHTML = '<div class="empty"><h2>Your saved guest cart is empty.</h2><p class="muted">Products you add while offline will appear here.</p></div>';
      summary.innerHTML = "";
      return;
    }

    itemsContainer.innerHTML = items.map(({ product, quantity }) => `
      <article class="item">
        ${productImage(product)}
        <div>
          <h2>${escapeHtml(product.name)}</h2>
          <p class="muted">Estimate: ₦${Number(product.price).toLocaleString("en-NG")} each</p>
          <div class="controls" aria-label="Quantity controls for ${escapeHtml(product.name)}">
            <button type="button" data-action="decrease" data-id="${product.id}" aria-label="Decrease quantity">−</button>
            <span>${quantity}</span>
            <button type="button" data-action="increase" data-id="${product.id}" aria-label="Increase quantity">+</button>
          </div>
        </div>
        <div class="item-side">
          <span class="price">₦${(product.price * quantity).toLocaleString("en-NG")}</span>
          <button class="remove" type="button" data-action="remove" data-id="${product.id}">Remove</button>
        </div>
      </article>
    `).join("");

    const subtotal = items.reduce((total, item) => total + item.product.price * item.quantity, 0);
    summary.innerHTML = `<div class="summary"><span>Estimated subtotal</span><span>₦${subtotal.toLocaleString("en-NG")}</span></div><p class="muted">Estimate from saved product information. Final price and availability are checked online.</p>`;
  }

  itemsContainer.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const productId = Number(button.dataset.id);
    const item = cart.get().find((entry) => entry.product.id === productId);
    if (!item) return;

    try {
      if (button.dataset.action === "remove") await cart.remove(productId);
      if (button.dataset.action === "increase") await cart.update(productId, item.quantity + 1);
      if (button.dataset.action === "decrease") await cart.update(productId, item.quantity - 1);
      render();
    } catch (error) {
      notice.textContent = error.message || "The cart could not be saved on this device.";
    }
  });

  reconnectButton.addEventListener("click", () => {
    if (navigator.onLine) window.location.reload();
    else notice.textContent = "Reconnect before opening the live cart or checking out.";
  });
  function updateConnectionState() {
    reconnectButton.disabled = !navigator.onLine;
    reconnectButton.textContent = navigator.onLine
      ? "Reload live cart"
      : "Checkout requires internet";
  }
  window.addEventListener("online", updateConnectionState);
  window.addEventListener("offline", updateConnectionState);
  updateConnectionState();
  window.addEventListener("shopping-place:cart-updated", render);
  window.addEventListener("storage", render);
  render();
})();
