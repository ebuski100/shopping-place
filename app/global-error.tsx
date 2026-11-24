"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
        <div className="flex flex-col items-center gap-4 px-4 text-center">
          <h2 className="text-xl font-semibold">Something went wrong.</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            A server error occurred. Please try again.
          </p>
          <button
            onClick={() => reset()}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-black"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}