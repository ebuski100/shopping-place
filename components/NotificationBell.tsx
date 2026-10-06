"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  getNotificationSound,
  playNotificationSound,
} from "@/lib/notification-sounds";

type Notification = {
  id: number;
  type: "ORDER" | "DELIVERY" | "PROMOTION";
  title: string;
  message: string;
  orderId: number | null;
  readAt: string | null;
  createdAt: string;
};

type NotificationsResponse = {
  notifications: Notification[];
  unreadCount: number;
};

type SettingsResponse = {
  notificationSounds: boolean;
};

function formatRelativeTime(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);

  if (seconds < 60) {
    return "Just now";
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days}d ago`;
  }

  return new Date(date).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
  });
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notificationRef = useRef<HTMLDivElement>(null);

  const [unreadCount, setUnreadCount] = useState(0);

  const [open, setOpen] = useState(false);

  const [loading, setLoading] = useState(false);

  // Keeps track of notifications we have already seen.
  // This prevents old notifications from playing a sound.
  const knownNotificationIds = useRef<Set<number>>(new Set());

  // The user's notification sound preference.
  const notificationSoundsEnabled = useRef(true);

  // Prevents the first fetch from being treated as new notifications.
  const initialFetchComplete = useRef(false);

  /**
   * Load the user's notification sound preference.
   */
  const loadNotificationSoundPreference = useCallback(async () => {
    try {
      const response = await fetch("/api/settings", {
        cache: "no-store",
      });

      if (!response.ok) {
        return;
      }

      const data: SettingsResponse = await response.json();

      notificationSoundsEnabled.current = data.notificationSounds;
    } catch {
      // Keep the default value if settings cannot be loaded.
    }
  }, []);

  /**
   * Fetch notifications and detect newly-created notifications.
   */
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/notifications", {
        cache: "no-store",
      });

      if (!response.ok) {
        return;
      }

      const data: NotificationsResponse = await response.json();

      /**
       * First fetch:
       *
       * We only establish a baseline.
       *
       * We DON'T play a sound because these notifications already existed
       * before the notification bell loaded.
       */
      if (!initialFetchComplete.current) {
        data.notifications.forEach((notification) => {
          knownNotificationIds.current.add(notification.id);
        });

        initialFetchComplete.current = true;
      } else {
        /**
         * Find notifications that weren't present during the previous poll.
         */
        const newNotifications = data.notifications.filter(
          (notification) => !knownNotificationIds.current.has(notification.id),
        );

        /**
         * Add all newly discovered notifications to our known set.
         */
        data.notifications.forEach((notification) => {
          knownNotificationIds.current.add(notification.id);
        });

        /**
         * Only play one sound per polling cycle.
         *
         * If several notifications arrive at once, we don't want
         * the browser to play several sounds on top of each other.
         *
         * The newest notification determines the sound.
         */
        if (newNotifications.length > 0 && notificationSoundsEnabled.current) {
          const newestNotification = [...newNotifications].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          )[0];

          const sound = getNotificationSound(
            newestNotification.title,
            newestNotification.message,
          );

          playNotificationSound(sound);
        }
      }

      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // Notification failures should not break the header.
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load settings and establish the initial notification baseline.
   */
  useEffect(() => {
    loadNotificationSoundPreference();
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 30_000);

    return () => clearInterval(interval);
  }, [fetchNotifications, loadNotificationSoundPreference]);

  useEffect(() => {
    function handleSoundPreferenceChange(event: Event) {
      const customEvent = event as CustomEvent<boolean>;

      notificationSoundsEnabled.current = customEvent.detail;
    }

    window.addEventListener(
      "notification-sounds-preference-change",
      handleSoundPreferenceChange,
    );

    return () => {
      window.removeEventListener(
        "notification-sounds-preference-change",
        handleSoundPreferenceChange,
      );
    };
  }, []);

  /**
   * Close the notification dropdown when clicking outside it.
   */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  async function markAsRead(id: number) {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        return;
      }

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id
            ? {
                ...notification,
                readAt: new Date().toISOString(),
              }
            : notification,
        ),
      );

      setUnreadCount((current) => Math.max(0, current - 1));
    } catch {
      // Ignore notification UI errors.
    }
  }

  async function markAllAsRead() {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ all: true }),
      });

      if (!response.ok) {
        return;
      }

      const now = new Date().toISOString();

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          readAt: notification.readAt ?? now,
        })),
      );

      setUnreadCount(0);
    } catch {
      // Ignore notification UI errors.
    }
  }

  function handleNotificationClick(notification: Notification) {
    if (!notification.readAt) {
      markAsRead(notification.id);
    }

    setOpen(false);
  }

  return (
    <div className="relative" ref={notificationRef}>
      {/* Bell */}

      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="relative rounded-full p-2 transition hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="currentColor"
          className="h-6 w-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9a6 6 0 1 0-12 0v.75a8.967 8.967 0 0 1-2.31 6.022c1.733.64 3.55 1.08 5.454 1.31m5.713 0a24.255 24.255 0 0 1-5.713 0m5.713 0a3 3 0 1 1-5.713 0"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}

      {open && (
        <div className="fixed right-15 top-13 z-51 flex max-h-[calc(90vh-5rem)] w-75 flex-col overflow-hidden rounded-xl border border-gray-600 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
          {/* Header */}

          <div className="flex items-center justify-between border-b px-4 py-3 dark:border-gray-800">
            <div>
              <h3 className="font-semibold">Notifications</h3>

              {unreadCount > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {unreadCount} unread
                </p>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs font-medium hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications */}

          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                  <span className="text-lg">🔔</span>
                </div>

                <p className="text-sm font-medium">No notifications</p>

                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  You're all caught up.
                </p>
              </div>
            ) : (
              notifications.slice(0, 8).map((notification) => {
                const content = (
                  <div
                    className={`border-b px-4 py-3 transition last:border-b-0 dark:border-gray-800 ${
                      notification.readAt
                        ? "bg-white dark:bg-gray-900"
                        : "bg-blue-50 dark:bg-blue-950/30"
                    }`}
                  >
                    <div className="flex gap-3">
                      {!notification.readAt && (
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                      )}

                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-medium">
                            {notification.title}
                          </p>

                          <span className="shrink-0 text-[11px] text-gray-400">
                            {formatRelativeTime(notification.createdAt)}
                          </span>
                        </div>

                        <p className="mt-1 text-xs leading-5 text-gray-600 dark:text-gray-400">
                          {notification.message}
                        </p>
                      </div>
                    </div>
                  </div>
                );

                if (notification.orderId) {
                  return (
                    <Link
                      key={notification.id}
                      href={`/orders/${notification.orderId}`}
                      onClick={() => handleNotificationClick(notification)}
                      className="block hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      {content}
                    </Link>
                  );
                }

                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className="block w-full text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    {content}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}

          <div className="border-t p-3 dark:border-gray-800">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block text-center text-sm font-medium hover:underline"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
