import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import type { PaystackVerifyResponse } from "@/lib/types/paystack";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // --------------------------------------------------
    // 2. Check Paystack configuration
    // --------------------------------------------------

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

    // --------------------------------------------------
    // 3. Get payment reference
    // --------------------------------------------------

    const { searchParams } = new URL(request.url);

    const reference = searchParams.get("reference")?.trim();

    if (!reference) {
      return Response.json(
        {
          error: "Payment reference is required",
        },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // 4. Find the order belonging to this user
    // --------------------------------------------------

    const order = await prisma.order.findFirst({
      where: {
        payStackReference: reference,
        userId: user.id,
      },

      select: {
        id: true,
        total: true,
        status: true,
        paymentStatus: true,
        payStackReference: true,
      },
    });

    if (!order) {
      return Response.json(
        {
          error: "Order not found",
        },
        { status: 404 },
      );
    }

    // --------------------------------------------------
    // 5. Verify transaction with Paystack
    // --------------------------------------------------

    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(
        reference,
      )}`,
      {
        method: "GET",

        headers: {
          Authorization: `Bearer ${secretKey}`,
        },

        cache: "no-store",
      },
    );

    // --------------------------------------------------
    // 6. Parse Paystack response
    // --------------------------------------------------

    let data: PaystackVerifyResponse;

    try {
      data = (await response.json()) as PaystackVerifyResponse;
    } catch {
      console.error("Paystack returned an invalid verification response");

      return Response.json(
        {
          error: "Unable to verify payment",
        },
        { status: 502 },
      );
    }

    // --------------------------------------------------
    // 7. Handle Paystack failure
    // --------------------------------------------------

    if (!response.ok || !data.status) {
      console.error("Paystack verification failed:", {
        status: response.status,
        data,
      });

      return Response.json(
        {
          error: "Unable to verify payment",
        },
        { status: 502 },
      );
    }

    // --------------------------------------------------
    // 8. Make sure transaction data exists
    // --------------------------------------------------

    const transaction = data.data;

    if (!transaction) {
      console.error("Paystack verification response missing transaction data");

      return Response.json(
        {
          error: "Invalid payment verification response",
        },
        { status: 502 },
      );
    }

    // --------------------------------------------------
    // 9. Verify reference
    // --------------------------------------------------

    if (transaction.reference !== order.payStackReference) {
      console.error("Payment reference mismatch:", {
        orderId: order.id,
        expected: order.payStackReference,
        received: transaction.reference,
      });

      return Response.json(
        {
          error: "Payment reference mismatch",
        },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // 10. Verify amount
    // --------------------------------------------------

    const expectedAmount = Math.round(order.total * 100);

    if (
      typeof transaction.amount !== "number" ||
      transaction.amount !== expectedAmount
    ) {
      console.error("Payment amount mismatch:", {
        orderId: order.id,
        expectedAmount,
        receivedAmount: transaction.amount,
      });

      return Response.json(
        {
          error: "Payment amount mismatch",
        },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // 11. Return Paystack transaction status
    // --------------------------------------------------
    //
    // IMPORTANT:
    //
    // This endpoint does NOT mark the order as paid.
    //
    // The webhook is responsible for updating the
    // database.
    // --------------------------------------------------

    if (transaction.status !== "success") {
      return Response.json({
        success: false,

        paymentStatus: transaction.status,

        orderStatus: order.status,

        orderPaymentStatus: order.paymentStatus,

        message:
          transaction.gateway_response ||
          data.message ||
          "Payment was not successful",

        orderId: order.id,
      });
    }

    // --------------------------------------------------
    // 12. Paystack says payment succeeded
    // --------------------------------------------------

    return Response.json({
      success: true,

      paymentStatus: transaction.status,

      orderStatus: order.status,

      orderPaymentStatus: order.paymentStatus,

      orderId: order.id,

      reference: transaction.reference,
    });
  } catch (error) {
    console.error("Payment verification error:", error);

    return Response.json(
      {
        error: "Failed to verify payment",
      },
      { status: 500 },
    );
  }
}
