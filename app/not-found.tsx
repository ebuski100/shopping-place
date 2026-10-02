import Link from "next/link";
import { Home, SearchX, ShoppingBag } from "lucide-react";

import BackButton from "@/components/BackButton";

export default function NotFound() {
  return (
    <main className="min-h-[calc(100vh-80px)] bg-white dark:bg-gray-950">
      <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-4xl items-center justify-center px-6 py-16">
        <div className="w-full max-w-2xl text-center">
          {/* Icon */}
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-900">
            <SearchX className="h-10 w-10 text-gray-500 dark:text-gray-400" />
          </div>

          {/* Error code */}
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
            Error 404
          </p>

          {/* Heading */}
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl dark:text-white">
            Page not found
          </h1>

          {/* Description */}
          <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-gray-600 sm:text-lg dark:text-gray-400">
            The page or Resource you&apos;re looking for doesn&apos;t exist, may
            have been moved, or is no longer available.
          </p>

          {/* Primary actions */}
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 sm:w-auto dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 dark:focus:ring-white"
            >
              <Home className="h-4 w-4" />
              Back to Home
            </Link>

            <Link
              href="/products"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 sm:w-auto dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:focus:ring-white"
            >
              <ShoppingBag className="h-4 w-4" />
              Continue Shopping
            </Link>
          </div>

          {/* Browser history */}
          <div className="mt-8">
            <BackButton />
          </div>
        </div>
      </div>
    </main>
  );
}
