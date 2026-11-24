"use strict";

const CACHE_PREFIX = "shopping-place-static-";
const CACHE_NAME = `${CACHE_PREFIX}v1`;
const OFFLINE_PAGE = "/offline.html";
const PRECACHE_URLS = [
  OFFLINE_PAGE,
  "/shopping-bag.png",
  "/icons/shopping-place-192.png",
  "/icons/shopping-place-512.png",
  "/icons/shopping-place-maskable-512.png",
  "/icons/apple-touch-icon.png",
];
const PRECACHED_PATHS = new Set(PRECACHE_URLS);
const NETWORK_ONLY_PREFIXES = [
  "/api",
  "/access-denied",
  "/account",
  "/admin",
  "/admin-entry",
  "/addresses",
  "/auth",
  "/cart",
  "/checkout",
  "/disputes",
  "/login",
  "/notifications",
  "/orders",
  "/payment",
  "/payments",
  "/register",
  "/settings",
  "/wishlist",
];

function normalizePathname(pathname) {
  let decodedPath = pathname;

  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    // Keep malformed paths network-only if they cannot be normalized.
  }

  const collapsedPath = decodedPath.replace(/\/{2,}/g, "/").toLowerCase();
  return collapsedPath.replace(/\/+$/, "") || "/";
}

function isNetworkOnlyPath(pathname) {
  const path = normalizePathname(pathname);

  return NETWORK_ONLY_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

async function offlineFallback() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const fallback = await cache.match(OFFLINE_PAGE);

    if (fallback) return fallback;
  } catch {
    // Fall through to a minimal response if Cache Storage is unavailable.
  }

  return new Response(
    "<!doctype html><html lang=\"en\"><meta charset=\"utf-8\"><title>Offline</title><p>You're offline. Reconnect and try again.</p></html>",
    { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

async function networkNavigation(request) {
  try {
    return await fetch(request);
  } catch {
    return offlineFallback();
  }
}

async function publicStaticAsset(request, pathname) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(pathname, { ignoreSearch: true });

    if (cached) return cached;
  } catch {
    // Network remains the fallback if Cache Storage cannot be read.
  }

  try {
    return await fetch(request);
  } catch {
    return Response.error();
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      try {
        await cache.addAll(PRECACHE_URLS);
      } catch (error) {
        await caches.delete(CACHE_NAME);
        throw error;
      }

      // Intentionally omit skipWaiting so an update waits for current clients.
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();

      await Promise.all(
        cacheNames
          .filter(
            (name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME,
          )
          .map((name) => caches.delete(name)),
      );

      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Mutating requests are always left to the browser's normal network path.
  if (request.method !== "GET") return;

  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin) return;

  const pathname = normalizePathname(requestUrl.pathname);

  // This policy applies to API, authentication, account, commerce and admin
  // routes even when query strings, casing or trailing slashes vary.
  if (isNetworkOnlyPath(pathname)) {
    if (request.mode === "navigate") {
      event.respondWith(networkNavigation(request));
    }

    return;
  }

  if (request.mode === "navigate") {
    // Never cache successful HTML or Next.js/RSC responses.
    event.respondWith(networkNavigation(request));
    return;
  }

  if (PRECACHED_PATHS.has(pathname)) {
    event.respondWith(publicStaticAsset(request, pathname));
  }
});
