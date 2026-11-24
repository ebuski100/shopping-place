import { prisma } from "@/lib/prisma";
import type { Product } from "@/types/product";

const VALID_SORTS = [
  "newest",
  "oldest",
  "price-asc",
  "price-desc",
  "name-asc",
  "name-desc",
] as const;

type SortOption = (typeof VALID_SORTS)[number];

export function normalizeSort(sort?: string | null): SortOption {
  const sortParam = sort ?? "newest";
  return VALID_SORTS.includes(sortParam as SortOption)
    ? (sortParam as SortOption)
    : "newest";
}

export async function getProducts(options?: {
  search?: string;
  category?: string;
  sort?: string;
}): Promise<Product[]> {
  const search = options?.search?.trim() ?? "";
  const category = options?.category?.trim() ?? "";
  const sort = normalizeSort(options?.sort);

  return prisma.product.findMany({
    where: {
      isActive: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { category: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(category && {
        category: { equals: category, mode: "insensitive" },
      }),
    },
    orderBy:
      sort === "price-asc"
        ? { price: "asc" }
        : sort === "price-desc"
          ? { price: "desc" }
          : sort === "name-asc"
            ? { name: "asc" }
            : sort === "name-desc"
              ? { name: "desc" }
              : sort === "oldest"
                ? { createdAt: "asc" }
                : { createdAt: "desc" },
  }) as unknown as Product[];
}