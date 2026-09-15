import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { updateCartItemSchema } from "@/lib/validations/cart";

type RouteContext = {
  params: Promise<{
    itemId: string;
  }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { itemId } = await params;

    const parsedItemId = Number(itemId);

    if (!Number.isInteger(parsedItemId) || parsedItemId <= 0) {
      return Response.json({ error: "Invalid cart item ID" }, { status: 400 });
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const result = updateCartItemSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        {
          error: result.error.issues[0].message,
        },
        { status: 400 },
      );
    }

    const { quantity } = result.data;

    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: parsedItemId,
        cart: {
          userId: user.id,
        },
      },
      include: {
        product: true,
      },
    });

    if (!cartItem) {
      return Response.json({ error: "Cart item not found" }, { status: 404 });
    }

    if (quantity > cartItem.product.stock) {
      return Response.json(
        { error: "Not enough stock available" },
        { status: 409 },
      );
    }

    const updatedItem = await prisma.cartItem.update({
      where: {
        id: cartItem.id,
      },
      data: {
        quantity,
      },
      include: {
        product: true,
      },
    });

    return Response.json(updatedItem);
  } catch (error) {
    console.error("Update cart error:", error);

    return Response.json(
      { error: "Failed to update cart item" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { itemId } = await params;
    const id = Number(itemId);

    if (!Number.isInteger(id) || id <= 0) {
      return Response.json({ error: "Invalid cart item ID" }, { status: 400 });
    }

    // Make sure the item belongs to the logged-in user's cart
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id,
        cart: {
          userId: user.id,
        },
      },
    });

    if (!cartItem) {
      return Response.json({ error: "Cart item not found" }, { status: 404 });
    }

    await prisma.cartItem.delete({
      where: {
        id: cartItem.id,
      },
    });

    return Response.json({
      message: "Item removed from cart",
    });
  } catch (error) {
    console.error("Failed to remove cart item:", error);

    return Response.json(
      { error: "Failed to remove cart item" },
      { status: 500 },
    );
  }
}
