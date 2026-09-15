import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/admin";
import CustomerStatusButton from "./CustomerStatusButton";
type CustomerDetailsPageProps = {
  params: Promise<{
    customerId: string;
  }>;
};

export default async function AdminCustomerDetailsPage({
  params,
}: CustomerDetailsPageProps) {
  await requireAdminPage();

  const { customerId } = await params;

  const id = Number(customerId);

  if (!Number.isInteger(id)) {
    notFound();
  }

  const customer = await prisma.user.findUnique({
    where: {
      id,
    },
    include: {
      orders: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      },
    },
  });

  if (!customer) {
    notFound();
  }

  const totalOrders = customer.orders.length;

  const paidOrders = customer.orders.filter(
    (order) => order.paymentStatus === "PAID",
  );

  const pendingOrders = customer.orders.filter(
    (order) => order.status === "PENDING",
  );

  const deliveredOrders = customer.orders.filter(
    (order) => order.status === "DELIVERED",
  );

  const totalSpent = paidOrders.reduce((sum, order) => sum + order.total, 0);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8">
      <div className="mx-auto max-w-7xl">
        {/* Back */}
        <Link
          href="/admin/customers"
          className="mb-6 inline-block text-sm text-gray-500 dark:text-gray-400 hover:text-black"
        >
          ← Back to customers
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            {customer.name || "Unnamed Customer"}
          </h1>

          <p className="mt-2 text-gray-500 dark:text-gray-400">Customer #{customer.id}</p>

          <div className="flex flex-col items-start gap-3 sm:items-end">
            <div
              className={`inline-flex rounded-full px-4 py-2 text-sm font-medium ${
                customer.isActive
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {customer.isActive ? "Active" : "Inactive"}
            </div>

            <CustomerStatusButton
              customerId={customer.id}
              isActive={customer.isActive}
            />
          </div>
        </div>

        {/* Customer information */}
        <section className="mb-8 rounded-xl border bg-white dark:bg-gray-900 p-6">
          <h2 className="mb-6 text-xl font-semibold">Customer Information</h2>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>

              <p className="mt-1 font-medium">{customer.name || "Unnamed"}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>

              <p className="mt-1 font-medium">{customer.email}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Role</p>

              <p className="mt-1 font-medium">{String(customer.role)}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Joined</p>

              <p className="mt-1 font-medium">
                {customer.createdAt.toLocaleDateString("en-NG", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </section>

        {/* Statistics */}
        <section className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border bg-white dark:bg-gray-900 p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Orders</p>

            <p className="mt-2 text-3xl font-bold">{totalOrders}</p>
          </div>

          <div className="rounded-xl border bg-white dark:bg-gray-900 p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">Paid Orders</p>

            <p className="mt-2 text-3xl font-bold">{paidOrders.length}</p>
          </div>

          <div className="rounded-xl border bg-white dark:bg-gray-900 p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">Pending Orders</p>

            <p className="mt-2 text-3xl font-bold">{pendingOrders.length}</p>
          </div>

          <div className="rounded-xl border bg-white dark:bg-gray-900 p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">Delivered</p>

            <p className="mt-2 text-3xl font-bold">{deliveredOrders.length}</p>
          </div>

          <div className="rounded-xl border bg-white dark:bg-gray-900 p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Spent</p>

            <p className="mt-2 text-2xl font-bold">
              ₦{totalSpent.toLocaleString("en-NG")}
            </p>
          </div>
        </section>

        {/* Order history */}
        <section className="overflow-hidden rounded-xl border bg-white dark:bg-gray-900">
          <div className="border-b p-6">
            <h2 className="text-xl font-semibold">Order History</h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              All orders placed by this customer.
            </p>
          </div>

          {customer.orders.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              This customer has not placed any orders yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-gray-50 dark:bg-gray-950">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Order
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Items
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Total
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Payment
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Status
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Date
                    </th>

                    <th className="px-6 py-4 text-right text-sm font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {customer.orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      {/* Order */}
                      <td className="px-6 py-4 font-medium">#{order.id}</td>

                      {/* Items */}
                      <td className="px-6 py-4">
                        {order.items.reduce(
                          (sum, item) => sum + item.quantity,
                          0,
                        )}
                      </td>

                      {/* Total */}
                      <td className="px-6 py-4 font-medium">
                        ₦{order.total.toLocaleString("en-NG")}
                      </td>

                      {/* Payment */}
                      <td className="px-6 py-4">
                        <PaymentBadge status={String(order.paymentStatus)} />
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <StatusBadge status={String(order.status)} />
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {order.createdAt.toLocaleDateString("en-NG")}
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-medium underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PAID: "bg-green-100 text-green-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    FAILED: "bg-red-100 text-red-700",
    REFUNDED: "bg-purple-100 text-purple-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        styles[status] ?? "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200"
      }`}
    >
      {status}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    CONFIRMED: "bg-blue-100 text-blue-700",
    PROCESSING: "bg-indigo-100 text-indigo-700",
    SHIPPED: "bg-purple-100 text-purple-700",
    OUT_FOR_DELIVERY: "bg-orange-100 text-orange-700",
    DELIVERED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        styles[status] ?? "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200"
      }`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
