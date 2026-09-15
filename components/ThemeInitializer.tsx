"use client";

import { useEffect } from "react";

type Theme = "light" | "dark" | "system";

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

  root.classList.toggle(
    "dark",
    window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
}

export default function ThemeInitializer() {
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as Theme | null;

    if (storedTheme === "light" || storedTheme === "dark" || storedTheme === "system") {
      applyTheme(storedTheme);
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemThemeChange = () => {
      const currentTheme = localStorage.getItem("theme");

      if (!currentTheme || currentTheme === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);

    async function loadSavedTheme() {
      try {
        const response = await fetch("/api/settings", {
          cache: "no-store",
        });

        if (!response.ok) return;

        const settings: { theme: Theme } = await response.json();

        localStorage.setItem("theme", settings.theme);
        applyTheme(settings.theme);
      } catch {
        // Guests are expected to receive a 401; localStorage remains the fallback.
      }
    }

    loadSavedTheme();

    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, []);

  return null;
}
