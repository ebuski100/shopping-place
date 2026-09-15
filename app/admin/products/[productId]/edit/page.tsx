import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/admin";

import EditProductForm from "./EditProductForm";

type EditProductPageProps = {
  params: Promise<{
    productId: string;
  }>;
};

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
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

  console.log("PRODUCT ID:", productId);
  console.log("PARSED ID:", id);
  console.log("PRODUCT:", product);

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/admin/products"
          className="mb-6 inline-block text-sm text-gray-500 dark:text-gray-400 hover:text-black"
        >
          ← Back to products
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold">Edit Product</h1>

          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Update the information for {product.name}.
          </p>
        </div>

        <EditProductForm product={product} />
      </div>
    </main>
  );
}
