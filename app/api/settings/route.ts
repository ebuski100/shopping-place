import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_THEMES = ["light", "dark", "system"] as const;

type Theme = (typeof VALID_THEMES)[number];

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.user.findUnique({
    where: {
      id: user.id,
    },
    select: {
      theme: true,
      orderNotifications: true,
      deliveryNotifications: true,
      promotionalNotifications: true,
      notificationSounds: true,
    },
  });

  if (!settings) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(settings);
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: unknown = await request.json();

    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid settings payload" },
        { status: 400 },
      );
    }

    const input = body as Record<string, unknown>;

    const data: {
      theme?: Theme;
      orderNotifications?: boolean;
      deliveryNotifications?: boolean;
      promotionalNotifications?: boolean;
      notificationSounds?: boolean;
    } = {};

    if (input.theme !== undefined) {
      if (
        typeof input.theme !== "string" ||
        !VALID_THEMES.includes(input.theme as Theme)
      ) {
        return NextResponse.json({ error: "Invalid theme" }, { status: 400 });
      }

      data.theme = input.theme as Theme;
    }

    if (input.orderNotifications !== undefined) {
      if (typeof input.orderNotifications !== "boolean") {
        return NextResponse.json(
          { error: "Invalid order notification value" },
          { status: 400 },
        );
      }

      data.orderNotifications = input.orderNotifications;
    }

    if (input.deliveryNotifications !== undefined) {
      if (typeof input.deliveryNotifications !== "boolean") {
        return NextResponse.json(
          { error: "Invalid delivery notification value" },
          { status: 400 },
        );
      }

      data.deliveryNotifications = input.deliveryNotifications;
    }

    if (input.promotionalNotifications !== undefined) {
      if (typeof input.promotionalNotifications !== "boolean") {
        return NextResponse.json(
          { error: "Invalid promotional notification value" },
          { status: 400 },
        );
      }

      data.promotionalNotifications = input.promotionalNotifications;
    }

    if (input.notificationSounds !== undefined) {
      if (typeof input.notificationSounds !== "boolean") {
        return NextResponse.json(
          { error: "Invalid notification sound preference" },
          { status: 400 },
        );
      }

      data.notificationSounds = input.notificationSounds;
    }

    const settings = await prisma.user.update({
      where: {
        id: user.id,
      },
      data,
      select: {
        theme: true,
        orderNotifications: true,
        deliveryNotifications: true,
        promotionalNotifications: true,
        notificationSounds: true,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating settings:", error);

    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 },
    );
  }
}
