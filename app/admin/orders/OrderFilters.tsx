"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

type Order = {
  id: number;
  customer: {
    name: string | null;
    email: string;
  };
  items: {
    id: number;
    productName: string;
    quantity: number;
  }[];
  total: number;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  createdAt: string;
};

type OrderFiltersProps = {
  orders: Order[];
};

export default function OrderFilters({ orders }: OrderFiltersProps) {
  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState<"ALL" | OrderStatus>("ALL");

  const [paymentFilter, setPaymentFilter] = useState<"ALL" | PaymentStatus>(
    "ALL",
  );

  const filteredOrders = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        normalizedSearch === "" ||
        String(order.id).includes(normalizedSearch) ||
        (order.customer.name ?? "").toLowerCase().includes(normalizedSearch) ||
        order.customer.email.toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "ALL" || order.status === statusFilter;

      const matchesPayment =
        paymentFilter === "ALL" || order.paymentStatus === paymentFilter;

      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [orders, search, statusFilter, paymentFilter]);

  function clearFilters() {
    setSearch("");
    setStatusFilter("ALL");
    setPaymentFilter("ALL");
  }

  const hasFilters =
    search !== "" || statusFilter !== "ALL" || paymentFilter !== "ALL";

  return (
    <div>
      {/* Filters */}
      <div className="border-b p-6">
        <div className="grid gap-4 md:grid-cols-3">
          {/* Search */}
          <div className="md:col-span-1">
            <label
              htmlFor="order-search"
              className="mb-2 block text-sm font-medium"
            >
              Search orders
            </label>

            <input
              id="order-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Order ID, name or email..."
              className="w-full rounded-md border px-4 py-3 outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* Order status */}
          <div>
            <label
              htmlFor="order-status-filter"
              className="mb-2 block text-sm font-medium"
            >
              Order Status
            </label>

            <select
              id="order-status-filter"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "ALL" | OrderStatus)
              }
              className="w-full rounded-md border bg-white dark:bg-gray-900 px-4 py-3 outline-none focus:ring-2 focus:ring-black"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PROCESSING">Processing</option>
              <option value="SHIPPED">Shipped</option>
              <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Payment status */}
          <div>
            <label
              htmlFor="payment-status-filter"
              className="mb-2 block text-sm font-medium"
            >
              Payment
            </label>

            <select
              id="payment-status-filter"
              value={paymentFilter}
              onChange={(event) =>
                setPaymentFilter(event.target.value as "ALL" | PaymentStatus)
              }
              className="w-full rounded-md border bg-white dark:bg-gray-900 px-4 py-3 outline-none focus:ring-2 focus:ring-black"
            >
              <option value="ALL">All Payments</option>
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>
        </div>

        {/* Results */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {filteredOrders.length} of {orders.length} orders
          </p>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm font-medium underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Results table */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 text-center text-gray-500 dark:text-gray-400">
          No orders match your filters.
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
                  Customer
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
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  {/* Order */}
                  <td className="px-6 py-4 font-medium">#{order.id}</td>

                  {/* Customer */}
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium">
                        {order.customer.name || "Unnamed Customer"}
                      </p>

                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {order.customer.email}
                      </p>
                    </div>
                  </td>

                  {/* Items */}
                  <td className="px-6 py-4">
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </td>

                  {/* Total */}
                  <td className="px-6 py-4 font-medium">
                    ₦{order.total.toLocaleString("en-NG")}
                  </td>

                  {/* Payment */}
                  <td className="px-6 py-4">
                    <PaymentBadge status={order.paymentStatus} />
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <StatusBadge status={order.status} />
                  </td>

                  {/* Date */}
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString("en-NG")}
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
    </div>
  );
}

function PaymentBadge({ status }: { status: PaymentStatus }) {
  const styles: Record<PaymentStatus, string> = {
    PAID: "bg-green-100 text-green-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    FAILED: "bg-red-100 text-red-700",
    REFUNDED: "bg-purple-100 text-purple-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const styles: Record<OrderStatus, string> = {
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
      className={`rounded-full px-3 py-1 text-xs font-medium ${styles[status]}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
