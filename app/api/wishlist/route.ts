import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const wishlist = await prisma.wishlist.findMany({
      where: {
        userId: user.id,
      },
      include: {
        product: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return Response.json({
      items: wishlist,
      totalItems: wishlist.length,
    });
  } catch (error) {
    console.error("Get wishlist error:", error);

    return Response.json(
      { error: "Failed to fetch wishlist" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const productId = Number((body as { productId?: unknown }).productId);

    if (!Number.isInteger(productId) || productId <= 0) {
      return Response.json({ error: "Invalid product ID" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
    });

    if (!product) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    const existingWishlist = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
    });

    if (existingWishlist) {
      return Response.json(
        {
          error: "Product is already in wishlist",
        },
        { status: 409 },
      );
    }

    const wishlistItem = await prisma.wishlist.create({
      data: {
        userId: user.id,
        productId,
      },
      include: {
        product: true,
      },
    });

    return Response.json(wishlistItem, { status: 201 });
  } catch (error) {
    console.error("Add to wishlist error:", error);

    return Response.json(
      { error: "Failed to add product to wishlist" },
      { status: 500 },
    );
  }
}
