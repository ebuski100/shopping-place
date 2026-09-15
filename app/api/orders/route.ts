import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { checkoutSchema } from "@/lib/validations/checkout";
import { deliveryOptions } from "@/lib/delivery";

export async function POST(request: Request) {
  try {
    // --------------------------------------------------
    // 1. Authenticate user
    // --------------------------------------------------

    const user = await getCurrentUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // --------------------------------------------------
    // 2. Parse request body
    // --------------------------------------------------

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // --------------------------------------------------
    // 3. Validate checkout information
    // --------------------------------------------------

    const result = checkoutSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        {
          error: result.error.issues[0].message,
        },
        { status: 400 },
      );
    }

    const { fullName, phone, address, city, state, country, deliveryMethod } =
      result.data;

    // --------------------------------------------------
    // 4. Validate delivery method
    // --------------------------------------------------

    const selectedDelivery = deliveryOptions.find(
      (option) => option.id === deliveryMethod,
    );

    if (!selectedDelivery) {
      return Response.json(
        {
          error: "Invalid delivery method",
        },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // 5. Get user's cart
    // --------------------------------------------------

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

    if (!cart || cart.items.length === 0) {
      return Response.json(
        {
          error: "Your cart is empty",
        },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // 6. Check products before creating order
    // --------------------------------------------------

    for (const item of cart.items) {
      if (!item.product.isActive) {
        return Response.json(
          {
            error: `"${item.product.name}" is no longer available.`,
          },
          { status: 409 },
        );
      }

      if (item.quantity <= 0) {
        return Response.json(
          {
            error: "Invalid cart quantity",
          },
          { status: 400 },
        );
      }
    }

    // --------------------------------------------------
    // 7. Calculate totals on the server
    // --------------------------------------------------

    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );

    const deliveryFee = selectedDelivery.price;

    const total = subtotal + deliveryFee;

    // --------------------------------------------------
    // 8. Sort items consistently
    // --------------------------------------------------
    //
    // This gives concurrent transactions a consistent
    // lock/update order.
    //
    // Example:
    //
    // Order A: product 1 -> product 2
    // Order B: product 2 -> product 1
    //
    // Sorting both as:
    //
    // product 1 -> product 2
    //
    // reduces deadlock risk.
    // --------------------------------------------------

    const sortedItems = [...cart.items].sort(
      (a, b) => a.product.id - b.product.id,
    );

    // --------------------------------------------------
    // 9. Create order atomically
    // --------------------------------------------------

    const order = await prisma.$transaction(async (tx) => {
      // ----------------------------------------------
      // Decrease stock
      // ----------------------------------------------

      for (const item of sortedItems) {
        const updatedProduct = await tx.product.updateMany({
          where: {
            id: item.product.id,
            isActive: true,
            stock: {
              gte: item.quantity,
            },
          },

          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });

        if (updatedProduct.count !== 1) {
          throw new Error(`INSUFFICIENT_STOCK:${item.product.name}`);
        }
      }

      // ----------------------------------------------
      // Estimated delivery
      // ----------------------------------------------

      const estimatedDeliveryAt = new Date();

      estimatedDeliveryAt.setDate(
        estimatedDeliveryAt.getDate() + selectedDelivery.maxDays,
      );

      // ----------------------------------------------
      // Create order
      // ----------------------------------------------
      const reservationExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
      const newOrder = await tx.order.create({
        data: {
          userId: user.id,

          status: "PENDING",

          paymentStatus: "PENDING",

          subtotal,

          deliveryFee,

          total,

          deliveryMethod,

          estimatedDeliveryAt,

          fullName,

          phone,

          address,

          city,

          state,

          country,

          reservationExpiresAt,

          items: {
            create: cart.items.map((item) => ({
              productId: item.product.id,

              productName: item.product.name,

              price: item.product.price,

              quantity: item.quantity,
            })),
          },
        },

        include: {
          items: true,
        },
      });

      // ----------------------------------------------
      // Inventory history
      // ----------------------------------------------

      for (const item of sortedItems) {
        await tx.inventoryTransaction.create({
          data: {
            productId: item.product.id,

            quantity: -item.quantity,

            type: "ORDER",

            reason: `Order #${newOrder.id}`,
          },
        });
      }

      // ----------------------------------------------
      // Clear cart
      // ----------------------------------------------

      await tx.cartItem.deleteMany({
        where: {
          cartId: cart.id,
        },
      });

      return newOrder;
    });

    // --------------------------------------------------
    // 10. Return successful response
    // --------------------------------------------------

    return Response.json(
      {
        message: "Order created successfully",

        order,
      },
      { status: 201 },
    );
  } catch (error) {
    // --------------------------------------------------
    // Insufficient stock
    // --------------------------------------------------

    if (
      error instanceof Error &&
      error.message.startsWith("INSUFFICIENT_STOCK:")
    ) {
      const productName = error.message.replace("INSUFFICIENT_STOCK:", "");

      return Response.json(
        {
          error: `Insufficient stock for "${productName}".`,
        },
        { status: 409 },
      );
    }

    // --------------------------------------------------
    // Unexpected error
    // --------------------------------------------------

    console.error("Create order error:", error);

    return Response.json(
      {
        error: "Failed to create order",
      },
      { status: 500 },
    );
  }
}
