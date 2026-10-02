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
