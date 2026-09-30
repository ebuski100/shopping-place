"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

type GoBackProps = {
  href?: string;
};

const GoBack = ({ href }: GoBackProps) => {
  const router = useRouter();
  function handleBack() {
    if (href) {
      router.push(href);
      return;
    }

    router.back();
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label="Go back"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95"
    >
      <ArrowLeft size={21} />
    </button>
  );
};

export default GoBack;
