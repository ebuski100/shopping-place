import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/admin";

import StatusUpdater from "./StatusUpdater";

type AdminOrderPageProps = {
  params: Promise<{
    orderId: string;
  }>;
};

export default async function AdminOrderPage({ params }: AdminOrderPageProps) {
  const admin = await requireAdminPage();

  if (!admin) {
    redirect("/login?redirect=/admin/orders");
  }

  const { orderId } = await params;
  const id = Number(orderId);

  if (!Number.isInteger(id) || id <= 0) {
    notFound();
  }

  const order = await prisma.order.findUnique({
    where: {
      id,
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      items: {
        select: {
          id: true,
          productName: true,
          price: true,
          quantity: true,
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  // Preserve the order and its stored delivery details if the customer
  // has deleted their account.
  const customerName = order.user?.name ?? order.fullName;
  const customerEmail = order.user?.email ?? "Account deleted";

  return (
    <main className="min-h-screen bg-gray-50 p-4 text-gray-900 dark:bg-gray-950 dark:text-white sm:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-7xl">
        <Link
          href="/admin/orders"
          className="mb-6 inline-block text-sm text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white"
        >
          ← Back to orders
        </Link>

        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">
              Order #{order.id}
            </h1>

            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Placed{" "}
              {order.createdAt.toLocaleDateString("en-NG", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="w-fit rounded-lg border border-gray-200 bg-white px-5 py-3 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs text-gray-500 dark:text-gray-400">Payment</p>

            <p
              className={`mt-1 font-semibold ${
                order.paymentStatus === "PAID"
                  ? "text-green-600 dark:text-green-400"
                  : order.paymentStatus === "FAILED"
                    ? "text-red-600 dark:text-red-400"
                    : "text-yellow-600 dark:text-yellow-400"
              }`}
            >
              {order.paymentStatus}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3 lg:gap-8">
          {/* Left column */}
          <section className="min-w-0 space-y-6 lg:col-span-2">
            {/* Order status */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 sm:p-6">
              <h2 className="mb-6 text-lg font-semibold sm:text-xl">
                Order Status
              </h2>

              <StatusUpdater
                orderId={order.id}
                currentStatus={order.status}
                paymentStatus={order.paymentStatus}
              />
            </div>

            {/* Items */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 sm:p-6">
              <h2 className="mb-6 text-lg font-semibold sm:text-xl">Items</h2>

              {order.items.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No items recorded for this order.
                </p>
              ) : (
                <div className="space-y-5">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between gap-4 border-b border-gray-100 pb-5 last:border-b-0 last:pb-0 dark:border-gray-800"
                    >
                      <div className="min-w-0">
                        <p className="break-words font-medium">
                          {item.productName}
                        </p>

                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          ₦{item.price.toLocaleString("en-NG")} ×{" "}
                          {item.quantity}
                        </p>
                      </div>

                      <p className="shrink-0 font-semibold">
                        ₦{(item.price * item.quantity).toLocaleString("en-NG")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Right column */}
          <aside className="min-w-0 space-y-6">
            {/* Customer information */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 sm:p-6">
              <h2 className="mb-5 text-lg font-semibold sm:text-xl">
                Customer
              </h2>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Name
                  </p>

                  <p className="break-words font-medium">{customerName}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Email
                  </p>

                  <p className="break-all font-medium">{customerEmail}</p>

                  {!order.user && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      The customer account associated with this order has been
                      deleted.
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Phone
                  </p>

                  <p className="break-words font-medium">{order.phone}</p>
                </div>
              </div>
            </div>

            {/* Delivery */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 sm:p-6">
              <h2 className="mb-5 text-lg font-semibold sm:text-xl">
                Delivery
              </h2>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Address
                  </p>

                  <p className="break-words font-medium">{order.address}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Location
                  </p>

                  <p className="break-words font-medium">
                    {order.city}, {order.state}, {order.country}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Delivery method
                  </p>

                  <p className="font-medium capitalize">
                    {order.deliveryMethod}
                  </p>
                </div>
              </div>
            </div>

            {/* Order summary */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 sm:p-6">
              <h2 className="mb-5 text-lg font-semibold sm:text-xl">
                Order Summary
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    Subtotal
                  </span>

                  <span className="text-right">
                    ₦{order.subtotal.toLocaleString("en-NG")}
                  </span>
                </div>

                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    Delivery
                  </span>

                  <span className="text-right">
                    {order.deliveryFee === 0
                      ? "Free"
                      : `₦${order.deliveryFee.toLocaleString("en-NG")}`}
                  </span>
                </div>

                <div className="flex justify-between gap-4 border-t border-gray-200 pt-4 text-lg font-bold dark:border-gray-800">
                  <span>Total</span>

                  <span className="text-right">
                    ₦{order.total.toLocaleString("en-NG")}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
