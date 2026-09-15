import type { Product } from "@/types/product";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Categories from "@/components/Categories";

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

  const categories = [...new Set(products.map((product) => product.category))];

  return (
    <main className="py-8  pb-30  ">
      <Header />
      <Categories categories={categories} />

      <PromoCarousel />

      <TodaysDeals products={products} />

      <MoreToLove products={products} excludeWishlisted={false} />
      <Footer />
    </main>
  );
}
