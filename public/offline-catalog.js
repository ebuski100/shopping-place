"use strict";

(() => {
  const databaseName = "shopping-place-offline-catalog";
  const maxAge = 90 * 24 * 60 * 60 * 1000;
  const listingMaxAge = 30 * 24 * 60 * 60 * 1000;
  const title = document.getElementById("page-title");
  const catalog = document.getElementById("catalog");
  const notice = document.getElementById("notice");
  const connectionStatus = document.getElementById("connection-status");
  const refreshButton = document.getElementById("refresh");

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[character]);
  }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      if (!("indexedDB" in window)) {
        reject(new Error("Saved catalogue is unavailable on this browser."));
        return;
      }
      const request = indexedDB.open(databaseName, 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onupgradeneeded = () => {
        // Do not create a competing or partial database if the application
        // snapshot store has not yet been initialized.
        request.transaction.abort();
        reject(new Error("Visit the catalogue online first to save products."));
      };
    });
  }

  function readSavedData() {
    return openDatabase().then((database) => new Promise((resolve, reject) => {
      const transaction = database.transaction(["products", "listings"], "readonly");
      const productsRequest = transaction.objectStore("products").getAll();
      const listingsRequest = transaction.objectStore("listings").getAll();
      transaction.oncomplete = () => {
        database.close();
        resolve({ products: productsRequest.result, listings: listingsRequest.result });
      };
      transaction.onerror = () => {
        database.close();
        reject(transaction.error);
      };
    }));
  }

  function listingKey(search) {
    const params = new URLSearchParams(search);
    const normalized = [
      (params.get("search") || "").trim().toLocaleLowerCase(),
      (params.get("category") || "").trim().toLocaleLowerCase(),
      (params.get("sort") || "newest").trim() || "newest",
    ];
    return `products:${normalized.join(":")}`;
  }

  function formatPrice(price) {
    return `₦${Number(price).toLocaleString("en-NG")}`;
  }

  function imageMarkup(product) {
    let imageUrl = "";
    try {
      const image = new URL(product.image);
      const allowedDummyJson = image.protocol === "https:" && image.hostname === "cdn.dummyjson.com";
      const allowedProductCloudinary = image.protocol === "https:" && image.hostname === "res.cloudinary.com" && /\/market-place\/products\//.test(image.pathname);
      if (allowedDummyJson || allowedProductCloudinary) imageUrl = image.href;
    } catch {}
    return imageUrl
      ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(product.name)}" loading="lazy" onerror="this.remove()">`
      : "";
  }

  function staleLabel(savedAt) {
    return `<p class="saved-time">Saved ${escapeHtml(new Date(savedAt).toLocaleString())}; price and stock may have changed.</p>`;
  }

  function safeListingHref(href) {
    try {
      const url = new URL(href, window.location.origin);
      if (url.origin !== window.location.origin) return "";
      if (url.pathname !== "/" && url.pathname !== "/products") return "";
      return `${url.pathname}${url.search}`;
    } catch {
      return "";
    }
  }

  function productCard(product) {
    return `<a class="card" href="/products/${encodeURIComponent(product.id)}">${imageMarkup(product)}<div class="card-content"><span class="category">${escapeHtml(product.category)}</span><h2>${escapeHtml(product.name)}</h2><p class="price">${escapeHtml(formatPrice(product.price))}</p>${staleLabel(product.savedAt)}</div></a>`;
  }

  function renderProduct(product) {
    title.textContent = product.name;
    catalog.innerHTML = `<article class="detail">${imageMarkup(product)}<div class="detail-content"><span class="category">${escapeHtml(product.category)}</span><h2>${escapeHtml(product.name)}</h2><p class="price">${escapeHtml(formatPrice(product.price))}</p><p>${escapeHtml(product.description)}</p><p>${product.stock > 0 ? `${escapeHtml(product.stock)} shown in stock when saved` : "Shown as out of stock when saved"}</p>${staleLabel(product.savedAt)}<a class="button secondary" href="/products">Back to catalogue</a></div></article>`;
  }

  function renderListing(products, listing) {
    if (!listing || Date.now() - listing.savedAt > listingMaxAge) return false;
    const byId = new Map(products.map((product) => [product.id, product]));
    const visible = listing.productIds
      .map((id) => byId.get(id))
      .filter((product) => product && Date.now() - product.savedAt <= maxAge);
    if (!visible.length) return false;
    catalog.innerHTML = `<div class="grid">${visible.map(productCard).join("")}</div><p class="saved-time">This saved catalogue view may be incomplete or out of date. No live stock check is available offline.</p>`;
    return true;
  }

  function renderUnavailable(listings, products) {
    const usableListings = listings.filter(
      (listing) => Date.now() - listing.savedAt <= listingMaxAge,
    );
    const links = usableListings
      .map((listing) => ({ listing, href: safeListingHref(listing.href) }))
      .filter(({ listing, href }) => href && href !== window.location.pathname + window.location.search && listing.key)
      .map(({ listing, href }) => `<a class="button secondary" href="${escapeHtml(href)}">${listing.key === "home" ? "Saved home products" : "Saved product listing"}</a>`)
      .join("");
    const productLinks = products
      .filter((product) => Date.now() - product.savedAt <= maxAge)
      .slice(0, 12)
      .map(productCard)
      .join("");
    catalog.innerHTML = `<div class="empty"><h2>This page has not been saved on this device.</h2><p>Visit this catalogue page while online to make its public product details available offline.</p><div class="actions">${links}</div></div>${productLinks ? `<div class="grid">${productLinks}</div>` : ""}`;
  }

  function render(data) {
    const products = data.products.filter((product) => Date.now() - product.savedAt <= maxAge);
    const path = window.location.pathname.replace(/\/+$/, "") || "/";
    const productRoute = path.match(/^\/products\/(\d+)$/);

    if (productRoute) {
      const product = products.find((item) => item.id === Number(productRoute[1]));
      if (product) renderProduct(product);
      else renderUnavailable(data.listings, products);
      return;
    }

    const key = path === "/" ? "home" : path === "/products" ? listingKey(window.location.search) : "";
    const listing = data.listings.find((item) => item.key === key);
    const hasSavedListing = renderListing(products, listing);
    if (!hasSavedListing) renderUnavailable(data.listings, products);
    if (hasSavedListing && path === "/") title.textContent = "Saved home products";
    if (hasSavedListing && path === "/products") title.textContent = "Saved product catalogue";
  }

  function updateConnectionStatus() {
    connectionStatus.textContent = navigator.onLine ? "Connection available" : "Saved catalogue • offline";
    notice.textContent = navigator.onLine
      ? "You are viewing the offline catalogue shell. These saved details may be out of date. Refresh the page to load current catalogue information. Shopping actions, accounts, checkout and payments require an internet connection."
      : "These saved catalogue details may be out of date. Prices and stock are not authoritative. Shopping actions, accounts, checkout and payments require an internet connection.";
  }

  refreshButton.addEventListener("click", () => {
    if (navigator.onLine) window.location.reload();
    else {
      notice.textContent = "Reconnect to the internet before refreshing live catalogue information.";
    }
  });
  window.addEventListener("online", updateConnectionStatus);
  window.addEventListener("offline", updateConnectionStatus);
  updateConnectionStatus();

  readSavedData()
    .then(render)
    .catch((error) => {
      title.textContent = "Saved catalogue unavailable";
      catalog.innerHTML = `<div class="empty">${escapeHtml(error.message || "Saved catalogue could not be opened.")}</div>`;
    });
})();
