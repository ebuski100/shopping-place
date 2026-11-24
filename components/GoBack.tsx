"use client";

import { ArrowLeft } from "lucide-react";
import { useCanGoBack, useSmartBack } from "@/components/AppNavigation";

type GoBackProps = {
  href?: string;
};

const GoBack = ({ href }: GoBackProps) => {
  const handleBack = useSmartBack(href ?? "/");
  const canGoBack = useCanGoBack();

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label={canGoBack ? "Go back" : "Return to shopping homepage"}
      title={canGoBack ? "Go back" : "Return to shopping homepage"}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95"
    >
      <ArrowLeft size={21} />
    </button>
  );
};

export default GoBack;
