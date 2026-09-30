"use client";

import { Star } from "lucide-react";

type ProductRatingProps = {
  rating: number;
  reviewCount: number;
  size?: "sm" | "md";
  showCount?: boolean;
};

export default function ProductRating({
  rating,
  reviewCount,
  size = "sm",
  showCount = true,
}: ProductRatingProps) {
  const starSize = size === "md" ? "h-5 w-5" : "h-4 w-4";

  return (
    <div className="flex items-center gap-2">
      <div
        className="flex items-center"
        aria-label={`${rating} out of 5 stars`}
      >
        {Array.from({ length: 5 }).map((_, index) => {
          const starNumber = index + 1;

          const filled = starNumber <= Math.round(rating);

          return (
            <Star
              key={starNumber}
              className={`${starSize} ${
                filled
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-transparent text-gray-300 dark:text-gray-600"
              }`}
            />
          );
        })}
      </div>

      <span
        className={`font-medium text-gray-700 dark:text-gray-300 ${
          size === "md" ? "text-sm" : "text-xs"
        }`}
      >
        {rating.toFixed(1)}
      </span>

      {showCount && (
        <span
          className={`text-gray-500 dark:text-gray-400 ${
            size === "md" ? "text-sm" : "text-xs"
          }`}
        >
          ({reviewCount})
        </span>
      )}
    </div>
  );
}
