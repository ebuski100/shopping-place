import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

import CheckoutClient from "@/components/CheckoutClient";
export default async function CheckoutPage() {
  const user = await getCurrentUser();

  // Checkout requires authentication
  if (!user) {
    redirect("/login?redirect=/checkout");
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

  // No cart or empty cart
  if (!cart || cart.items.length === 0) {
    redirect("/cart");
  }

  

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl p-8">
      <h1 className="mb-8 text-3xl font-bold">Checkout</h1>

      <div className="grid gap-8 md:grid-cols-3">
        <CheckoutClient cart={cart} />
      </div>
    </main>
  );
}
