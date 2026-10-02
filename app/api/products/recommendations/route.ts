import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const pageParam = Number(searchParams.get("page") ?? "1");

    const limitParam = Number(searchParams.get("limit") ?? "8");

    const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

    const limit =
      Number.isInteger(limitParam) && limitParam > 0 && limitParam <= 20
        ? limitParam
        : 8;

    const user = await getCurrentUser();

    let wishlistProductIds: number[] = [];

    // ------------------------------------------
    // Get authenticated user's wishlist
    // ------------------------------------------

    if (user) {
      const wishlist = await prisma.wishlist.findMany({
        where: {
          userId: user.id,
        },
        select: {
          productId: true,
        },
      });

      wishlistProductIds = wishlist.map((item) => item.productId);
    }

    // ------------------------------------------
    // Base product filter
    // ------------------------------------------

    const where = {
      isActive: true,

      ...(wishlistProductIds.length > 0 && {
        id: {
          notIn: wishlistProductIds,
        },
      }),
    };

    // ------------------------------------------
    // Count available products
    // ------------------------------------------

    const totalProducts = await prisma.product.count({
      where,
    });

    // ------------------------------------------
    // Pagination
    // ------------------------------------------

    const skip = (page - 1) * limit;

    const products = await prisma.product.findMany({
      where,

      orderBy: [
        {
          createdAt: "desc",
        },
        {
          id: "desc",
        },
      ],

      skip,
      take: limit,
    });

    // ------------------------------------------
    // Pagination information
    // ------------------------------------------

    const hasMore = skip + products.length < totalProducts;

    return Response.json({
      products,
      pagination: {
        page,
        limit,
        totalProducts,
        hasMore,
      },
    });
  } catch (error) {
    console.error("Get recommended products error:", error);

    return Response.json(
      {
        error: "Failed to fetch recommended products",
      },
      {
        status: 500,
      },
    );
  }
}
