import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference");

  if (!reference) {
    redirect("/checkout?payment=failed");
  }

  let orderId: number | null = null;

  try {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      console.error("PAYSTACK_SECRET_KEY is not configured");

      throw new Error("Payment service is not configured");
    }

    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(
        reference,
      )}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      },
    );

    const data = await response.json();

    if (!response.ok || !data.status) {
      console.error("Paystack verification failed:", data);

      throw new Error("Paystack verification failed");
    }

    const transaction = data.data;

    if (transaction.status !== "success") {
      throw new Error("Payment was not successful");
    }

    const order = await prisma.order.findUnique({
      where: {
        payStackReference: reference,
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    orderId = order.id;

    const expectedAmount = Math.round(order.total * 100);

    if (transaction.amount !== expectedAmount) {
      console.error("Payment amount mismatch", {
        orderId: order.id,
        reference,
        expectedAmount,
        receivedAmount: transaction.amount,
      });

      throw new Error("Payment amount mismatch");
    }
  } catch (error) {
    console.error("Payment callback error:", error);

    redirect("/checkout?payment=failed");
  }

  // Redirect only AFTER the try/catch has completed.
  redirect(`/orders/${orderId}`);
}
