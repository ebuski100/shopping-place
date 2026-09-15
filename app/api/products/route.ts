import { prisma } from "@/lib/prisma";

const VALID_SORTS = [
  "newest",
  "oldest",
  "price-asc",
  "price-desc",
  "name-asc",
  "name-desc",
] as const;

type SortOption = (typeof VALID_SORTS)[number];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() ?? "";
    const category = searchParams.get("category")?.trim() ?? "";
    const sortParam = searchParams.get("sort") ?? "newest";

    const sort: SortOption = VALID_SORTS.includes(sortParam as SortOption)
      ? (sortParam as SortOption)
      : "newest";

    const products = await prisma.product.findMany({
      where: {
        isActive: true,

        ...(search && {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              description: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              category: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        }),

        ...(category && {
          category: {
            equals: category,
            mode: "insensitive",
          },
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
    });

    return Response.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);

    return Response.json(
      {
        error: "Failed to fetch products",
      },
      {
        status: 500,
      },
    );
  }
}
