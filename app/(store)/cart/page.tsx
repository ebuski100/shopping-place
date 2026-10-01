import Link from "next/link";
import { ArrowLeft, ShoppingBag } from "lucide-react";

import CartClient from "@/components/CartClient";
import MoreToLove from "@/components/MoreToLove";
import ProductRatingsLoader from "@/components/products/ProductRatingsLoader";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export default async function CartPage() {
  const user = await getCurrentUser();

  let cart = null;

  /*
   * Load the authenticated user's cart.
   */
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

    /*
     * Create a cart if the user doesn't
     * already have one.
     */
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

  /*
   * Recommended products.
   */
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
    <>
      {/* Product ratings are loaded once on the client */}
      <ProductRatingsLoader />

      <main className="min-h-screen bg-gray-50 pb-15 pt-20 dark:bg-gray-950">
        {/* Header */}
        <header className="fixed left-0 right-0 top-0 z-[99] border-b border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-5 sm:px-6 lg:px-8">
            {/* Back */}
            <Link
              href="/"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
              aria-label="Back to shopping"
            >
              <ArrowLeft size={20} />
            </Link>

            {/* Title */}
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-center">
                  <h1 className="mr-[3px] text-xl font-bold text-green-700 sm:text-2xl">
                    Your Cart
                  </h1>

                  <ShoppingBag
                    size={20}
                    className="text-gray-700 dark:text-gray-200"
                  />
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                  Review your items before checkout
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <CartClient initialCart={cart} isAuthenticated={Boolean(user)} />

          {/* Recommendations */}
          <div className="mt-8">
            <MoreToLove excludeWishlisted={false} title="Popular Products" />
          </div>
        </section>
      </main>
    </>
  );
}
