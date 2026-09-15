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
    const body = await request.json();

    const data: {
      theme?: Theme;
      orderNotifications?: boolean;
      deliveryNotifications?: boolean;
      promotionalNotifications?: boolean;
    } = {};

    if (body.theme !== undefined) {
      if (!VALID_THEMES.includes(body.theme)) {
        return NextResponse.json({ error: "Invalid theme" }, { status: 400 });
      }

      data.theme = body.theme;
    }

    if (body.orderNotifications !== undefined) {
      if (typeof body.orderNotifications !== "boolean") {
        return NextResponse.json(
          { error: "Invalid order notification value" },
          { status: 400 },
        );
      }

      data.orderNotifications = body.orderNotifications;
    }

    if (body.deliveryNotifications !== undefined) {
      if (typeof body.deliveryNotifications !== "boolean") {
        return NextResponse.json(
          {
            error: "Invalid delivery notification value",
          },
          { status: 400 },
        );
      }

      data.deliveryNotifications = body.deliveryNotifications;
    }

    if (body.promotionalNotifications !== undefined) {
      if (typeof body.promotionalNotifications !== "boolean") {
        return NextResponse.json(
          {
            error: "Invalid promotional notification value",
          },
          { status: 400 },
        );
      }

      data.promotionalNotifications = body.promotionalNotifications;
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
