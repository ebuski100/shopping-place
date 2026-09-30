// import Link from "next/link";
// import type { Product } from "@/types/product";

// import WishlistButton from "@/components/WishlistButton";

// import AddToCartIcon from "@/components/AddToCartIcon";

// import ProductRating from "@/components/products/ProductRating";
// import { useProductRatingsStore } from "@/lib/store/productRatingsStore";

// type ProductCardProps = {
//   product: Product;

//   showCategory?: boolean;
//   showDescription?: boolean;
//   showStock?: boolean;
//   showWishlist?: boolean;
//   showAddToCart?: boolean;
// };

// export default function ProductCard({
//   product,
//   showCategory = true,
//   showDescription = true,
//   showStock = true,
//   showWishlist = true,
//   showAddToCart = true,
// }: ProductCardProps) {
//   const rating = useProductRatingsStore((state) => state.getRating(product.id));

//   return (
//     <article className="group overflow-hidden rounded-xl bg-white dark:bg-gray-900 shadow-sm transition-shadow duration-200 hover:shadow-md">
//       {/* Product image */}
//       <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
//         <Link href={`/products/${product.id}`}>
//           <img
//             src={product.image}
//             alt={product.name}
//             className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
//           />
//         </Link>

//         {/* Wishlist */}
//         {showWishlist && (
//           <div className="absolute right-3 top-3">
//             <WishlistButton productId={product.id} />
//           </div>
//         )}

//         {showAddToCart && (
//           <div className="absolute bottom-3 right-3">
//             <AddToCartIcon product={product} />
//           </div>
//         )}

//         {/* Out of stock */}
//         {product.stock <= 0 && (
//           <div className="absolute inset-0 flex items-center justify-center bg-black/40">
//             <span className="rounded-full bg-white dark:bg-gray-900 px-3 py-1 text-sm font-medium text-gray-800 dark:text-gray-100 text-red-400">
//               Out of stock
//             </span>
//           </div>
//         )}
//       </div>

//       {/* Product information */}
//       <div className="p-4">
//         {showCategory && (
//           <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
//             {product.category}
//           </p>
//         )}

//         <Link href={`/products/${product.id}`}>
//           <h2 className="mt-1 line-clamp-1 text-base font-semibold text-gray-900 dark:text-white transition-colors hover:text-gray-600 dark:text-gray-300 sm:text-lg">
//             {product.name}
//           </h2>
//         </Link>

//         {showDescription && (
//           <p className="mt-2 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
//             {product.description}
//           </p>
//         )}

//         {/* Price */}
//         <p className="mt-4 text-lg font-bold text-gray-900 dark:text-white">
//           ₦{product.price.toLocaleString()}
//         </p>

//         {/* rating */}
//         <div className="mt-2">
//           <ProductRating
//             rating={rating.averageRating}
//             reviewCount={rating.totalReviews}
//           />
//         </div>

//         {/* Stock */}

//         {showStock && (
//           <p
//             className={`mt-1 text-green-400 text-xs ${product.stock > 0 ? "" : "text-red-400"} `}
//           >
//             {product.stock > 0
//               ? `${product.stock} available`
//               : "Currently unavailable"}
//           </p>
//         )}
//       </div>
//     </article>
//   );
// }

"use client";

import Link from "next/link";

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
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </Link>

        {/* Wishlist */}
        {showWishlist && (
          <div className="absolute right-3 top-3">
            <WishlistButton productId={product.id} />
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
      <div className="p-4">
        {/* Category */}
        {showCategory && (
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {product.category}
          </p>
        )}

        {/* Product name */}
        <Link href={`/products/${product.id}`}>
          <h2 className="mt-1 line-clamp-1 text-base font-semibold text-gray-900 transition-colors hover:text-green-600 dark:text-white dark:hover:text-green-400 sm:text-lg">
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
        <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">
          ₦{product.price.toLocaleString("en-NG")}
        </p>

        {/* Rating */}
        <div className="mt-2">
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
