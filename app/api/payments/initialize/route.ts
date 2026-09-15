import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { initializePaymentSchema } from "@/lib/validations/payment";
import type { PaystackInitializeResponse } from "@/lib/types/paystack";

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
    // 3. Validate request body
    // --------------------------------------------------

    const result = initializePaymentSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        {
          error: result.error.issues[0].message,
        },
        { status: 400 },
      );
    }

    const { orderId } = result.data;

    // --------------------------------------------------
    // 4. Find the order belonging to this user
    // --------------------------------------------------

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: user.id,
      },
    });

    if (!order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    // --------------------------------------------------
    // 5. Make sure payment is still pending
    // --------------------------------------------------

    if (order.paymentStatus !== "PENDING") {
      return Response.json(
        {
          error: "This order cannot be paid for",
        },
        { status: 409 },
      );
    }

    // --------------------------------------------------
    // 6. Make sure order has not been cancelled
    // --------------------------------------------------

    if (order.status === "CANCELLED") {
      return Response.json(
        {
          error: "This order has been cancelled",
        },
        { status: 409 },
      );
    }

    // --------------------------------------------------
    // 7. Check reservation expiry
    // --------------------------------------------------

    if (
      order.reservationExpiresAt &&
      order.reservationExpiresAt <= new Date()
    ) {
      return Response.json(
        {
          error: "This order has expired. Please create a new order.",
        },
        { status: 409 },
      );
    }

    // --------------------------------------------------
    // 8. Reuse existing Paystack initialization
    // --------------------------------------------------

    if (order.payStackReference && order.payStackAuthorizationUrl) {
      return Response.json({
        message: "Payment already initialized",
        authorizationUrl: order.payStackAuthorizationUrl,
        reference: order.payStackReference,
      });
    }

    // --------------------------------------------------
    // 9. Check Paystack configuration
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
    // 10. Convert NGN to kobo
    // --------------------------------------------------

    const amountInKobo = Math.round(order.total * 100);

    // --------------------------------------------------
    // 11. Generate Paystack reference
    // --------------------------------------------------

    const reference = `order_${order.id}_${Date.now()}`;

    // --------------------------------------------------
    // 12. Initialize payment with Paystack
    // --------------------------------------------------

    const response = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email: user.email,

          amount: amountInKobo,

          reference,

          callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/callback`,

          metadata: {
            orderId: order.id,
            userId: user.id,
          },
        }),
      },
    );

    // --------------------------------------------------
    // 13. Parse Paystack response
    // --------------------------------------------------

    let data: PaystackInitializeResponse;

    try {
      data = (await response.json()) as PaystackInitializeResponse;
    } catch {
      console.error("Paystack returned an invalid response");

      return Response.json(
        {
          error: "Unable to initialize payment",
        },
        { status: 502 },
      );
    }

    // --------------------------------------------------
    // 14. Validate Paystack response
    // --------------------------------------------------

    if (!response.ok || !data.status || !data.data) {
      console.error("Paystack initialization failed:", {
        status: response.status,
        data,
      });

      return Response.json(
        {
          error: "Unable to initialize payment",
        },
        { status: 502 },
      );
    }

    // --------------------------------------------------
    // 15. Extract Paystack payment data
    // --------------------------------------------------

    const payStackReference = data.data.reference;

    const authorizationUrl = data.data.authorization_url;

    const accessCode = data.data.access_code;

    // --------------------------------------------------
    // 16. Save Paystack information
    // --------------------------------------------------

    await prisma.order.update({
      where: {
        id: order.id,
      },

      data: {
        payStackReference,
        payStackAuthorizationUrl: authorizationUrl,
      },
    });

    // --------------------------------------------------
    // 17. Return payment information
    // --------------------------------------------------

    return Response.json({
      message: "Payment initialized",

      authorizationUrl,

      reference: payStackReference,

      accessCode,
    });
  } catch (error) {
    console.error("Payment initialization error:", error);

    return Response.json(
      {
        error: "Failed to initialize payment",
      },
      { status: 500 },
    );
  }
}
