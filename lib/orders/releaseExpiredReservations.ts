import { prisma } from "@/lib/prisma";
import { createOrderNotification } from "@/lib/notifications";
export async function releaseExpiredReservations() {
  const now = new Date();

  const expiredOrders = await prisma.order.findMany({
    where: {
      status: "PENDING",
      paymentStatus: "PENDING",
      reservationExpiresAt: {
        lte: now,
      },
    },
    select: {
      id: true,
      userId: true,
    },
  });

  let releasedCount = 0;

  for (const { id, userId } of expiredOrders) {
    try {
      const released = await prisma.$transaction(async (tx) => {
        /*
         * Atomically claim this order.
         *
         * Only an order that is still:
         *   PENDING
         *   PENDING payment
         *   expired
         *
         * can be changed to CANCELLED.
         */
        const claim = await tx.order.updateMany({
          where: {
            id,
            status: "PENDING",
            paymentStatus: "PENDING",
            reservationExpiresAt: {
              lte: now,
            },
          },
          data: {
            status: "CANCELLED",
          },
        });

        /*
         * Someone else already handled this order.
         */
        if (claim.count !== 1) {
          return false;
        }

        const orderItems = await tx.orderItem.findMany({
          where: {
            orderId: id,
          },
          select: {
            productId: true,
            quantity: true,
          },
        });

        /*
         * Restore every reserved product.
         */
        for (const item of orderItems) {
          await tx.product.update({
            where: {
              id: item.productId,
            },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });

          /*
           * Record the inventory movement.
           */
          await tx.inventoryTransaction.create({
            data: {
              productId: item.productId,
              quantity: item.quantity,
              type: "RETURN",
              reason: `Expired reservation released for order #${id}`,
            },
          });
        }

        return true;
      });

      if (released) {
        releasedCount++;

        try {
          await createOrderNotification(
            // We need the user's ID here
            userId,
            "Payment window expired",
            `Your payment window for order #${id} expired, so the order was cancelled and the reserved stock was released.`,
            id,
          );
        } catch (error) {
          console.error(
            `Failed to create expiry notification for order #${id}:`,
            error,
          );
        }
      }
    } catch (error) {
      console.error(`Failed to release reservation for order #${id}:`, error);
    }
  }

  return releasedCount;
}
