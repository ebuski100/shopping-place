import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    const admin = await requireAdmin();

    if (!admin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return Response.json({
      orders,
    });
  } catch (error) {
    console.error("Admin orders error:", error);

    return Response.json(
      {
        error: "Failed to fetch orders",
      },
      { status: 500 },
    );
  }
}
