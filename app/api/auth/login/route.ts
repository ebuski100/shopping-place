import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { loginSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    // 1. Get request body
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // 2. Validate and normalize input with Zod
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        {
          error: result.error.issues[0].message,
        },
        { status: 400 },
      );
    }

    const { email, password } = result.data;

    // 3. Find the user
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    // Don't reveal whether the email exists
    if (!user) {
      return Response.json(
        {
          error: "Invalid email or password",
        },
        { status: 401 },
      );
    }

    if (!user.password) {
      return Response.json(
        {
          error:
            "This account uses social login. Please continue with Google or GitHub.",
        },
        { status: 400 },
      );
    }

    // 4. Compare submitted password with hashed password
    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return Response.json(
        {
          error: "Invalid email or password",
        },
        { status: 401 },
      );
    }

    // 5. Check whether the account is active
    if (!user.isActive) {
      return Response.json(
        {
          error: "Your account has been deactivated. Please contact support.",
        },
        { status: 403 },
      );
    }

    // 6. Create a random session ID
    const sessionId = randomBytes(32).toString("hex");

    // 7. Session expires in 7 days
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // 8. Save session in database
    await prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        expiresAt,
      },
    });

    // 9. Store session ID in an HttpOnly cookie
    const cookieStore = await cookies();

    cookieStore.set("sessionId", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });

    // 10. Return successful login
    return Response.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return Response.json(
      {
        error: "Failed to login",
      },
      { status: 500 },
    );
  }
}
