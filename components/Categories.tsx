"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

type CategoriesProps = {
  categories: string[];
};

export default function Categories({ categories }: CategoriesProps) {
  const searchParams = useSearchParams();
  const currentSearch = searchParams.get("search") ?? "";
  const currentCategory = searchParams.get("category") ?? "";

  function createCategoryUrl(category?: string) {
    const params = new URLSearchParams();

    if (currentSearch) {
      params.set("search", currentSearch);
    }

    if (category) {
      params.set("category", category);
    }

    const query = params.toString();

    return query ? `/products?${query}` : "/products";
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 py-4 ">
      {/* All Products */}
      <Link
        href={createCategoryUrl()}
        className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
          !currentCategory
            ? "bg-black text-white"
            : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:bg-gray-700"
        }`}
      >
        All
      </Link>

      {/* Categories */}
      {categories.map((category) => (
        <Link
          key={category}
          href={createCategoryUrl(category)}
          className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
            currentCategory.toLowerCase() === category.toLowerCase()
              ? "bg-black text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:bg-gray-700"
          }`}
        >
          {category}
        </Link>
      ))}
    </div>
  );
}
