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
      name: order.user.name,
      email: order.user.email,
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

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Orders</h1>

            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Manage customer orders and fulfillment status.
            </p>
          </div>

          <Link
            href="/"
            className="rounded-md border bg-white dark:bg-gray-900 px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Back to Store
          </Link>
        </div>

        {/* Statistics */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Orders" value={orders.length} />

          <StatCard
            title="Pending Payment"
            value={
              orders.filter((order) => order.paymentStatus === "PENDING").length
            }
          />

          <StatCard
            title="Paid Orders"
            value={
              orders.filter((order) => order.paymentStatus === "PAID").length
            }
          />

          <StatCard
            title="Delivered"
            value={
              orders.filter((order) => order.status === "DELIVERED").length
            }
          />
        </div>

        {/* Orders */}
        <div className="overflow-hidden rounded-lg border bg-white dark:bg-gray-900">
          <div className="border-b p-6">
            <h2 className="text-xl font-semibold">All Orders</h2>
          </div>

          {orders.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              No orders found.
            </div>
          ) : (
            <section className="overflow-hidden rounded-xl border bg-white dark:bg-gray-900">
              <OrderFilters orders={ordersForFilters} />

              {orders.length === 0 && (
                <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                  No orders yet.
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 p-6">
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>

      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}

// function PaymentBadge({ status }: { status: string }) {
//   const styles: Record<string, string> = {
//     PAID: "bg-green-100 text-green-700",
//     PENDING: "bg-yellow-100 text-yellow-700",
//     FAILED: "bg-red-100 text-red-700",
//     REFUNDED: "bg-purple-100 text-purple-700",
//   };

//   return (
//     <span
//       className={`rounded-full px-3 py-1 text-xs font-medium ${
//         styles[status] ?? "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200"
//       }`}
//     >
//       {status}
//     </span>
//   );
// }

// function StatusBadge({ status }: { status: string }) {
//   const styles: Record<string, string> = {
//     PENDING: "bg-yellow-100 text-yellow-700",
//     CONFIRMED: "bg-blue-100 text-blue-700",
//     PROCESSING: "bg-indigo-100 text-indigo-700",
//     SHIPPED: "bg-purple-100 text-purple-700",
//     OUT_FOR_DELIVERY: "bg-orange-100 text-orange-700",
//     DELIVERED: "bg-green-100 text-green-700",
//     CANCELLED: "bg-red-100 text-red-700",
//   };

//   return (
//     <span
//       className={`rounded-full px-3 py-1 text-xs font-medium ${
//         styles[status] ?? "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200"
//       }`}
//     >
//       {status.replaceAll("_", " ")}
//     </span>
//   );
// }
