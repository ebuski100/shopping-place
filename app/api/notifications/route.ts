import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notifications = await prisma.notification.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  });

  const unreadCount = notifications.filter(
    (notification) => notification.readAt === null,
  ).length;

  return NextResponse.json({
    notifications,
    unreadCount,
  });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (body.all === true) {
      await prisma.notification.updateMany({
        where: {
          userId: user.id,
          readAt: null,
        },
        data: {
          readAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
      });
    }

    const id = Number(body.id);

    if (!Number.isInteger(id)) {
      return NextResponse.json(
        { error: "Invalid notification ID" },
        { status: 400 },
      );
    }

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 },
      );
    }

    await prisma.notification.update({
      where: {
        id,
      },
      data: {
        readAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 },
    );
  }
}
