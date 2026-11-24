export type OfflineProduct = {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  updatedAt: string;
};

export type CatalogQuery = {
  search?: string;
  category?: string;
  sort?: string;
};

type StoredProduct = OfflineProduct & { savedAt: number };
type StoredListing = {
  key: string;
  href: string;
  productIds: number[];
  savedAt: number;
};

const DATABASE_NAME = "shopping-place-offline-catalog";
const DATABASE_VERSION = 1;
const PRODUCT_STORE = "products";
const LISTING_STORE = "listings";
const MAX_PRODUCTS = 300;
const MAX_LISTINGS = 40;
const PRODUCT_MAX_AGE = 90 * 24 * 60 * 60 * 1000;
const LISTING_MAX_AGE = 30 * 24 * 60 * 60 * 1000;
export const HOME_CATALOG_KEY = "home";

function openCatalog(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is unavailable"));
      return;
    }

    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(PRODUCT_STORE)) {
        database.createObjectStore(PRODUCT_STORE, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(LISTING_STORE)) {
        database.createObjectStore(LISTING_STORE, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function normalizedQuery(query: CatalogQuery = {}) {
  return {
    search: query.search?.trim().toLocaleLowerCase() ?? "",
    category: query.category?.trim().toLocaleLowerCase() ?? "",
    sort: query.sort?.trim() || "newest",
  };
}

export function catalogListingKey(query: CatalogQuery = {}) {
  const normalized = normalizedQuery(query);
  return `products:${normalized.search}:${normalized.category}:${normalized.sort}`;
}

export async function saveCatalogSnapshot(
  products: OfflineProduct[],
  listingQuery?: CatalogQuery | typeof HOME_CATALOG_KEY,
) {
  const database = await openCatalog();
  const savedAt = Date.now();

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(
        [PRODUCT_STORE, LISTING_STORE],
        "readwrite",
      );
      const productStore = transaction.objectStore(PRODUCT_STORE);
      const listingStore = transaction.objectStore(LISTING_STORE);

      for (const product of products.slice(0, MAX_PRODUCTS)) {
        if (
          !Number.isInteger(product.id) ||
          typeof product.name !== "string" ||
          typeof product.description !== "string" ||
          !Number.isFinite(product.price) ||
          typeof product.image !== "string" ||
          typeof product.category !== "string" ||
          !Number.isInteger(product.stock)
        ) {
          continue;
        }
        productStore.put({ ...product, savedAt } satisfies StoredProduct);
      }

      if (listingQuery) {
        const href =
          listingQuery === HOME_CATALOG_KEY
            ? "/"
            : (() => {
                const params = new URLSearchParams();
                if (listingQuery.search?.trim()) {
                  params.set("search", listingQuery.search.trim());
                }
                if (listingQuery.category?.trim()) {
                  params.set("category", listingQuery.category.trim());
                }
                if (listingQuery.sort?.trim() && listingQuery.sort !== "newest") {
                  params.set("sort", listingQuery.sort.trim());
                }
                const search = params.toString();
                return search ? `/products?${search}` : "/products";
              })();
        const listing: StoredListing = {
          key:
            listingQuery === HOME_CATALOG_KEY
              ? HOME_CATALOG_KEY
              : catalogListingKey(listingQuery),
          href,
          productIds: products
            .slice(0, MAX_PRODUCTS)
            .map(({ id }) => id)
            .filter(Number.isInteger),
          savedAt,
        };
        listingStore.put(listing);
      }

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });

    await pruneCatalog(database, savedAt);
  } finally {
    database.close();
  }
}

async function pruneCatalog(database: IDBDatabase, now: number) {
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(
      [PRODUCT_STORE, LISTING_STORE],
      "readwrite",
    );
    const productsStore = transaction.objectStore(PRODUCT_STORE);
    const listingsStore = transaction.objectStore(LISTING_STORE);
    const productRequest = productsStore.getAll() as IDBRequest<StoredProduct[]>;
    const listingRequest = listingsStore.getAll() as IDBRequest<StoredListing[]>;

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);

    productRequest.onsuccess = () => {
      const products = productRequest.result.sort((a, b) => b.savedAt - a.savedAt);
      products.forEach((product, index) => {
        if (now - product.savedAt > PRODUCT_MAX_AGE || index >= MAX_PRODUCTS) {
          productsStore.delete(product.id);
        }
      });
    };
    listingRequest.onsuccess = () => {
      const listings = listingRequest.result.sort((a, b) => b.savedAt - a.savedAt);
      listings.forEach((listing, index) => {
        if (now - listing.savedAt > LISTING_MAX_AGE || index >= MAX_LISTINGS) {
          listingsStore.delete(listing.key);
        }
      });
    };
  });
}
