"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Heart, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { addProductToCart } from "@/lib/cartActions";
import type { Product } from "@/types/product";

import MoreToLove from "@/components/MoreToLove";
import GoBack from "@/components/GoBack";
import ProductRating from "@/components/products/ProductRating";
import ProductRatingsLoader from "@/components/products/ProductRatingsLoader";

import { useWishlistStore } from "@/lib/store/useWishlistStore";
import { useStoreCounts } from "@/lib/store/useStoreCounts";
import { useProductRatingsStore } from "@/lib/store/productRatingsStore";

export default function WishlistPage() {
  const { setWishlistCount } = useStoreCounts();

  const [removingId, setRemovingId] = useState<number | null>(null);

  const [addingId, setAddingId] = useState<number | null>(null);

  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);

  const { items, loading, initialized, loadWishlist, removeItem } =
    useWishlistStore();

  /*
   * Product ratings are loaded once into Zustand.
   */
  const ratings = useProductRatingsStore((state) => state.ratings);

  /*
   * Load wishlist.
   */
  useEffect(() => {
    if (!initialized) {
      loadWishlist();
    }
  }, [initialized, loadWishlist]);

  /*
   * Load recommendations.
   */
  // useEffect(() => {
  //   async function loadRecommendations() {
  //     try {
  //       const response = await fetch("/api/products/recommendations", {
  //         cache: "no-store",
  //       });

  //       if (!response.ok) {
  //         throw new Error("Failed to fetch recommended products");
  //       }

  //       const data = await response.json();

  //       setRecommendedProducts(data.products ?? []);
  //     } catch (error) {
  //       console.error("Load recommendations error:", error);
  //     }
  //   }

  //   loadRecommendations();
  // }, []);

  useEffect(() => {
    async function loadRecommendations() {
      try {
        const response = await fetch("/api/products/recommendations", {
          cache: "no-store",
        });

        if (response.status === 401) {
          // Guests don't have personalized recommendations.
          // Simply don't show the recommendations section.
          setRecommendedProducts([]);
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch recommended products");
        }

        const data = await response.json();

        setRecommendedProducts(data.products ?? []);
      } catch (error) {
        console.error("Load recommendations error:", error);

        setRecommendedProducts([]);
      }
    }

    loadRecommendations();
  }, []);
  /*
   * Remove wishlist item.
   */
  async function removeFromWishlist(productId: number) {
    if (removingId !== null) {
      return;
    }

    setRemovingId(productId);

    try {
      await removeItem(productId);

      /*
       * Keep footer badge synchronized.
       */
      setWishlistCount(useWishlistStore.getState().items.length);

      toast("Removed from wishlist", {
        style: {
          background: "#fef2f2",
          border: "1px solid #fecaca",
          color: "#dc2626",
        },
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to remove item",
      );
    } finally {
      setRemovingId(null);
    }
  }

  /*
   * Add product to cart.
   */
  // async function addToCart(product: Product) {
  //   if (addingId !== null) return;

  //   if (product.stock <= 0) {
  //     toast.error("This product is out of stock");
  //     return;
  //   }

  //   setAddingId(product.id);

  //   try {
  //     const result = await addProductToCart(product, 1);

  //     if (!result.authenticated) {
  //       toast.success(`${product.name} added to cart`);
  //       return;
  //     }

  //     toast.success(`${product.name} added to cart`);
  //   } catch (error) {
  //     toast.error(
  //       error instanceof Error ? error.message : "Failed to add to cart",
  //     );
  //   } finally {
  //     setAddingId(null);
  //   }
  // }

  async function addToCart(product: Product) {
    if (addingId !== null) return;

    if (product.stock <= 0) {
      toast.error("This product is out of stock");
      return;
    }

    setAddingId(product.id);

    try {
      await addProductToCart(product, 1);

      toast.success(`${product.name} added to cart`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add to cart",
      );
    } finally {
      setAddingId(null);
    }
  }

  /*
   * Loading state.
   */
  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-8 pb-28 dark:bg-gray-950 sm:px-4 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <div className="h-8 w-40 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />

            <div className="mt-3 h-4 w-64 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({
              length: 8,
            }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-gray-900"
              >
                <div className="aspect-square animate-pulse bg-gray-200 dark:bg-gray-700" />

                <div className="space-y-3 p-4">
                  <div className="h-4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />

                  <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />

                  <div className="h-10 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  /*
   * Empty state.
   */
  if (items.length === 0) {
    return (
      <>
        <ProductRatingsLoader />

        <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 pb-28 dark:bg-gray-950">
          <div className="w-full max-w-md text-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-50">
              <Heart size={42} className="text-green-500" strokeWidth={1.5} />
            </div>

            <h1 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">
              Your wishlist is empty
            </h1>

            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-gray-500 dark:text-gray-400">
              Save products you love here so you can easily find them later.
            </p>

            <Link
              href="/"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-black px-7 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 active:scale-95"
            >
              Start Shopping
              <ArrowRight size={17} />
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      {/* Load product ratings once */}
      <ProductRatingsLoader />

      <main className="min-h-screen bg-gray-50 px-4 py-8 pb-15 dark:bg-gray-950 sm:px-6 lg:px-8 pt-22">
        <div className="mx-auto mb-5 max-w-7xl ">
          {/* Header */}
          <div className="mb-8 flex flex-col justify-between p-2 border-b border-gray-300 dark:border-gray-600 shadow-md   gap-4 sm:flex-row sm:items-end fixed top-0 left-0 right-0 z-50 bg-gray-50 dark:bg-gray-900 ">
            <div className="flex items-center   h-14 ">
              <div className=" flex items-start h-full justify-left -ml-3 mr-2">
                <GoBack />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                    My Wishlist
                  </h1>

                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50">
                    <Heart size={25} className="fill-red-500 text-red-500" />
                  </div>
                </div>

                <p className=" text-sm text-gray-500 dark:text-gray-400">
                  Products you&apos;ve saved for later.
                </p>
              </div>
            </div>
          </div>
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 my-2 ml-1">
            {items.length} {items.length === 1 ? "item" : "items"}
          </div>
          {/* Product grid */}
          <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => {
              const product = item.product;

              const isRemoving = removingId === product.id;

              const isAdding = addingId === product.id;

              const rating = ratings[product.id];

              return (
                <article
                  key={item.id}
                  className={`group overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 ${
                    isRemoving ? "scale-95 opacity-50" : ""
                  }`}
                >
                  {/* Image */}
                  <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <Link
                      href={`/products/${product.id}`}
                      className="block h-full w-full"
                    >
                      {/* <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      /> */}

                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </Link>

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => removeFromWishlist(product.id)}
                      disabled={isRemoving}
                      aria-label={`Remove ${product.name} from wishlist`}
                      className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-600 shadow-md backdrop-blur transition hover:bg-red-50 hover:text-red-500 active:scale-90 disabled:opacity-50 dark:bg-gray-900/95 dark:text-gray-300"
                    >
                      {isRemoving ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-red-500 dark:border-gray-700" />
                      ) : (
                        <Heart
                          className="fill-red-500 text-red-500"
                          size={17}
                          strokeWidth={2}
                        />
                      )}
                    </button>

                    {/* Stock */}
                    {product.stock <= 0 && (
                      <div className="absolute bottom-3 left-3 rounded-full bg-black/80 px-3 py-1 text-[11px] font-semibold text-white">
                        Out of stock
                      </div>
                    )}

                    {product.stock > 0 && product.stock <= 5 && (
                      <div className="absolute bottom-3 left-3 rounded-full bg-orange-500 px-3 py-1 text-[11px] font-semibold text-white">
                        Only {product.stock} left
                      </div>
                    )}
                  </div>

                  {/* Product info */}
                  <div className="p-2">
                    <Link href={`/products/${product.id}`}>
                      <h2 className="line-clamp-2 min-h-[30px] text-md font-semibold text-gray-900 transition  text-green-600 hover:text-underline sm:text-base">
                        {product.name}
                      </h2>
                    </Link>

                    <div className=" flex items-center justify-between gap-2">
                      <p className="text-base font-bold text-gray-900 dark:text-white sm:text-lg">
                        ₦{product.price.toLocaleString("en-NG")}
                      </p>

                      {/* {product.stock > 0 && (
                        <span className="text-xs font-medium text-green-600">
                          In stock
                        </span>
                      )} */}
                    </div>

                    {/* Rating */}
                    <div>
                      <ProductRating
                        rating={rating?.averageRating ?? 0}
                        reviewCount={rating?.totalReviews ?? 0}
                      />
                    </div>

                    {/* Add to cart */}
                    <button
                      type="button"
                      onClick={() => addToCart(product)}
                      disabled={product.stock <= 0 || isAdding}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-black px-4 py-3 text-xs font-semibold text-white transition hover:bg-gray-300 cursor-pointer active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 dark:bg-gray-100 dark:text-gray-900 sm:text-sm  "
                    >
                      {isAdding ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-white" />
                          Adding...
                        </>
                      ) : product.stock <= 0 ? (
                        "Out of Stock"
                      ) : (
                        <>
                          <ShoppingCart size={16} />
                          Add to Cart
                        </>
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* Recommendations */}
        <MoreToLove excludeWishlisted={true} title="More To Love" />
      </main>
    </>
  );
}
