import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    // --------------------------------------------------
    // 1. Authenticate admin
    // --------------------------------------------------

    const user = await getCurrentUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "ADMIN") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // --------------------------------------------------
    // 2. Read analytics range
    // --------------------------------------------------

    const { searchParams } = new URL(request.url);

    const range = searchParams.get("range") ?? "30d";

    const allowedRanges = ["7d", "30d", "90d", "all"];

    if (!allowedRanges.includes(range)) {
      return Response.json(
        { error: "Invalid analytics range" },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // 3. Calculate start date
    // --------------------------------------------------

    let startDate: Date | undefined;

    if (range !== "all") {
      const days = Number(range.replace("d", ""));

      startDate = new Date();

      startDate.setDate(startDate.getDate() - days);

      startDate.setHours(0, 0, 0, 0);
    }

    // --------------------------------------------------
    // 4. Shared date filter
    // --------------------------------------------------

    const dateFilter = startDate
      ? {
          createdAt: {
            gte: startDate,
          },
        }
      : undefined;

    // --------------------------------------------------
    // 5. Fetch analytics data
    // --------------------------------------------------

    const [
      paidOrders,
      totalOrders,
      totalCustomers,
      totalProducts,
      pendingOrders,
      lowStockProducts,
      orderStatusCounts,
      topProducts,
      topCustomers,
      recentOrders,
    ] = await Promise.all([
      // ------------------------------------------------
      // Paid orders
      // ------------------------------------------------

      prisma.order.findMany({
        where: {
          paymentStatus: "PAID",
          ...dateFilter,
        },
        select: {
          id: true,
          total: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      }),

      // ------------------------------------------------
      // Orders in selected period
      // ------------------------------------------------

      prisma.order.count({
        where: dateFilter,
      }),

      // ------------------------------------------------
      // Total customers
      // ------------------------------------------------

      prisma.user.count({
        where: {
          role: "CUSTOMER",
        },
      }),

      // ------------------------------------------------
      // Active products
      // ------------------------------------------------

      prisma.product.count({
        where: {
          isActive: true,
        },
      }),

      // ------------------------------------------------
      // Pending orders in selected period
      // ------------------------------------------------

      prisma.order.count({
        where: {
          status: "PENDING",
          ...dateFilter,
        },
      }),

      // ------------------------------------------------
      // Low-stock products
      // ------------------------------------------------

      prisma.product.count({
        where: {
          isActive: true,
          stock: {
            lte: 5,
          },
        },
      }),

      // ------------------------------------------------
      // Orders by status
      // ------------------------------------------------

      prisma.order.groupBy({
        by: ["status"],
        where: dateFilter,
        _count: {
          id: true,
        },
      }),

      // ------------------------------------------------
      // Product analytics
      // ------------------------------------------------

      prisma.orderItem.findMany({
        where: {
          order: {
            paymentStatus: "PAID",
            ...dateFilter,
          },
        },
        select: {
          productId: true,
          productName: true,
          price: true,
          quantity: true,
        },
      }),

      // ------------------------------------------------
      // Customer analytics
      // ------------------------------------------------

      prisma.order.findMany({
        where: {
          paymentStatus: "PAID",
          ...dateFilter,
        },
        select: {
          userId: true,
          total: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),

      // ------------------------------------------------
      // Recent orders
      // ------------------------------------------------

      prisma.order.findMany({
        take: 8,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          total: true,
          status: true,
          paymentStatus: true,
          createdAt: true,
          fullName: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    // --------------------------------------------------
    // 6. Calculate total revenue
    // --------------------------------------------------

    const totalRevenue = paidOrders.reduce(
      (sum, order) => sum + order.total,
      0,
    );

    // --------------------------------------------------
    // 7. Build revenue by date
    // --------------------------------------------------

    const revenueByDate = new Map<string, number>();

    for (const order of paidOrders) {
      const date = order.createdAt.toISOString().split("T")[0];

      revenueByDate.set(date, (revenueByDate.get(date) ?? 0) + order.total);
    }

    // --------------------------------------------------
    // 8. Fill missing dates with zero
    // --------------------------------------------------

    const revenue: {
      date: string;
      amount: number;
    }[] = [];

    if (range === "all") {
      for (const [date, amount] of revenueByDate) {
        revenue.push({
          date,
          amount,
        });
      }
    } else {
      const days = Number(range.replace("d", ""));

      const currentDate = new Date();

      currentDate.setHours(0, 0, 0, 0);

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(currentDate);

        date.setDate(currentDate.getDate() - i);

        const dateString = date.toISOString().split("T")[0];

        revenue.push({
          date: dateString,
          amount: revenueByDate.get(dateString) ?? 0,
        });
      }
    }

    // --------------------------------------------------
    // 9. Order status analytics
    // --------------------------------------------------

    const ordersByStatus = orderStatusCounts.reduce(
      (result, item) => {
        result[item.status] = item._count.id;

        return result;
      },
      {} as Record<string, number>,
    );

    // --------------------------------------------------
    // 10. Top products
    // --------------------------------------------------

    const productMap = new Map<
      number,
      {
        productId: number;
        productName: string;
        unitsSold: number;
        revenue: number;
      }
    >();

    for (const item of topProducts) {
      const existing = productMap.get(item.productId);

      const itemRevenue = item.price * item.quantity;

      if (existing) {
        existing.unitsSold += item.quantity;
        existing.revenue += itemRevenue;
      } else {
        productMap.set(item.productId, {
          productId: item.productId,
          productName: item.productName,
          unitsSold: item.quantity,
          revenue: itemRevenue,
        });
      }
    }

    const topSellingProducts = Array.from(productMap.values())
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 10);

    // --------------------------------------------------
    // 11. Top customers
    // --------------------------------------------------

    const customerMap = new Map<
      number,
      {
        customerId: number;
        name: string | null;
        email: string;
        orderCount: number;
        totalSpent: number;
      }
    >();

    for (const order of topCustomers) {
      const existing = customerMap.get(order.userId);

      if (existing) {
        existing.orderCount += 1;
        existing.totalSpent += order.total;
      } else {
        customerMap.set(order.userId, {
          customerId: order.userId,
          name: order.user.name,
          email: order.user.email,
          orderCount: 1,
          totalSpent: order.total,
        });
      }
    }

    const topCustomersData = Array.from(customerMap.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    // --------------------------------------------------
    // 12. Serialize recent orders
    // --------------------------------------------------

    const recentOrdersData = recentOrders.map((order) => ({
      ...order,
      createdAt: order.createdAt.toISOString(),
    }));

    // 13. Return analytics

    return Response.json({
      overview: {
        totalRevenue,
        totalOrders,
        totalCustomers,
        totalProducts,
        pendingOrders,
        lowStockProducts,
      },

      revenue,

      ordersByStatus,

      topProducts: topSellingProducts,

      topCustomers: topCustomersData,

      recentOrders: recentOrdersData,
    });
  } catch (error) {
    console.error("Admin analytics error:", error);

    return Response.json(
      {
        error: "Failed to fetch analytics",
      },
      {
        status: 500,
      },
    );
  }
}
