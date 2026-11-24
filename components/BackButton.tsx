"use client";

import { ArrowLeft } from "lucide-react";
import { useCanGoBack, useSmartBack } from "@/components/AppNavigation";

export default function BackButton() {
  const handleBack = useSmartBack("/");
  const canGoBack = useCanGoBack();

  return (
    <button
      type="button"
      onClick={handleBack}
      className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
    >
      <ArrowLeft className="h-4 w-4" />
      {canGoBack ? "Go back" : "Return home"}
    </button>
  );
}
