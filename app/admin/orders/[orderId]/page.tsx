import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/admin";
import { redirect } from "next/navigation";

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

  if (!Number.isInteger(id)) {
    notFound();
  }

  const order = await prisma.order.findUnique({
    where: {
      id,
    },
    include: {
      user: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  return (
    <div className="p-8">
      <Link
        href="/admin/orders"
        className="mb-6 inline-block text-sm text-gray-500 dark:text-gray-400 hover:text-black"
      >
        ← Back to orders
      </Link>

      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row">
        <div>
          <h1 className="text-3xl font-bold">Order #{order.id}</h1>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Placed{" "}
            {order.createdAt.toLocaleDateString("en-NG", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <div className="rounded-lg border bg-white dark:bg-gray-900 px-5 py-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Payment</p>

          <p
            className={`mt-1 font-semibold ${
              order.paymentStatus === "PAID"
                ? "text-green-600"
                : "text-yellow-600"
            }`}
          >
            {order.paymentStatus}
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <section className="space-y-8 lg:col-span-2">
          {/* Order status */}
          <div className="rounded-lg border bg-white dark:bg-gray-900 p-6">
            <h2 className="mb-6 text-xl font-semibold">Order Status</h2>

            <StatusUpdater
              orderId={order.id}
              currentStatus={order.status}
              paymentStatus={order.paymentStatus}
            />
          </div>

          {/* Items */}
          <div className="rounded-lg border bg-white dark:bg-gray-900 p-6">
            <h2 className="mb-6 text-xl font-semibold">Items</h2>

            <div className="space-y-5">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between gap-4 border-b pb-5 last:border-b-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">{item.productName}</p>

                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      ₦{item.price.toLocaleString()} × {item.quantity}
                    </p>
                  </div>

                  <p className="font-semibold">
                    ₦{(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Customer information */}
        <aside className="h-fit space-y-6">
          <div className="rounded-lg border bg-white dark:bg-gray-900 p-6">
            <h2 className="mb-5 text-xl font-semibold">Customer</h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                <p className="font-medium">{order.fullName}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                <p className="break-all font-medium">{order.user.email}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                <p className="font-medium">{order.phone}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-white dark:bg-gray-900 p-6">
            <h2 className="mb-5 text-xl font-semibold">Delivery</h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Address</p>
                <p className="font-medium">{order.address}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                <p className="font-medium">
                  {order.city}, {order.state}, {order.country}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Delivery method</p>
                <p className="font-medium capitalize">{order.deliveryMethod}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-white dark:bg-gray-900 p-6">
            <h2 className="mb-5 text-xl font-semibold">Order Summary</h2>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Subtotal</span>

                <span>₦{order.subtotal.toLocaleString()}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Delivery</span>

                <span>
                  {order.deliveryFee === 0
                    ? "Free"
                    : `₦${order.deliveryFee.toLocaleString()}`}
                </span>
              </div>

              <div className="flex justify-between border-t pt-4 text-lg font-bold">
                <span>Total</span>

                <span>₦{order.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
