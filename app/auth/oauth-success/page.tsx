"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { mergeGuestCart } from "@/lib/guestCart";

export default function OAuthSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    async function finishLogin() {
      try {
        await mergeGuestCart();
      } catch (error) {
        console.error("Guest cart merge failed:", error);
      } finally {
        router.replace("/");
        router.refresh();
      }
    }

    finishLogin();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gray-300 dark:border-gray-700 border-t-black" />

        <p className="text-gray-600 dark:text-gray-300">Almost there !!</p>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400"> Just a moment... </p>
      </div>
    </main>
  );
}
