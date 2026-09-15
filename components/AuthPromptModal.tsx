"use client";

import { X, LockKeyhole } from "lucide-react";
import Link from "next/link";

type AuthPromptModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
};

export default function AuthPromptModal({
  open,
  onClose,
  title = "Sign in to continue",
  message = "Create an account or sign in to save your cart, wishlist, and shopping activity.",
}: AuthPromptModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-8 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-gray-500 dark:text-gray-400 transition hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:text-white"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Icon */}
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
          <LockKeyhole size={26} />
        </div>

        {/* Content */}
        <h2 className="mb-3 text-2xl font-bold">{title}</h2>

        <p className="mb-7 text-gray-600 dark:text-gray-300">{message}</p>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            onClick={onClose}
            className="w-full rounded-lg bg-black px-4 py-3 text-center font-medium text-white transition hover:bg-gray-800"
          >
            Sign In
          </Link>

          <Link
            href="/register"
            onClick={onClose}
            className="w-full rounded-lg border px-4 py-3 text-center font-medium transition hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Create Account
          </Link>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
