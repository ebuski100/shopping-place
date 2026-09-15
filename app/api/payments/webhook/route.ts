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
    // 10. Validate amount
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
        userId: true,
        total: true,
        status: true,
        paymentStatus: true,
        reservationExpiresAt: true,
        payStackReference: true,
      },
    });

    // ------------------------------------------
    // 12. Unknown reference
    // ------------------------------------------

    if (!order) {
      console.error(`No order found for Paystack reference: ${reference}`);

      // We return 200 so Paystack does not
      // repeatedly retry an unknown event.
      return Response.json({
        received: true,
      });
    }

    // ------------------------------------------
    // 13. Idempotency
    // ------------------------------------------
    // If Paystack sends the same webhook again,
    // don't process the payment twice.

    if (order.paymentStatus === "PAID") {
      return Response.json({
        received: true,
      });
    }

    // ------------------------------------------
    // 14. Verify the amount
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
    // 15. Check reservation expiry
    // ------------------------------------------

    const now = new Date();

    if (order.reservationExpiresAt && order.reservationExpiresAt <= now) {
      console.error(
        `Payment arrived after reservation expired for order #${order.id}`,
      );

      return Response.json({
        received: true,
      });
    }

    // ------------------------------------------
    // 16. Confirm payment atomically
    // ------------------------------------------
    //
    // Only an order that is still:
    //
    // PENDING + PENDING + reservation not expired
    //
    // can become:
    //
    // CONFIRMED + PAID
    //
    // This prevents the webhook from confirming
    // an order that the expiration worker already
    // cancelled.

    const paymentUpdate = await prisma.order.updateMany({
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

    // ------------------------------------------
    // 17. Handle race condition / duplicate
    // ------------------------------------------

    if (paymentUpdate.count !== 1) {
      return Response.json({
        received: true,
      });
    }

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

    // ------------------------------------------
    // 18. Success
    // ------------------------------------------

    console.log(`Payment confirmed for order #${order.id}`);

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
