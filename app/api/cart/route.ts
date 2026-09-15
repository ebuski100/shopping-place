import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { addToCartSchema } from "@/lib/validations/cart";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cart = await prisma.cart.findUnique({
      where: {
        userId: user.id,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // User doesn't have a cart yet
    if (!cart) {
      return Response.json({
        items: [],
        totalItems: 0,
      });
    }

    const totalItems = cart.items.reduce(
      (total, item) => total + item.quantity,
      0,
    );

    return Response.json({
      items: cart.items,
      totalItems,
    });
  } catch (error) {
    console.error("Get cart error:", error);

    return Response.json({ error: "Failed to fetch cart" }, { status: 500 });
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

    const result = addToCartSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        {
          error: result.error.issues[0].message,
        },
        { status: 400 },
      );
    }

    const { productId, quantity } = result.data;

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
    });

    if (!product) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    if (quantity > product.stock) {
      return Response.json(
        { error: "Not enough stock available" },
        { status: 409 },
      );
    }

    let cart = await prisma.cart.findUnique({
      where: {
        userId: user.id,
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: user.id,
        },
      });
    }

    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
      },
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;

      if (newQuantity > product.stock) {
        return Response.json(
          { error: "Not enough stock available" },
          { status: 400 },
        );
      }

      const updatedItem = await prisma.cartItem.update({
        where: {
          id: existingItem.id,
        },
        data: {
          quantity: newQuantity,
        },
        include: {
          product: true,
        },
      });

      return Response.json(updatedItem);
    }

    const cartItem = await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        quantity,
      },
      include: {
        product: true,
      },
    });

    return Response.json(cartItem, { status: 201 });
  } catch (error) {
    console.error("Add to cart error:", error);

    return Response.json(
      { error: "Failed to add item to cart" },
      { status: 500 },
    );
  }
}
