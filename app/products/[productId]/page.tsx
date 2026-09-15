import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductDetails from "./ProductDetails";

type ProductPageProps = {
  params: Promise<{
    productId: string;
  }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { productId } = await params;

  const id = Number(productId);

  if (!Number.isInteger(id)) {
    notFound();
  }

  const product = await prisma.product.findUnique({
    where: {
      id,
      isActive: true,
    },
  });

  if (!product) {
    notFound();
  }

  return <ProductDetails product={product} />;
}
