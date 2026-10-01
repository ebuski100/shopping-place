"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
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
  authenticated: boolean;

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

  hasVerifiedPurchase: boolean;

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

type StarsProps = {
  rating: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  hoverRating?: number;
  onHover?: (rating: number) => void;
  onChange?: (rating: number) => void;
};

function Stars({
  rating,
  size = "sm",
  interactive = false,
  hoverRating = 0,
  onHover,
  onChange,
}: StarsProps) {
  const sizeClass =
    size === "lg" ? "h-7 w-7" : size === "md" ? "h-6 w-6" : "h-5 w-5";

  const activeRating = hoverRating > 0 ? hoverRating : rating;

  return (
    <div
      className="flex items-center gap-1"
      onMouseLeave={() => {
        if (interactive) {
          onHover?.(0);
        }
      }}
    >
      {Array.from({ length: 5 }).map((_, index) => {
        const starNumber = index + 1;

        const active = starNumber <= activeRating;

        return (
          <button
            key={starNumber}
            type="button"
            disabled={!interactive}
            aria-label={`${starNumber} star${starNumber > 1 ? "s" : ""}`}
            className={`transition ${
              interactive ? "cursor-pointer hover:scale-110" : "cursor-default"
            }`}
            onMouseEnter={() => {
              if (interactive) {
                onHover?.(starNumber);
              }
            }}
            onClick={() => {
              if (interactive) {
                onChange?.(starNumber);
              }
            }}
          >
            <Star
              className={`${sizeClass} ${
                active
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-transparent text-gray-300 dark:text-gray-600"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

function getInitials(name: string | null) {
  if (!name) {
    return "U";
  }

  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getRatingLabel(rating: number) {
  switch (rating) {
    case 5:
      return "Excellent";

    case 4:
      return "Very good";

    case 3:
      return "Good";

    case 2:
      return "Fair";

    case 1:
      return "Poor";

    default:
      return "";
  }
}

export default function Reviews({ productId }: ReviewsProps) {
  const [data, setData] = useState<ReviewsResponse | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const [deleting, setDeleting] = useState(false);

  const [editing, setEditing] = useState(false);

  const [rating, setRating] = useState(0);

  const [hoverRating, setHoverRating] = useState(0);

  const [comment, setComment] = useState("");

  /**
   * Load reviews.
   */
  async function loadReviews() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: "GET",
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

      /**
       * If the current user already has a review,
       * preload the form with it when editing starts.
       */
      if (result.currentUserReview) {
        setRating(result.currentUserReview.rating);

        setComment(result.currentUserReview.comment);
      }
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error ? error.message : "Failed to load reviews",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviews();
  }, [productId]);

  /**
   * Rating distribution percentages.
   */
  const distribution = useMemo(() => {
    if (!data || data.totalReviews === 0) {
      return {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0,
      };
    }

    return {
      5: (data.distribution[5] / data.totalReviews) * 100,

      4: (data.distribution[4] / data.totalReviews) * 100,

      3: (data.distribution[3] / data.totalReviews) * 100,

      2: (data.distribution[2] / data.totalReviews) * 100,

      1: (data.distribution[1] / data.totalReviews) * 100,
    };
  }, [data]);

  /**
   * Submit or update review.
   */
  async function handleSubmit() {
    if (rating < 1) {
      toast.error("Please select a star rating");

      return;
    }

    if (comment.trim().length < 10) {
      toast.error("Your review must be at least 10 characters");

      return;
    }

    if (comment.trim().length > 1000) {
      toast.error("Your review cannot exceed 1000 characters");

      return;
    }

    try {
      setSubmitting(true);

      const isEditing = Boolean(data?.currentUserReview) && editing;

      const url = isEditing
        ? `/api/reviews/${data?.currentUserReview?.id}`
        : `/api/products/${productId}/reviews`;

      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,

        headers: {
          "Content-Type": "application/json",
        },

        credentials: "include",

        body: JSON.stringify({
          rating,
          comment: comment.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit review");
      }

      toast.success(
        isEditing
          ? "Review updated successfully"
          : "Review submitted successfully",
      );

      setEditing(false);

      setHoverRating(0);

      await loadReviews();
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error ? error.message : "Failed to submit review",
      );
    } finally {
      setSubmitting(false);
    }
  }

  /**
   * Start editing current user's review.
   */
  function handleStartEditing() {
    if (!data?.currentUserReview) {
      return;
    }

    setRating(data.currentUserReview.rating);

    setComment(data.currentUserReview.comment);

    setHoverRating(0);

    setEditing(true);
  }

  /**
   * Cancel editing.
   */
  function handleCancelEditing() {
    setEditing(false);

    setHoverRating(0);

    if (data?.currentUserReview) {
      setRating(data.currentUserReview.rating);

      setComment(data.currentUserReview.comment);
    } else {
      setRating(0);
      setComment("");
    }
  }

  /**
   * Delete current user's review.
   */
  async function handleDelete() {
    if (!data?.currentUserReview) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete your review?",
    );

    if (!confirmed) {
      return;
    }

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

      setEditing(false);

      setRating(0);

      setComment("");

      await loadReviews();
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error ? error.message : "Failed to delete review",
      );
    } finally {
      setDeleting(false);
    }
  }

  /**
   * Loading state.
   */
  if (loading) {
    return (
      <section className="border-t border-gray-200 py-10 dark:border-gray-800">
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
        </div>
      </section>
    );
  }

  /**
   * Error state.
   */
  if (error) {
    return (
      <section className="border-t border-gray-200 py-10 dark:border-gray-800">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-900/40 dark:bg-red-950/20">
          <p className="font-medium text-red-700 dark:text-red-400">
            Failed to load reviews
          </p>

          <p className="mt-1 text-sm text-red-600 dark:text-red-500">{error}</p>

          <button
            type="button"
            onClick={loadReviews}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
          >
            Try again
          </button>
        </div>
      </section>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <section className="border-t border-gray-200 py-10 dark:border-gray-800">
      {/* ------------------------------------------------ */}
      {/* Header */}
      {/* ------------------------------------------------ */}

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Customer Reviews
        </h2>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          See what customers think about this product.
        </p>
      </div>

      {/* ------------------------------------------------ */}
      {/* Rating Summary */}
      {/* ------------------------------------------------ */}

      <div className="grid gap-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:grid-cols-[180px_1fr] dark:border-gray-800 dark:bg-gray-900">
        {/* Average */}

        <div className="flex flex-col items-center justify-center border-b border-gray-200 pb-6 md:border-b-0 md:border-r md:pb-0 md:pr-8 dark:border-gray-800">
          <p className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
            {data.averageRating.toFixed(1)}
          </p>

          <Stars rating={data.averageRating} size="sm" />

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {data.totalReviews} {data.totalReviews === 1 ? "review" : "reviews"}
          </p>
        </div>

        {/* Distribution */}

        <div className="flex flex-col justify-center gap-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count =
              data.distribution[star as keyof typeof data.distribution];

            const percentage = distribution[star as keyof typeof distribution];

            return (
              <div key={star} className="flex items-center gap-3">
                <div className="flex w-12 items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <span>{star}</span>

                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                </div>

                <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    className="h-full rounded-full bg-yellow-400 transition-all"
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>

                <span className="w-8 text-right text-xs text-gray-500 dark:text-gray-400">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------ */}
      {/* Current User Review */}
      {/* ------------------------------------------------ */}

      {data.currentUserReview && !editing && (
        <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900/50">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                Your review
              </p>

              <div className="mt-2 flex items-center gap-3">
                <Stars rating={data.currentUserReview.rating} />

                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {getRatingLabel(data.currentUserReview.rating)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleStartEditing}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/50 dark:bg-gray-900 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete
              </button>
            </div>
          </div>

          <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-gray-700 dark:text-gray-300">
            {data.currentUserReview.comment}
          </p>

          <p className="mt-3 text-xs text-gray-500 dark:text-gray-500">
            Updated {formatDate(data.currentUserReview.updatedAt)}
          </p>
        </div>
      )}

      {/* ------------------------------------------------ */}
      {/* Review Form */}
      {/* ------------------------------------------------ */}

      {(data.canReview || editing) && (
        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {editing ? "Edit your review" : "Write a review"}
            </h3>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {editing
                ? "Update your rating and feedback."
                : "Your review helps other customers make better decisions."}
            </p>
          </div>

          {/* Rating */}

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Rating
            </label>

            <div className="mt-2 flex items-center gap-3">
              <Stars
                rating={rating}
                hoverRating={hoverRating}
                interactive
                size="md"
                onHover={setHoverRating}
                onChange={setRating}
              />

              {rating > 0 && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {getRatingLabel(rating)}
                </span>
              )}
            </div>
          </div>

          {/* Comment */}

          <div className="mt-6">
            <div className="flex items-center justify-between">
              <label
                htmlFor="review-comment"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Your review
              </label>

              <span
                className={`text-xs ${
                  comment.length > 1000 ? "text-red-500" : "text-gray-500"
                }`}
              >
                {comment.length}/1000
              </span>
            </div>

            <textarea
              id="review-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={5}
              maxLength={1000}
              placeholder="Share your experience with this product..."
              className="mt-2 w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-gray-400"
            />

            {comment.trim().length > 0 && comment.trim().length < 10 && (
              <p className="mt-2 text-xs text-red-500">
                Your review must be at least 10 characters.
              </p>
            )}
          </div>

          {/* Actions */}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            {editing && (
              <button
                type="button"
                disabled={submitting}
                onClick={handleCancelEditing}
                className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
            )}

            <button
              type="button"
              disabled={
                submitting || rating === 0 || comment.trim().length < 10
              }
              onClick={handleSubmit}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}

              {editing ? "Update review" : "Submit review"}
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------ */}
      {/* Guest Prompt */}
      {/* ------------------------------------------------ */}

      {!data.authenticated && (
        <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900/50">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Have you purchased this product?
              </h3>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Sign in to see whether youre eligible to leave a verified
                review.
              </p>
            </div>

            <a
              href="/login"
              className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
            >
              Sign in
            </a>
          </div>
        </div>
      )}

      {/* ------------------------------------------------ */}
      {/* Purchased but already reviewed */}
      {/* ------------------------------------------------ */}

      {data.authenticated &&
        data.hasVerifiedPurchase &&
        data.currentUserReview &&
        !editing && (
          <div className="mt-8 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-900/40 dark:bg-green-950/20">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />

            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-300">
                Verified purchase
              </p>

              <p className="mt-1 text-sm text-green-700 dark:text-green-400">
                You have already reviewed this product.
              </p>
            </div>
          </div>
        )}

      {/* ------------------------------------------------ */}
      {/* Purchased but cannot review */}
      {/* ------------------------------------------------ */}

      {data.authenticated &&
        !data.hasVerifiedPurchase &&
        !data.currentUserReview && (
          <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900/50">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />

              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  Verified reviews only
                </p>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  You can leave a review after purchasing and receiving this
                  product.
                </p>
              </div>
            </div>
          </div>
        )}

      {/* ------------------------------------------------ */}
      {/* Review List */}
      {/* ------------------------------------------------ */}

      <div className="mt-10">
        {data.reviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center dark:border-gray-700">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <Star className="h-6 w-6 text-gray-400" />
            </div>

            <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">
              No reviews yet
            </h3>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Be the first customer to review this product.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {data.reviews.map((review) => (
              <article key={review.id} className="py-8 first:pt-0">
                <div className="flex items-start gap-4">
                  {/* Avatar */}

                  {/* <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    {review.user.profileImage ? (
                      <img
                        src={review.user.profileImage}
                        alt={review.user.name ?? "Customer"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-gray-600 dark:text-gray-300">
                        {review.user.name ? (
                          getInitials(review.user.name)
                        ) : (
                          <UserRound className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    )}
                  </div> */}

                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    {review.user.profileImage ? (
                      <Image
                        src={review.user.profileImage}
                        alt={review.user.name ?? "Customer"}
                        fill
                        sizes="44px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-gray-600 dark:text-gray-300">
                        {review.user.name ? (
                          getInitials(review.user.name)
                        ) : (
                          <UserRound className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Content */}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {review.user.name ?? "Customer"}
                          </p>

                          {review.verifiedPurchase && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-950/30 dark:text-green-400">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Verified purchase
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex items-center gap-3">
                          <Stars rating={review.rating} size="sm" />

                          <span className="text-xs text-gray-500 dark:text-gray-500">
                            {formatDate(review.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-gray-700 dark:text-gray-300">
                      {review.comment}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
