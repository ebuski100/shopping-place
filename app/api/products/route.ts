import { getProducts, normalizeSort } from "@/lib/products";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const products = await getProducts({
      search: searchParams.get("search") ?? "",
      category: searchParams.get("category") ?? "",
      sort: normalizeSort(searchParams.get("sort")),
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