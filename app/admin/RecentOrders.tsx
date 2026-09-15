import Link from "next/link";

import type { OrderStatus, PaymentStatus } from "@/lib/generated/prisma/client";

type RecentOrder = {
  id: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  fullName: string;
  user: {
    name: string | null;
    email: string;
  };
};

type RecentOrdersProps = {
  orders: RecentOrder[];
};

const statusStyles: Record<OrderStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-purple-100 text-purple-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  OUT_FOR_DELIVERY: "bg-orange-100 text-orange-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const statusLabels: Record<OrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export default function RecentOrders({ orders }: RecentOrdersProps) {
  return (
    <section className="rounded-xl border bg-white dark:bg-gray-900 p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Recent Orders</h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Your latest customer orders.
          </p>
        </div>

        <Link
          href="/admin/orders"
          className="text-sm font-medium hover:underline"
        >
          View all
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-sm text-gray-500 dark:text-gray-400">
          No orders yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b text-left text-sm text-gray-500 dark:text-gray-400">
                <th className="pb-4 font-medium">Order</th>
                <th className="pb-4 font-medium">Customer</th>
                <th className="pb-4 font-medium">Amount</th>
                <th className="pb-4 font-medium">Payment</th>
                <th className="pb-4 font-medium">Status</th>
                <th className="pb-4 font-medium">Date</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b last:border-b-0">
                  <td className="py-4">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-medium hover:underline"
                    >
                      #{order.id}
                    </Link>
                  </td>

                  <td className="py-4">
                    <p className="font-medium">
                      {order.user.name || order.fullName}
                    </p>

                    <p className="text-sm text-gray-500 dark:text-gray-400">{order.user.email}</p>
                  </td>

                  <td className="py-4 font-medium">
                    ₦{order.total.toLocaleString("en-NG")}
                  </td>

                  <td className="py-4">
                    <span
                      className={
                        order.paymentStatus === "PAID"
                          ? "text-sm font-medium text-green-600"
                          : "text-sm font-medium text-yellow-600"
                      }
                    >
                      {order.paymentStatus}
                    </span>
                  </td>

                  <td className="py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusStyles[order.status]}`}
                    >
                      {statusLabels[order.status]}
                    </span>
                  </td>

                  <td className="py-4 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
