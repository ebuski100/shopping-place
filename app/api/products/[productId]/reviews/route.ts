import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrderStatus, PaymentStatus } from "@/lib/generated/prisma/client";

type RouteContext = {
  params: Promise<{
    productId: string;
  }>;
};

const createReviewSchema = z.object({
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
 * GET
 *
 * Fetch reviews and rating statistics for a product.
 */
export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { productId } = await params;

    const id = Number(productId);

    if (!Number.isInteger(id)) {
      return Response.json({ error: "Invalid product ID" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: {
        id,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (!product) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    // const reviews = await prisma.review.findMany({
    //   where: {
    //     productId: id,
    //   },
    //   orderBy: {
    //     createdAt: "desc",
    //   },
    //   select: {
    //     id: true,
    //     rating: true,
    //     comment: true,
    //     createdAt: true,
    //     updatedAt: true,

    //     user: {
    //       select: {
    //         id: true,
    //         name: true,
    //         profileImage: true,
    //       },
    //     },
    //   },
    // });

    const reviews = await prisma.review.findMany({
      where: {
        productId: id,
      },
      orderBy: {
        createdAt: "desc",
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

    const reviewsWithVerification = reviews.map((review) => ({
      ...review,
      verifiedPurchase: true,
    }));

    const totalReviews = reviews.length;

    const ratingTotal = reviews.reduce(
      (total, review) => total + review.rating,
      0,
    );

    const averageRating =
      totalReviews > 0 ? Number((ratingTotal / totalReviews).toFixed(1)) : 0;

    const distribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    for (const review of reviews) {
      distribution[review.rating as keyof typeof distribution]++;
    }

    /*
     * Determine whether the currently authenticated
     * user has already reviewed this product.
     */
    const user = await getCurrentUser();

    let currentUserReview = null;

    if (user) {
      currentUserReview = await prisma.review.findUnique({
        where: {
          userId_productId: {
            userId: user.id,
            productId: id,
          },
        },
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    }

    /*
     * Check whether the current user is eligible
     * to review this product.
     *
     * A qualifying purchase means:
     * - order belongs to the current user
     * - payment succeeded
     * - order was delivered
     * - order contains this product
     */
    let canReview = false;

    if (user) {
      const purchase = await prisma.orderItem.findFirst({
        where: {
          productId: id,

          order: {
            userId: user.id,
            paymentStatus: PaymentStatus.PAID,
            status: OrderStatus.DELIVERED,
          },
        },
        select: {
          id: true,
        },
      });

      canReview = Boolean(purchase) && !currentUserReview;
    }

    return Response.json({
      averageRating,
      totalReviews,
      distribution,
      canReview,
      currentUserReview,
      reviews,
    });
  } catch (error) {
    console.error("Get product reviews error:", error);

    return Response.json(
      { error: "Failed to fetch product reviews" },
      { status: 500 },
    );
  }
}

/**
 * POST
 *
 * Create a review for a product.
 */
export async function POST(request: Request, { params }: RouteContext) {
  try {
    /*
     * ------------------------------------------
     * Authentication
     * ------------------------------------------
     */

    const user = await getCurrentUser();

    if (!user) {
      return Response.json(
        { error: "You must be logged in to review a product" },
        { status: 401 },
      );
    }

    /*
     * ------------------------------------------
     * Product ID
     * ------------------------------------------
     */

    const { productId } = await params;

    const id = Number(productId);

    if (!Number.isInteger(id)) {
      return Response.json({ error: "Invalid product ID" }, { status: 400 });
    }

    /*
     * ------------------------------------------
     * Product existence
     * ------------------------------------------
     */

    const product = await prisma.product.findUnique({
      where: {
        id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!product) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    /*
     * ------------------------------------------
     * Validate request body
     * ------------------------------------------
     */

    const body = await request.json();

    const result = createReviewSchema.safeParse(body);

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
     * Check for existing review
     * ------------------------------------------
     */

    const existingReview = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId: id,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingReview) {
      return Response.json(
        {
          error: "You have already reviewed this product",
        },
        { status: 409 },
      );
    }

    /*
     * ------------------------------------------
     * Verify purchase
     * ------------------------------------------
     *
     * The user must have:
     *
     * 1. Purchased this product
     * 2. Successfully paid
     * 3. Received the order
     */

    const purchase = await prisma.orderItem.findFirst({
      where: {
        productId: id,

        order: {
          userId: user.id,
          paymentStatus: PaymentStatus.PAID,
          status: OrderStatus.DELIVERED,
        },
      },
      select: {
        id: true,
      },
    });

    if (!purchase) {
      return Response.json(
        {
          error: "You can only review products you have purchased and received",
        },
        { status: 403 },
      );
    }

    /*
     * ------------------------------------------
     * Create review
     * ------------------------------------------
     */

    const review = await prisma.review.create({
      data: {
        userId: user.id,
        productId: id,
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

    return Response.json(
      {
        message: "Review submitted successfully",
        review,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create product review error:", error);

    return Response.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
