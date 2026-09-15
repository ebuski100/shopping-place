"use client";

import { useState } from "react";

export function useAuthPrompt() {
  const [authPromptOpen, setAuthPromptOpen] = useState(false);

  function openAuthPrompt() {
    setAuthPromptOpen(true);
  }

  function closeAuthPrompt() {
    setAuthPromptOpen(false);
  }

  return {
    authPromptOpen,
    openAuthPrompt,
    closeAuthPrompt,
  };
}
