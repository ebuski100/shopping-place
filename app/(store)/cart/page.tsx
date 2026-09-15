import Link from "next/link";
import { ArrowLeft, ShoppingBag } from "lucide-react";

import CartClient from "@/components/CartClient";
import MoreToLove from "@/components/MoreToLove";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export default async function CartPage() {
  const user = await getCurrentUser();

  let cart = null;

  if (user) {
    cart = await prisma.cart.findUnique({
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

    // Create a cart for the user if one doesn't exist
    if (!cart) {
      cart = await prisma.cart.create({
        data: {
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
    }
  }

  const moreToLoveProducts = await prisma.product.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 32,
  });

  return (
    <main className="min-h-screen  bg-gray-50 dark:bg-gray-950 pb-24">
      <header className=" sticky bg-white dark:bg-gray-900 top-0 left-0 shadow-sm border-b border-gray-200 dark:border-gray-800 z-99 mb-5">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 transition hover:bg-gray-50 dark:hover:bg-gray-800"
            aria-label="Back to shopping"
          >
            <ArrowLeft size={20} />
          </Link>

          <div className="flex items-center gap-3 ">
            <div>
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-green-700 sm:text-2xl mr-[3px]">
                  Your Cart
                </h1>
                <ShoppingBag size={20} className="text-gray-700 dark:text-gray-200" />
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                Review your items before checkout
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <CartClient initialCart={cart} isAuthenticated={!!user} />

        <div className="mt-8">
          <MoreToLove products={moreToLoveProducts} excludeWishlisted={false} />
        </div>
      </section>
    </main>
  );
}
