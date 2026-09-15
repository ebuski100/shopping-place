import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import Footer from "@/components/Footer";
import GoBack from "@/components/GoBack";

function formatOrderStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default async function OrdersPage() {
  const user = await getCurrentUser();

  // Orders require authentication
  if (!user) {
    redirect("/login?redirect=/orders");
  }

  const orders = await prisma.order.findMany({
    where: {
      userId: user.id,
    },
    include: {
      items: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl p-8 pb-30">
      <div className="flex items-center mb-3 gap-2">
        <GoBack />
        <h1 className=" text-2xl font-bold text-gray-900 dark:text-white">
          My Orders
        </h1>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-lg border p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            You havent placed any orders yet.
          </p>

          <Link
            href="/"
            className="mt-4 inline-block rounded-md bg-black px-6 py-3 text-white"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const itemCount = order.items.reduce(
              (total, item) => total + item.quantity,
              0,
            );

            return (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm bg-gray-100 dark:bg-gray-800/30 p-6 transition hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row">
                  <div>
                    <p className="font-semibold">Order #{order.id}</p>

                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {order.createdAt.toLocaleDateString("en-NG", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>

                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      {itemCount} {itemCount === 1 ? "item" : "items"}
                    </p>
                  </div>

                  <div className="sm:text-right">
                    <p className="text-lg font-bold">
                      ₦{order.total.toLocaleString()}
                    </p>

                    <div className="mt-2 flex gap-2 sm:justify-end">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          order.paymentStatus === "PAID"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {order.paymentStatus}
                      </span>

                      <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-200">
                        {formatOrderStatus(order.status)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 border-t border-gray-600 pt-4 text-sm font-medium">
                  View Order →
                </div>
              </Link>
            );
          })}
        </div>
      )}
      <Footer />
    </main>
  );
}
