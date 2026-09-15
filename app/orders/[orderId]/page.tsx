import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import PayOrderButton from "./PayOrderButton";
type OrderPageProps = {
  params: Promise<{
    orderId: string;
  }>;
};

export default async function OrderPage({ params }: OrderPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirect=/orders");
  }

  // --------------------------------------------------
  // 2. Get order ID from URL
  // --------------------------------------------------

  const { orderId } = await params;

  const id = Number(orderId);

  if (!Number.isInteger(id)) {
    notFound();
  }

  console.log("ORDER DEBUG:", {
    orderId,
    id,
    userId: user.id,
  });
  const order = await prisma.order.findFirst({
    where: {
      id,
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

  console.log("ORDER FOUND:", order);

  if (!order) {
    notFound();
  }

  // --------------------------------------------------
  // 4. Calculate current status
  // --------------------------------------------------
  const currentStatus = order.status;

  // --------------------------------------------------
  // 5. Render
  // --------------------------------------------------

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl p-8">
      {/* Back */}
      <Link
        href="/orders"
        className="mb-6 inline-block text-sm text-gray-500 dark:text-gray-400 hover:text-gray-200"
      >
        ← Back to orders
      </Link>

      {/* Header */}
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

        {/* Status badges */}
        <div className="flex flex-wrap gap-2 ">
          <span
            className={`rounded-full px-3 md:rounded-3xl text-sm font-medium flex items-center ${
              order.paymentStatus === "PAID"
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            Payment: {order.paymentStatus}
          </span>

          <span className="rounded-full md:rounded-3xl flex items-center bg-gray-100 dark:bg-gray-800 px-3 py-1 text-sm font-medium">
            {formatStatus(currentStatus)}
          </span>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Main content */}
        <section className="space-y-8 md:col-span-2">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 overflow-hidden bg-gray-100 dark:bg-gray-800/30">
            <h2 className="mb-6 text-xl font-semibold text-green-500">Items</h2>

            {order.items.map((item) => (
              <div
                key={item.id}
                className="group flex gap-4 rounded-2xl border border-gray-100 bg-white dark:bg-gray-900 p-4 shadow-sm my-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5"
              >
                {/* Product image */}
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800 sm:h-28 sm:w-28">
                  <img
                    src={item.product.image}
                    alt={item.productName}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                {/* Product information */}
                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                      Order item
                    </p>

                    <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-gray-900 dark:text-white sm:text-base">
                      {item.productName}
                    </h3>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                    {/* Quantity */}
                    <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                      <span>Qty</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-100">
                        {item.quantity}
                      </span>
                    </div>

                    {/* Unit price */}
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      ₦{item.price.toLocaleString("en-NG")} each
                    </div>
                  </div>
                </div>

                {/* Total */}
                <div className="flex shrink-0  items-end ">
                  {/* <span className="text-xs text-gray-400 dark:text-gray-500">Total</span> */}

                  <p className="text-base font-bold text-gray-900 dark:text-white sm:text-lg">
                    ₦{(item.price * item.quantity).toLocaleString("en-NG")}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {/* Order Status */}

          <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800  shadow-sm bg-gray-100 dark:bg-gray-800/30">
            {/* Header */}
            <div className="border-b border-gray-100 px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-green-500">
                    Order Status
                  </h2>

                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    Track the progress of your order
                  </p>
                </div>

                {/* Current status badge */}
                <span className="hidden rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700 sm:inline-flex">
                  {currentStatus.replaceAll("_", " ")}
                </span>
              </div>
            </div>

            {/* Timeline */}
            <div className="px-6 py-8">
              <OrderTimeline status={order.status} />
            </div>

            {/* Payment confirmation */}
            {order.paymentStatus === "PAID" && order.paidAt && (
              <div className="mx-6 mb-6 flex items-center gap-4 rounded-xl bg-green-50 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100">
                  <svg
                    className="h-5 w-5 text-green-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>

                <div>
                  <p className="text-sm font-semibold text-green-800">
                    Payment confirmed
                  </p>

                  <p className="mt-0.5 text-sm text-green-700">
                    {order.paidAt.toLocaleString("en-NG", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Items */}

          {/* Delivery Information */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm bg-gray-100 dark:bg-gray-800/30 p-6">
            <h2 className="mb-6 text-xl font-semibold text-green-500">
              Delivery Information
            </h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Recipient
                </p>

                <p className="font-medium">{order.fullName}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Phone
                </p>

                <p className="font-medium">{order.phone}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Address
                </p>

                <p className="font-medium">{order.address}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Location
                </p>

                <p className="font-medium">
                  {order.city}, {order.state}, {order.country}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Delivery method
                </p>

                <p className="font-medium capitalize">{order.deliveryMethod}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Summary */}
        <aside className="h-fit rounded-lg border p-6 border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800/40 shadow-md">
          <h2 className="mb-6 text-xl font-semibold text-green-600">
            Order Summary
          </h2>

          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Subtotal</span>

              <span>₦{order.subtotal.toLocaleString()}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Delivery</span>

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

          {/* Payment */}
          <div className="mt-6 border-t pt-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Payment status
            </p>

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

          {/* Current order status
          <div className="mt-6 border-t pt-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">Current order status</p>

            <p className="mt-1 font-semibold">{formatStatus(currentStatus)}</p>
          </div> */}

          {order.paymentStatus === "PENDING" &&
            order.status !== "CANCELLED" && (
              <PayOrderButton orderId={order.id} />
            )}
        </aside>
      </div>
    </main>
  );
}

/**
 * Convert database-style status names into
 * human-readable text.
 */
function formatStatus(status: string) {
  switch (status) {
    case "PENDING":
      return "Order placed";

    case "CONFIRMED":
      return "Order confirmed";

    case "PROCESSING":
      return "Processing";

    case "SHIPPED":
      return "Shipped";

    case "OUT_FOR_DELIVERY":
      return "Out for delivery";

    case "DELIVERED":
      return "Delivered";

    case "CANCELLED":
      return "Cancelled";

    default:
      return status;
  }
}

/**
 * Order status timeline
 */
function OrderTimeline({ status }: { status: string }) {
  const steps = [
    {
      id: "PENDING",
      label: "Order placed",
    },
    {
      id: "CONFIRMED",
      label: "Order confirmed",
    },
    {
      id: "PROCESSING",
      label: "Processing",
    },
    {
      id: "SHIPPED",
      label: "Shipped",
    },
    {
      id: "OUT_FOR_DELIVERY",
      label: "Out for delivery",
    },
    {
      id: "DELIVERED",
      label: "Delivered",
    },
  ];

  const currentIndex = steps.findIndex((step) => step.id === status);

  return (
    <div className="space-y-5">
      {steps.map((step, index) => {
        const completed = currentIndex >= index && currentIndex !== -1;

        const current = step.id === status;

        return (
          <div key={step.id} className="flex items-start gap-4">
            {/* Circle + connecting line */}
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                  completed
                    ? "bg-black text-white"
                    : "border bg-white dark:bg-gray-900 text-gray-400 dark:text-gray-500"
                }`}
              >
                {completed ? "✓" : index + 1}
              </div>

              {index < steps.length - 1 && (
                <div
                  className={`mt-1 h-8 w-px ${
                    currentIndex > index
                      ? "bg-black"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                />
              )}
            </div>

            {/* Status text */}
            <div>
              <p
                className={`font-medium ${
                  current
                    ? "text-black"
                    : completed
                      ? "text-gray-700 dark:text-gray-200"
                      : "text-gray-400 dark:text-gray-500"
                }`}
              >
                {step.label}
              </p>

              {current && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Current status
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
