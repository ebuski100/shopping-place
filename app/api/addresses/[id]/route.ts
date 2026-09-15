import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { addressSchema } from "@/lib/validations/address";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const addressId = Number(id);

    if (!Number.isInteger(addressId)) {
      return Response.json({ error: "Invalid address ID" }, { status: 400 });
    }

    const existingAddress = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId: user.id,
      },
    });

    if (!existingAddress) {
      return Response.json({ error: "Address not found" }, { status: 404 });
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const result = addressSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        {
          error: result.error.issues[0].message,
        },
        { status: 400 },
      );
    }

    const data = result.data;

    const address = await prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.address.updateMany({
          where: {
            userId: user.id,
            isDefault: true,
            id: {
              not: addressId,
            },
          },
          data: {
            isDefault: false,
          },
        });
      }

      return tx.address.update({
        where: {
          id: addressId,
        },
        data,
      });
    });

    return Response.json({
      message: "Address updated successfully",
      address,
    });
  } catch (error) {
    console.error("Update address error:", error);

    return Response.json(
      {
        error: "Failed to update address",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const addressId = Number(id);

    if (!Number.isInteger(addressId)) {
      return Response.json({ error: "Invalid address ID" }, { status: 400 });
    }

    const existingAddress = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId: user.id,
      },
    });

    if (!existingAddress) {
      return Response.json({ error: "Address not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.address.delete({
        where: {
          id: addressId,
        },
      });

      // If the deleted address was the default,
      // make the newest remaining address default.
      if (existingAddress.isDefault) {
        const nextAddress = await tx.address.findFirst({
          where: {
            userId: user.id,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        if (nextAddress) {
          await tx.address.update({
            where: {
              id: nextAddress.id,
            },
            data: {
              isDefault: true,
            },
          });
        }
      }
    });

    return Response.json({
      message: "Address deleted successfully",
    });
  } catch (error) {
    console.error("Delete address error:", error);

    return Response.json(
      {
        error: "Failed to delete address",
      },
      { status: 500 },
    );
  }
}
