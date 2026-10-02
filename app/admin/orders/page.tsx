import Link from "next/link";
import { redirect } from "next/navigation";

import OrderFilters from "./OrderFilters";
import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/admin";

export default async function AdminOrdersPage() {
  const admin = await requireAdminPage();

  if (!admin) {
    redirect("/login?redirect=/admin/orders");
  }

  const orders = await prisma.order.findMany({
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
          quantity: true,
          price: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const ordersForFilters = orders.map((order) => ({
    id: order.id,
    customer: {
      // Orders remain visible even if their customer account was deleted.
      name: order.user?.name ?? order.fullName,
      email: order.user?.email ?? "Account deleted",
    },
    items: order.items.map((item) => ({
      id: item.id,
      productName: item.productName,
      quantity: item.quantity,
    })),
    total: order.total,
    paymentStatus: order.paymentStatus,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
  }));

  const pendingPaymentCount = orders.filter(
    (order) => order.paymentStatus === "PENDING",
  ).length;

  const paidOrdersCount = orders.filter(
    (order) => order.paymentStatus === "PAID",
  ).length;

  const deliveredOrdersCount = orders.filter(
    (order) => order.status === "DELIVERED",
  ).length;

  return (
    <main className="min-h-screen bg-gray-50 p-4 dark:bg-gray-950 sm:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
              Admin Orders
            </h1>

            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Manage customer orders and fulfillment status.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex w-fit items-center rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
          >
            Back to Store
          </Link>
        </div>

        {/* Statistics */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Orders" value={orders.length} />

          <StatCard title="Pending Payment" value={pendingPaymentCount} />

          <StatCard title="Paid Orders" value={paidOrdersCount} />

          <StatCard title="Delivered" value={deliveredOrdersCount} />
        </div>

        {/* Orders */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-gray-200 p-5 dark:border-gray-800 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
              All Orders
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              View and manage orders placed in your store.
            </p>
          </div>

          {orders.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400 sm:p-12">
              No orders found.
            </div>
          ) : (
            <OrderFilters orders={ordersForFilters} />
          )}
        </div>
      </div>
    </main>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 sm:p-6">
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>

      <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
        {value.toLocaleString("en-NG")}
      </p>
    </div>
  );
}
