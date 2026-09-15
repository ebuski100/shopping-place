import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

type RouteContext = {
  params: Promise<{
    customerId: string;
  }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    // 1. Make sure the requester is an admin
    const admin = await requireAdmin();

    if (!admin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // 2. Get customer ID
    const { customerId } = await params;

    const id = Number(customerId);

    if (!Number.isInteger(id)) {
      return Response.json({ error: "Invalid customer ID" }, { status: 400 });
    }

    // 3. Read request body
    const body = await request.json();

    const isActive = body.isActive;

    if (typeof isActive !== "boolean") {
      return Response.json(
        { error: "isActive must be a boolean" },
        { status: 400 },
      );
    }

    // 4. Find customer
    const customer = await prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!customer) {
      return Response.json({ error: "Customer not found" }, { status: 404 });
    }

    // 5. Make sure this is actually a customer
    if (customer.role !== "CUSTOMER") {
      return Response.json(
        { error: "This account is not a customer account" },
        { status: 400 },
      );
    }

    // 6. Don't perform unnecessary updates
    if (customer.isActive === isActive) {
      return Response.json({
        message: `Customer is already ${isActive ? "active" : "inactive"}`,
        customer,
      });
    }

    // 7. Deactivate customer
    if (!isActive) {
      const updatedCustomer = await prisma.$transaction(async (tx) => {
        // Disable account
        const updated = await tx.user.update({
          where: {
            id,
          },
          data: {
            isActive: false,
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
          },
        });

        // Immediately invalidate all existing sessions
        await tx.session.deleteMany({
          where: {
            userId: id,
          },
        });

        return updated;
      });

      return Response.json({
        message: "Customer deactivated successfully",
        customer: updatedCustomer,
      });
    }

    // 8. Activate customer
    const updatedCustomer = await prisma.user.update({
      where: {
        id,
      },
      data: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    return Response.json({
      message: "Customer activated successfully",
      customer: updatedCustomer,
    });
  } catch (error) {
    console.error("Admin customer status update error:", error);

    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update customer",
      },
      { status: 500 },
    );
  }
}
