import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { OrderStatus } from "@/lib/generated/prisma/client";
import {
  createOrderNotification,
  createDeliveryNotification,
} from "@/lib/notifications";

const validStatuses: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
];

const fulfillmentStatuses: OrderStatus[] = [
  OrderStatus.CONFIRMED,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.DELIVERED,
];

const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: OrderStatus.CONFIRMED,
  CONFIRMED: OrderStatus.PROCESSING,
  PROCESSING: OrderStatus.SHIPPED,
  SHIPPED: OrderStatus.OUT_FOR_DELIVERY,
  OUT_FOR_DELIVERY: OrderStatus.DELIVERED,
};

type RouteContext = {
  params: Promise<{
    orderId: string;
  }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    // --------------------------------------------------
    // 1. Authenticate admin
    // --------------------------------------------------

    const user = await getCurrentUser();

    if (!user) {
      return Response.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    if (user.role !== "ADMIN") {
      return Response.json(
        {
          error: "Forbidden",
        },
        {
          status: 403,
        },
      );
    }

    // --------------------------------------------------
    // 2. Validate order ID
    // --------------------------------------------------

    const { orderId } = await params;

    const id = Number(orderId);

    if (!Number.isInteger(id) || id <= 0) {
      return Response.json(
        {
          error: "Invalid order ID",
        },
        {
          status: 400,
        },
      );
    }

    // --------------------------------------------------
    // 3. Parse request body
    // --------------------------------------------------

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return Response.json(
        {
          error: "Invalid JSON body",
        },
        {
          status: 400,
        },
      );
    }

    if (typeof body !== "object" || body === null || !("status" in body)) {
      return Response.json(
        {
          error: "Order status is required",
        },
        {
          status: 400,
        },
      );
    }

    const requestedStatus = body.status;

    if (
      typeof requestedStatus !== "string" ||
      !validStatuses.includes(requestedStatus as OrderStatus)
    ) {
      return Response.json(
        {
          error: "Invalid order status",
        },
        {
          status: 400,
        },
      );
    }

    const newStatus = requestedStatus as OrderStatus;

    // --------------------------------------------------
    // 4. Atomic status update
    // --------------------------------------------------

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: {
          id,
        },

        include: {
          items: true,
        },
      });

      if (!order) {
        throw new Error("ORDER_NOT_FOUND");
      }

      // ----------------------------------------------
      // Same status
      // ----------------------------------------------

      if (order.status === newStatus) {
        return order;
      }

      // ----------------------------------------------
      // Terminal states
      // ----------------------------------------------

      if (order.status === OrderStatus.CANCELLED) {
        throw new Error("CANCELLED_ORDER");
      }

      if (order.status === OrderStatus.DELIVERED) {
        throw new Error("DELIVERED_ORDER");
      }

      // ----------------------------------------------
      // Payment protection
      // ----------------------------------------------

      if (
        fulfillmentStatuses.includes(newStatus) &&
        order.paymentStatus !== "PAID"
      ) {
        throw new Error("PAYMENT_REQUIRED");
      }

      if (newStatus === OrderStatus.CANCELLED) {
        if (
          order.status !== OrderStatus.PENDING &&
          order.status !== OrderStatus.CONFIRMED
        ) {
          throw new Error("CANCELLATION_NOT_ALLOWED");
        }

        for (const item of order.items) {
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

          await tx.inventoryTransaction.create({
            data: {
              productId: item.productId,
              quantity: item.quantity,
              type: "RETURN",
              reason: `Cancelled order #${order.id}`,
            },
          });
        }

        return tx.order.update({
          where: {
            id,
          },

          data: {
            status: OrderStatus.CANCELLED,

            // Reservation no longer needs to remain
            // active after cancellation.
            reservationExpiresAt: null,
          },

          include: {
            items: true,
          },
        });
      }

      // ----------------------------------------------
      // Normal fulfillment transition
      // ----------------------------------------------

      const expectedNextStatus = nextStatus[order.status];

      if (expectedNextStatus !== newStatus) {
        throw new Error("INVALID_STATUS_TRANSITION");
      }

      // ----------------------------------------------
      // Update order
      // ----------------------------------------------

      return tx.order.update({
        where: {
          id,
        },

        data: {
          status: newStatus,

          // Once the order enters fulfillment,
          // the reservation is no longer needed.
          reservationExpiresAt:
            newStatus === OrderStatus.CONFIRMED
              ? null
              : order.reservationExpiresAt,
        },

        include: {
          items: true,
        },
      });
    });

    // return Response.json({
    //   message: "Order status updated successfully",

    //   order: updatedOrder,
    // });

    // --------------------------------------------------
    // 5. Create customer notification
    // --------------------------------------------------

    try {
      switch (updatedOrder.status) {
        case OrderStatus.PROCESSING:
          await createOrderNotification(
            updatedOrder.userId,
            "Order is being processed",
            `Your order #${updatedOrder.id} is now being processed.`,
            updatedOrder.id,
          );
          break;

        case OrderStatus.SHIPPED:
          await createDeliveryNotification(
            updatedOrder.userId,
            "Your order has shipped",
            `Your order #${updatedOrder.id} has been shipped and is on its way.`,
            updatedOrder.id,
          );
          break;

        case OrderStatus.OUT_FOR_DELIVERY:
          await createDeliveryNotification(
            updatedOrder.userId,
            "Your order is out for delivery",
            `Your order #${updatedOrder.id} is out for delivery.`,
            updatedOrder.id,
          );
          break;

        case OrderStatus.DELIVERED:
          await createDeliveryNotification(
            updatedOrder.userId,
            "Order delivered",
            `Your order #${updatedOrder.id} has been delivered.`,
            updatedOrder.id,
          );
          break;

        case OrderStatus.CANCELLED:
          await createOrderNotification(
            updatedOrder.userId,
            "Order cancelled",
            `Your order #${updatedOrder.id} has been cancelled.`,
            updatedOrder.id,
          );
          break;
      }
    } catch (error) {
      console.error("Failed to create order notification:", error);
    }

    return Response.json({
      message: "Order status updated successfully",

      order: updatedOrder,
    });
  } catch (error) {
    console.error("Admin order status update error:", error);

    if (error instanceof Error) {
      switch (error.message) {
        case "ORDER_NOT_FOUND":
          return Response.json(
            {
              error: "Order not found",
            },
            {
              status: 404,
            },
          );

        case "CANCELLED_ORDER":
          return Response.json(
            {
              error: "A cancelled order cannot be updated.",
            },
            {
              status: 400,
            },
          );

        case "DELIVERED_ORDER":
          return Response.json(
            {
              error: "A delivered order cannot be updated.",
            },
            {
              status: 400,
            },
          );

        case "PAYMENT_REQUIRED":
          return Response.json(
            {
              error:
                "Payment must be confirmed before fulfillment can continue.",
            },
            {
              status: 400,
            },
          );

        case "CANCELLATION_NOT_ALLOWED":
          return Response.json(
            {
              error:
                "This order can no longer be cancelled. Use the return/refund workflow instead.",
            },
            {
              status: 400,
            },
          );

        case "INVALID_STATUS_TRANSITION":
          return Response.json(
            {
              error: "Invalid order status transition.",
            },
            {
              status: 400,
            },
          );
      }
    }

    return Response.json(
      {
        error: "Failed to update order status",
      },
      {
        status: 500,
      },
    );
  }
}
