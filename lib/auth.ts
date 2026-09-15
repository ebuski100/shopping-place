import { cookies } from "next/headers";
import { prisma } from "./prisma";

export async function getCurrentUser() {
  const cookieStore = await cookies();

  const sessionId = cookieStore.get("sessionId")?.value;

  if (!sessionId) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: {
      id: sessionId,
    },
    include: {
      user: true,
    },
  });

  if (!session) {
    return null;
  }

  // Check whether the session has expired
  if (session.expiresAt < new Date()) {
    // Use deleteMany so this does not throw
    // if another request has already deleted the session.
    await prisma.session.deleteMany({
      where: {
        id: session.id,
      },
    });

    return null;
  }

  // Check whether the account is active
  if (!session.user.isActive) {
    // Invalidate the database session.
    //
    // We intentionally do NOT delete the cookie here because
    // getCurrentUser() can be called from Server Components,
    // where cookies cannot be modified.
    await prisma.session.deleteMany({
      where: {
        id: session.id,
      },
    });

    return null;
  }

  return session.user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  if (user.role !== "ADMIN") {
    return null;
  }

  return user;
}
