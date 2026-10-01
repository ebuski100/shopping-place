"use client";

import Link from "next/link";
import Image from "next/image";

import type { Product } from "@/types/product";

import WishlistButton from "@/components/WishlistButton";
import AddToCartIcon from "@/components/AddToCartIcon";
import ProductRating from "@/components/products/ProductRating";

import { useProductRatingsStore } from "@/lib/store/productRatingsStore";

type ProductCardProps = {
  product: Product;

  showCategory?: boolean;
  showDescription?: boolean;
  showStock?: boolean;
  showWishlist?: boolean;
  showAddToCart?: boolean;
};

export default function ProductCard({
  product,
  showCategory = true,
  showDescription = true,
  showStock = true,
  showWishlist = true,
  showAddToCart = true,
}: ProductCardProps) {
  /*
   * Read only this product's rating from Zustand.
   *
   * Important:
   * We do NOT call getRating() here because a fallback
   * object created inside the selector can cause unnecessary
   * re-renders.
   */
  const rating = useProductRatingsStore((state) => state.ratings[product.id]);

  const averageRating = rating?.averageRating ?? 0;

  const totalReviews = rating?.totalReviews ?? 0;

  return (
    <article className="group overflow-hidden rounded-xl bg-white shadow-sm transition-shadow duration-200 hover:shadow-md dark:bg-gray-900">
      {/* Product image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
        <Link href={`/products/${product.id}`} className="block h-full w-full">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </Link>

        {/* Wishlist */}
        {showWishlist && (
          <div className="absolute right-3 top-3">
            <WishlistButton product={product} />
          </div>
        )}

        {/* Add to cart */}
        {showAddToCart && (
          <div className="absolute bottom-3 right-3">
            <AddToCartIcon product={product} />
          </div>
        )}

        {/* Out of stock */}
        {product.stock <= 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-red-400 dark:bg-gray-900 dark:text-red-400">
              Out of stock
            </span>
          </div>
        )}
      </div>

      {/* Product information */}
      <div className="p-2">
        {/* Category */}
        {showCategory && (
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {product.category}
          </p>
        )}

        {/* Product name */}
        <Link href={`/products/${product.id}`}>
          <h2 className=" line-clamp-1  text-base font-semibold text-gray-900 transition-colors text-green-700 sm:text-lg">
            {product.name}
          </h2>
        </Link>

        {/* Description */}
        {showDescription && (
          <p className=" line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
            {product.description}
          </p>
        )}

        {/* Price */}
        <p className="mt-1  font-bold text-gray-900 dark:text-white">
          ₦{product.price.toLocaleString("en-NG")}
        </p>

        {/* Rating */}
        <div className="mt-1">
          <ProductRating rating={averageRating} reviewCount={totalReviews} />
        </div>

        {/* Stock */}
        {showStock && (
          <p
            className={`mt-1 text-xs ${
              product.stock > 0 ? "text-green-500" : "text-red-400"
            }`}
          >
            {product.stock > 0
              ? `${product.stock} available`
              : "Currently unavailable"}
          </p>
        )}
      </div>
    </article>
  );
}
