"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import type { Product } from "@/types/product";
import WishlistButton from "@/components/WishlistButton";
import AddToCartIcon from "@/components/AddToCartIcon";

type TodaysDealsProps = {
  products: Product[];
};

const DEAL_DURATION = 24 * 60 * 60 * 1000;

export default function TodaysDeals({ products }: TodaysDealsProps) {
  /*
   * Temporary deal data.
   *
   * Later these values can come from the database:
   * - discountPercentage
   * - dealEndsAt
   * - isDeal
   */

  const deals = useMemo(() => {
    return products.slice(0, 8).map((product, index) => {
      const discount = [10, 15, 20, 25, 30, 15, 20, 10][index] ?? 10;

      const originalPrice = Math.round(product.price / (1 - discount / 100));

      return {
        ...product,
        discount,
        originalPrice,
      };
    });
  }, [products]);

  /*
   * Countdown
   */

  const [timeLeft, setTimeLeft] = useState(DEAL_DURATION);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1000) {
          return DEAL_DURATION;
        }

        return current - 1000;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const hours = Math.floor(timeLeft / (1000 * 60 * 60));

  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  /*
   * Carousel
   */

  const carouselRef = useRef<HTMLDivElement>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  function updateScrollButtons() {
    const carousel = carouselRef.current;

    if (!carousel) return;

    const atStart = carousel.scrollLeft <= 0;

    const atEnd =
      carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 1;

    setCanScrollLeft(!atStart);
    setCanScrollRight(!atEnd);
  }

  //   function scrollCarousel(direction: "left" | "right") {
  //     if (!carouselRef.current) return;

  //     const scrollAmount = 260;

  //     carouselRef.current.scrollBy({
  //       left: direction === "right" ? scrollAmount : -scrollAmount,
  //       behavior: "smooth",
  //     });
  //   }

  function scrollCarousel(direction: "left" | "right") {
    if (!carouselRef.current) return;

    const scrollAmount = 260;

    carouselRef.current.scrollBy({
      left: direction === "right" ? scrollAmount : -scrollAmount,
      behavior: "smooth",
    });
  }

  useEffect(() => {
    const carousel = carouselRef.current;

    if (!carousel) return;

    updateScrollButtons();

    carousel.addEventListener("scroll", updateScrollButtons);
    window.addEventListener("resize", updateScrollButtons);

    return () => {
      carousel.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [deals]);

  if (deals.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-8">
      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
                Super Deals
              </h2>

              <span className="rounded-md bg-red-500 px-2 py-1 text-xs font-bold uppercase text-white">
                Hot
              </span>
            </div>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Grab these deals before they disappear
            </p>
          </div>

          {/* Countdown */}
          <div className="shrink-0">
            <p className="mb-1 text-right text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Ends in
            </p>

            <div className="flex items-center gap-1">
              <TimeBox value={hours} />

              <span className="font-bold text-gray-400 dark:text-gray-500">:</span>

              <TimeBox value={minutes} />

              <span className="font-bold text-gray-400 dark:text-gray-500">:</span>

              <TimeBox value={seconds} />
            </div>
          </div>
        </div>

        {/* Carousel wrapper */}
        <div className="relative">
          {/* Left arrow */}

          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scrollCarousel("left")}
              aria-label="Previous deals"
              className="absolute left-2 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white dark:bg-gray-900 text-xl font-bold text-gray-700 dark:text-gray-200 shadow-lg transition hover:scale-105 hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 lg:flex"
            >
              ←
            </button>
          )}
          {/* Products */}
          <div
            ref={carouselRef}
            className="flex gap-4 overflow-x-auto scroll-smooth pb-4 scrollbar-hide"
          >
            {deals.map((product) => {
              const discountedPrice = product.price;

              return (
                <article
                  key={product.id}
                  className="group relative w-[190px] shrink-0 overflow-hidden rounded-xl bg-white dark:bg-gray-900 shadow-sm transition-shadow duration-200 hover:shadow-md sm:w-[220px]"
                >
                  {/* Image */}
                  <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <Link href={`/products/${product.id}`}>
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </Link>

                    {/* Discount badge */}
                    <div className="absolute left-2 top-2 rounded-md bg-red-500 px-2 py-1 text-xs font-bold text-white">
                      -{product.discount}%
                    </div>

                    {/* Wishlist */}
                    <div className="absolute right-2 top-2">
                      <WishlistButton productId={product.id} />
                    </div>

                    {/* Cart */}
                    <div className="absolute bottom-2 right-2">
                      <AddToCartIcon product={product} />
                    </div>
                  </div>

                  {/* Product information */}
                  <div className="p-3">
                    <Link href={`/products/${product.id}`}>
                      <h3 className="line-clamp-1 text-sm font-semibold text-gray-900 dark:text-white hover:text-gray-600 dark:text-gray-300">
                        {product.name}
                      </h3>
                    </Link>

                    <p className="mt-2 line-clamp-1 text-xs text-gray-500 dark:text-gray-400">
                      {product.description}
                    </p>

                    {/* Prices */}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="text-base font-bold text-red-600">
                        ₦{discountedPrice.toLocaleString()}
                      </span>

                      <span className="text-xs text-gray-400 dark:text-gray-500 line-through">
                        ₦{product.originalPrice.toLocaleString()}
                      </span>
                    </div>

                    {/* Savings */}
                    <p className="mt-1 text-[11px] font-medium text-green-600">
                      Save ₦
                      {(
                        product.originalPrice - discountedPrice
                      ).toLocaleString()}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Right arrow */}

          {canScrollRight && (
            <button
              type="button"
              onClick={() => scrollCarousel("right")}
              aria-label="Next deals"
              className="absolute right-2 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white dark:bg-gray-900 text-xl font-bold text-gray-700 dark:text-gray-200 shadow-lg transition hover:scale-105 hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 lg:flex"
            >
              →
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

/*
 * Countdown box
 */

function TimeBox({ value }: { value: number }) {
  return (
    <span className="flex h-7 min-w-7 items-center justify-center rounded bg-black px-1.5 text-xs font-bold text-white">
      {String(value).padStart(2, "0")}
    </span>
  );
}
