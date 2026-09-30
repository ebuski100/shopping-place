import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    reviewId: string;
  }>;
};

const updateReviewSchema = z.object({
  rating: z
    .number()
    .int()
    .min(1, "Rating must be at least 1 star")
    .max(5, "Rating cannot be more than 5 stars"),

  comment: z
    .string()
    .trim()
    .min(10, "Review must be at least 10 characters")
    .max(1000, "Review cannot exceed 1000 characters"),
});

/**
 * PATCH
 *
 * Update the authenticated user's own review.
 */
export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    /*
     * ------------------------------------------
     * Authentication
     * ------------------------------------------
     */

    const user = await getCurrentUser();

    if (!user) {
      return Response.json(
        {
          error: "You must be logged in to edit a review",
        },
        { status: 401 },
      );
    }

    /*
     * ------------------------------------------
     * Review ID
     * ------------------------------------------
     */

    const { reviewId } = await params;

    const id = Number(reviewId);

    if (!Number.isInteger(id)) {
      return Response.json(
        {
          error: "Invalid review ID",
        },
        { status: 400 },
      );
    }

    /*
     * ------------------------------------------
     * Find review
     * ------------------------------------------
     */

    const review = await prisma.review.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        userId: true,
        productId: true,
      },
    });

    if (!review) {
      return Response.json(
        {
          error: "Review not found",
        },
        { status: 404 },
      );
    }

    /*
     * ------------------------------------------
     * Ownership check
     * ------------------------------------------
     *
     * Users can only edit their own reviews.
     */

    if (review.userId !== user.id) {
      return Response.json(
        {
          error: "You can only edit your own reviews",
        },
        { status: 403 },
      );
    }

    /*
     * ------------------------------------------
     * Validate request body
     * ------------------------------------------
     */

    const body = await request.json();

    const result = updateReviewSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        {
          error: "Invalid review",
          issues: result.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { rating, comment } = result.data;

    /*
     * ------------------------------------------
     * Update review
     * ------------------------------------------
     */

    const updatedReview = await prisma.review.update({
      where: {
        id,
      },
      data: {
        rating,
        comment,
      },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        updatedAt: true,

        user: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
    });

    return Response.json({
      message: "Review updated successfully",
      review: updatedReview,
    });
  } catch (error) {
    console.error("Update review error:", error);

    return Response.json(
      {
        error: "Failed to update review",
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE
 *
 * Delete the authenticated user's own review.
 */
export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    /*
     * ------------------------------------------
     * Authentication
     * ------------------------------------------
     */

    const user = await getCurrentUser();

    if (!user) {
      return Response.json(
        {
          error: "You must be logged in to delete a review",
        },
        { status: 401 },
      );
    }

    /*
     * ------------------------------------------
     * Review ID
     * ------------------------------------------
     */

    const { reviewId } = await params;

    const id = Number(reviewId);

    if (!Number.isInteger(id)) {
      return Response.json(
        {
          error: "Invalid review ID",
        },
        { status: 400 },
      );
    }

    /*
     * ------------------------------------------
     * Find review
     * ------------------------------------------
     */

    const review = await prisma.review.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!review) {
      return Response.json(
        {
          error: "Review not found",
        },
        { status: 404 },
      );
    }

    /*
     * ------------------------------------------
     * Ownership check
     * ------------------------------------------
     */

    if (review.userId !== user.id) {
      return Response.json(
        {
          error: "You can only delete your own reviews",
        },
        { status: 403 },
      );
    }

    /*
     * ------------------------------------------
     * Delete review
     * ------------------------------------------
     */

    await prisma.review.delete({
      where: {
        id,
      },
    });

    return Response.json({
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Delete review error:", error);

    return Response.json(
      {
        error: "Failed to delete review",
      },
      { status: 500 },
    );
  }
}
