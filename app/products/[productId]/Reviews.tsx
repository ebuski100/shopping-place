"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  Pencil,
  Star,
  Trash2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

type ReviewUser = {
  id: number;
  name: string | null;
  profileImage: string | null;
};

type Review = {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  verifiedPurchase: boolean;
  user: ReviewUser;
};

type ReviewsResponse = {
  averageRating: number;
  totalReviews: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  canReview: boolean;
  currentUserReview: {
    id: number;
    rating: number;
    comment: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  reviews: Review[];
};

type ReviewsProps = {
  productId: number;
};

function Stars({
  rating,
  size = "sm",
  interactive = false,
  onChange,
}: {
  rating: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (rating: number) => void;
}) {
  const sizeClass = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-7 w-7",
  }[size];

  return (
    <div
      className="flex items-center gap-0.5"
      role={interactive ? "radiogroup" : undefined}
      aria-label={interactive ? "Choose a rating" : undefined}
    >
      {Array.from({ length: 5 }).map((_, index) => {
        const star = index + 1;
        const filled = star <= rating;

        return (
          <button
            key={star}
            type={interactive ? "button" : undefined}
            disabled={!interactive}
            onClick={() => onChange?.(star)}
            aria-label={
              interactive ? `${star} star${star > 1 ? "s" : ""}` : undefined
            }
            className={
              interactive
                ? "cursor-pointer rounded-sm transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20"
                : "cursor-default"
            }
          >
            <Star
              className={`${sizeClass} ${
                filled
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300 dark:text-gray-600"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name: string | null) {
  if (!name) return "U";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function Reviews({ productId }: ReviewsProps) {
  const [data, setData] = useState<ReviewsResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  async function loadReviews() {
    try {
      setLoading(true);

      const response = await fetch(`/api/products/${productId}/reviews`, {
        cache: "no-store",
        credentials: "include",
      });

      const result: ReviewsResponse & {
        error?: string;
      } = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load reviews");
      }

      setData(result);

      if (result.currentUserReview) {
        setRating(result.currentUserReview.rating);
        setComment(result.currentUserReview.comment);
      }
    } catch (error) {
      console.error("Load reviews error:", error);

      toast.error(
        error instanceof Error ? error.message : "Failed to load reviews",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviews();
  }, [productId]);

  async function handleSubmit() {
    if (rating < 1) {
      toast.error("Please choose a rating");
      return;
    }

    if (comment.trim().length < 10) {
      toast.error("Your review must be at least 10 characters");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        editing && data?.currentUserReview
          ? `/api/reviews/${data.currentUserReview.id}`
          : `/api/products/${productId}/reviews`,
        {
          method: editing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            rating,
            comment: comment.trim(),
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit review");
      }

      toast.success(
        editing
          ? "Review updated successfully"
          : "Review submitted successfully",
      );

      setEditing(false);

      await loadReviews();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!data?.currentUserReview) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete your review?",
    );

    if (!confirmed) return;

    try {
      setDeleting(true);

      const response = await fetch(
        `/api/reviews/${data.currentUserReview.id}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete review");
      }

      toast.success("Review deleted successfully");

      setRating(0);
      setComment("");
      setEditing(false);

      await loadReviews();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete review",
      );
    } finally {
      setDeleting(false);
    }
  }

  const distribution = useMemo(() => {
    if (!data) return [];

    return [5, 4, 3, 2, 1].map((star) => {
      const count = data.distribution[star as keyof typeof data.distribution];

      const percentage =
        data.totalReviews > 0
          ? Math.round((count / data.totalReviews) * 100)
          : 0;

      return {
        star,
        count,
        percentage,
      };
    });
  }, [data]);

  if (loading) {
    return (
      <section className="mt-12 border-t pt-10">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </section>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <section className="mt-12 border-t pt-10">
      {/* Header */}

      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Customer Reviews
        </h2>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          See what customers are saying about this product.
        </p>
      </div>

      {/* Rating Summary */}

      <div className="grid gap-8 rounded-2xl border bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900/50 sm:grid-cols-[180px_1fr]">
        {/* Average */}

        <div className="flex flex-col items-center justify-center border-b pb-6 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-8">
          <p className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
            {data.averageRating.toFixed(1)}
          </p>

          <Stars rating={Math.round(data.averageRating)} size="md" />

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {data.totalReviews} {data.totalReviews === 1 ? "review" : "reviews"}
          </p>
        </div>

        {/* Distribution */}

        <div className="flex flex-col justify-center gap-2">
          {distribution.map((item) => (
            <div key={item.star} className="flex items-center gap-3">
              <span className="w-8 text-sm font-medium text-gray-600 dark:text-gray-300">
                {item.star}★
              </span>

              <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-full rounded-full bg-yellow-400 transition-all"
                  style={{
                    width: `${item.percentage}%`,
                  }}
                />
              </div>

              <span className="w-10 text-right text-xs text-gray-500 dark:text-gray-400">
                {item.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Current user's review */}

      {data.currentUserReview && !editing && (
        <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50/50 p-5 dark:border-blue-900/40 dark:bg-blue-950/20">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Your review
              </p>

              <div className="mt-2">
                <Stars rating={data.currentUserReview.rating} size="sm" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-900/50 dark:bg-gray-900 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                {deleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Delete
              </button>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-gray-700 dark:text-gray-300">
            {data.currentUserReview.comment}
          </p>
        </div>
      )}

      {/* Review form */}

      {data.canReview || editing ? (
        <div className="mt-8 rounded-2xl border p-6 dark:border-gray-800">
          <div className="mb-5">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {editing ? "Edit your review" : "Write a review"}
            </h3>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {editing
                ? "Update your experience with this product."
                : "Share your experience with other customers."}
            </p>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Your rating
            </p>

            <Stars rating={rating} size="lg" interactive onChange={setRating} />
          </div>

          <div className="mt-5">
            <label
              htmlFor={`review-${productId}`}
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Your review
            </label>

            <textarea
              id={`review-${productId}`}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              maxLength={1000}
              rows={5}
              placeholder="Tell other customers about your experience..."
              className="w-full resize-none rounded-xl border bg-white px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-black/5 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-gray-500"
            />

            <div className="mt-1 flex justify-end">
              <span className="text-xs text-gray-400">
                {comment.length}/1000
              </span>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-end gap-3">
            {editing && (
              <button
                type="button"
                onClick={() => {
                  setEditing(false);

                  if (data.currentUserReview) {
                    setRating(data.currentUserReview.rating);
                    setComment(data.currentUserReview.comment);
                  }
                }}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                submitting || rating === 0 || comment.trim().length < 10
              }
              className="inline-flex items-center gap-2 rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}

              {editing ? "Update review" : "Submit review"}
            </button>
          </div>
        </div>
      ) : null}

      {/* Reviews list */}

      {data.reviews.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed p-10 text-center dark:border-gray-800">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <Star className="h-5 w-5 text-gray-400" />
          </div>

          <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">
            No reviews yet
          </h3>

          <p className="mx-auto mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
            Be the first customer to share your experience with this product.
          </p>
        </div>
      ) : (
        <div className="mt-8 divide-y dark:divide-gray-800">
          {data.reviews.map((review) => (
            <article key={review.id} className="py-7 first:pt-0">
              <div className="flex gap-4">
                {/* Avatar */}

                {review.user.profileImage ? (
                  <img
                    src={review.user.profileImage}
                    alt={review.user.name ?? "Customer"}
                    className="h-11 w-11 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                    {review.user.name ? (
                      getInitials(review.user.name)
                    ) : (
                      <UserRound className="h-5 w-5" />
                    )}
                  </div>
                )}

                {/* Content */}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {review.user.name ?? "Customer"}
                    </h4>

                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Verified purchase
                    </span>
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-3">
                    <Stars rating={review.rating} size="sm" />

                    <span className="text-xs text-gray-400">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-7 text-gray-700 dark:text-gray-300">
                    {review.comment}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
