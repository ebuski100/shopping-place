import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { productSchema } from "@/lib/validations/product";

type RouteContext = {
  params: Promise<{
    productId: string;
  }>;
};

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    await requireAdmin();

    const { productId } = await params;

    const id = Number(productId);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 },
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const result = productSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error.issues[0].message,
        },
        { status: 400 },
      );
    }

    const existingProduct = await prisma.product.findUnique({
      where: {
        id,
      },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const product = await prisma.product.update({
      where: {
        id,
      },
      data: result.data,
    });

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Admin product update error:", error);

    return NextResponse.json(
      {
        error: "Failed to update product",
      },
      {
        status: 500,
      },
    );
  }
}
