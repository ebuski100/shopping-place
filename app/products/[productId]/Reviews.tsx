"use client";

import { Star } from "lucide-react";

type Review = {
  id: number;
  user: string;
  rating: number;
  comment: string;
  date: string;
  avatar: string;
};

const reviews: Review[] = [
  {
    id: 1,
    user: "David Okafor",
    rating: 5,
    comment:
      "Excellent product. The quality is even better than I expected. Delivery was also very fast.",
    date: "2 days ago",
    avatar: "DO",
  },
  {
    id: 2,
    user: "Sarah Williams",
    rating: 5,
    comment:
      "Really happy with this purchase. The product looks exactly like the pictures and works perfectly.",
    date: "1 week ago",
    avatar: "SW",
  },
  {
    id: 3,
    user: "Michael Johnson",
    rating: 4,
    comment:
      "Great product overall. Good quality and reasonable price. Would definitely recommend it.",
    date: "2 weeks ago",
    avatar: "MJ",
  },
  {
    id: 4,
    user: "Chiamaka Eze",
    rating: 5,
    comment:
      "I absolutely love it! The quality is impressive and it arrived nicely packaged.",
    date: "3 weeks ago",
    avatar: "CE",
  },
  {
    id: 5,
    user: "Daniel Adeyemi",
    rating: 4,
    comment:
      "Very good product. Everything was as described and delivery was smooth.",
    date: "1 month ago",
    avatar: "DA",
  },
];

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          size={16}
          className={
            index < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          }
        />
      ))}
    </div>
  );
}

export default function Reviews() {
  const averageRating = 4.7;

  return (
    <section className="mt-12 border-t pt-10">
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Customer Reviews</h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            See what other customers think about this product.
          </p>
        </div>

        {/* Rating summary */}
        <div className="flex items-center gap-4 rounded-xl bg-gray-50 dark:bg-gray-950 px-5 py-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{averageRating}</p>

            <Stars rating={5} />

            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {reviews.length + 123} reviews
            </p>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-8 space-y-4">
        {reviews.map((review) => (
          <article
            key={review.id}
            className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white">
                {review.avatar}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{review.user}</p>

                    <div className="mt-1">
                      <Stars rating={review.rating} />
                    </div>
                  </div>

                  <span className="text-xs text-gray-400 dark:text-gray-500">{review.date}</span>
                </div>

                <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
                  {review.comment}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
