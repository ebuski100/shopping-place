import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

type RouteContext = {
  params: Promise<{
    productId: string;
  }>;
};

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId } = await params;

    const id = Number(productId);

    if (!Number.isInteger(id)) {
      return Response.json({ error: "Invalid product ID" }, { status: 400 });
    }

    const wishlistItem = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId: id,
        },
      },
    });

    if (!wishlistItem) {
      return Response.json(
        { error: "Product is not in wishlist" },
        { status: 404 },
      );
    }

    await prisma.wishlist.delete({
      where: {
        id: wishlistItem.id,
      },
    });

    return Response.json({
      message: "Product removed from wishlist",
    });
  } catch (error) {
    console.error("Remove wishlist error:", error);

    return Response.json(
      { error: "Failed to remove product from wishlist" },
      { status: 500 },
    );
  }
}
