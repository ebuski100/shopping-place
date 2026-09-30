import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
      },

      select: {
        id: true,

        reviews: {
          select: {
            rating: true,
          },
        },
      },
    });

    const ratings = products.map((product) => {
      const totalReviews = product.reviews.length;

      const ratingTotal = product.reviews.reduce(
        (total, review) => total + review.rating,
        0,
      );

      const averageRating =
        totalReviews > 0 ? Number((ratingTotal / totalReviews).toFixed(1)) : 0;

      return {
        productId: product.id,
        averageRating,
        totalReviews,
      };
    });

    return Response.json({
      ratings,
    });
  } catch (error) {
    console.error("Get product ratings error:", error);

    return Response.json(
      {
        error: "Failed to fetch product ratings",
      },
      {
        status: 500,
      },
    );
  }
}
