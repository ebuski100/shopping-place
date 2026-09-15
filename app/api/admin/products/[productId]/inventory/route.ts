import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { productIdSchema } from "@/lib/validations/product";

type RouteContext = {
  params: Promise<{
    productId: string;
  }>;
};

const allowedTypes = [
  "RESTOCK",
  "ADJUSTMENT",
  "DAMAGED",
  "RETURN",
  "ORDER",
] as const;

type InventoryTransactionType = (typeof allowedTypes)[number];

export async function POST(request: Request, { params }: RouteContext) {
  try {
    // ------------------------------------------
    // 1. Authentication
    // ------------------------------------------

    const admin = await requireAdmin();

    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ------------------------------------------
    // 2. Validate product ID
    // ------------------------------------------

    const { productId } = await params;

    const idResult = productIdSchema.safeParse(productId);

    if (!idResult.success) {
      return NextResponse.json(
        {
          error: idResult.error.issues[0].message,
        },
        { status: 400 },
      );
    }

    const id = idResult.data;

    // ------------------------------------------
    // 3. Parse JSON
    // ------------------------------------------

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (typeof body !== "object" || body === null) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const data = body as Record<string, unknown>;

    // ------------------------------------------
    // 4. Validate quantity
    // ------------------------------------------

    const quantity = Number(data.quantity);

    if (!Number.isInteger(quantity) || quantity === 0) {
      return NextResponse.json(
        {
          error: "Quantity must be a non-zero integer",
        },
        { status: 400 },
      );
    }

    // ------------------------------------------
    // 5. Validate transaction type
    // ------------------------------------------

    const type = data.type;

    if (
      typeof type !== "string" ||
      !allowedTypes.includes(type as InventoryTransactionType)
    ) {
      return NextResponse.json(
        {
          error: "Invalid inventory transaction type",
        },
        { status: 400 },
      );
    }

    const transactionType = type as InventoryTransactionType;

    // ------------------------------------------
    // 6. Validate reason
    // ------------------------------------------

    let reason: string | null = null;

    if (data.reason !== undefined) {
      if (typeof data.reason !== "string") {
        return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
      }

      reason = data.reason.trim() || null;
    }

    // ------------------------------------------
    // 7. Update inventory atomically
    // ------------------------------------------

    const result = await prisma.$transaction(async (tx) => {
      let updatedProduct;

      if (quantity > 0) {
        // ------------------------------------
        // Increasing stock
        // ------------------------------------

        updatedProduct = await tx.product.update({
          where: {
            id,
          },
          data: {
            stock: {
              increment: quantity,
            },
          },
        });
      } else {
        // ------------------------------------
        // Decreasing stock
        // ------------------------------------

        const decreaseAmount = Math.abs(quantity);

        const updateResult = await tx.product.updateMany({
          where: {
            id,
            stock: {
              gte: decreaseAmount,
            },
          },
          data: {
            stock: {
              decrement: decreaseAmount,
            },
          },
        });

        // No row updated means either:
        // - product doesn't exist
        // - insufficient stock
        if (updateResult.count === 0) {
          const product = await tx.product.findUnique({
            where: {
              id,
            },
            select: {
              id: true,
              stock: true,
            },
          });

          if (!product) {
            throw new Error("PRODUCT_NOT_FOUND");
          }

          throw new Error("INSUFFICIENT_STOCK");
        }

        updatedProduct = await tx.product.findUniqueOrThrow({
          where: {
            id,
          },
        });
      }

      // ------------------------------------
      // Record inventory transaction
      // ------------------------------------

      const transaction = await tx.inventoryTransaction.create({
        data: {
          productId: id,
          quantity,
          type: transactionType,
          reason,
        },
      });

      return {
        product: updatedProduct,
        transaction,
      };
    });

    // ------------------------------------------
    // 8. Success
    // ------------------------------------------

    return NextResponse.json({
      message: "Inventory updated successfully",
      stock: result.product.stock,
      transaction: result.transaction,
    });
  } catch (error) {
    // ------------------------------------------
    // Expected business errors
    // ------------------------------------------

    if (error instanceof Error && error.message === "PRODUCT_NOT_FOUND") {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (error instanceof Error && error.message === "INSUFFICIENT_STOCK") {
      return NextResponse.json(
        {
          error: "Insufficient stock",
        },
        { status: 409 },
      );
    }

    // ------------------------------------------
    // Unexpected errors
    // ------------------------------------------

    console.error("Inventory update error:", error);

    return NextResponse.json(
      {
        error: "Failed to update inventory",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: Request, { params }: RouteContext) {
  try {
    // ------------------------------------------
    // 1. Authentication / authorization
    // ------------------------------------------

    const admin = await requireAdmin();

    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ------------------------------------------
    // 2. Validate product ID
    // ------------------------------------------

    const { productId } = await params;

    const idResult = productIdSchema.safeParse(productId);

    if (!idResult.success) {
      return NextResponse.json(
        {
          error: idResult.error.issues[0].message,
        },
        { status: 400 },
      );
    }

    const id = idResult.data;

    // ------------------------------------------
    // 3. Find product
    // ------------------------------------------

    const product = await prisma.product.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        stock: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // ------------------------------------------
    // 4. Get inventory history
    // ------------------------------------------

    const transactions = await prisma.inventoryTransaction.findMany({
      where: {
        productId: id,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        quantity: true,
        type: true,
        reason: true,
        createdAt: true,
      },
    });

    // ------------------------------------------
    // 5. Return response
    // ------------------------------------------

    return NextResponse.json({
      product,
      transactions,
    });
  } catch (error) {
    console.error("Inventory history error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch inventory history",
      },
      { status: 500 },
    );
  }
}
