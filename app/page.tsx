import Footer from "@/components/Footer";
import Header from "@/components/Header";

import PromoCarousel from "@/components/PromoCarousel";
import TodaysDeals from "@/components/TodaysDeals";
import MoreToLove from "@/components/MoreToLove";
import { InstallAppButton } from "@/components/PwaInstall";
import PublicCatalogSnapshot from "@/components/PublicCatalogSnapshot";
import { getProducts } from "@/lib/products";

// Preserve the previous no-store/dynamic rendering behavior now that the
// homepage reads directly from the database instead of an HTTP fetch.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const products = await getProducts();

  return (
    <main className="py-8 pb-15 pt-20">
      <Header />

      <PublicCatalogSnapshot
        products={products
          .filter((product) => product.isActive && product.stock > 0)
          .slice(0, 8)
          .map((product) => ({
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            image: product.image,
            category: product.category,
            stock: product.stock,
            updatedAt: product.updatedAt.toISOString(),
          }))}
        listingQuery="home"
      />

      <PromoCarousel />

      <div className="mx-auto flex w-full max-w-7xl justify-center px-4 py-2">
        <InstallAppButton />
      </div>

      <TodaysDeals products={products} />

      <MoreToLove excludeWishlisted={false} title="Recommended for you" />
      <Footer />
    </main>
  );
}
