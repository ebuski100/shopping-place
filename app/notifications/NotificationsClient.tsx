"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Notification = {
  id: number;
  type: "ORDER" | "DELIVERY" | "PROMOTION";
  title: string;
  message: string;
  orderId: number | null;
  readAt: string | null;
  createdAt: string;
};

function formatNotificationDate(date: string) {
  const notificationDate = new Date(date);
  const now = new Date();

  const difference = now.getTime() - notificationDate.getTime();

  const minutes = Math.floor(difference / (1000 * 60));
  const hours = Math.floor(difference / (1000 * 60 * 60));
  const days = Math.floor(difference / (1000 * 60 * 60 * 24));

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  if (hours < 24) {
    return `${hours}h ago`;
  }

  if (days < 7) {
    return `${days}d ago`;
  }

  return notificationDate.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getNotificationIcon(type: Notification["type"]) {
  switch (type) {
    case "ORDER":
      return "📦";

    case "DELIVERY":
      return "🚚";

    case "PROMOTION":
      return "🎉";

    default:
      return "🔔";
  }
}

export default function NotificationsClient() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  async function fetchNotifications() {
    try {
      setLoading(true);

      const response = await fetch("/api/notifications");

      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const data = await response.json();

      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function markAsRead(notificationId: number) {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notificationId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to mark notification as read");
      }

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                readAt: new Date().toISOString(),
              }
            : notification,
        ),
      );

      setUnreadCount((current) => Math.max(0, current - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  }

  async function markAllAsRead() {
    if (unreadCount === 0 || markingAll) {
      return;
    }

    try {
      setMarkingAll(true);

      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          markAllRead: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to mark notifications as read");
      }

      const now = new Date().toISOString();

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          readAt: notification.readAt ?? now,
        })),
      );

      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    } finally {
      setMarkingAll(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="h-9 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />

        <div className="h-24 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />

        <div className="h-24 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />

        <div className="h-24 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Notifications
          </h1>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Stay updated about your orders and account.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllAsRead}
            disabled={markingAll}
            className="self-start rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800 sm:self-auto"
          >
            {markingAll ? "Marking as read..." : "Mark all as read"}
          </button>
        )}
      </div>

      {/* Empty state */}

      {notifications.length === 0 ? (
        <div className="rounded-2xl border bg-white px-6 py-16 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="text-4xl">🔔</div>

          <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
            No notifications yet
          </h2>

          <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
            We'll let you know when there are updates about your orders or
            account.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          {notifications.map((notification) => {
            const unread = !notification.readAt;

            const content = (
              <div
                className={`flex gap-4 border-b p-5 transition last:border-b-0 ${
                  unread
                    ? "bg-blue-50/60 dark:bg-blue-950/20"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                }`}
              >
                {/* Icon */}

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-lg dark:bg-gray-800">
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <h2
                        className={`text-sm ${
                          unread
                            ? "font-semibold text-gray-900 dark:text-white"
                            : "font-medium text-gray-800 dark:text-gray-200"
                        }`}
                      >
                        {notification.title}
                      </h2>

                      {unread && (
                        <span
                          className="h-2 w-2 rounded-full bg-blue-600"
                          aria-label="Unread"
                        />
                      )}
                    </div>

                    <span className="shrink-0 text-xs text-gray-400">
                      {formatNotificationDate(notification.createdAt)}
                    </span>
                  </div>

                  <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
                    {notification.message}
                  </p>

                  {notification.orderId && (
                    <span className="mt-2 inline-block text-xs font-medium text-gray-500 dark:text-gray-400">
                      Order #{notification.orderId}
                    </span>
                  )}
                </div>
              </div>
            );

            if (notification.orderId) {
              return (
                <Link
                  key={notification.id}
                  href={`/orders/${notification.orderId}`}
                  onClick={() => {
                    if (unread) {
                      markAsRead(notification.id);
                    }
                  }}
                  className="block"
                >
                  {content}
                </Link>
              );
            }

            return (
              <button
                key={notification.id}
                type="button"
                onClick={() => {
                  if (unread) {
                    markAsRead(notification.id);
                  }
                }}
                className="block w-full text-left"
              >
                {content}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
