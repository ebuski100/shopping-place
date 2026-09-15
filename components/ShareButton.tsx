"use client";

import { Check, Copy, Share2 } from "lucide-react";
import { useState } from "react";

type ShareButtonProps = {
  productName: string;
};

export default function ShareButton({ productName }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleShare() {
    if (loading) return;

    setLoading(true);

    try {
      const url = window.location.href;

      // Mobile / browsers that support native sharing
      if (navigator.share) {
        await navigator.share({
          title: productName,
          text: `Check out ${productName}`,
          url,
        });

        return;
      }

      // Desktop fallback: copy URL
      await navigator.clipboard.writeText(url);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      // AbortError happens when the user closes the share sheet.
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      console.error("Share error:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={loading}
      aria-label={copied ? "Link copied" : "Share product"}
      title={copied ? "Link copied" : "Share product"}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 shadow-sm transition hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {copied ? <Check size={20} /> : <Share2 size={20} />}
    </button>
  );
}
