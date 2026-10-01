import type { Product } from "@/types/product";

import Footer from "@/components/Footer";
import Header from "@/components/Header";

import PromoCarousel from "@/components/PromoCarousel";
import TodaysDeals from "@/components/TodaysDeals";
import MoreToLove from "@/components/MoreToLove";

export default async function HomePage() {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/products`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch products");
  }

  const products: Product[] = await response.json();

  return (
    <main className="py-8  pb-15  pt-20">
      <Header />

      <PromoCarousel />

      <TodaysDeals products={products} />

      <MoreToLove excludeWishlisted={false} title="Recommended for you" />
      <Footer />
    </main>
  );
}
