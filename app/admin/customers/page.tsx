import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/admin";
import { UserRole } from "@/lib/generated/prisma/client";

import CustomerFilters from "./CustomerFilters";

export default async function AdminCustomersPage() {
  await requireAdminPage();

  const customers = await prisma.user.findMany({
    where: {
      role: UserRole.CUSTOMER,
    },
    include: {
      orders: {
        select: {
          id: true,
          total: true,
          paymentStatus: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const customersWithStats = customers.map((customer) => {
    const paidOrders = customer.orders.filter(
      (order) => order.paymentStatus === "PAID",
    );

    const totalSpent = paidOrders.reduce((sum, order) => sum + order.total, 0);

    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      createdAt: customer.createdAt.toISOString(),
      orderCount: customer.orders.length,
      totalSpent,
      isActive: customer.isActive,
    };
  });

  const totalRevenue = customersWithStats.reduce(
    (sum, customer) => sum + customer.totalSpent,
    0,
  );

  const customersWithoutOrders = customers.filter(
    (customer) => customer.orders.length === 0,
  );

  const totalPaidOrders = customers.reduce(
    (sum, customer) =>
      sum +
      customer.orders.filter((order) => order.paymentStatus === "PAID").length,
    0,
  );

  const averageOrderValue =
    totalPaidOrders > 0 ? totalRevenue / totalPaidOrders : 0;

  const customersWithOrders = customers.filter(
    (customer) => customer.orders.length > 0,
  ).length;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold">Customers</h1>

            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Manage your customers and view their order history.
            </p>
          </div>

          <Link
            href="/admin"
            className="rounded-md border bg-white dark:bg-gray-900 px-5 py-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            ← Dashboard
          </Link>
        </div>

        <section className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Customers */}
          <div className="rounded-xl border bg-white dark:bg-gray-900 p-6">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Customers</p>

            <p className="mt-2 text-3xl font-bold">{customers.length}</p>
          </div>

          {/* Customers With Orders */}
          <div className="rounded-xl border bg-white dark:bg-gray-900 p-6">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">With Orders</p>

            <p className="mt-2 text-3xl font-bold">{customersWithOrders}</p>
          </div>

          {/* Customers Without Orders */}
          <div className="rounded-xl border bg-white dark:bg-gray-900 p-6">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Without Orders</p>

            <p className="mt-2 text-3xl font-bold">
              {customersWithoutOrders.length}
            </p>
          </div>

          {/* Revenue */}
          <div className="rounded-xl border bg-white dark:bg-gray-900 p-6">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Customer Revenue
            </p>

            <p className="mt-2 text-2xl font-bold">
              ₦{totalRevenue.toLocaleString("en-NG")}
            </p>
          </div>
        </section>

        <section className="mb-8 grid gap-5 sm:grid-cols-2">
          <div className="rounded-xl border bg-white dark:bg-gray-900 p-6">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Paid Orders</p>

            <p className="mt-2 text-3xl font-bold">{totalPaidOrders}</p>
          </div>

          <div className="rounded-xl border bg-white dark:bg-gray-900 p-6">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Average Order Value
            </p>

            <p className="mt-2 text-2xl font-bold">
              ₦{Math.round(averageOrderValue).toLocaleString("en-NG")}
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border bg-white dark:bg-gray-900">
          <CustomerFilters customers={customersWithStats} />

          {customers.length === 0 && (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              No customers yet.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
