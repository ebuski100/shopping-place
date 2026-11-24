import Footer from "@/components/Footer";
import Header from "@/components/Header";

import PromoCarousel from "@/components/PromoCarousel";
import TodaysDeals from "@/components/TodaysDeals";
import MoreToLove from "@/components/MoreToLove";
import { getProducts } from "@/lib/products";

// Preserve the previous no-store/dynamic rendering behavior now that the
// homepage reads directly from the database instead of an HTTP fetch.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const products = await getProducts();

  return (
    <main className="py-8 pb-15 pt-20">
      <Header />

      <PromoCarousel />

      <TodaysDeals products={products} />

      <MoreToLove excludeWishlisted={false} title="Recommended for you" />
      <Footer />
    </main>
  );
}