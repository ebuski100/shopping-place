import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/admin";

import InventoryAdjuster from "./InventoryAdjuster";
import InventoryHistory from "./InventoryHistory";
import ProductStatusButton from "../ProductStatusButton";

type AdminProductPageProps = {
  params: Promise<{
    productId: string;
  }>;
};

export default async function AdminProductPage({
  params,
}: AdminProductPageProps) {
  await requireAdminPage();

  const { productId } = await params;

  const id = Number(productId);

  if (!Number.isInteger(id)) {
    notFound();
  }

  const product = await prisma.product.findUnique({
    where: {
      id,
    },
  });

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8">
      <div className="mx-auto max-w-5xl">
        {/* Back */}
        <Link
          href="/admin/products"
          className="mb-6 inline-block text-sm text-gray-500 dark:text-gray-400 hover:text-black"
        >
          ← Back to products
        </Link>

        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>

            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Product #{product.id}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/admin/products/${product.id}/edit`}
              className="rounded-md bg-black px-5 py-3 text-sm font-medium text-white hover:bg-gray-800"
            >
              Edit Product
            </Link>

            <ProductStatusButton
              productId={product.id}
              isActive={product.isActive}
            />
          </div>
        </div>

        {/* Product overview */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Product image */}
          <section className="rounded-xl border bg-white dark:bg-gray-900 p-6">
            <h2 className="mb-5 text-xl font-semibold">Product Image</h2>

            <div className="overflow-hidden rounded-lg border bg-gray-50 dark:bg-gray-950">
              <Image
                src={product.image}
                alt={product.name}
                width={600}
                height={600}
                className="aspect-square w-full object-cover"
              />
            </div>
          </section>

          {/* Product information */}
          <section className="rounded-xl border bg-white dark:bg-gray-900 p-6 lg:col-span-2">
            <h2 className="mb-6 text-xl font-semibold">Product Information</h2>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>

                <p className="mt-1 font-medium">{product.name}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Category</p>

                <p className="mt-1 font-medium capitalize">
                  {product.category}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Price</p>

                <p className="mt-1 text-lg font-semibold">
                  ₦{product.price.toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Stock</p>

                <p
                  className={`mt-1 font-semibold ${
                    product.stock === 0
                      ? "text-red-600"
                      : product.stock <= 5
                        ? "text-orange-600"
                        : "text-green-600"
                  }`}
                >
                  {product.stock} units
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>

                <span
                  className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-medium ${
                    product.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {product.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Product ID</p>

                <p className="mt-1 font-medium">#{product.id}</p>
              </div>
            </div>

            {/* Description */}
            <div className="mt-8 border-t pt-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">Description</p>

              <p className="mt-2 leading-7 text-gray-700 dark:text-gray-200">
                {product.description}
              </p>
            </div>
          </section>
        </div>

        {/* Inventory management */}
        <section className="mt-8 rounded-xl border bg-white dark:bg-gray-900 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Inventory Management</h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Adjust stock and track every inventory movement.
            </p>
          </div>

          <InventoryAdjuster
            productId={product.id}
            currentStock={product.stock}
          />

          <InventoryHistory productId={product.id} />
        </section>

        {/* Product metadata */}
        <section className="mt-8 rounded-xl border bg-white dark:bg-gray-900 p-6">
          <h2 className="mb-5 text-xl font-semibold">Product Metadata</h2>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Product ID</p>

              <p className="mt-1 font-medium">#{product.id}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>

              <p className="mt-1 font-medium">
                {product.createdAt.toLocaleDateString("en-NG", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated</p>

              <p className="mt-1 font-medium">
                {product.updatedAt.toLocaleDateString("en-NG", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
