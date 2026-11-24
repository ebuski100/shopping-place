import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductDetails from "./ProductDetails";
import PublicCatalogSnapshot from "@/components/PublicCatalogSnapshot";

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

  return (
    <>
      <PublicCatalogSnapshot
        products={[
          {
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            image: product.image,
            category: product.category,
            stock: product.stock,
            updatedAt: product.updatedAt.toISOString(),
          },
        ]}
      />
      <ProductDetails product={product} />
    </>
  );
}
