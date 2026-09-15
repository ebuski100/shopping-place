import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orderCount = await prisma.order.count({
      where: {
        userId: user.id,
      },
    });

    return Response.json({
      orderCount,
    });
  } catch (error) {
    console.error("Get order count error:", error);

    return Response.json(
      { error: "Failed to fetch order count" },
      { status: 500 },
    );
  }
}
