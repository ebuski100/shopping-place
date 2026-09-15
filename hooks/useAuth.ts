"use client";

import { useEffect, useState } from "react";

type User = {
  id: number;
  name: string;
  email: string;
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        const data = await response.json();

        setUser(data.user ?? null);
      } catch (error) {
        console.error("Auth check failed:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  return {
    user,
    loading,
    isAuthenticated: !!user,
  };
}
