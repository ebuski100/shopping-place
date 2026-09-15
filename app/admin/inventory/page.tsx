import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/admin";

type StockStatus = "OUT_OF_STOCK" | "LOW_STOCK" | "IN_STOCK";

function getStockStatus(stock: number): StockStatus {
  if (stock === 0) {
    return "OUT_OF_STOCK";
  }

  if (stock <= 5) {
    return "LOW_STOCK";
  }

  return "IN_STOCK";
}

function StockStatusBadge({ stock }: { stock: number }) {
  const status = getStockStatus(stock);

  if (status === "OUT_OF_STOCK") {
    return (
      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
        Out of stock
      </span>
    );
  }

  if (status === "LOW_STOCK") {
    return (
      <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
        Low stock · {stock}
      </span>
    );
  }

  return (
    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
      In stock · {stock}
    </span>
  );
}

function InventoryStatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-xl border bg-white dark:bg-gray-900 p-6 shadow-sm">
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>

      <p className="mt-2 text-3xl font-bold tracking-tight">
        {value.toLocaleString("en-NG")}
      </p>

      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{description}</p>
    </div>
  );
}

export default async function AdminInventoryPage() {
  await requireAdminPage();

  const products = await prisma.product.findMany({
    orderBy: {
      stock: "asc",
    },
    select: {
      id: true,
      name: true,
      image: true,
      category: true,
      stock: true,
      isActive: true,
      updatedAt: true,
    },
  });

  const totalProducts = products.length;

  const totalInventoryUnits = products.reduce(
    (total, product) => total + product.stock,
    0,
  );

  const lowStockProducts = products.filter(
    (product) => product.stock > 0 && product.stock <= 5,
  ).length;

  const outOfStockProducts = products.filter(
    (product) => product.stock === 0,
  ).length;

  const inStockProducts = products.filter(
    (product) => product.stock > 5,
  ).length;

  return (
    <main className="space-y-8 p-8">
      {/* Header */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">Inventory</h1>

          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Monitor stock levels across your store.
          </p>
        </div>

        <Link
          href="/admin/products"
          className="rounded-md border bg-white dark:bg-gray-900 px-5 py-3 text-center text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Manage Products
        </Link>
      </div>

      {/* Statistics */}

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <InventoryStatCard
          title="Total Products"
          value={totalProducts}
          description="Products in your catalog"
        />

        <InventoryStatCard
          title="Inventory Units"
          value={totalInventoryUnits}
          description="Total physical units in stock"
        />

        <InventoryStatCard
          title="Low Stock"
          value={lowStockProducts}
          description="Products with 1–5 units"
        />

        <InventoryStatCard
          title="Out of Stock"
          value={outOfStockProducts}
          description="Products with zero units"
        />
      </section>

      {/* Inventory Summary */}

      <section className="rounded-xl border bg-white dark:bg-gray-900 p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Inventory Summary</h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Current stock distribution across your catalog.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-green-50 p-4">
            <p className="text-sm text-green-700">In stock</p>

            <p className="mt-1 text-2xl font-bold text-green-800">
              {inStockProducts}
            </p>

            <p className="mt-1 text-xs text-green-700">More than 5 units</p>
          </div>

          <div className="rounded-lg bg-yellow-50 p-4">
            <p className="text-sm text-yellow-700">Low stock</p>

            <p className="mt-1 text-2xl font-bold text-yellow-800">
              {lowStockProducts}
            </p>

            <p className="mt-1 text-xs text-yellow-700">1–5 units remaining</p>
          </div>

          <div className="rounded-lg bg-red-50 p-4">
            <p className="text-sm text-red-700">Out of stock</p>

            <p className="mt-1 text-2xl font-bold text-red-800">
              {outOfStockProducts}
            </p>

            <p className="mt-1 text-xs text-red-700">No units remaining</p>
          </div>
        </div>
      </section>

      {/* Products */}

      <section className="rounded-xl border bg-white dark:bg-gray-900 shadow-sm">
        <div className="border-b p-6">
          <h2 className="text-xl font-semibold">Stock Levels</h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Products ordered from lowest stock to highest stock.
          </p>
        </div>

        {products.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">No products found.</p>

            <Link
              href="/admin/products/new"
              className="mt-4 inline-block text-sm font-medium underline"
            >
              Add your first product
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b bg-gray-50 dark:bg-gray-950">
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold">Product</th>

                  <th className="px-6 py-4 text-sm font-semibold">Category</th>

                  <th className="px-6 py-4 text-sm font-semibold">Stock</th>

                  <th className="px-6 py-4 text-sm font-semibold">Status</th>

                  <th className="px-6 py-4 text-sm font-semibold">
                    Last Updated
                  </th>

                  <th className="px-6 py-4" />
                </tr>
              </thead>

              <tbody className="divide-y">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    {/* Product */}

                    <td className="px-6 py-4">
                      <div>
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="font-medium hover:underline"
                        >
                          {product.name}
                        </Link>

                        {!product.isActive && (
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Inactive product
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Category */}

                    <td className="px-6 py-4">
                      <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs font-medium">
                        {product.category}
                      </span>
                    </td>

                    {/* Stock */}

                    <td className="px-6 py-4">
                      <span className="font-semibold">
                        {product.stock.toLocaleString("en-NG")}
                      </span>
                    </td>

                    {/* Status */}

                    <td className="px-6 py-4">
                      <StockStatusBadge stock={product.stock} />
                    </td>

                    {/* Updated */}

                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {product.updatedAt.toLocaleDateString("en-NG", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>

                    {/* Action */}

                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
