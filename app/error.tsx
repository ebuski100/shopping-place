"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-xl font-semibold">This page couldn&apos;t load.</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        A server error occurred. Reload to try again.
      </p>
      <button
        onClick={() => reset()}
        className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-black"
      >
        Try again
      </button>
    </div>
  );
}