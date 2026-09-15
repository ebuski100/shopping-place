import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const mergeCartSchema = z.object({
  items: z.array(
    z.object({
      productId: z.number().int().positive(),
      quantity: z.number().int().positive(),
    }),
  ),
});

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

    const result = mergeCartSchema.safeParse(body);

    if (!result.success) {
      return Response.json({ error: "Invalid cart data" }, { status: 400 });
    }

    const { items } = result.data;

    // Find or create the user's cart
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

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: {
          id: item.productId,
        },
      });

      if (!product) {
        continue;
      }

      // Don't allow the guest cart to exceed available stock
      const quantity = Math.min(item.quantity, product.stock);

      if (quantity <= 0) {
        continue;
      }

      const existingItem = await prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId: item.productId,
        },
      });

      if (existingItem) {
        const newQuantity = Math.min(
          existingItem.quantity + quantity,
          product.stock,
        );

        await prisma.cartItem.update({
          where: {
            id: existingItem.id,
          },
          data: {
            quantity: newQuantity,
          },
        });
      } else {
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: item.productId,
            quantity,
          },
        });
      }
    }

    return Response.json({
      message: "Cart merged successfully",
    });
  } catch (error) {
    console.error("Merge cart error:", error);

    return Response.json({ error: "Failed to merge cart" }, { status: 500 });
  }
}
