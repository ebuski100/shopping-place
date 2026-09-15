import Link from "next/link";
import type { Product } from "@/types/product";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";

type ProductsPageProps = {
  searchParams: Promise<{
    search?: string;
    category?: string;
    sort?: string;
  }>;
};

async function getProducts(
  search: string,
  category: string,
  sort: string,
): Promise<Product[]> {
  const params = new URLSearchParams();

  if (search) {
    params.set("search", search);
  }

  if (category) {
    params.set("category", category);
  }

  if (sort) {
    params.set("sort", sort);
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/products?${params.toString()}`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch products");
  }

  return response.json();
}

function createCategoryUrl(category: string, search: string) {
  const params = new URLSearchParams();

  if (search) {
    params.set("search", search);
  }

  if (category) {
    params.set("category", category);
  }

  const query = params.toString();

  return query ? `/products?${query}` : "/products";
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const params = await searchParams;

  const search = params.search?.trim() ?? "";
  const category = params.category?.trim() ?? "";
  const sort = params.sort?.trim() ?? "newest";

  const products = await getProducts(search, category, sort);

  const allProducts = await getProducts("", "", "newest");

  const categories = [
    ...new Set(allProducts.map((product) => product.category)),
  ].sort();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 ">
      <Header />

      <div className="flex min-h-[calc(100vh-80px)]">
        {/* ================================================== */}
        {/* CATEGORY SIDEBAR */}
        {/* ================================================== */}

        <aside className="sticky top-0 h-[calc(100vh-80px)] w-40 shrink-0 overflow-y-auto border-r bg-white dark:bg-gray-900 sm:w-52 lg:w-60">
          <div className="p-3 sm:p-5">
            <h2 className="mb-4 text-sm font-bold  tracking-wide text-gray-900 dark:text-white sm:text-base">
              Categories
            </h2>

            <nav className="space-y-1">
              {/* All Products */}
              <Link
                href={createCategoryUrl("", search)}
                className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  !category
                    ? "bg-black text-white"
                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                All Products
              </Link>

              {/* Categories */}
              {categories.map((item) => (
                <Link
                  key={item}
                  href={createCategoryUrl(item, search)}
                  className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    category.toLowerCase() === item.toLowerCase()
                      ? "bg-black text-white"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {item}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* ================================================== */}
        {/* PRODUCTS CONTENT */}
        {/* ================================================== */}

        <main className="min-w-0 flex-1 pb-30">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {/* Page Header */}
            <div className="mb-6">
              <h1 className="text-xl font-bold text-green-600 ">
                {category || "All Products"}
              </h1>
            </div>

            {/* Products */}
            {products.length === 0 ? (
              <div className="flex min-h-80 items-center justify-center rounded-xl border bg-white dark:bg-gray-900 text-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    No products found
                  </h2>

                  <p className="mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
                    We couldn&apos;t find any products matching your search or
                    category.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
