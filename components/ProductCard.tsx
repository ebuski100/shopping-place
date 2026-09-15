import Link from "next/link";
import type { Product } from "@/types/product";

import WishlistButton from "@/components/WishlistButton";

import AddToCartIcon from "@/components/AddToCartIcon";

type ProductCardProps = {
  product: Product;
};

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="group overflow-hidden rounded-xl bg-white dark:bg-gray-900 shadow-sm transition-shadow duration-200 hover:shadow-md">
      {/* Product image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
        <Link href={`/products/${product.id}`}>
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </Link>

        {/* Wishlist */}
        <div className="absolute right-3 top-3">
          <WishlistButton productId={product.id} />
        </div>

        <div className="absolute bottom-3 right-3">
          <AddToCartIcon product={product} />
        </div>

        {/* Out of stock */}
        {product.stock <= 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="rounded-full bg-white dark:bg-gray-900 px-3 py-1 text-sm font-medium text-gray-800 dark:text-gray-100 text-red-400">
              Out of stock
            </span>
          </div>
        )}
      </div>

      {/* Product information */}
      <div className="p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {product.category}
        </p>

        <Link href={`/products/${product.id}`}>
          <h2 className="mt-1 line-clamp-1 text-base font-semibold text-gray-900 dark:text-white transition-colors hover:text-gray-600 dark:text-gray-300 sm:text-lg">
            {product.name}
          </h2>
        </Link>

        <p className="mt-2 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
          {product.description}
        </p>

        {/* Price */}
        <p className="mt-4 text-lg font-bold text-gray-900 dark:text-white">
          ₦{product.price.toLocaleString()}
        </p>

        {/* Stock */}
        <p className="mt-1 text-green-400 text-xs ">
          {product.stock > 0
            ? `${product.stock} available`
            : "Currently unavailable"}
        </p>
      </div>
    </article>
  );
}
