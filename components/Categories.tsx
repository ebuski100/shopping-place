// "use client";

// import Link from "next/link";
// import { useSearchParams } from "next/navigation";

// type CategoriesProps = {
//   categories: string[];
// };

// export default function Categories({ categories }: CategoriesProps) {
//   const searchParams = useSearchParams();

//   const activeCategory = searchParams.get("category") ?? "";

//   return (
//     <section className="w-full py-4">
//       <div className="mx-auto max-w-7xl">
//         <div className="flex gap-3 overflow-x-auto px-1 pb-2 scrollbar-hide">
//           {/* All */}
//           <Link
//             href="/"
//             className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
//               activeCategory === ""
//                 ? "bg-black text-white shadow-sm"
//                 : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:bg-gray-700"
//             }`}
//           >
//             All
//           </Link>

//           {/* Database categories */}
//           {categories.map((category) => {
//             const params = new URLSearchParams(searchParams.toString());

//             params.set("category", category);
//             params.delete("page");

//             const href = `/?${params.toString()}`;

//             const isActive = activeCategory === category;

//             return (
//               <Link
//                 key={category}
//                 href={href}
//                 className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-medium capitalize transition-all duration-200 ${
//                   isActive
//                     ? "bg-black text-white shadow-sm"
//                     : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:bg-gray-700"
//                 }`}
//               >
//                 {category}
//               </Link>
//             );
//           })}
//         </div>
//       </div>
//     </section>
//   );
// }

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
