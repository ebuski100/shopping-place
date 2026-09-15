"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import PromoBanner from "@/components/PromoBanner";
import { promotions, type Promotion } from "@/data/promotion";

export default function PromoCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const [isPaused, setIsPaused] = useState(false);

  const totalSlides = promotions.length;

  const nextSlide = useCallback(() => {
    setCurrentIndex((current) =>
      current === totalSlides - 1 ? 0 : current + 1,
    );
  }, [totalSlides]);

  const previousSlide = useCallback(() => {
    setCurrentIndex((current) =>
      current === 0 ? totalSlides - 1 : current - 1,
    );
  }, [totalSlides]);

  /*
   * Automatic slideshow
   */
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(timer);
  }, [isPaused, nextSlide]);

  /*
   * Keyboard navigation
   */
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight") {
        nextSlide();
      }

      if (event.key === "ArrowLeft") {
        previousSlide();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [nextSlide, previousSlide]);

  const currentPromotion: Promotion = promotions[currentIndex];

  return (
    <section
      className="mx-auto w-full max-w-7xl px-4 py-4"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative">
        {/* Banner */}
        <PromoBanner promotion={currentPromotion} />

        {/* Previous button */}
        <button
          type="button"
          onClick={previousSlide}
          aria-label="Previous promotion"
          className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white dark:bg-gray-900/90 text-gray-800 dark:text-gray-100 shadow-md backdrop-blur transition hover:scale-105 hover:bg-white dark:bg-gray-900 active:scale-95 sm:left-5"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Next button */}
        <button
          type="button"
          onClick={nextSlide}
          aria-label="Next promotion"
          className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white dark:bg-gray-900/90 text-gray-800 dark:text-gray-100 shadow-md backdrop-blur transition hover:scale-105 hover:bg-white dark:bg-gray-900 active:scale-95 sm:right-5"
        >
          <ChevronRight size={20} />
        </button>

        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
          {promotions.map((promotion, index) => {
            const isActive = index === currentIndex;

            return (
              <button
                key={promotion.id}
                type="button"
                onClick={() => setCurrentIndex(index)}
                aria-label={`Go to promotion ${index + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  isActive
                    ? "w-6 bg-white dark:bg-gray-900"
                    : "w-2 bg-white dark:bg-gray-900/50 hover:bg-white dark:bg-gray-900/80"
                }`}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
