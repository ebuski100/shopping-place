"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export default function Modal({ open, onClose, title, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // ------------------------------------------
  // PREVENT BACKGROUND SCROLL
  // ------------------------------------------

  useEffect(() => {
    if (!open) {
      return;
    }

    const originalOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  // ------------------------------------------
  // ESCAPE KEY
  // ------------------------------------------

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const focusableSelector =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusFirstElement = () => {
      const focusable = modalRef.current?.querySelector<HTMLElement>(focusableSelector);
      (focusable ?? modalRef.current)?.focus();
    };
    const focusFrame = window.requestAnimationFrame(focusFirstElement);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = Array.from(
        modalRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
      );
      if (focusable.length === 0) {
        event.preventDefault();
        modalRef.current?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [open, onClose]);

  // ------------------------------------------
  // DON'T RENDER WHEN CLOSED
  // ------------------------------------------

  if (!open) {
    return null;
  }

  // ------------------------------------------
  // CLICK OUTSIDE
  // ------------------------------------------

  function handleBackdropClick(event: React.MouseEvent<HTMLDivElement>) {
    /*
     * Only close when the actual backdrop is clicked.
     *
     * Clicking anywhere inside modalRef will not
     * trigger onClose.
     */
    if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
      onClose();
    }
  }

  return (
    <div
      className="modal-backdrop-enter fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        className="modal-content-enter relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900"
        onMouseDown={(event) => {
          event.stopPropagation();
        }}
      >
        {/* ------------------------------------------ */}
        {/* HEADER */}
        {/* ------------------------------------------ */}

        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
          <h2
            id="modal-title"
            className="text-lg font-semibold text-gray-900 dark:text-white"
          >
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* ------------------------------------------ */}
        {/* CONTENT */}
        {/* ------------------------------------------ */}

        <div className="min-h-0 overflow-y-auto px-5 py-5 sm:px-6">
          {children}
        </div>
      </div>
    </div>
  );
}
