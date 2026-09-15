"use client";

import type { ReactNode } from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

export default function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white dark:bg-gray-900 p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{title}</h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
