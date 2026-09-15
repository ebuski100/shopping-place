import { NotificationType } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type CreateNotificationInput = {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  orderId?: number;
};

export async function createNotification({
  userId,
  type,
  title,
  message,
  orderId,
}: CreateNotificationInput) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      orderNotifications: true,
      deliveryNotifications: true,
      promotionalNotifications: true,
    },
  });

  if (!user) {
    return null;
  }

  const enabled =
    type === NotificationType.ORDER
      ? user.orderNotifications
      : type === NotificationType.DELIVERY
        ? user.deliveryNotifications
        : user.promotionalNotifications;

  if (!enabled) {
    return null;
  }

  return prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      orderId,
    },
  });
}

export function createOrderNotification(
  userId: number,
  title: string,
  message: string,
  orderId?: number,
) {
  return createNotification({
    userId,
    type: NotificationType.ORDER,
    title,
    message,
    orderId,
  });
}

export function createDeliveryNotification(
  userId: number,
  title: string,
  message: string,
  orderId?: number,
) {
  return createNotification({
    userId,
    type: NotificationType.DELIVERY,
    title,
    message,
    orderId,
  });
}

export function createPromotionNotification(
  userId: number,
  title: string,
  message: string,
) {
  return createNotification({
    userId,
    type: NotificationType.PROMOTION,
    title,
    message,
  });
}
