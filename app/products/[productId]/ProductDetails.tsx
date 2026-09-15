"use client";

import type { Product } from "@/lib/generated/prisma/client";
import { Heart, Package, Star, Truck } from "lucide-react";
import ProductDetailHeader from "@/components/ProductDetailHeader";
import AddToCartButton from "@/components/AddToCartButton";
import WishlistButton from "@/components/WishlistButton";
import ShareButton from "@/components/ShareButton";
import Reviews from "./Reviews";
import QuantitySelector from "@/components/QuantitySelector";
import { useState } from "react";

type ProductDetailsProps = {
  product: Product;
};

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          size={18}
          className={
            index < Math.round(rating)
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300"
          }
        />
      ))}
    </div>
  );
}

export default function ProductDetails({ product }: ProductDetailsProps) {
  const [quantity, setQuantity] = useState(1);
  const rating = 4.7;
  const reviewCount = 128;

  const isInStock = product.stock > 0;

  return (
    <>
      <ProductDetailHeader />

      <main className="mx-auto w-full max-w-7xl px-4 py-8 pb-24 sm:px-6 lg:px-8">
        {/* Breadcrumb-style header */}
        <div className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          {product.category} /{" "}
          <span className="font-medium text-gray-900 dark:text-white">{product.name}</span>
        </div>

        {/* Main product section */}
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* ====================================== */}
          {/* Product Image */}
          {/* ====================================== */}

          <div className="relative">
            <div className="overflow-hidden rounded-3xl bg-gray-100 dark:bg-gray-800">
              <img
                src={product.image}
                alt={product.name}
                className="aspect-square h-full w-full object-cover"
              />
            </div>

            {/* Wishlist */}
            <div className="absolute right-5 top-5 ">
              <WishlistButton productId={product.id} />
            </div>
            <div className=" absolute left-5 top-5">
              <ShareButton productName={product.name} />
            </div>
          </div>

          {/* ====================================== */}
          {/* Product Information */}
          {/* ====================================== */}

          <div className="flex flex-col">
            {/* Category */}
            <p className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {product.category}
            </p>

            {/* Name */}
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="mt-4 flex items-center gap-3">
              <Stars rating={rating} />

              <span className="font-semibold text-gray-900 dark:text-white">{rating}</span>

              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({reviewCount} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="mt-6">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                ₦{product.price.toLocaleString("en-NG")}
              </p>
            </div>

            <div className="my-7 h-px bg-gray-200 dark:bg-gray-700" />

            {/* Description */}
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                Description
              </h2>

              <p className="mt-2 text-base leading-7 text-gray-600 dark:text-gray-300">
                {product.description}
              </p>
            </div>

            {/* Stock */}
            <div className="mt-7 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      isInStock
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    <Package size={20} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {isInStock ? "In stock" : "Out of stock"}
                    </p>

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {isInStock
                        ? `${product.stock} available`
                        : "Currently unavailable"}
                    </p>
                  </div>
                </div>

                {isInStock && (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                    Available
                  </span>
                )}
              </div>
            </div>

            {/* Delivery information */}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                <Truck size={20} className="text-gray-700 dark:text-gray-200" />

                <div>
                  <p className="text-sm font-medium">Fast delivery</p>

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Delivered to your address
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                <Heart size={20} className="text-gray-700 dark:text-gray-200" />

                <div>
                  <p className="text-sm font-medium">Save for later</p>

                  <p className="text-xs text-gray-500 dark:text-gray-400">Add to your wishlist</p>
                </div>
              </div>
            </div>

            <div className="mt-7 flex w-full items-end gap-3">
              {/* Quantity */}
              <div className="shrink-0">
                <QuantitySelector
                  quantity={quantity}
                  stock={product.stock}
                  onQuantityChange={setQuantity}
                />
              </div>

              <div className="min-w-0 flex-1 pointer-cursor">
                <AddToCartButton product={product} quantity={quantity} />
              </div>
            </div>

            {/* Small reassurance */}
            <p className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
              Secure checkout • Quality guaranteed
            </p>
          </div>
        </div>

        {/* ====================================== */}
        {/* Reviews */}
        {/* ====================================== */}

        <Reviews />
      </main>
    </>
  );
}
