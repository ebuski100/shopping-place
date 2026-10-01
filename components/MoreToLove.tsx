// "use client";

// import { useMemo, useState } from "react";

// import type { Product } from "@/types/product";
// import ProductCard from "@/components/ProductCard";
// import { useWishlistStore } from "@/lib/store/useWishlistStore";

// type MoreToLoveProps = {
//   products: Product[];
//   title: string;
//   excludeWishlisted?: boolean;
// };

// const PRODUCTS_PER_LOAD = 8;
// const LOADING_TIME = 800;

// export default function MoreToLove({
//   products,
//   title,
//   excludeWishlisted = false,
// }: MoreToLoveProps) {
//   /*
//    * Get the current wishlist from Zustand.
//    *
//    * This allows MoreToLove to react immediately
//    * whenever a product is added or removed from
//    * the wishlist.
//    */
//   const wishlistItems = useWishlistStore((state) => state.items);

//   const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_LOAD);

//   const [loading, setLoading] = useState(false);

//   const filteredProducts = useMemo(() => {
//     if (!excludeWishlisted) {
//       return products;
//     }

//     return products.filter(
//       (product) => !wishlistItems.some((item) => item.productId === product.id),
//     );
//   }, [products, wishlistItems, excludeWishlisted]);

//   const visibleProducts = useMemo(() => {
//     return filteredProducts.slice(0, visibleCount);
//   }, [filteredProducts, visibleCount]);

//   const hasMore = visibleCount < filteredProducts.length;

//   function handleLoadMore() {
//     if (loading || !hasMore) {
//       return;
//     }

//     setLoading(true);

//     setTimeout(() => {
//       setVisibleCount((current) =>
//         Math.min(current + PRODUCTS_PER_LOAD, filteredProducts.length),
//       );

//       setLoading(false);
//     }, LOADING_TIME);
//   }

//   if (filteredProducts.length === 0) {
//     return null;
//   }

//   return (
//     <section className="w-full py-8">
//       <div className="mx-auto max-w-7xl px-4">
//         <div className="mb-6 flex items-end justify-between gap-4">
//           <div>
//             <h2 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
//               {title}
//             </h2>

//             <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
//               Discover more products you might like
//             </p>
//           </div>
//         </div>

//         <div className="grid grid-cols-2 gap-3  md:grid-cols-3 lg:grid-cols-4">
//           {visibleProducts.map((product) => (
//             <ProductCard
//               key={product.id}
//               product={product}
//               showAddToCart
//               showCategory={false}
//               showDescription={false}
//             />
//           ))}
//         </div>

//         {loading && (
//           <div className="mt-8 flex justify-center">
//             <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
//               <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 dark:border-gray-700 border-t-black" />

//               <span>Loading more products...</span>
//             </div>
//           </div>
//         )}

//         {!loading && hasMore && (
//           <div className="mt-8 flex justify-center  ">
//             <button
//               type="button"
//               onClick={handleLoadMore}
//               disabled={loading}
//               className="cursor-pointer rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-8 py-3 text-sm font-semibold text-gray-800 dark:text-gray-100 shadow-sm transition hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
//             >
//               Load More
//             </button>
//           </div>
//         )}

//         {!hasMore && filteredProducts.length > PRODUCTS_PER_LOAD && (
//           <p className="mt-8 text-center text-sm text-gray-400 dark:text-gray-500">
//             You&apos;ve reached the end of the products.
//           </p>
//         )}
//       </div>
//     </section>
//   );
// }

"use client";

import { useEffect, useMemo, useState } from "react";

import type { Product } from "@/types/product";
import ProductCard from "@/components/ProductCard";
import { useWishlistStore } from "@/lib/store/useWishlistStore";

type MoreToLoveProps = {
  title: string;
  excludeWishlisted?: boolean;
};

type RecommendationsResponse = {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    totalProducts: number;
    hasMore: boolean;
  };
};

const PRODUCTS_PER_LOAD = 8;

export default function MoreToLove({
  title,
  excludeWishlisted = false,
}: MoreToLoveProps) {
  const wishlistItems = useWishlistStore((state) => state.items);

  const [products, setProducts] = useState<Product[]>([]);

  const [page, setPage] = useState(1);

  const [hasMore, setHasMore] = useState(true);

  const [loading, setLoading] = useState(true);

  const [loadingMore, setLoadingMore] = useState(false);

  // ------------------------------------------
  // FETCH PRODUCTS
  // ------------------------------------------

  async function fetchProducts(pageNumber: number, append: boolean) {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const response = await fetch(
        `/api/products/recommendations?page=${pageNumber}&limit=${PRODUCTS_PER_LOAD}`,
        {
          cache: "no-store",
        },
      );

      const data: RecommendationsResponse & {
        error?: string;
      } = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch recommended products");
      }

      setProducts((currentProducts) => {
        if (!append) {
          return data.products;
        }

        return [...currentProducts, ...data.products];
      });

      setHasMore(data.pagination.hasMore);
      setPage(pageNumber);
    } catch (error) {
      console.error("Failed to fetch MoreToLove products:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  // ------------------------------------------
  // INITIAL LOAD
  // ------------------------------------------

  useEffect(() => {
    fetchProducts(1, false);
  }, []);

  // ------------------------------------------
  // FILTER WISHLIST PRODUCTS
  // ------------------------------------------

  const filteredProducts = useMemo(() => {
    if (!excludeWishlisted) {
      return products;
    }

    return products.filter(
      (product) => !wishlistItems.some((item) => item.productId === product.id),
    );
  }, [products, wishlistItems, excludeWishlisted]);

  // ------------------------------------------
  // LOAD MORE
  // ------------------------------------------

  function handleLoadMore() {
    if (loadingMore || !hasMore) {
      return;
    }

    void fetchProducts(page + 1, true);
  }

  // ------------------------------------------
  // INITIAL LOADING
  // ------------------------------------------

  if (loading && products.length === 0) {
    return (
      <section className="w-full py-8">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
              {title}
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Discover more products you might like
            </p>
          </div>

          <div className="flex justify-center py-12">
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-black dark:border-gray-700" />

              <span>Loading products...</span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ------------------------------------------
  // NO PRODUCTS
  // ------------------------------------------

  if (filteredProducts.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-8">
      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}

        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
              {title}
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Discover more products you might like
            </p>
          </div>
        </div>

        {/* Products */}

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              showAddToCart
              showCategory={false}
              showDescription={false}
            />
          ))}
        </div>

        {/* Loading more */}

        {loadingMore && (
          <div className="mt-8 flex justify-center">
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-black dark:border-gray-700" />

              <span>Loading more products...</span>
            </div>
          </div>
        )}

        {/* Load More */}

        {!loadingMore && hasMore && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="cursor-pointer rounded-full border border-gray-300 bg-white px-8 py-3 text-sm font-semibold text-gray-800 shadow-sm transition hover:border-gray-400 hover:bg-gray-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
            >
              Load More
            </button>
          </div>
        )}

        {/* End */}

        {!hasMore && filteredProducts.length > PRODUCTS_PER_LOAD && (
          <p className="mt-8 text-center text-sm text-gray-400 dark:text-gray-500">
            You&apos;ve reached the end of the products.
          </p>
        )}
      </div>
    </section>
  );
}
