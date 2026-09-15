import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get products already in the user's wishlist
    const wishlist = await prisma.wishlist.findMany({
      where: {
        userId: user.id,
      },
      select: {
        productId: true,
      },
    });

    const wishlistProductIds = wishlist.map((item) => item.productId);

    // Get active products that are NOT already wishlisted
    const products = await prisma.product.findMany({
      where: {
        isActive: true,

        ...(wishlistProductIds.length > 0 && {
          id: {
            notIn: wishlistProductIds,
          },
        }),
      },

      orderBy: {
        createdAt: "desc",
      },

      take: 20,
    });

    return Response.json({
      products,
    });
  } catch (error) {
    console.error("Get recommended products error:", error);

    return Response.json(
      {
        error: "Failed to fetch recommended products",
      },
      { status: 500 },
    );
  }
}
