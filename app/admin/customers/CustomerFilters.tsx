"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
type Customer = {
  id: number;
  name: string | null;
  email: string;
  orderCount: number;
  totalSpent: number;
  createdAt: string;
  isActive: boolean;
};

type CustomerFiltersProps = {
  customers: Customer[];
};

export default function CustomerFilters({ customers }: CustomerFiltersProps) {
  const [search, setSearch] = useState("");
  const [orderFilter, setOrderFilter] = useState<
    "ALL" | "WITH_ORDERS" | "WITHOUT_ORDERS"
  >("ALL");

  const filteredCustomers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return customers.filter((customer) => {
      const matchesSearch =
        normalizedSearch === "" ||
        (customer.name ?? "").toLowerCase().includes(normalizedSearch) ||
        customer.email.toLowerCase().includes(normalizedSearch);

      const matchesOrderFilter =
        orderFilter === "ALL" ||
        (orderFilter === "WITH_ORDERS" && customer.orderCount > 0) ||
        (orderFilter === "WITHOUT_ORDERS" && customer.orderCount === 0);

      return matchesSearch && matchesOrderFilter;
    });
  }, [customers, search, orderFilter]);

  return (
    <div className="rounded-xl border bg-white dark:bg-gray-900">
      {/* Filters */}
      <div className="border-b p-6">
        <div className="flex flex-col gap-4 md:flex-row">
          {/* Search */}
          <div className="flex-1">
            <label
              htmlFor="customer-search"
              className="mb-2 block text-sm font-medium"
            >
              Search customers
            </label>

            <input
              id="customer-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or email..."
              className="w-full rounded-md border px-4 py-3 outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* Order filter */}
          <div className="md:w-64">
            <label
              htmlFor="customer-order-filter"
              className="mb-2 block text-sm font-medium"
            >
              Orders
            </label>

            <select
              id="customer-order-filter"
              value={orderFilter}
              onChange={(event) =>
                setOrderFilter(
                  event.target.value as
                    | "ALL"
                    | "WITH_ORDERS"
                    | "WITHOUT_ORDERS",
                )
              }
              className="w-full rounded-md border bg-white dark:bg-gray-900 px-4 py-3 outline-none focus:ring-2 focus:ring-black"
            >
              <option value="ALL">All Customers</option>
              <option value="WITH_ORDERS">With Orders</option>
              <option value="WITHOUT_ORDERS">Without Orders</option>
            </select>
          </div>
        </div>

        {/* Results / clear */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {filteredCustomers.length} of {customers.length} customers
          </p>

          {(search || orderFilter !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setOrderFilter("ALL");
              }}
              className="text-sm font-medium underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {filteredCustomers.length === 0 ? (
        <div className="p-12 text-center text-gray-500 dark:text-gray-400">
          No customers match your filters.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-gray-50 dark:bg-gray-950">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Customer
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Orders
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Total Spent
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Joined
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold">
                  status
                </th>

                <th className="px-6 py-4 text-right text-sm font-semibold">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 ">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium">
                        {customer.name || "Unnamed Customer"}
                      </p>

                      <p className="text-sm text-gray-500 dark:text-gray-400">{customer.email}</p>
                    </div>
                  </td>

                  <td className="px-6 py-4">{customer.orderCount}</td>

                  <td className="px-6 py-4 font-medium">
                    ₦{customer.totalSpent.toLocaleString("en-NG")}
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(customer.createdAt).toLocaleDateString("en-NG")}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    <div
                      className={`inline-flex  px-4 py-2 text-sm font-medium ${
                        customer.isActive ? " text-green-700" : " text-red-700"
                      }`}
                    >
                      {customer.isActive ? "Active" : "Inactive"}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <a
                      href={`/admin/customers/${customer.id}`}
                      className="font-medium underline"
                    >
                      View
                    </a>
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
