// import { prisma } from "@/lib/prisma";
// import { requireAdmin } from "@/lib/auth";

// export async function POST(request: Request) {
//   try {
//     await requireAdmin();

//     const body = await request.json();

//     const { name, description, price, image, category, stock } = body;

//     // Basic validation
//     if (
//       typeof name !== "string" ||
//       !name.trim() ||
//       typeof description !== "string" ||
//       !description.trim() ||
//       typeof image !== "string" ||
//       !image.trim() ||
//       typeof category !== "string" ||
//       !category.trim()
//     ) {
//       return Response.json(
//         { error: "All product fields are required" },
//         { status: 400 },
//       );
//     }

//     const numericPrice = Number(price);
//     const numericStock = Number(stock);

//     if (!Number.isFinite(numericPrice) || numericPrice < 0) {
//       return Response.json({ error: "Invalid product price" }, { status: 400 });
//     }

//     if (!Number.isInteger(numericStock) || numericStock < 0) {
//       return Response.json(
//         { error: "Invalid stock quantity" },
//         { status: 400 },
//       );
//     }

//     const product = await prisma.product.create({
//       data: {
//         name: name.trim(),
//         description: description.trim(),
//         price: Math.round(numericPrice),
//         image: image.trim(),
//         category: category.trim(),
//         stock: numericStock,
//       },
//     });

//     return Response.json(
//       {
//         message: "Product created successfully",
//         product,
//       },
//       { status: 201 },
//     );
//   } catch (error) {
//     console.error("Create product error:", error);

//     return Response.json(
//       {
//         error:
//           error instanceof Error ? error.message : "Failed to create product",
//       },
//       { status: 500 },
//     );
//   }
// }

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { productSchema } from "@/lib/validations/product";

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();

    if (!admin) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (admin.role !== "ADMIN") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const result = productSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        {
          error: result.error.issues[0].message,
        },
        { status: 400 },
      );
    }

    const product = await prisma.product.create({
      data: {
        name: result.data.name,
        description: result.data.description,
        price: result.data.price,
        image: result.data.image,
        category: result.data.category,
        stock: result.data.stock,
        cloudinaryPublicId: result.data.cloudinaryPublicId,
      },
    });

    return Response.json(
      {
        message: "Product created successfully",
        product,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create product error:", error);

    return Response.json(
      {
        error: "Failed to create product",
      },
      { status: 500 },
    );
  }
}
