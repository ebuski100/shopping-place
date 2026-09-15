import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  try {
    await requireAdmin();

    const { productId } = await params;

    const id = Number(productId);

    if (!Number.isInteger(id)) {
      return Response.json({ error: "Invalid product ID" }, { status: 400 });
    }

    const body = await request.json();

    if (typeof body.isActive !== "boolean") {
      return Response.json(
        { error: "isActive must be a boolean" },
        { status: 400 },
      );
    }

    const product = await prisma.product.findUnique({
      where: {
        id,
      },
    });

    if (!product) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    const updatedProduct = await prisma.product.update({
      where: {
        id,
      },
      data: {
        isActive: body.isActive,
      },
    });

    return Response.json({
      success: true,
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Product status update error:", error);

    return Response.json(
      {
        error: "Failed to update product status",
      },
      { status: 500 },
    );
  }
}
