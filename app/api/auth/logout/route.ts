import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("sessionId")?.value;

    if (sessionId) {
      await prisma.session.deleteMany({
        where: {
          id: sessionId,
        },
      });
    }

    cookieStore.delete("sessionId");

    return Response.json({
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);

    return Response.json(
      {
        error: "Failed to logout",
      },
      {
        status: 500,
      },
    );
  }
}
