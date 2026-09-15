import { getCurrentUser } from "@/lib/auth";
import { deleteCloudinaryImage } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function DELETE() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Never allow the store to end up without an admin.
    if (user.role === "ADMIN") {
      const adminCount = await prisma.user.count({
        where: {
          role: "ADMIN",
          isActive: true,
        },
      });

      if (adminCount <= 1) {
        return Response.json(
          {
            error: "You cannot delete the only active admin account.",
          },
          { status: 400 },
        );
      }
    }

    if (user.profileImagePublicId) {
      await deleteCloudinaryImage(user.profileImagePublicId);
    }

    await prisma.user.delete({
      where: {
        id: user.id,
      },
    });

    const cookieStore = await cookies();
    cookieStore.delete("sessionId");

    return Response.json({
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Account deletion error:", error);

    return Response.json(
      {
        error: "Failed to delete account",
      },
      { status: 500 },
    );
  }
}
