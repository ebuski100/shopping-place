"use client";

import { useEffect } from "react";
import {
  saveCatalogSnapshot,
  type CatalogQuery,
  type OfflineProduct,
} from "@/lib/offlineCatalog";

type PublicCatalogSnapshotProps = {
  products: OfflineProduct[];
  listingQuery?: CatalogQuery | "home";
};

export default function PublicCatalogSnapshot({
  products,
  listingQuery,
}: PublicCatalogSnapshotProps) {
  useEffect(() => {
    void saveCatalogSnapshot(products, listingQuery).catch(() => {
      // Offline storage is best-effort and must never interrupt shopping.
    });
  }, [products, listingQuery]);

  useEffect(() => {
    function navigateToOfflineShell(event: MouseEvent) {
      if (navigator.onLine || event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || (anchor.target && anchor.target !== "_self")) return;

      const url = new URL(anchor.href);
      if (url.origin !== window.location.origin) return;
      const path = url.pathname.replace(/\/+$/, "") || "/";
      if (
        path !== "/" &&
        path !== "/products" &&
        path !== "/cart" &&
        !/^\/products\/\d+$/.test(path)
      ) {
        return;
      }

      event.preventDefault();
      // A document navigation lets the service worker return the offline HTML shell.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign(`${url.pathname}${url.search}${url.hash}`);
    }

    document.addEventListener("click", navigateToOfflineShell, true);
    return () => document.removeEventListener("click", navigateToOfflineShell, true);
  }, []);

  return null;
}
