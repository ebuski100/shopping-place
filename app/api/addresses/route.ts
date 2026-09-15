import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { addressSchema } from "@/lib/validations/address";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const addresses = await prisma.address.findMany({
      where: {
        userId: user.id,
      },
      orderBy: [
        {
          isDefault: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
    });

    return Response.json({
      addresses,
    });
  } catch (error) {
    console.error("Get addresses error:", error);

    return Response.json(
      {
        error: "Failed to fetch addresses",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
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
      // If this is the first address, automatically
      // make it the default address.
      const addressCount = await tx.address.count({
        where: {
          userId: user.id,
        },
      });

      const shouldBeDefault = addressCount === 0 || data.isDefault;

      // If this address is becoming the default,
      // remove default status from other addresses.
      if (shouldBeDefault) {
        await tx.address.updateMany({
          where: {
            userId: user.id,
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });
      }

      return tx.address.create({
        data: {
          userId: user.id,
          label: data.label,
          fullName: data.fullName,
          phone: data.phone,
          address: data.address,
          city: data.city,
          state: data.state,
          country: data.country,
          isDefault: shouldBeDefault,
        },
      });
    });

    return Response.json(
      {
        message: "Address created successfully",
        address,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create address error:", error);

    return Response.json(
      {
        error: "Failed to create address",
      },
      { status: 500 },
    );
  }
}
