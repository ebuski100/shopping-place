import crypto from "crypto";

import { prisma } from "@/lib/prisma";
import { createOrderNotification } from "@/lib/notifications";

type PaystackWebhookTransaction = {
  reference: string;
  amount: number;
};

type PaystackWebhookPayload = {
  event: string;
  data?: PaystackWebhookTransaction;
};

function isPaystackWebhookPayload(
  value: unknown,
): value is PaystackWebhookPayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const payload = value as Record<string, unknown>;

  if (typeof payload.event !== "string") {
    return false;
  }

  if (payload.data === undefined) {
    return true;
  }

  if (typeof payload.data !== "object" || payload.data === null) {
    return false;
  }

  const data = payload.data as Record<string, unknown>;

  return (
    typeof data.reference === "string" &&
    typeof data.amount === "number" &&
    Number.isFinite(data.amount)
  );
}

export async function POST(request: Request) {
  try {
    // ------------------------------------------
    // 1. Get Paystack signature
    // ------------------------------------------

    const signature = request.headers.get("x-paystack-signature");

    if (!signature) {
      return Response.json({ error: "Missing signature" }, { status: 401 });
    }

    // ------------------------------------------
    // 2. Get Paystack secret key
    // ------------------------------------------

    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      console.error("PAYSTACK_SECRET_KEY is not configured");

      return Response.json(
        {
          error: "Payment service is not configured",
        },
        { status: 500 },
      );
    }

    // ------------------------------------------
    // 3. Read raw request body
    // ------------------------------------------

    const rawBody = await request.text();

    // ------------------------------------------
    // 4. Verify webhook signature
    // ------------------------------------------

    const expectedSignature = crypto
      .createHmac("sha512", secretKey)
      .update(rawBody)
      .digest("hex");

    const receivedBuffer = Buffer.from(signature, "utf8");
    const expectedBuffer = Buffer.from(expectedSignature, "utf8");

    if (
      receivedBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
    ) {
      console.error("Invalid Paystack webhook signature");

      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }

    // ------------------------------------------
    // 5. Parse JSON safely
    // ------------------------------------------

    let parsedPayload: unknown;

    try {
      parsedPayload = JSON.parse(rawBody);
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // ------------------------------------------
    // 6. Validate webhook payload
    // ------------------------------------------

    if (!isPaystackWebhookPayload(parsedPayload)) {
      return Response.json(
        {
          error: "Invalid webhook payload",
        },
        { status: 400 },
      );
    }

    const payload = parsedPayload;

    // ------------------------------------------
    // 7. Ignore events we don't handle
    // ------------------------------------------

    if (payload.event !== "charge.success") {
      return Response.json({
        received: true,
      });
    }

    // ------------------------------------------
    // 8. Get transaction
    // ------------------------------------------

    const transaction = payload.data;

    if (!transaction) {
      return Response.json(
        {
          error: "Invalid webhook payload",
        },
        { status: 400 },
      );
    }

    const reference = transaction.reference.trim();
    const amount = transaction.amount;

    // ------------------------------------------
    // 9. Validate reference
    // ------------------------------------------

    if (!reference) {
      return Response.json(
        {
          error: "Invalid payment reference",
        },
        { status: 400 },
      );
    }

    // ------------------------------------------
    // 10. Validate payment amount
    // ------------------------------------------

    if (!Number.isFinite(amount) || amount < 0) {
      return Response.json(
        {
          error: "Invalid payment amount",
        },
        { status: 400 },
      );
    }

    // ------------------------------------------
    // 11. Find the order
    // ------------------------------------------

    const order = await prisma.order.findUnique({
      where: {
        payStackReference: reference,
      },
      select: {
        id: true,
        payStackReference: true,
        userId: true,
        status: true,
        paymentStatus: true,
        total: true,
        reservationExpiresAt: true,
        items: {
          select: {
            productId: true,
            quantity: true,
          },
        },
      },
    });

    // ------------------------------------------
    // 12. Unknown reference
    // ------------------------------------------

    if (!order) {
      console.error(`No order found for Paystack reference: ${reference}`);

      return Response.json({
        received: true,
      });
    }

    // ------------------------------------------
    // 13. Verify the payment amount
    // ------------------------------------------

    const expectedAmount = Math.round(order.total * 100);

    if (amount !== expectedAmount) {
      console.error("Paystack payment amount mismatch:", {
        orderId: order.id,
        expectedAmount,
        receivedAmount: amount,
        reference,
      });

      return Response.json(
        {
          error: "Payment amount mismatch",
        },
        { status: 400 },
      );
    }

    // ------------------------------------------
    // 14. Check reservation expiry
    // ------------------------------------------

    const now = new Date();

    // A payment for an already-confirmed/paid order
    // does not need another reservation check.
    //
    // A still-pending order must have an active
    // reservation before it can be confirmed.
    if (
      order.paymentStatus === "PENDING" &&
      order.reservationExpiresAt &&
      order.reservationExpiresAt <= now
    ) {
      console.error(
        `Payment arrived after reservation expired for order #${order.id}`,
      );

      return Response.json({
        received: true,
      });
    }

    // ------------------------------------------
    // 15. Confirm payment and synchronize cart
    // ------------------------------------------
    //
    // There are two possible situations:
    //
    // A. The order is still PENDING.
    //    We atomically confirm it and then update
    //    the cart.
    //
    // B. The order is already PAID.
    //    Another webhook/process already confirmed
    //    it, so we don't confirm it again.
    //    We still synchronize the cart because the
    //    previous process may not have done so.
    //
    // This makes repeated webhook delivery safe.
    // ------------------------------------------

    const result = await prisma.$transaction(async (tx) => {
      let newlyConfirmed = false;

      if (order.paymentStatus === "PENDING") {
        const paymentUpdate = await tx.order.updateMany({
          where: {
            id: order.id,
            status: "PENDING",
            paymentStatus: "PENDING",
            reservationExpiresAt: {
              gt: now,
            },
          },
          data: {
            paymentStatus: "PAID",
            status: "CONFIRMED",
            paidAt: now,
          },
        });

        // Another process handled the order between
        // our initial read and this transaction.
        if (paymentUpdate.count === 0) {
          const currentOrder = await tx.order.findUnique({
            where: {
              id: order.id,
            },
            select: {
              paymentStatus: true,
            },
          });

          // If another process already paid the order,
          // continue with cart synchronization.
          if (currentOrder?.paymentStatus !== "PAID") {
            return {
              newlyConfirmed: false,
              cartSynchronized: false,
            };
          }
        } else {
          newlyConfirmed = true;
        }
      }

      // ------------------------------------------
      // Synchronize the cart
      // ------------------------------------------
      //
      // Remove only the quantities purchased.
      //
      // Example:
      //
      // Checkout quantity: 2
      // Current cart quantity: 3
      //
      // Result:
      // Cart quantity becomes 1.
      //
      // This means extra quantity added after checkout
      // is preserved.
      // ------------------------------------------

      if (order.userId !== null) {
        const cart = await tx.cart.findUnique({
          where: {
            userId: order.userId,
          },
          select: {
            id: true,
          },
        });

        if (cart) {
          for (const item of order.items) {
            const removed = await tx.cartItem.deleteMany({
              where: {
                cartId: cart.id,
                productId: item.productId,
                quantity: {
                  lte: item.quantity,
                },
              },
            });

            if (removed.count === 0) {
              await tx.cartItem.updateMany({
                where: {
                  cartId: cart.id,
                  productId: item.productId,
                  quantity: {
                    gt: item.quantity,
                  },
                },
                data: {
                  quantity: {
                    decrement: item.quantity,
                  },
                },
              });
            }
          }
        }
      }

      return {
        newlyConfirmed,
        cartSynchronized: true,
      };
    });

    // ------------------------------------------
    // 16. Another process handled the order
    // ------------------------------------------

    if (!result.cartSynchronized) {
      return Response.json({
        received: true,
      });
    }

    // ------------------------------------------
    // 17. Create notification only when this
    //     webhook actually confirmed the payment.
    // ------------------------------------------

    if (result.newlyConfirmed && order.userId !== null) {
      try {
        await createOrderNotification(
          order.userId,
          "Payment confirmed",
          `Your payment for order #${order.id} has been confirmed.`,
          order.id,
        );
      } catch (error) {
        console.error("Failed to create payment notification:", error);
      }
    }

    // ------------------------------------------
    // 18. Success
    // ------------------------------------------

    console.log(
      `Payment processed for order #${order.id}. ` +
        `Newly confirmed: ${result.newlyConfirmed}. ` +
        `Cart synchronized: ${result.cartSynchronized}.`,
    );

    return Response.json({
      received: true,
    });
  } catch (error) {
    console.error("Paystack webhook error:", error);

    return Response.json(
      {
        error: "Webhook processing failed",
      },
      { status: 500 },
    );
  }
}
