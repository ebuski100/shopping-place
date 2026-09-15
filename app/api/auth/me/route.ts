import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return Response.json({ user: null }, { status: 200 });
    }

    return Response.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error("Auth check error:", error);

    return Response.json(
      { error: "Failed to check authentication" },
      { status: 500 },
    );
  }
}
