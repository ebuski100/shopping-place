import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/admin";
import Image from "next/image";

export default async function AdminProductsPage() {
  await requireAdminPage();

  const products = await prisma.product.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="p-4 md:p-6">
      {" "}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        {" "}
        <div>
          {" "}
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Manage your store inventory.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="cursor-pointer rounded-md bg-gray-800 px-3 py-3 text-center font-medium text-white hover:bg-gray-700"
        >
          + Add Product
        </Link>
      </div>
      {products.length === 0 ? (
        <div className="rounded-lg border p-10 text-center">
          <p className="text-gray-500 dark:text-gray-400">No products found.</p>

          <Link
            href="/admin/products/new"
            className="mt-4 inline-block font-medium underline"
          >
            Create your first product
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md dark:border-gray-800 dark:bg-gray-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
                <tr>
                  <th className="whitespace-nowrap px-6 py-4 text-sm font-semibold">
                    Product
                  </th>

                  <th className="whitespace-nowrap px-6 py-4 text-sm font-semibold">
                    Category
                  </th>

                  <th className="whitespace-nowrap px-6 py-4 text-sm font-semibold">
                    Price
                  </th>

                  <th className="whitespace-nowrap px-6 py-4 text-sm font-semibold">
                    Stock
                  </th>

                  <th className="whitespace-nowrap px-6 py-4 text-sm font-semibold">
                    Created
                  </th>

                  <th className="whitespace-nowrap px-6 py-4 text-sm font-semibold">
                    Status
                  </th>

                  <th className="px-6 py-4" />
                </tr>
              </thead>

              <tbody className="divide-y">
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    {/* Product */}
                    <td className="px-2 py-4">
                      <div className="flex items-center gap-4">
                        <Link href={`/admin/products/${product.id}`}>
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-gray-50 dark:bg-gray-950">
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              sizes="56px"
                              className="object-contain"
                            />
                          </div>
                        </Link>

                        <div className="min-w-0">
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="font-medium hover:underline"
                          >
                            <p className="truncate font-semibold">
                              {product.name}
                            </p>
                          </Link>

                          <p className="mt-1 max-w-xs truncate text-sm text-gray-500 dark:text-gray-400">
                            {product.description}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="whitespace-nowrap px-2 py-4">
                      <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium dark:bg-gray-800">
                        {product.category}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="whitespace-nowrap px-6 py-4 font-semibold">
                      ₦{product.price.toLocaleString()}
                    </td>

                    {/* Stock */}
                    <td className="whitespace-nowrap px-6 py-4">
                      <StockBadge stock={product.stock} />
                    </td>

                    {/* Created */}
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {product.createdAt.toLocaleDateString("en-NG", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>

                    {/* Status */}
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                          product.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                        }`}
                      >
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) {
    return (
      <span className="inline-flex whitespace-nowrap rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
        Out of stock{" "}
      </span>
    );
  }

  if (stock <= 5) {
    return (
      <span className="inline-flex whitespace-nowrap rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700">
        {stock} left{" "}
      </span>
    );
  }

  return (
    <span className="inline-flex whitespace-nowrap rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
      {stock} in stock{" "}
    </span>
  );
}
