"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

type Settings = {
  theme: Theme;
  orderNotifications: boolean;
  deliveryNotifications: boolean;
  promotionalNotifications: boolean;
};

const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  orderNotifications: true,
  deliveryNotifications: true,
  promotionalNotifications: true,
};

export default function SettingsClient() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch("/api/settings", { cache: "no-store" });

        if (!response.ok) {
          throw new Error("Failed to load settings");
        }

        const data: Settings = await response.json();

        setSettings(data);
        applyTheme(data.theme);
      } catch (error) {
        console.error("Error loading settings:", error);

        setError("Unable to load your settings.");
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  function applyTheme(theme: Theme) {
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
      return;
    }

    if (theme === "light") {
      root.classList.remove("dark");
      return;
    }

    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;

    root.classList.toggle("dark", prefersDark);
  }

  async function updateSetting(updates: Partial<Settings>) {
    const previousSettings = settings;

    const nextSettings = {
      ...settings,
      ...updates,
    };

    setSettings(nextSettings);

    if (updates.theme) {
      localStorage.setItem("theme", updates.theme);
      applyTheme(updates.theme);
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error("Failed to update settings");
      }

      const savedSettings: Settings = await response.json();

      setSettings(savedSettings);

      if (updates.theme) {
        applyTheme(savedSettings.theme);
        localStorage.setItem("theme", savedSettings.theme);
      }
    } catch (error) {
      console.error("Error updating settings:", error);

      setSettings(previousSettings);

      if (updates.theme) {
        applyTheme(previousSettings.theme);
        localStorage.setItem("theme", previousSettings.theme);
      }

      setError("Unable to save your setting. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-48 animate-pulse rounded-xl border bg-gray-100 dark:bg-gray-800" />

        <div className="h-64 animate-pulse rounded-xl border bg-gray-100 dark:bg-gray-800" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Appearance */}
      <section className="rounded-xl border bg-white dark:bg-gray-900 p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Appearance</h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Choose how the store looks on your device.
          </p>
        </div>

        <div>
          <label
            htmlFor="theme"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            Theme
          </label>

          <select
            id="theme"
            value={settings.theme}
            disabled={saving}
            onChange={(event) =>
              updateSetting({
                theme: event.target.value as Theme,
              })
            }
            className="w-full rounded-lg border bg-white dark:bg-gray-900 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black sm:max-w-sm"
          >
            <option value="system">System default</option>

            <option value="light">Light</option>

            <option value="dark">Dark</option>
          </select>
        </div>
      </section>

      {/* Notifications */}
      <section className="rounded-xl border bg-white dark:bg-gray-900 p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Choose which updates you want to receive.
          </p>
        </div>

        <div className="space-y-6">
          <NotificationToggle
            title="Order updates"
            description="Get notified when your order status changes."
            enabled={settings.orderNotifications}
            disabled={saving}
            onChange={(enabled) =>
              updateSetting({
                orderNotifications: enabled,
              })
            }
          />

          <NotificationToggle
            title="Delivery updates"
            description="Get notified about shipping and delivery."
            enabled={settings.deliveryNotifications}
            disabled={saving}
            onChange={(enabled) =>
              updateSetting({
                deliveryNotifications: enabled,
              })
            }
          />

          <NotificationToggle
            title="Promotions"
            description="Receive special offers and product promotions."
            enabled={settings.promotionalNotifications}
            disabled={saving}
            onChange={(enabled) =>
              updateSetting({
                promotionalNotifications: enabled,
              })
            }
          />
        </div>
      </section>
    </div>
  );
}

type NotificationToggleProps = {
  title: string;
  description: string;
  enabled: boolean;
  disabled?: boolean;
  onChange: (enabled: boolean) => void;
};

function NotificationToggle({
  title,
  description,
  enabled,
  disabled,
  onChange,
}: NotificationToggleProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">{title}</h3>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        disabled={disabled}
        onClick={() => onChange(!enabled)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          enabled ? "bg-black" : "bg-gray-300"
        } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
            enabled ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}
