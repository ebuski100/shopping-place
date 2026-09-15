import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateAccountSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),
});

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    return Response.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Account GET error:", error);

    return Response.json({ error: "Failed to load account" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
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

    const result = updateAccountSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        {
          error: result.error.issues[0].message,
        },
        { status: 400 },
      );
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        name: result.data.name,
      },
      select: {
        id: true,
        name: true,
        email: true,
        profileImage: true,
        role: true,
      },
    });

    return Response.json({
      message: "Account updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Account PATCH error:", error);

    return Response.json(
      { error: "Failed to update account" },
      { status: 500 },
    );
  }
}
