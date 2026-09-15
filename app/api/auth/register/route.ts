import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { registerSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // ---------------------------------------
    // Validate and normalize input with Zod
    // ---------------------------------------

    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        {
          error: result.error.issues[0].message,
        },
        { status: 400 },
      );
    }

    const { name, email, password } = result.data;

    // ---------------------------------------
    // Check if user already exists
    // ---------------------------------------

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return Response.json(
        {
          error: "A user with this email already exists",
        },
        { status: 409 },
      );
    }

    // ---------------------------------------
    // Hash password
    // ---------------------------------------

    const hashedPassword = await bcrypt.hash(password, 12);

    // ---------------------------------------
    // Create user + cart
    // ---------------------------------------

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,

        cart: {
          create: {},
        },
      },

      // Never return the password
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    // ---------------------------------------
    // Create session
    // ---------------------------------------

    const sessionId = randomBytes(32).toString("hex");

    // Session expires in 7 days
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        expiresAt,
      },
    });

    // ---------------------------------------
    // Store session ID in HttpOnly cookie
    // ---------------------------------------

    const cookieStore = await cookies();

    cookieStore.set("sessionId", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });

    // ---------------------------------------
    // Return successful response
    // ---------------------------------------

    return Response.json(
      {
        message: "User registered successfully",
        user,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error:", error);

    return Response.json(
      {
        error: "Failed to register user",
      },
      { status: 500 },
    );
  }
}
