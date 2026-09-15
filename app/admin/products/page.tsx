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
    <main className="p-8">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>

          <p className="mt-2 text-gray-500 dark:text-gray-400">Manage your store inventory.</p>
        </div>

        <Link
          href="/admin/products/new"
          className="rounded-md bg-black px-5 py-3 text-center font-medium text-white hover:bg-gray-800"
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
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 shadow-md bg-white dark:bg-gray-900 bg-green-500">
          <div className="overflow-x-auto ">
            <table className="w-full text-left">
              <thead className="border-b bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800 ">
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold">Product</th>

                  <th className="px-6 py-4 text-sm font-semibold">Category</th>

                  <th className="px-6 py-4 text-sm font-semibold">Price</th>

                  <th className="px-6 py-4 text-sm font-semibold">Stock</th>

                  <th className="px-6 py-4 text-sm font-semibold">Created</th>
                  <th className="px-6 py-4 text-sm font-semibold">Status</th>

                  <th className="px-6 py-4" />
                </tr>
              </thead>

              <tbody className="divide-y">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <Link href={`/admin/products/${product.id}`}>
                          <div className="relative h-16 w-16 overflow-hidden rounded-md bg-gray-50 dark:bg-gray-950">
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              sizes="56px"
                              className="object-contain"
                            />
                          </div>
                        </Link>

                        <div>
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="font-medium hover:underline"
                          >
                            <p className="font-semibold">{product.name}</p>
                          </Link>

                          <p className="mt-1 max-w-xs truncate text-sm text-gray-500 dark:text-gray-400">
                            {product.description}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs font-medium">
                        {product.category}
                      </span>
                    </td>

                    <td className="px-6 py-4 font-semibold">
                      ₦{product.price.toLocaleString()}
                    </td>

                    <td className="px-6 py-4">
                      <StockBadge stock={product.stock} />
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {product.createdAt.toLocaleDateString("en-NG", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          product.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
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
      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
        Out of stock
      </span>
    );
  }

  if (stock <= 5) {
    return (
      <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
        {stock} left
      </span>
    );
  }

  return (
    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
      {stock} in stock
    </span>
  );
}
